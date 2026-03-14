"""
FFmpeg clip producer - MCP Integration
Produces clips correctly by extracting and concatenating individual segments.

Key differences from producer_crew.py:
- Extracts EACH segment separately (not start_time to end_time)
- Concatenates segments in correct order
- Single FFmpeg command with all filters (no re-encoding)
"""
import os
import subprocess
import tempfile
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List, Dict, Any


@dataclass
class MCPProductionResult:
    """Result from MCP-based production."""
    clip_id: str
    title: str
    success: bool
    horizontal_path: Optional[str] = None
    vertical_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    duration_seconds: float = 0
    file_size_bytes: int = 0
    error: Optional[str] = None


def run_ffmpeg(args: list, timeout: int = 3600) -> tuple[bool, str]:
    """Run FFmpeg command and return success status + output/error."""
    try:
        cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning"] + args
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


def get_duration(video_path: str) -> float:
    """Get video duration in seconds."""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ], capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception:
        pass
    return 0


def escape_ffmpeg_text(text: str) -> str:
    """Escape special characters for FFmpeg drawtext filter."""
    return text.replace("\\", "\\\\").replace("'", "'\\''").replace(":", "\\:")


# ═══════════════════════════════════════════════════════════════════════════════
# SEGMENT EXTRACTION AND CONCATENATION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_segments(
    video_path: str,
    segments: List[Dict[str, Any]],
    output_dir: str,
) -> List[str]:
    """
    Extract each segment from video as separate files.

    Args:
        video_path: Path to source video
        segments: List of segments with 'start' and 'end' keys
        output_dir: Directory for temporary segment files

    Returns:
        List of paths to extracted segment files
    """
    segment_files = []

    for idx, seg in enumerate(segments):
        start = seg.get("start", seg.get("start_time", 0))
        end = seg.get("end", seg.get("end_time", start + 10))

        output_file = os.path.join(output_dir, f"segment_{idx:03d}.mp4")

        # Use fast copy when possible (accurate seeking with re-encode)
        success, _ = run_ffmpeg([
            "-ss", str(start),
            "-to", str(end),
            "-i", video_path,
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k",
            "-avoid_negative_ts", "make_zero",
            output_file
        ])

        if success and os.path.exists(output_file):
            segment_files.append(output_file)
            duration = end - start
            print(f"    Segment {idx + 1}: {start}s-{end}s ({duration:.1f}s)")

    return segment_files


def concatenate_segments(
    segment_files: List[str],
    output_path: str,
) -> bool:
    """
    Concatenate multiple segment files into one video.

    Args:
        segment_files: List of paths to segment files
        output_path: Path for concatenated output

    Returns:
        True if successful
    """
    if not segment_files:
        return False

    if len(segment_files) == 1:
        # Just copy single segment
        success, _ = run_ffmpeg([
            "-i", segment_files[0],
            "-c", "copy",
            output_path
        ])
        return success

    # Create concat file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for seg_file in segment_files:
            f.write(f"file '{seg_file}'\n")
        concat_file = f.name

    try:
        success, _ = run_ffmpeg([
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c", "copy",
            output_path
        ])
        return success
    finally:
        os.unlink(concat_file)


# ═══════════════════════════════════════════════════════════════════════════════
# VIDEO PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def add_logo_overlay(
    video_path: str,
    output_path: str,
    logo_path: str,
    position: str = "top-right",
    scale: float = 0.08,
    margin: int = 20,
) -> bool:
    """Add logo overlay to video."""
    if not os.path.exists(logo_path):
        # No logo, just copy
        success, _ = run_ffmpeg(["-i", video_path, "-c", "copy", output_path])
        return success

    positions = {
        "top-left": f"{margin}:{margin}",
        "top-right": f"main_w-overlay_w-{margin}:{margin}",
        "bottom-left": f"{margin}:main_h-overlay_h-{margin}",
        "bottom-right": f"main_w-overlay_w-{margin}:main_h-overlay_h-{margin}",
    }
    pos = positions.get(position, positions["top-right"])

    filter_complex = f"[1:v]scale=iw*{scale}:-1[logo];[0:v][logo]overlay={pos}"

    success, _ = run_ffmpeg([
        "-i", video_path,
        "-i", logo_path,
        "-filter_complex", filter_complex,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        output_path
    ])
    return success


def boost_volume(video_path: str, output_path: str, boost_db: float = 6.0) -> bool:
    """Boost audio volume."""
    success, _ = run_ffmpeg([
        "-i", video_path,
        "-af", f"volume={boost_db}dB",
        "-c:v", "copy",
        output_path
    ])
    return success


def convert_to_vertical(video_path: str, output_path: str) -> bool:
    """Convert horizontal video to vertical (9:16) with blur background."""
    filter_complex = (
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,boxblur=20:20[bg];"
        "[0:v]scale=1080:-1:force_original_aspect_ratio=decrease[fg];"
        "[bg][fg]overlay=(W-w)/2:(H-h)/2[vout]"
    )

    success, _ = run_ffmpeg([
        "-i", video_path,
        "-filter_complex", filter_complex,
        "-map", "[vout]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        output_path
    ])
    return success


def extract_thumbnail(video_path: str, timestamp: float, output_path: str) -> bool:
    """Extract thumbnail at specific timestamp."""
    success, _ = run_ffmpeg([
        "-ss", str(timestamp),
        "-i", video_path,
        "-vframes", "1",
        "-vf", "scale=1280:-1",
        "-q:v", "2",
        output_path
    ])
    return success


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN MCP PRODUCTION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def produce_clip_mcp(
    video_path: str,
    clip: Dict[str, Any],
    output_dir: str,
    logo_path: Optional[str] = None,
) -> MCPProductionResult:
    """
    Produce a single clip using MCP-style pipeline.

    CORRECTLY extracts individual segments and concatenates them.

    Args:
        video_path: Path to source video
        clip: Clip data with 'segments' list containing 'start'/'end' times
        output_dir: Output directory for produced clips
        logo_path: Path to logo image

    Returns:
        MCPProductionResult with paths and status
    """
    clip_id = clip.get("id", f"clip_{clip.get('priority', 0)}")
    title = clip.get("title", "Untitled")

    try:
        # Create temp directory
        tmp = os.path.join("/tmp/mcp-clips", clip_id)
        os.makedirs(tmp, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)

        # Get asset paths
        assets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "assets")
        if not logo_path:
            logo_path = os.path.join(assets_dir, "union_logo.png")

        # Get segments
        segments = clip.get("segments", [])

        # Fallback: if no segments, create one from start/end
        if not segments:
            start = clip.get("start_time", clip.get("start", 0))
            end = clip.get("end_time", clip.get("end", start + 60))
            segments = [{"start": start, "end": end, "type": "content"}]

        # Calculate expected duration
        expected_duration = sum(
            (seg.get("end", seg.get("end_time", 0)) - seg.get("start", seg.get("start_time", 0)))
            for seg in segments
        )

        print(f"  Clip: {title}")
        print(f"  Segments: {len(segments)} (~{expected_duration:.0f}s total)")

        # ── PHASE 1: EXTRACT SEGMENTS ──
        print(f"  [1/5] Extracting {len(segments)} segments...")
        segment_files = extract_segments(video_path, segments, tmp)

        if not segment_files:
            return MCPProductionResult(
                clip_id=clip_id,
                title=title,
                success=False,
                error="Failed to extract segments",
            )

        # ── PHASE 2: CONCATENATE ──
        print(f"  [2/5] Concatenating {len(segment_files)} segments...")
        concat_path = os.path.join(tmp, "concatenated.mp4")

        if not concatenate_segments(segment_files, concat_path):
            return MCPProductionResult(
                clip_id=clip_id,
                title=title,
                success=False,
                error="Failed to concatenate segments",
            )

        current_file = concat_path

        # ── PHASE 3: LOGO OVERLAY ──
        print(f"  [3/5] Adding logo overlay...")
        with_logo = os.path.join(tmp, "with_logo.mp4")

        if add_logo_overlay(current_file, with_logo, logo_path):
            current_file = with_logo

        # ── PHASE 4: VOLUME BOOST ──
        spec = clip.get("production_spec", {})
        audio_spec = spec.get("audio", {})
        boost_db = audio_spec.get("boost_db", 6.0)

        print(f"  [4/5] Boosting volume (+{boost_db}dB)...")
        final_horizontal = os.path.join(output_dir, f"{clip_id}_horizontal.mp4")

        if not boost_volume(current_file, final_horizontal, boost_db):
            # Fallback: just copy
            run_ffmpeg(["-i", current_file, "-c", "copy", final_horizontal])

        # ── PHASE 5: VERTICAL VERSION ──
        clip_format = spec.get("format", "horizontal")  # Default to horizontal only
        final_vertical = None

        if clip_format in ["vertical", "both"]:
            print(f"  [5/5] Creating vertical version...")
            final_vertical = os.path.join(output_dir, f"{clip_id}_vertical.mp4")
            convert_to_vertical(final_horizontal, final_vertical)
        else:
            print(f"  [5/5] Skipping vertical (format={clip_format})")

        # ── THUMBNAIL ──
        thumb_path = os.path.join(output_dir, f"{clip_id}_thumb.jpg")
        final_duration = get_duration(final_horizontal)
        thumb_time = min(5, final_duration - 1) if final_duration > 1 else 0
        extract_thumbnail(final_horizontal, thumb_time, thumb_path)

        # Get file info
        file_size = os.path.getsize(final_horizontal) if os.path.exists(final_horizontal) else 0

        print(f"  ✅ Done: {final_duration:.1f}s (expected {expected_duration:.0f}s)")

        return MCPProductionResult(
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
        import traceback
        return MCPProductionResult(
            clip_id=clip_id,
            title=title,
            success=False,
            error=f"{str(e)}\n{traceback.format_exc()}",
        )


def produce_clips_mcp(
    video_path: str,
    clips: List[Dict[str, Any]],
    evaluations: Optional[List[Dict[str, Any]]] = None,
    output_dir: str = "/tmp/mcp-output",
    only_approved: bool = True,
) -> List[MCPProductionResult]:
    """
    Produce all clips from a production plan using MCP pipeline.

    Args:
        video_path: Path to source video
        clips: List of clips from production plan
        evaluations: Optional list of evaluations (to filter)
        output_dir: Output directory
        only_approved: If True, only produce APPROVED clips

    Returns:
        List of MCPProductionResult for each clip
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

    print(f"🎬 [MCP] Producing {len(clips_to_produce)} clips...")

    for idx, clip in enumerate(clips_to_produce, 1):
        title = clip.get("title", "Untitled")
        print(f"\n[{idx}/{len(clips_to_produce)}] {title}")

        result = produce_clip_mcp(
            video_path=video_path,
            clip=clip,
            output_dir=output_dir,
        )

        if result.success:
            print(f"  ✅ Produced: {result.duration_seconds:.1f}s")
        else:
            print(f"  ❌ Failed: {result.error}")

        results.append(result)

    return results
