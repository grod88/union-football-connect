#!/usr/bin/env python3
"""
Union FC - FFmpeg MCP Server

Custom MCP server for video/audio processing with FFmpeg.
Implements all tools needed for the Union FC clip production pipeline.

Tools:
- Video: trim, concat, resize, vertical conversion
- Audio: ducking, background music mix, volume boost
- Overlays: logo, subtitles (ASS/SRT), text
- Templates: reaction, split_horizontal, grande_momento, resenha
- Intro/Outro: fade effects, card generation

Usage:
    python server.py  # Runs on stdio transport
"""

import os
import sys
import json
import subprocess
import tempfile
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict

# Use stderr for logging (stdout is reserved for JSON-RPC)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("union-ffmpeg-mcp")

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    logger.error("MCP SDK not installed. Run: pip install 'mcp[cli]'")
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

ASSETS_DIR = Path(__file__).parent.parent.parent / "worker" / "assets"
OUTPUT_DIR = Path("/tmp/union-clips")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Union FC branding
UNION_LOGO = ASSETS_DIR / "union_logo.png"
UNION_INTRO = ASSETS_DIR / "union_intro.mp4"
UNION_OUTRO = ASSETS_DIR / "union_outro.mp4"
FONT_PATH = ASSETS_DIR / "fonts" / "Oswald-Bold.ttf"

# Background music by mood
MUSIC_PATHS = {
    "hype": ASSETS_DIR / "audio" / "bg" / "hype.mp3",
    "emotional": ASSETS_DIR / "audio" / "bg" / "emotional.mp3",
    "suspense": ASSETS_DIR / "audio" / "bg" / "suspense.mp3",
    "chill": ASSETS_DIR / "audio" / "bg" / "chill.mp3",
}

# Duration rules
DURATION_RULES = {
    "short": {"min": 15, "max": 30, "platforms": ["Reels", "TikTok", "Shorts"]},
    "medium": {"min": 30, "max": 60, "platforms": ["TikTok", "Reels"]},
    "long": {"min": 60, "max": 120, "platforms": ["TikTok", "YouTube"]},
}

# ═══════════════════════════════════════════════════════════════════════════════
# MCP SERVER INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════════

mcp = FastMCP(
    name="union-ffmpeg",
    instructions="MCP server para produção de clips de futebol Union FC. Inclui trimming, legendas ASS, ducking, intro/outro Union, templates reaction/split/grande_momento/resenha.",
)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def run_ffmpeg(args: list, timeout: int = 3600) -> tuple[bool, str]:
    """Run FFmpeg command and return success status + output/error."""
    try:
        cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning"] + args
        logger.info(f"Running: {' '.join(cmd[:10])}...")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        if result.returncode != 0:
            return False, result.stderr or "FFmpeg processing failed"

        return True, result.stdout or "Success"
    except subprocess.TimeoutExpired:
        return False, f"FFmpeg operation timed out ({timeout}s)"
    except Exception as e:
        return False, f"Error: {str(e)}"


def run_ffprobe(args: list) -> Optional[dict]:
    """Run ffprobe and return parsed JSON output."""
    try:
        cmd = ["ffprobe", "-v", "error", "-print_format", "json"] + args
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            return json.loads(result.stdout)
        return None
    except Exception:
        return None


def get_duration(video_path: str) -> float:
    """Get video duration in seconds."""
    data = run_ffprobe([
        "-show_entries", "format=duration",
        video_path
    ])
    if data and "format" in data:
        return float(data["format"].get("duration", 0))
    return 0


def escape_ffmpeg_text(text: str) -> str:
    """Escape special characters for FFmpeg drawtext filter."""
    return text.replace("\\", "\\\\").replace("'", "'\\''").replace(":", "\\:")


# ═══════════════════════════════════════════════════════════════════════════════
# CORE VIDEO TOOLS
# ═══════════════════════════════════════════════════════════════════════════════

@mcp.tool()
def get_media_info(video_path: str) -> dict:
    """
    Get detailed information about a video/audio file.

    Args:
        video_path: Path to media file

    Returns:
        Dictionary with duration, resolution, codec, fps, audio info
    """
    if not Path(video_path).exists():
        return {"success": False, "error": f"File not found: {video_path}"}

    data = run_ffprobe([
        "-show_entries", "format=duration,size,bit_rate",
        "-show_entries", "stream=codec_name,width,height,r_frame_rate,codec_type,channels,sample_rate",
        video_path
    ])

    if not data:
        return {"success": False, "error": "Failed to probe media file"}

    result = {
        "success": True,
        "path": video_path,
        "duration": float(data.get("format", {}).get("duration", 0)),
        "size_bytes": int(data.get("format", {}).get("size", 0)),
        "streams": [],
    }

    for stream in data.get("streams", []):
        stream_info = {"type": stream.get("codec_type"), "codec": stream.get("codec_name")}

        if stream.get("codec_type") == "video":
            stream_info["width"] = stream.get("width")
            stream_info["height"] = stream.get("height")
            fps_parts = stream.get("r_frame_rate", "30/1").split("/")
            stream_info["fps"] = round(float(fps_parts[0]) / float(fps_parts[1]), 2)
            result["resolution"] = f"{stream.get('width')}x{stream.get('height')}"
            result["fps"] = stream_info["fps"]

        elif stream.get("codec_type") == "audio":
            stream_info["channels"] = stream.get("channels")
            stream_info["sample_rate"] = stream.get("sample_rate")

        result["streams"].append(stream_info)

    return result


@mcp.tool()
def trim_video(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    copy_codec: bool = False,
) -> dict:
    """
    Trim video to specified time range.

    Args:
        input_path: Path to input video
        output_path: Path to save trimmed video
        start_time: Start time in seconds
        end_time: End time in seconds
        copy_codec: If True, use stream copy (faster but less precise)

    Returns:
        Result with success status and file info
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    if copy_codec:
        args = [
            "-ss", str(start_time),
            "-to", str(end_time),
            "-i", input_path,
            "-c", "copy",
            output_path
        ]
    else:
        args = [
            "-i", input_path,
            "-ss", str(start_time),
            "-to", str(end_time),
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k",
            output_path
        ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "duration": end_time - start_time,
            "file_size": Path(output_path).stat().st_size,
        }

    return {"success": False, "error": message}


@mcp.tool()
def remove_silence(
    input_path: str,
    output_path: str,
    silence_threshold_db: float = -30.0,
    min_silence_duration: float = 0.5,
) -> dict:
    """
    Remove silent parts from video (creates jump cuts).

    Args:
        input_path: Path to input video
        output_path: Path to save processed video
        silence_threshold_db: Audio level considered silence (default -30dB)
        min_silence_duration: Minimum silence duration to remove (seconds)

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Use silenceremove filter
    filter_complex = (
        f"silenceremove=start_periods=1:start_duration=0.1:start_threshold={silence_threshold_db}dB:"
        f"stop_periods=-1:stop_duration={min_silence_duration}:stop_threshold={silence_threshold_db}dB"
    )

    args = [
        "-i", input_path,
        "-af", filter_complex,
        "-c:v", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "duration": get_duration(output_path),
            "file_size": Path(output_path).stat().st_size,
        }

    return {"success": False, "error": message}


@mcp.tool()
def concatenate_videos(
    input_paths: List[str],
    output_path: str,
    crossfade_duration: float = 0.0,
) -> dict:
    """
    Concatenate multiple videos into one.

    Args:
        input_paths: List of video paths to concatenate
        output_path: Path to save concatenated video
        crossfade_duration: Duration of crossfade between clips (0 for hard cut)

    Returns:
        Result with success status
    """
    for path in input_paths:
        if not Path(path).exists():
            return {"success": False, "error": f"Input not found: {path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    if crossfade_duration > 0 and len(input_paths) > 1:
        # Use xfade filter for crossfade
        filter_parts = []
        input_args = []

        for i, path in enumerate(input_paths):
            input_args.extend(["-i", path])

        # Build xfade filter chain
        prev_label = "[0:v]"
        for i in range(1, len(input_paths)):
            offset = sum(get_duration(input_paths[j]) for j in range(i)) - (crossfade_duration * i)
            out_label = f"[v{i}]" if i < len(input_paths) - 1 else "[outv]"
            filter_parts.append(
                f"{prev_label}[{i}:v]xfade=transition=fade:duration={crossfade_duration}:offset={offset}{out_label}"
            )
            prev_label = out_label

        # Audio concat
        audio_inputs = "".join(f"[{i}:a]" for i in range(len(input_paths)))
        filter_parts.append(f"{audio_inputs}concat=n={len(input_paths)}:v=0:a=1[outa]")

        filter_complex = ";".join(filter_parts)

        args = input_args + [
            "-filter_complex", filter_complex,
            "-map", "[outv]" if len(input_paths) > 1 else "[v0]",
            "-map", "[outa]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k",
            output_path
        ]
    else:
        # Simple concat demuxer
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            for path in input_paths:
                f.write(f"file '{path}'\n")
            concat_file = f.name

        try:
            args = [
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c", "copy",
                output_path
            ]

            success, message = run_ffmpeg(args)
        finally:
            Path(concat_file).unlink()

        if success and Path(output_path).exists():
            return {
                "success": True,
                "output_path": output_path,
                "duration": get_duration(output_path),
                "file_size": Path(output_path).stat().st_size,
                "clips_count": len(input_paths),
            }

        return {"success": False, "error": message}

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "duration": get_duration(output_path),
            "file_size": Path(output_path).stat().st_size,
            "clips_count": len(input_paths),
            "crossfade": crossfade_duration,
        }

    return {"success": False, "error": message}


@mcp.tool()
def change_resolution(
    input_path: str,
    output_path: str,
    width: int,
    height: int,
    maintain_aspect: bool = True,
    pad_color: str = "black",
) -> dict:
    """
    Change video resolution. Use for vertical conversion (1080x1920).

    Args:
        input_path: Path to input video
        output_path: Path to save resized video
        width: Target width
        height: Target height
        maintain_aspect: If True, add padding instead of stretching
        pad_color: Padding color (black, white, or hex like 0x000000)

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    if maintain_aspect:
        scale_filter = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:{pad_color}"
    else:
        scale_filter = f"scale={width}:{height}"

    args = [
        "-i", input_path,
        "-vf", scale_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "resolution": f"{width}x{height}",
            "duration": get_duration(output_path),
            "file_size": Path(output_path).stat().st_size,
        }

    return {"success": False, "error": message}


# ═══════════════════════════════════════════════════════════════════════════════
# OVERLAY TOOLS
# ═══════════════════════════════════════════════════════════════════════════════

@mcp.tool()
def add_image_overlay(
    input_path: str,
    output_path: str,
    image_path: str,
    position: str = "top-right",
    scale: float = 0.1,
    margin: int = 20,
) -> dict:
    """
    Add image overlay (logo/watermark) to video.

    Args:
        input_path: Path to input video
        output_path: Path to save video with overlay
        image_path: Path to overlay image (PNG with transparency recommended)
        position: Position - top-left, top-right, bottom-left, bottom-right, center
        scale: Scale relative to video width (0.1 = 10%)
        margin: Margin from edge in pixels

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Video not found: {input_path}"}
    if not Path(image_path).exists():
        return {"success": False, "error": f"Image not found: {image_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Position mapping
    positions = {
        "top-left": f"{margin}:{margin}",
        "top-right": f"main_w-overlay_w-{margin}:{margin}",
        "bottom-left": f"{margin}:main_h-overlay_h-{margin}",
        "bottom-right": f"main_w-overlay_w-{margin}:main_h-overlay_h-{margin}",
        "center": "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
    }

    pos = positions.get(position, positions["top-right"])

    filter_complex = f"[1:v]scale=iw*{scale}:-1[logo];[0:v][logo]overlay={pos}"

    args = [
        "-i", input_path,
        "-i", image_path,
        "-filter_complex", filter_complex,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "position": position,
            "scale": scale,
        }

    return {"success": False, "error": message}


@mcp.tool()
def add_union_logo(
    input_path: str,
    output_path: str,
    position: str = "top-right",
    scale: float = 0.08,
) -> dict:
    """
    Add Union FC logo overlay to video.

    Args:
        input_path: Path to input video
        output_path: Path to save video with logo
        position: Logo position (top-right recommended)
        scale: Logo scale (default 8% of video width)

    Returns:
        Result with success status
    """
    logo_path = str(UNION_LOGO)

    if not Path(logo_path).exists():
        return {"success": False, "error": f"Union logo not found at: {logo_path}"}

    return add_image_overlay(input_path, output_path, logo_path, position, scale)


@mcp.tool()
def burn_subtitles(
    input_path: str,
    output_path: str,
    subtitle_path: str,
) -> dict:
    """
    Burn subtitles into video (SRT, ASS, VTT format).

    Args:
        input_path: Path to input video
        output_path: Path to save video with subtitles
        subtitle_path: Path to subtitle file

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Video not found: {input_path}"}
    if not Path(subtitle_path).exists():
        return {"success": False, "error": f"Subtitle not found: {subtitle_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Escape path for FFmpeg
    sub_escaped = subtitle_path.replace("\\", "/").replace(":", "\\:")

    args = [
        "-i", input_path,
        "-vf", f"subtitles='{sub_escaped}'",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "subtitle_file": subtitle_path,
        }

    return {"success": False, "error": message}


@mcp.tool()
def generate_srt_file(
    output_path: str,
    subtitles: List[Dict[str, Any]],
) -> dict:
    """
    Generate SRT subtitle file from list of subtitle entries.

    Args:
        output_path: Path to save .srt file
        subtitles: List of dicts with keys: start, end, text
                   Example: [{"start": 0.0, "end": 3.0, "text": "Hello world"}]

    Returns:
        Result with success status
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    def format_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            for i, sub in enumerate(subtitles, 1):
                start = format_time(sub.get("start", 0))
                end = format_time(sub.get("end", 0))
                text = sub.get("text", "")

                f.write(f"{i}\n")
                f.write(f"{start} --> {end}\n")
                f.write(f"{text}\n\n")

        return {
            "success": True,
            "output_path": output_path,
            "subtitle_count": len(subtitles),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIO TOOLS
# ═══════════════════════════════════════════════════════════════════════════════

@mcp.tool()
def audio_duck(
    input_path: str,
    output_path: str,
    duck_level_db: float = -15.0,
) -> dict:
    """
    Reduce audio volume (ducking) - useful for background music under dialogue.

    Args:
        input_path: Path to input video/audio
        output_path: Path to save with ducked audio
        duck_level_db: Volume reduction in dB (negative value)

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Convert dB to linear gain
    gain = 10 ** (duck_level_db / 20)

    args = [
        "-i", input_path,
        "-af", f"volume={gain:.4f}",
        "-c:v", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "duck_level_db": duck_level_db,
        }

    return {"success": False, "error": message}


@mcp.tool()
def mix_background_music(
    video_path: str,
    music_path: str,
    output_path: str,
    music_volume: float = 0.15,
    duck_during_speech: bool = True,
) -> dict:
    """
    Mix background music with video audio, optionally ducking during speech.

    Args:
        video_path: Path to input video
        music_path: Path to background music
        output_path: Path to save mixed video
        music_volume: Music volume (0.0-1.0, default 0.15)
        duck_during_speech: Auto-reduce music when speech detected

    Returns:
        Result with success status
    """
    if not Path(video_path).exists():
        return {"success": False, "error": f"Video not found: {video_path}"}
    if not Path(music_path).exists():
        return {"success": False, "error": f"Music not found: {music_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    video_duration = get_duration(video_path)

    if duck_during_speech:
        # Use sidechaincompress for auto-ducking
        filter_complex = (
            f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{video_duration},volume={music_volume}[music];"
            f"[0:a]asplit=2[voice][voice_sc];"
            f"[music][voice_sc]sidechaincompress=threshold=0.02:ratio=8:attack=50:release=500[ducked];"
            f"[voice][ducked]amix=inputs=2:duration=first[aout]"
        )
    else:
        filter_complex = (
            f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{video_duration},volume={music_volume}[music];"
            f"[0:a][music]amix=inputs=2:duration=first[aout]"
        )

    args = [
        "-i", video_path,
        "-i", music_path,
        "-filter_complex", filter_complex,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "music_volume": music_volume,
            "ducking": duck_during_speech,
        }

    return {"success": False, "error": message}


@mcp.tool()
def boost_volume(
    input_path: str,
    output_path: str,
    boost_db: float = 6.0,
) -> dict:
    """
    Boost audio volume.

    Args:
        input_path: Path to input video/audio
        output_path: Path to save boosted video
        boost_db: Volume boost in dB (default +6dB)

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    args = [
        "-i", input_path,
        "-af", f"volume={boost_db}dB",
        "-c:v", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "boost_db": boost_db,
        }

    return {"success": False, "error": message}


@mcp.tool()
def select_music_by_mood(mood: str) -> dict:
    """
    Get path to background music file based on mood.

    Args:
        mood: Music mood - hype, emotional, suspense, chill

    Returns:
        Path to music file if found
    """
    music_path = MUSIC_PATHS.get(mood.lower())

    if music_path and music_path.exists():
        return {
            "success": True,
            "mood": mood,
            "path": str(music_path),
        }

    available = [m for m, p in MUSIC_PATHS.items() if p.exists()]
    return {
        "success": False,
        "error": f"Mood '{mood}' not found. Available: {available}",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# INTRO/OUTRO & FADE EFFECTS
# ═══════════════════════════════════════════════════════════════════════════════

@mcp.tool()
def add_fade_effect(
    input_path: str,
    output_path: str,
    fade_in_duration: float = 0.5,
    fade_out_duration: float = 0.5,
) -> dict:
    """
    Add fade in/out effects to video.

    Args:
        input_path: Path to input video
        output_path: Path to save video with fades
        fade_in_duration: Fade in duration in seconds
        fade_out_duration: Fade out duration in seconds

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    duration = get_duration(input_path)
    fade_out_start = duration - fade_out_duration

    video_filter = f"fade=t=in:st=0:d={fade_in_duration},fade=t=out:st={fade_out_start}:d={fade_out_duration}"
    audio_filter = f"afade=t=in:st=0:d={fade_in_duration},afade=t=out:st={fade_out_start}:d={fade_out_duration}"

    args = [
        "-i", input_path,
        "-vf", video_filter,
        "-af", audio_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "fade_in": fade_in_duration,
            "fade_out": fade_out_duration,
        }

    return {"success": False, "error": message}


@mcp.tool()
def create_text_card(
    output_path: str,
    text: str,
    duration: float = 3.0,
    width: int = 1920,
    height: int = 1080,
    bg_color: str = "black",
    text_color: str = "white",
    font_size: int = 72,
) -> dict:
    """
    Create a video card with text (for intro/outro).

    Args:
        output_path: Path to save video card
        text: Text to display
        duration: Card duration in seconds
        width: Video width
        height: Video height
        bg_color: Background color
        text_color: Text color
        font_size: Font size

    Returns:
        Result with success status
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    escaped_text = escape_ffmpeg_text(text)

    font_file = ""
    if FONT_PATH.exists():
        font_file = f":fontfile='{FONT_PATH}'"

    drawtext = (
        f"drawtext=text='{escaped_text}':"
        f"fontsize={font_size}:fontcolor={text_color}:"
        f"x=(w-text_w)/2:y=(h-text_h)/2"
        f"{font_file}"
    )

    args = [
        "-f", "lavfi",
        "-i", f"color=c={bg_color}:s={width}x{height}:d={duration}",
        "-f", "lavfi",
        "-i", f"anullsrc=channel_layout=stereo:sample_rate=48000",
        "-vf", drawtext,
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "duration": duration,
            "text": text,
        }

    return {"success": False, "error": message}


@mcp.tool()
def add_union_intro_outro(
    input_path: str,
    output_path: str,
    add_intro: bool = True,
    add_outro: bool = True,
    crossfade: float = 0.5,
) -> dict:
    """
    Add Union FC intro and/or outro to video.

    Args:
        input_path: Path to input video
        output_path: Path to save final video
        add_intro: Whether to add intro
        add_outro: Whether to add outro
        crossfade: Crossfade duration between clips

    Returns:
        Result with success status
    """
    clips = []

    if add_intro and UNION_INTRO.exists():
        clips.append(str(UNION_INTRO))

    clips.append(input_path)

    if add_outro and UNION_OUTRO.exists():
        clips.append(str(UNION_OUTRO))

    if len(clips) == 1:
        return {"success": False, "error": "No intro/outro files found"}

    return concatenate_videos(clips, output_path, crossfade)


# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

@mcp.tool()
def apply_template_reaction(
    input_path: str,
    output_path: str,
    add_logo: bool = True,
    add_subtitles: Optional[str] = None,
) -> dict:
    """
    Apply REACTION template: simple cut with logo and subtitles.

    Args:
        input_path: Path to input video
        output_path: Path to save processed video
        add_logo: Add Union logo overlay
        add_subtitles: Path to subtitle file (optional)

    Returns:
        Result with success status
    """
    current = input_path
    temp_files = []

    try:
        # Step 1: Add logo
        if add_logo:
            logo_out = str(OUTPUT_DIR / f"temp_logo_{Path(output_path).stem}.mp4")
            result = add_union_logo(current, logo_out)
            if not result["success"]:
                return result
            current = logo_out
            temp_files.append(logo_out)

        # Step 2: Add subtitles
        if add_subtitles and Path(add_subtitles).exists():
            subs_out = str(OUTPUT_DIR / f"temp_subs_{Path(output_path).stem}.mp4")
            result = burn_subtitles(current, subs_out, add_subtitles)
            if not result["success"]:
                return result
            current = subs_out
            temp_files.append(subs_out)

        # Final copy to output
        import shutil
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(current, output_path)

        return {
            "success": True,
            "output_path": output_path,
            "template": "reaction",
            "duration": get_duration(output_path),
        }

    finally:
        for f in temp_files:
            if f != output_path and Path(f).exists():
                Path(f).unlink()


@mcp.tool()
def apply_template_split_horizontal(
    top_video_path: str,
    bottom_video_path: str,
    output_path: str,
) -> dict:
    """
    Apply SPLIT_HORIZONTAL template: commentary on top, gameplay/lance on bottom.

    Args:
        top_video_path: Path to top video (commentary/reaction)
        bottom_video_path: Path to bottom video (gameplay/lance)
        output_path: Path to save split video

    Returns:
        Result with success status
    """
    if not Path(top_video_path).exists():
        return {"success": False, "error": f"Top video not found: {top_video_path}"}
    if not Path(bottom_video_path).exists():
        return {"success": False, "error": f"Bottom video not found: {bottom_video_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Stack videos vertically (top/bottom)
    filter_complex = (
        "[0:v]scale=1920:540[top];"
        "[1:v]scale=1920:540[bottom];"
        "[top][bottom]vstack=inputs=2[v];"
        "[0:a][1:a]amix=inputs=2:duration=shortest[a]"
    )

    args = [
        "-i", top_video_path,
        "-i", bottom_video_path,
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "template": "split_horizontal",
            "duration": get_duration(output_path),
        }

    return {"success": False, "error": message}


@mcp.tool()
def apply_template_grande_momento(
    input_path: str,
    output_path: str,
    title: str,
    subtitle: str = "",
) -> dict:
    """
    Apply GRANDE_MOMENTO template: TV Cultura style with banner.

    Args:
        input_path: Path to input video
        output_path: Path to save processed video
        title: Main title text
        subtitle: Subtitle/description text

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    escaped_title = escape_ffmpeg_text(title)
    escaped_subtitle = escape_ffmpeg_text(subtitle)

    font_file = f":fontfile='{FONT_PATH}'" if FONT_PATH.exists() else ""

    # Banner style drawtext filters
    filters = [
        # Background banner (red)
        f"drawbox=x=0:y=ih-120:w=iw:h=120:color=red@0.8:t=fill",
        # Title
        f"drawtext=text='{escaped_title}':fontsize=48:fontcolor=white:x=40:y=h-100{font_file}",
    ]

    if subtitle:
        filters.append(
            f"drawtext=text='{escaped_subtitle}':fontsize=32:fontcolor=white@0.9:x=40:y=h-55{font_file}"
        )

    video_filter = ",".join(filters)

    args = [
        "-i", input_path,
        "-vf", video_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "template": "grande_momento",
            "title": title,
            "duration": get_duration(output_path),
        }

    return {"success": False, "error": message}


@mcp.tool()
def apply_template_resenha(
    input_path: str,
    output_path: str,
    zoom_factor: float = 1.2,
    border_color: str = "red",
    border_width: int = 8,
) -> dict:
    """
    Apply RESENHA template: progressive zoom with red frame border.

    Args:
        input_path: Path to input video
        output_path: Path to save processed video
        zoom_factor: Final zoom level (1.2 = 20% zoom)
        border_color: Border color
        border_width: Border width in pixels

    Returns:
        Result with success status
    """
    if not Path(input_path).exists():
        return {"success": False, "error": f"Input not found: {input_path}"}

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    duration = get_duration(input_path)

    # Progressive zoom + red border
    video_filter = (
        f"zoompan=z='min(zoom+0.0005,{zoom_factor})':d={int(duration*30)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080,"
        f"drawbox=x=0:y=0:w=iw:h={border_width}:color={border_color}:t=fill,"
        f"drawbox=x=0:y=ih-{border_width}:w=iw:h={border_width}:color={border_color}:t=fill,"
        f"drawbox=x=0:y=0:w={border_width}:h=ih:color={border_color}:t=fill,"
        f"drawbox=x=iw-{border_width}:y=0:w={border_width}:h=ih:color={border_color}:t=fill"
    )

    args = [
        "-i", input_path,
        "-vf", video_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        output_path
    ]

    success, message = run_ffmpeg(args)

    if success and Path(output_path).exists():
        return {
            "success": True,
            "output_path": output_path,
            "template": "resenha",
            "zoom_factor": zoom_factor,
            "duration": get_duration(output_path),
        }

    return {"success": False, "error": message}


# ═══════════════════════════════════════════════════════════════════════════════
# REPORT GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

@mcp.tool()
def generate_production_report(
    clips: List[Dict[str, Any]],
    output_path: str,
    session_info: Optional[Dict[str, Any]] = None,
) -> dict:
    """
    Generate production report in Markdown format.

    Args:
        clips: List of produced clips with info
        output_path: Path to save report (.md file)
        session_info: Optional session metadata (tokens, etc)

    Returns:
        Result with success status
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    try:
        total_duration = sum(c.get("duration", 0) for c in clips)
        total_size = sum(c.get("file_size", 0) for c in clips)

        # Count by category
        categories = {}
        for c in clips:
            cat = c.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1

        report = f"""# Union FC - Relatorio de Producao

Gerado em: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}

## Resumo

| Metrica | Valor |
|---------|-------|
| Total de Clips | {len(clips)} |
| Duracao Total | {total_duration:.1f}s ({total_duration/60:.1f} min) |
| Tamanho Total | {total_size / (1024*1024):.1f} MB |

## Breakdown por Categoria

| Categoria | Quantidade |
|-----------|------------|
"""

        for cat, count in sorted(categories.items()):
            report += f"| {cat} | {count} |\n"

        report += "\n## Clips Produzidos\n\n"

        for i, clip in enumerate(clips, 1):
            report += f"""### {i}. {clip.get('title', 'Untitled')}

- **Duracao:** {clip.get('duration', 0):.1f}s
- **Categoria:** {clip.get('category', 'N/A')}
- **Score:** {clip.get('score', 'N/A')}/10
- **Arquivo:** `{clip.get('output_path', 'N/A')}`

"""

            if clip.get("captions"):
                report += "**Legendas sugeridas:**\n"
                for platform, caption in clip.get("captions", {}).items():
                    report += f"- {platform}: {caption}\n"
                report += "\n"

        if session_info:
            report += f"""## Custos da Sessao

| Metrica | Valor |
|---------|-------|
| Tokens Usados | {session_info.get('tokens', 0):,} |
| Custo Estimado | ${session_info.get('cost', 0):.4f} |

"""

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)

        return {
            "success": True,
            "output_path": output_path,
            "clips_count": len(clips),
            "total_duration": total_duration,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# SERVER ENTRYPOINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    logger.info("Starting Union FC FFmpeg MCP Server...")
    logger.info(f"Assets directory: {ASSETS_DIR}")
    logger.info(f"Output directory: {OUTPUT_DIR}")

    # Run on stdio transport for Claude Code integration
    mcp.run(transport="stdio")
