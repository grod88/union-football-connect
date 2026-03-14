"""
Audio transcription using OpenAI Whisper API
"""
from dataclasses import dataclass
from pathlib import Path
from openai import OpenAI
from ..config import settings


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass
class TranscriptionResult:
    segments: list[TranscriptSegment]
    full_text: str
    formatted_text: str  # With timestamps for Claude


def transcribe_audio(audio_path: str) -> TranscriptionResult:
    """
    Transcribe audio using OpenAI Whisper API.
    Returns segments with timestamps and formatted text.
    """
    client = OpenAI(api_key=settings.openai_api_key)

    # Read audio file
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # Whisper API has a 25MB limit, so we may need to chunk for very long videos
    # For now, we'll handle files up to 25MB directly
    file_size = audio_file.stat().st_size
    max_size = 25 * 1024 * 1024  # 25MB

    print(f"   📝 Arquivo de áudio: {file_size / (1024*1024):.1f}MB")

    if file_size > max_size:
        # For large files, we'll need to split and process in chunks
        print(f"   ⚠️  Arquivo > 25MB, dividindo em chunks...")
        return _transcribe_large_file(audio_path, client)

    print(f"   🎤 Transcrevendo áudio direto (< 25MB)...")
    # Transcribe with verbose_json to get timestamps
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model=settings.whisper_model,
            file=f,
            language="pt",
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    # Parse segments
    segments = []
    if hasattr(response, "segments") and response.segments:
        for seg in response.segments:
            segments.append(TranscriptSegment(
                start=seg.get("start", 0),
                end=seg.get("end", 0),
                text=seg.get("text", "").strip(),
            ))
    else:
        # Fallback: single segment with full text
        segments.append(TranscriptSegment(
            start=0,
            end=0,
            text=response.text,
        ))

    # Format for Claude (with timestamps in SECONDS for easier parsing)
    formatted_lines = []
    for seg in segments:
        # Use seconds directly to avoid HH:MM:SS conversion errors
        ts_start = f"{seg.start:.0f}s"
        ts_end = f"{seg.end:.0f}s"
        formatted_lines.append(f"[{ts_start}-{ts_end}] {seg.text}")

    formatted_text = "\n".join(formatted_lines)
    full_text = " ".join(seg.text for seg in segments)

    return TranscriptionResult(
        segments=segments,
        full_text=full_text,
        formatted_text=formatted_text,
    )


def _transcribe_large_file(audio_path: str, client: OpenAI) -> TranscriptionResult:
    """
    Handle large audio files by splitting into chunks.
    Uses ffmpeg to split the audio into 10-minute segments (to stay under 25MB limit).
    """
    import subprocess
    import tempfile

    audio_file = Path(audio_path)
    chunk_duration = 8 * 60  # 8 minutes in seconds (to ensure < 25MB limit)

    # Get audio duration
    probe_cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audio_path,
    ]
    result = subprocess.run(probe_cmd, capture_output=True, text=True)
    total_duration = float(result.stdout.strip())

    # Calculate number of chunks
    total_chunks = int(total_duration / chunk_duration) + 1
    print(f"   📊 Áudio: {total_duration/60:.1f} minutos → {total_chunks} chunks de {chunk_duration//60} min")

    all_segments = []
    current_offset = 0

    with tempfile.TemporaryDirectory() as tmpdir:
        chunk_index = 0
        while current_offset < total_duration:
            chunk_path = Path(tmpdir) / f"chunk_{chunk_index}.wav"

            # Extract chunk
            ffmpeg_cmd = [
                "ffmpeg",
                "-y",
                "-ss", str(current_offset),
                "-t", str(chunk_duration),
                "-i", audio_path,
                "-ar", "16000",
                "-ac", "1",
                str(chunk_path),
            ]
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

            # Transcribe chunk
            print(f"   🎤 Transcrevendo chunk {chunk_index + 1}/{total_chunks}... ({current_offset/60:.1f}min - {min(current_offset + chunk_duration, total_duration)/60:.1f}min)")
            with open(chunk_path, "rb") as f:
                response = client.audio.transcriptions.create(
                    model=settings.whisper_model,
                    file=f,
                    language="pt",
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                )
            print(f"   ✅ Chunk {chunk_index + 1}/{total_chunks} transcrito")

            # Add segments with adjusted timestamps
            if hasattr(response, "segments") and response.segments:
                for seg in response.segments:
                    # Handle both dict and Pydantic object responses
                    if hasattr(seg, "start"):
                        start = seg.start
                        end = seg.end
                        text = seg.text
                    else:
                        start = seg.get("start", 0)
                        end = seg.get("end", 0)
                        text = seg.get("text", "")
                    all_segments.append(TranscriptSegment(
                        start=start + current_offset,
                        end=end + current_offset,
                        text=text.strip() if text else "",
                    ))

            current_offset += chunk_duration
            chunk_index += 1

    # Format for Claude (with timestamps in SECONDS for easier parsing)
    formatted_lines = []
    for seg in all_segments:
        # Use seconds directly to avoid HH:MM:SS conversion errors
        ts_start = f"{seg.start:.0f}s"
        ts_end = f"{seg.end:.0f}s"
        formatted_lines.append(f"[{ts_start}-{ts_end}] {seg.text}")

    formatted_text = "\n".join(formatted_lines)
    full_text = " ".join(seg.text for seg in all_segments)

    return TranscriptionResult(
        segments=all_segments,
        full_text=full_text,
        formatted_text=formatted_text,
    )


def _format_time(seconds: float) -> str:
    """Format seconds as HH:MM:SS"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"
