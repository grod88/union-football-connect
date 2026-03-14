"""
FFmpeg clip producer
"""
import subprocess
from pathlib import Path
from dataclasses import dataclass
from ..config import settings


@dataclass
class ProducedClipResult:
    horizontal_path: str
    vertical_path: str | None
    thumbnail_path: str
    duration_seconds: float
    resolution: str
    file_size_bytes: int
    ffmpeg_command: str


def produce_clip(
    video_path: str,
    output_dir: str,
    clip_id: str,
    start_time: float,
    end_time: float,
    template: str = "reaction",
    text_overlays: list[dict] | None = None,
    logo_path: str | None = None,
) -> ProducedClipResult:
    """
    Produce a clip using FFmpeg.
    Currently implements the 'reaction' template (simple cut with logo).
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    duration = end_time - start_time
    horizontal_output = output_path / f"{clip_id}_horizontal.mp4"
    thumbnail_output = output_path / f"{clip_id}_thumb.jpg"

    # Build filter complex based on template
    if template == "reaction":
        ffmpeg_cmd = _build_reaction_filter(
            video_path=video_path,
            start_time=start_time,
            duration=duration,
            output_path=str(horizontal_output),
            text_overlays=text_overlays,
            logo_path=logo_path,
        )
    else:
        # Default to simple cut for other templates (MVP)
        ffmpeg_cmd = _build_simple_cut(
            video_path=video_path,
            start_time=start_time,
            duration=duration,
            output_path=str(horizontal_output),
        )

    # Execute FFmpeg
    subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

    # Generate thumbnail
    thumbnail_time = start_time + min(5, duration / 2)
    thumb_cmd = [
        "ffmpeg", "-y",
        "-ss", str(thumbnail_time),
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        str(thumbnail_output),
    ]
    subprocess.run(thumb_cmd, check=True, capture_output=True)

    # Get file info
    file_size = horizontal_output.stat().st_size

    return ProducedClipResult(
        horizontal_path=str(horizontal_output),
        vertical_path=None,  # TODO: implement vertical
        thumbnail_path=str(thumbnail_output),
        duration_seconds=duration,
        resolution="1920x1080",
        file_size_bytes=file_size,
        ffmpeg_command=" ".join(ffmpeg_cmd),
    )


def _build_reaction_filter(
    video_path: str,
    start_time: float,
    duration: float,
    output_path: str,
    text_overlays: list[dict] | None = None,
    logo_path: str | None = None,
) -> list[str]:
    """
    Build FFmpeg command for 'reaction' template.
    Simple cut with fade in/out and optional logo.
    """
    # Base filters
    vf_parts = [
        f"fade=t=in:st=0:d=0.5",
        f"fade=t=out:st={duration - 0.5}:d=0.5",
    ]

    # Add text overlays
    if text_overlays:
        for overlay in text_overlays:
            text = overlay.get("text", "").replace("'", "\\'").replace(":", "\\:")
            rel_time = overlay.get("relative_time", 0)
            dur = overlay.get("duration", 3)
            position = overlay.get("position", "bottom")
            style = overlay.get("style", "subtitle")

            # Y position
            y_pos = {
                "top": "50",
                "center": "(h-text_h)/2",
                "bottom": "h-text_h-80",
            }.get(position, "h-text_h-80")

            # Font size
            fontsize = {
                "title": 48,
                "subtitle": 36,
                "highlight": 42,
                "meme": 56,
                "stat": 32,
            }.get(style, 36)

            vf_parts.append(
                f"drawtext=text='{text}':"
                f"fontsize={fontsize}:fontcolor=white:"
                f"x=(w-text_w)/2:y={y_pos}:"
                f"box=1:boxcolor=black@0.6:boxborderw=10:"
                f"enable='between(t,{rel_time},{rel_time + dur})'"
            )

    video_filter = ",".join(vf_parts)

    # Audio filter
    af = f"afade=t=in:st=0:d=0.3,afade=t=out:st={duration - 0.3}:d=0.3"

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-t", str(duration),
        "-i", video_path,
        "-vf", video_filter,
        "-af", af,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_path,
    ]

    return cmd


def _build_simple_cut(
    video_path: str,
    start_time: float,
    duration: float,
    output_path: str,
) -> list[str]:
    """Simple cut without filters (fallback)"""
    return [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-t", str(duration),
        "-i", video_path,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_path,
    ]
