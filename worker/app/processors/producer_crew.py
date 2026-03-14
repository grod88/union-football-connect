"""
FFmpeg clip producer - Crew Integration

Produces clips using production specs from the PRODUTOR agent.
Integrates with the Crew multi-agent system.
"""
import os
import subprocess
import tempfile
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

from .producer_v3 import (
    ProducedClipResultV3,
    remove_silences_and_concat,
    apply_logo_overlay,
    boost_volume,
    convert_to_vertical,
    extract_thumbnail,
    mix_background_music,
    create_intro_card,
    create_outro_card,
    concat_videos,
    escape_ffmpeg_text,
)


@dataclass
class CrewProductionResult:
    """Result from crew-based production."""
    clip_id: str
    title: str
    success: bool
    horizontal_path: Optional[str] = None
    vertical_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    duration_seconds: float = 0
    file_size_bytes: int = 0
    error: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# TEXT OVERLAY (Impact Text)
# ═══════════════════════════════════════════════════════════════════════════════

def add_text_overlay(
    video_path: str,
    output_path: str,
    text: str,
    start_time: float = 0,
    duration: float = 3,
    style: str = "impact",
    position: str = "top",
    font_path: Optional[str] = None,
) -> str:
    """
    Add animated text overlay to video.

    Styles:
    - impact: Large bold text with shadow, fade in/out
    - subtitle: Lower third style
    - title: Center screen, larger
    """
    # Get assets directory for font
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
    if not font_path:
        font_path = os.path.join(assets_dir, "fonts", "Oswald-Bold.ttf")

    # Position mapping
    pos_y = {
        "top": "h*0.1",
        "center": "(h-text_h)/2",
        "bottom": "h*0.85",
    }

    # Style configurations
    style_config = {
        "impact": {
            "fontsize": 72,
            "fontcolor": "white",
            "shadowcolor": "black",
            "shadowx": 4,
            "shadowy": 4,
            "borderw": 3,
        },
        "subtitle": {
            "fontsize": 48,
            "fontcolor": "white",
            "shadowcolor": "black",
            "shadowx": 2,
            "shadowy": 2,
            "borderw": 2,
        },
        "title": {
            "fontsize": 96,
            "fontcolor": "white",
            "shadowcolor": "black",
            "shadowx": 5,
            "shadowy": 5,
            "borderw": 4,
        },
    }

    cfg = style_config.get(style, style_config["impact"])
    escaped_text = escape_ffmpeg_text(text)

    # Build drawtext filter with fade animation
    fade_in = 0.3
    fade_out = 0.3

    drawtext = (
        f"drawtext="
        f"text='{escaped_text}':"
        f"fontsize={cfg['fontsize']}:"
        f"fontcolor={cfg['fontcolor']}:"
        f"shadowcolor={cfg['shadowcolor']}:"
        f"shadowx={cfg['shadowx']}:"
        f"shadowy={cfg['shadowy']}:"
        f"borderw={cfg['borderw']}:"
        f"bordercolor=black:"
        f"x=(w-text_w)/2:"
        f"y={pos_y.get(position, pos_y['top'])}:"
        f"enable='between(t,{start_time},{start_time + duration})':"
        f"alpha='if(lt(t,{start_time + fade_in}),(t-{start_time})/{fade_in},"
        f"if(gt(t,{start_time + duration - fade_out}),({start_time + duration}-t)/{fade_out},1))'"
    )

    # Add font file if exists
    if font_path and os.path.exists(font_path):
        drawtext += f":fontfile='{font_path}'"

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-vf', drawtext,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
        '-c:a', 'copy',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


def add_multiple_text_overlays(
    video_path: str,
    output_path: str,
    overlays: List[Dict[str, Any]],
    font_path: Optional[str] = None,
) -> str:
    """
    Add multiple text overlays to video.

    Each overlay dict should have:
    - time: start time in seconds
    - duration: duration in seconds
    - text: the text to show
    - style: impact|subtitle|title (default: impact)
    - position: top|center|bottom (default: top)
    """
    if not overlays:
        # No overlays, just copy
        subprocess.run([
            'ffmpeg', '-y', '-i', video_path, '-c', 'copy', output_path
        ], check=True, capture_output=True)
        return output_path

    # Build filter chain
    current_input = video_path

    with tempfile.TemporaryDirectory() as tmpdir:
        for idx, overlay in enumerate(overlays):
            temp_output = os.path.join(tmpdir, f"overlay_{idx}.mp4")

            add_text_overlay(
                video_path=current_input,
                output_path=temp_output,
                text=overlay.get("text", ""),
                start_time=overlay.get("time", 0),
                duration=overlay.get("duration", 3),
                style=overlay.get("style", "impact"),
                position=overlay.get("position", "top"),
                font_path=font_path,
            )

            current_input = temp_output

        # Copy final result
        subprocess.run([
            'ffmpeg', '-y', '-i', current_input,
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
            '-c:a', 'copy',
            output_path
        ], check=True, capture_output=True)

    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND MUSIC BY TYPE
# ═══════════════════════════════════════════════════════════════════════════════

MUSIC_PATHS = {
    "hype": "audio/bg/hype.mp3",
    "emotional": "audio/bg/emotional.mp3",
    "suspense": "audio/bg/suspense.mp3",
    "chill": "audio/bg/chill.mp3",
}


def get_music_path(music_type: str) -> Optional[str]:
    """Get background music file path by type."""
    if music_type == "none":
        return None

    assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
    relative_path = MUSIC_PATHS.get(music_type)

    if not relative_path:
        return None

    full_path = os.path.join(assets_dir, relative_path)

    if os.path.exists(full_path):
        return full_path

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN CREW PRODUCTION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def produce_clip_from_crew_plan(
    video_path: str,
    clip: Dict[str, Any],
    output_dir: str,
    logo_path: Optional[str] = None,
) -> CrewProductionResult:
    """
    Produce a single clip using PRODUTOR specs.

    Args:
        video_path: Path to source video
        clip: Clip data from production plan (with production_spec)
        output_dir: Output directory for produced clips
        logo_path: Path to logo image

    Returns:
        CrewProductionResult with paths and status
    """
    clip_id = clip.get("id", f"clip_{clip.get('priority', 0)}")
    title = clip.get("title", "Untitled")

    try:
        tmp = os.path.join("/tmp/crew-clips", clip_id)
        os.makedirs(tmp, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)

        # Get asset paths
        assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
        if not logo_path:
            logo_path = os.path.join(assets_dir, "union_logo.png")

        # Extract production spec
        spec = clip.get("production_spec", {})
        audio_spec = spec.get("audio", {})

        # Get clip timing
        start_time = clip.get("start_time", 0)
        end_time = clip.get("end_time", 60)
        segments = clip.get("segments", [])

        # If no segments, create one from start/end
        if not segments:
            segments = [{"start": start_time, "end": end_time, "type": "content"}]

        # Calculate duration
        original_duration = end_time - start_time

        print(f"  [1/6] Extracting clip ({start_time}s - {end_time}s)...")

        # ── PHASE 1: EXTRACT ──
        raw_clip = os.path.join(tmp, "01_raw.mp4")

        # Simple extraction (no silence removal for now - Produtor already defined segments)
        subprocess.run([
            'ffmpeg', '-y',
            '-ss', str(start_time),
            '-to', str(end_time),
            '-i', video_path,
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '192k',
            raw_clip
        ], check=True, capture_output=True)

        current_file = raw_clip

        # ── PHASE 2: LOGO OVERLAY ──
        print(f"  [2/6] Applying logo overlay...")

        with_logo = os.path.join(tmp, "02_logo.mp4")
        apply_logo_overlay(current_file, logo_path, with_logo)
        current_file = with_logo

        # ── PHASE 3: TEXT OVERLAYS ──
        text_overlays = spec.get("text_overlays", [])
        if text_overlays:
            print(f"  [3/6] Adding {len(text_overlays)} text overlays...")
            with_text = os.path.join(tmp, "03_text.mp4")
            add_multiple_text_overlays(current_file, with_text, text_overlays)
            current_file = with_text
        else:
            print(f"  [3/6] No text overlays...")

        # ── PHASE 4: BACKGROUND MUSIC ──
        music_type = audio_spec.get("background_music", "none")
        music_path = get_music_path(music_type)

        if music_path:
            print(f"  [4/6] Adding background music ({music_type})...")
            music_volume = audio_spec.get("music_volume", 0.1)
            with_music = os.path.join(tmp, "04_music.mp4")
            mix_background_music(current_file, music_path, with_music, music_volume)
            current_file = with_music
        else:
            print(f"  [4/6] No background music...")

        # ── PHASE 5: VOLUME BOOST ──
        volume_db = audio_spec.get("boost_db", 6.0)
        print(f"  [5/6] Applying volume boost (+{volume_db}dB)...")

        final_horizontal = os.path.join(output_dir, f"{clip_id}_horizontal.mp4")
        boost_volume(current_file, final_horizontal, volume_db=volume_db)

        # ── PHASE 6: VERTICAL VERSION ──
        clip_format = spec.get("format", "both")
        final_vertical = None

        if clip_format in ["vertical", "both"]:
            print(f"  [6/6] Generating vertical version...")
            final_vertical = os.path.join(output_dir, f"{clip_id}_vertical.mp4")
            convert_to_vertical(final_horizontal, final_vertical)
        else:
            print(f"  [6/6] Skipping vertical version...")

        # ── THUMBNAIL ──
        thumb_spec = spec.get("thumbnail", {})
        thumb_time = thumb_spec.get("timestamp", start_time + 5) - start_time
        thumb_time = max(0, min(thumb_time, original_duration - 1))

        thumb_path = os.path.join(output_dir, f"{clip_id}_thumb.jpg")
        extract_thumbnail(final_horizontal, thumb_time, thumb_path)

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

        return CrewProductionResult(
            clip_id=clip_id,
            title=title,
            success=True,
            horizontal_path=final_horizontal,
            vertical_path=final_vertical,
            thumbnail_path=thumb_path,
            duration_seconds=final_duration,
            file_size_bytes=file_size,
        )

    except Exception as e:
        return CrewProductionResult(
            clip_id=clip_id,
            title=title,
            success=False,
            error=str(e),
        )


def produce_clips_from_crew_plan(
    video_path: str,
    clips: List[Dict[str, Any]],
    evaluations: Optional[List[Dict[str, Any]]] = None,
    output_dir: str = "/tmp/crew-output",
    only_approved: bool = True,
) -> List[CrewProductionResult]:
    """
    Produce all clips from a PRODUTOR production plan.

    Args:
        video_path: Path to source video
        clips: List of clips from production plan
        evaluations: Optional list of CRITICO evaluations (to filter)
        output_dir: Output directory
        only_approved: If True, only produce APPROVED clips

    Returns:
        List of CrewProductionResult for each clip
    """
    results = []

    # Build evaluation lookup
    eval_map = {}
    if evaluations:
        for ev in evaluations:
            eval_map[ev.get("clip_id")] = ev

    # Filter clips if needed
    clips_to_produce = []
    for clip in clips:
        clip_id = clip.get("id")

        if only_approved and evaluations:
            evaluation = eval_map.get(clip_id, {})
            verdict = evaluation.get("verdict", "APPROVED")

            if verdict == "REJECTED":
                print(f"  ⏭️ Skipping rejected clip: {clip.get('title')}")
                continue

        clips_to_produce.append(clip)

    print(f"🎬 [Crew] Producing {len(clips_to_produce)} clips...")

    for idx, clip in enumerate(clips_to_produce, 1):
        title = clip.get("title", "Untitled")
        print(f"\n[{idx}/{len(clips_to_produce)}] {title}")

        result = produce_clip_from_crew_plan(
            video_path=video_path,
            clip=clip,
            output_dir=output_dir,
        )

        if result.success:
            print(f"  ✅ Done: {result.duration_seconds:.1f}s")
        else:
            print(f"  ❌ Failed: {result.error}")

        results.append(result)

    return results
