"""
YouTube video downloader using yt-dlp
"""
import subprocess
import json
from pathlib import Path
from dataclasses import dataclass
from ..config import settings


@dataclass
class DownloadResult:
    video_path: str
    audio_path: str
    title: str
    duration: int
    description: str
    youtube_id: str
    metadata: dict


def download_video(youtube_url: str, job_id: str) -> DownloadResult:
    """
    Download video from YouTube and extract audio.
    Returns paths to video and audio files.
    """
    output_dir = Path(settings.temp_dir) / job_id
    output_dir.mkdir(parents=True, exist_ok=True)

    video_path = output_dir / "video.mp4"
    audio_path = output_dir / "audio.wav"

    # Download video with yt-dlp
    ydl_opts = {
        "format": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "outtmpl": str(video_path.with_suffix("")),
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
    }

    # First, get metadata
    info_cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-download",
        youtube_url,
    ]
    result = subprocess.run(info_cmd, capture_output=True, text=True, check=True)
    info = json.loads(result.stdout)

    # Download video
    download_cmd = [
        "yt-dlp",
        "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "-o", str(video_path.with_suffix("")),
        "--merge-output-format", "mp4",
        "--quiet",
        "--no-warnings",
        youtube_url,
    ]
    subprocess.run(download_cmd, check=True)

    # The output might have .mp4 extension or not depending on merge
    actual_video_path = video_path
    if not actual_video_path.exists():
        # Try with .mp4 suffix
        potential_path = video_path.with_suffix(".mp4")
        if potential_path.exists():
            actual_video_path = potential_path
        else:
            # Find any video file in the directory
            video_files = list(output_dir.glob("video*"))
            if video_files:
                actual_video_path = video_files[0]
            else:
                raise FileNotFoundError(f"Video file not found in {output_dir}")

    # Extract audio as WAV (16kHz mono for Whisper)
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i", str(actual_video_path),
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        str(audio_path),
    ]
    subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

    return DownloadResult(
        video_path=str(actual_video_path),
        audio_path=str(audio_path),
        title=info.get("title", "Sem título"),
        duration=info.get("duration", 0),
        description=info.get("description", ""),
        youtube_id=info.get("id", ""),
        metadata={
            "channel": info.get("channel", ""),
            "upload_date": info.get("upload_date", ""),
            "view_count": info.get("view_count", 0),
            "thumbnail_url": info.get("thumbnail", ""),
        },
    )


def cleanup_job_files(job_id: str):
    """Remove temporary files for a job"""
    import shutil
    job_dir = Path(settings.temp_dir) / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir)
