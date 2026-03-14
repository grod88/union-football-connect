"""
FFmpeg clip producer - V3 (Production Ready)
With subtitles, silence removal, intro/outro cards, background music
"""
import os
import subprocess
import tempfile
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class ProducedClipResultV3:
    horizontal_path: str
    vertical_path: Optional[str]
    thumbnail_path: str
    duration_seconds: float
    duration_after_cuts: float
    resolution: str
    file_size_bytes: int


# ═══════════════════════════════════════════════════════════════════════════════
# SUBTITLE GENERATION (ASS Format)
# ═══════════════════════════════════════════════════════════════════════════════

def format_ass_time(seconds: float) -> str:
    """Format seconds as ASS timestamp (H:MM:SS.cc)"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def generate_ass_subtitles(
    subtitles: list[dict],
    clip_offset: float,
    font_name: str = "Arial",
    font_size: int = 48,
) -> str:
    """
    Generate ASS subtitle file with Union Football styling.
    Subtitles positioned at BOTTOM of screen (Alignment=2 = bottom center)
    """

    # Alignment values in ASS:
    # 1=bottom-left, 2=bottom-center, 3=bottom-right
    # 4=middle-left, 5=middle-center, 6=middle-right
    # 7=top-left, 8=top-center, 9=top-right

    header = f"""[Script Info]
Title: Union Football Live - Clip
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,3,2,2,40,40,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    for sub in subtitles:
        start = format_ass_time(sub["start"] - clip_offset)
        end = format_ass_time(sub["end"] - clip_offset)
        text = sub.get("text", "")

        # Highlight words in yellow (ASS color format: &HBBGGRR&)
        for word in sub.get("highlight_words", []):
            # Remove ** markers if present
            text = text.replace(f"**{word}**", word)
            # Apply yellow highlight style
            text = text.replace(
                word,
                f"{{\\c&H00FFFF&\\b1}}{word}{{\\c&HFFFFFF&\\b0}}"
            )

        # Escape special characters
        text = text.replace("\\", "\\\\")

        events.append(
            f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}"
        )

    return header + "\n".join(events)


# ═══════════════════════════════════════════════════════════════════════════════
# SILENCE REMOVAL AND CONCATENATION
# ═══════════════════════════════════════════════════════════════════════════════

def split_by_silences(
    start: float,
    end: float,
    silence_cuts: list[dict],
    breath_margin: float = 0.15
) -> list[tuple[float, float]]:
    """Split a segment into sub-segments by removing silences."""

    # Filter silences within this segment
    relevant = [
        s for s in silence_cuts
        if s["start"] >= start and s["end"] <= end
    ]

    if not relevant:
        return [(start, end)]

    parts = []
    current = start

    for silence in sorted(relevant, key=lambda x: x["start"]):
        if silence["start"] > current:
            # Keep some breathing room
            parts.append((current, silence["start"] + breath_margin))
        current = silence["end"] - breath_margin

    if current < end:
        parts.append((current, end))

    return parts


def remove_silences_and_concat(
    video_path: str,
    segments: list[dict],
    silence_cuts: list[dict],
    output_path: str,
    crossfade: float = 0.15
) -> tuple[str, float]:
    """
    Remove silences and concatenate segments.
    Returns output path and final duration.
    """
    temp_parts = []
    part_idx = 0

    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract sub-segments (removing silences)
        for seg in segments:
            sub_segments = split_by_silences(
                seg["start_time"],
                seg["end_time"],
                silence_cuts
            )

            for sub_start, sub_end in sub_segments:
                part_file = os.path.join(tmpdir, f"part_{part_idx:03d}.mp4")

                cmd = [
                    'ffmpeg', '-y',
                    '-ss', str(sub_start),
                    '-to', str(sub_end),
                    '-i', video_path,
                    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
                    '-c:a', 'aac', '-b:a', '128k',
                    '-avoid_negative_ts', 'make_zero',
                    part_file
                ]
                subprocess.run(cmd, check=True, capture_output=True)
                temp_parts.append(part_file)
                part_idx += 1

        # If only one part, just copy
        if len(temp_parts) == 1:
            subprocess.run([
                'ffmpeg', '-y',
                '-i', temp_parts[0],
                '-c', 'copy',
                output_path
            ], check=True, capture_output=True)
        else:
            # Concatenate with minimal crossfade
            concat_list = os.path.join(tmpdir, "concat.txt")
            with open(concat_list, "w") as f:
                for part in temp_parts:
                    f.write(f"file '{part}'\n")

            subprocess.run([
                'ffmpeg', '-y',
                '-f', 'concat', '-safe', '0',
                '-i', concat_list,
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
                '-c:a', 'aac', '-b:a', '128k',
                output_path
            ], check=True, capture_output=True)

        # Get duration
        probe = subprocess.run([
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            output_path
        ], capture_output=True, text=True)
        duration = float(probe.stdout.strip())

        return output_path, duration


# ═══════════════════════════════════════════════════════════════════════════════
# INTRO / OUTRO CARDS
# ═══════════════════════════════════════════════════════════════════════════════

def escape_ffmpeg_text(text: str) -> str:
    """Escape special characters for FFmpeg drawtext filter."""
    return text.replace("'", "'\\''").replace(":", "\\:").replace("\\", "\\\\")


def create_intro_card(
    title: str,
    logo_path: str,
    output_path: str,
    background_path: Optional[str] = None,
    duration: float = 3.0,
    resolution: str = "1920x1080",
    font_path: Optional[str] = None,
) -> str:
    """
    Generate intro card: background image + logo centered.
    Pattern: Background + Logo (no title on intro, clean look)
    Includes silent audio track for proper concatenation.
    """
    w, h = resolution.split("x")

    # Get assets directory
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
    if not background_path:
        background_path = os.path.join(assets_dir, "background.jpg")

    # Check if we have background image
    has_bg = background_path and os.path.exists(background_path)
    has_logo = logo_path and os.path.exists(logo_path)

    if has_bg and has_logo:
        # Background + Logo centered + silent audio
        filter_complex = (
            f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},setsar=1[bg];"
            f"[1:v]scale=400:-1[logo];"
            f"[bg][logo]overlay=(W-w)/2:(H-h)/2[combined];"
            f"[combined]fade=t=in:st=0:d=0.5,fade=t=out:st={duration-0.3}:d=0.3[vout]"
        )
        cmd = [
            'ffmpeg', '-y',
            '-loop', '1', '-t', str(duration), '-i', background_path,
            '-i', logo_path,
            '-f', 'lavfi', '-t', str(duration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-filter_complex', filter_complex,
            '-map', '[vout]', '-map', '2:a',
            '-t', str(duration),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            output_path
        ]
    elif has_logo:
        # Dark background + Logo + silent audio
        filter_complex = (
            f"color=c=0x0D1117:s={resolution}:d={duration}[bg];"
            f"[1:v]scale=400:-1[logo];"
            f"[bg][logo]overlay=(W-w)/2:(H-h)/2[combined];"
            f"[combined]fade=t=in:st=0:d=0.5,fade=t=out:st={duration-0.3}:d=0.3[vout]"
        )
        cmd = [
            'ffmpeg', '-y',
            '-f', 'lavfi', '-i', f'color=c=0x0D1117:s={resolution}:d={duration}',
            '-i', logo_path,
            '-f', 'lavfi', '-t', str(duration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-filter_complex', filter_complex,
            '-map', '[vout]', '-map', '2:a',
            '-t', str(duration),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            output_path
        ]
    else:
        # Fallback: just dark background + silent audio
        cmd = [
            'ffmpeg', '-y',
            '-f', 'lavfi', '-i', f'color=c=0x0D1117:s={resolution}:d={duration}',
            '-f', 'lavfi', '-t', str(duration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-vf', f'fade=t=in:st=0:d=0.5,fade=t=out:st={duration-0.3}:d=0.3',
            '-map', '0:v', '-map', '1:a',
            '-t', str(duration),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            output_path
        ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


def create_outro_card(
    logo_path: str,
    output_path: str,
    tagline_path: Optional[str] = None,
    background_path: Optional[str] = None,
    resolution: str = "1920x1080",
) -> str:
    """
    Generate outro card in 2 parts:
    1. Background + Tagline (3s)
    2. Background + Logo (3s)
    Total: 6 seconds
    Includes silent audio track for proper concatenation.
    """
    w, h = resolution.split("x")

    # Get assets directory
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
    if not background_path:
        background_path = os.path.join(assets_dir, "background.jpg")
    if not tagline_path:
        tagline_path = "/home/guru/Desktop/UnionFC/imagens-base/union_football_live_tagline.png"

    has_bg = background_path and os.path.exists(background_path)
    has_tagline = tagline_path and os.path.exists(tagline_path)
    has_logo = logo_path and os.path.exists(logo_path)

    # Create temp directory for parts
    tmp_dir = os.path.join(os.path.dirname(output_path), "outro_tmp")
    os.makedirs(tmp_dir, exist_ok=True)

    part1_path = os.path.join(tmp_dir, "outro_part1.mp4")
    part2_path = os.path.join(tmp_dir, "outro_part2.mp4")

    duration_part = 3.0

    # PART 1: Background + Tagline (3s)
    if has_bg and has_tagline:
        filter_complex = (
            f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},setsar=1[bg];"
            f"[1:v]scale=800:-1[tagline];"
            f"[bg][tagline]overlay=(W-w)/2:(H-h)/2[combined];"
            f"[combined]fade=t=in:st=0:d=0.5,fade=t=out:st={duration_part-0.3}:d=0.3[vout]"
        )
        cmd1 = [
            'ffmpeg', '-y',
            '-loop', '1', '-t', str(duration_part), '-i', background_path,
            '-i', tagline_path,
            '-f', 'lavfi', '-t', str(duration_part), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-filter_complex', filter_complex,
            '-map', '[vout]', '-map', '2:a',
            '-t', str(duration_part),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            part1_path
        ]
    else:
        # Fallback: dark background
        cmd1 = [
            'ffmpeg', '-y',
            '-f', 'lavfi', '-i', f'color=c=0x0D1117:s={resolution}:d={duration_part}',
            '-f', 'lavfi', '-t', str(duration_part), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-vf', f'fade=t=in:st=0:d=0.5,fade=t=out:st={duration_part-0.3}:d=0.3',
            '-map', '0:v', '-map', '1:a',
            '-t', str(duration_part),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            part1_path
        ]

    subprocess.run(cmd1, check=True, capture_output=True)

    # PART 2: Background + Logo (3s) - same as intro
    if has_bg and has_logo:
        filter_complex = (
            f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},setsar=1[bg];"
            f"[1:v]scale=400:-1[logo];"
            f"[bg][logo]overlay=(W-w)/2:(H-h)/2[combined];"
            f"[combined]fade=t=in:st=0:d=0.5,fade=t=out:st={duration_part-0.5}:d=0.5[vout]"
        )
        cmd2 = [
            'ffmpeg', '-y',
            '-loop', '1', '-t', str(duration_part), '-i', background_path,
            '-i', logo_path,
            '-f', 'lavfi', '-t', str(duration_part), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-filter_complex', filter_complex,
            '-map', '[vout]', '-map', '2:a',
            '-t', str(duration_part),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            part2_path
        ]
    else:
        # Fallback: dark background
        cmd2 = [
            'ffmpeg', '-y',
            '-f', 'lavfi', '-i', f'color=c=0x0D1117:s={resolution}:d={duration_part}',
            '-f', 'lavfi', '-t', str(duration_part), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-vf', f'fade=t=in:st=0:d=0.5,fade=t=out:st={duration_part-0.5}:d=0.5',
            '-map', '0:v', '-map', '1:a',
            '-t', str(duration_part),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            part2_path
        ]

    subprocess.run(cmd2, check=True, capture_output=True)

    # Concatenate part1 + part2
    concat_list = os.path.join(tmp_dir, "concat.txt")
    with open(concat_list, "w") as f:
        f.write(f"file '{part1_path}'\n")
        f.write(f"file '{part2_path}'\n")

    subprocess.run([
        'ffmpeg', '-y',
        '-f', 'concat', '-safe', '0',
        '-i', concat_list,
        '-c', 'copy',
        output_path
    ], check=True, capture_output=True)

    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# VOLUME BOOST
# ═══════════════════════════════════════════════════════════════════════════════

def boost_volume(
    video_path: str,
    output_path: str,
    volume_db: float = 6.0,
) -> str:
    """
    Boost audio volume by specified dB.
    Default: +6dB (doubles perceived volume)
    """
    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-af', f'volume={volume_db}dB',
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND MUSIC WITH DUCKING
# ═══════════════════════════════════════════════════════════════════════════════

def mix_background_music(
    video_path: str,
    music_path: str,
    output_path: str,
    music_volume: float = 0.08,
) -> str:
    """Mix background music at low volume with speech ducking."""

    # Simple mixing (music at constant low volume)
    filter_complex = (
        f"[1:a]aloop=loop=-1:size=2e+09,volume={music_volume}[music];"
        f"[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-i', music_path,
        '-filter_complex', filter_complex,
        '-map', '0:v', '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# LOGO OVERLAY
# ═══════════════════════════════════════════════════════════════════════════════

def apply_logo_overlay(
    video_path: str,
    logo_path: str,
    output_path: str,
    position: str = "top_right",
    size: int = 80,
    opacity: float = 0.7,
    margin: int = 20
) -> str:
    """Apply semi-transparent logo overlay to entire video."""

    if not os.path.exists(logo_path):
        # No logo, just copy
        subprocess.run([
            'ffmpeg', '-y', '-i', video_path, '-c', 'copy', output_path
        ], check=True, capture_output=True)
        return output_path

    pos_map = {
        "top_right": f"W-w-{margin}:{margin}",
        "top_left": f"{margin}:{margin}",
        "bottom_right": f"W-w-{margin}:H-h-{margin}",
        "bottom_left": f"{margin}:H-h-{margin}",
    }

    filter_complex = (
        f"[1:v]scale={size}:-1,format=rgba,"
        f"colorchannelmixer=aa={opacity}[logo];"
        f"[0:v][logo]overlay={pos_map.get(position, pos_map['top_right'])}[vout]"
    )

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-i', logo_path,
        '-filter_complex', filter_complex,
        '-map', '[vout]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
        '-c:a', 'copy',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# BURN SUBTITLES
# ═══════════════════════════════════════════════════════════════════════════════

def burn_subtitles(
    video_path: str,
    ass_file: str,
    output_path: str
) -> str:
    """Burn ASS subtitles into video."""

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-vf', f"ass='{ass_file}'",
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
        '-c:a', 'copy',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# CONCATENATE VIDEOS
# ═══════════════════════════════════════════════════════════════════════════════

def concat_videos(video_list: list[str], output_path: str) -> str:
    """Concatenate multiple videos."""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for video in video_list:
            f.write(f"file '{video}'\n")
        concat_file = f.name

    try:
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat', '-safe', '0',
            '-i', concat_file,
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    finally:
        os.unlink(concat_file)

    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# VERTICAL CONVERSION (9:16)
# ═══════════════════════════════════════════════════════════════════════════════

def convert_to_vertical(
    video_path: str,
    output_path: str,
    target_width: int = 1080,
    target_height: int = 1920
) -> str:
    """Convert horizontal video to vertical (9:16) with blur background."""

    filter_complex = (
        f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
        f"crop={target_width}:{target_height},boxblur=20:20[bg];"
        f"[0:v]scale={target_width}:-1:force_original_aspect_ratio=decrease[fg];"
        f"[bg][fg]overlay=(W-w)/2:(H-h)/2[vout]"
    )

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-filter_complex', filter_complex,
        '-map', '[vout]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# THUMBNAIL EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_thumbnail(
    video_path: str,
    timestamp: float,
    output_path: str,
    width: int = 1280
) -> str:
    """Extract thumbnail from video at specific timestamp."""

    cmd = [
        'ffmpeg', '-y',
        '-ss', str(timestamp),
        '-i', video_path,
        '-vframes', '1',
        '-vf', f'scale={width}:-1',
        '-q:v', '2',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE V3
# ═══════════════════════════════════════════════════════════════════════════════

def produce_clip_v3(
    video_path: str,
    clip_data: dict,
    output_dir: str,
    logo_path: Optional[str] = None,
    music_dir: Optional[str] = None,
    font_path: Optional[str] = None,
    volume_boost_db: float = 6.0,
) -> ProducedClipResultV3:
    """
    Complete V3 production pipeline for a single clip.

    Pipeline (SIMPLIFIED - no subtitles, no intro/outro):
    1. PREPARATION: Extract segments, remove silences, concatenate
    2. COMPOSITION: Logo overlay only
    3. FINALIZATION: Volume boost, vertical version
    """

    clip_id = clip_data.get("id", "clip")
    tmp = os.path.join("/tmp/clips", clip_id)
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # Get asset paths
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
    if not logo_path:
        logo_path = os.path.join(assets_dir, "union_logo.png")

    # Extract data
    segments = clip_data.get("segments", [])
    silence_cuts = clip_data.get("silence_cuts", [])
    production = clip_data.get("production", {})

    # Calculate original duration
    original_duration = sum(
        seg["end_time"] - seg["start_time"]
        for seg in segments
    ) if segments else 0

    # ── PHASE 1: PREPARATION ──
    print(f"  [1/4] Extracting segments and removing silences...")

    raw_clip = os.path.join(tmp, "01_raw.mp4")
    if segments:
        _, clip_duration = remove_silences_and_concat(
            video_path=video_path,
            segments=segments,
            silence_cuts=silence_cuts,
            output_path=raw_clip
        )
    else:
        # Fallback: simple cut
        start = clip_data.get("start_time", 0)
        end = clip_data.get("end_time", 60)
        subprocess.run([
            'ffmpeg', '-y',
            '-ss', str(start),
            '-to', str(end),
            '-i', video_path,
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
            '-c:a', 'aac', '-b:a', '192k',
            raw_clip
        ], check=True, capture_output=True)
        clip_duration = end - start

    # ── PHASE 2: COMPOSITION (logo only, no subtitles) ──
    print(f"  [2/4] Applying logo overlay...")

    with_logo = os.path.join(tmp, "02_logo.mp4")
    apply_logo_overlay(raw_clip, logo_path, with_logo)

    # ── PHASE 3: FINALIZATION (no intro/outro) ──
    # Apply volume boost directly to the clip with logo
    print(f"  [3/4] Applying volume boost (+{volume_boost_db}dB)...")

    final_horizontal = os.path.join(output_dir, f"{clip_id}_horizontal.mp4")
    boost_volume(with_logo, final_horizontal, volume_db=volume_boost_db)

    # Generate vertical version
    print(f"  [4/4] Generating vertical version...")

    final_vertical = os.path.join(output_dir, f"{clip_id}_vertical.mp4")
    convert_to_vertical(final_horizontal, final_vertical)

    # Generate thumbnail
    thumb_time = production.get("thumbnail_time") or 5  # Default to 5 seconds
    if segments and len(segments) > 0:
        first_seg_start = segments[0].get("start_time", 0) or 0
        thumb_time = max(0, thumb_time - first_seg_start)
    thumb_path = os.path.join(output_dir, f"{clip_id}_thumb.jpg")

    # Use the clip with logo for thumbnail
    extract_thumbnail(with_logo, min(thumb_time, clip_duration - 1), thumb_path)

    # Get file size
    file_size = os.path.getsize(final_horizontal)

    # Get final duration
    probe = subprocess.run([
        'ffprobe', '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        final_horizontal
    ], capture_output=True, text=True)
    final_duration = float(probe.stdout.strip())

    return ProducedClipResultV3(
        horizontal_path=final_horizontal,
        vertical_path=final_vertical,
        thumbnail_path=thumb_path,
        duration_seconds=original_duration,
        duration_after_cuts=final_duration,
        resolution="1920x1080",
        file_size_bytes=file_size
    )
