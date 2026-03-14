"""
Union Clips AI - FastAPI Backend
"""
import asyncio
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from typing import Optional

from .config import settings
from .supabase_client import supabase, update_source_status, update_insight_status, log_worker
from .processors.downloader import download_video, cleanup_job_files
from .processors.transcriber import transcribe_audio
from .processors.analyzer import analyze_transcript
from .processors.analyzer_v3 import analyze_transcript_v3, clip_to_dict
from .processors.producer_v3 import produce_clip_v3
import re


def sanitize_error_message(error: str) -> str:
    """Remove API keys and sensitive data from error messages"""
    # Mask API keys (OpenAI, Anthropic patterns)
    sanitized = re.sub(r'sk-[a-zA-Z0-9\-_]{20,}', 'sk-***REDACTED***', error)
    sanitized = re.sub(r'sk-ant-[a-zA-Z0-9\-_]{20,}', 'sk-ant-***REDACTED***', sanitized)
    sanitized = re.sub(r'sk-proj-[a-zA-Z0-9\-_]{20,}', 'sk-proj-***REDACTED***', sanitized)
    # Mask Supabase keys
    sanitized = re.sub(r'eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+', '***JWT_REDACTED***', sanitized)
    return sanitized


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🎬 Union Clips AI Worker starting...")
    print(f"📁 Temp directory: {settings.temp_dir}")
    yield
    print("👋 Worker shutting down...")


app = FastAPI(
    title="Union Clips AI",
    description="Backend for automated clip generation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request/Response Models
# ============================================================

class CreateClipJobRequest(BaseModel):
    youtube_url: str
    context: Optional[str] = None
    max_clips: int = 10


class CreateClipJobResponse(BaseModel):
    id: str
    status: str
    message: str


class ProduceClipsRequest(BaseModel):
    insight_ids: list[str]


class CreateClipJobV3Request(BaseModel):
    youtube_url: str
    context: Optional[str] = None
    max_clips: int = 10
    use_v3: bool = True  # Use v3 prompts by default


class ProduceClipV3Request(BaseModel):
    clip_data: dict  # Full clip data from v3 analysis


class ProduceClipsV3BatchRequest(BaseModel):
    insight_ids: list[str]  # Same format as V1 for easier frontend integration


# ============================================================
# Background Tasks
# ============================================================

async def process_video_pipeline(source_id: str, youtube_url: str, context: str | None):
    """
    Full pipeline: download → transcribe → analyze → save insights
    """
    try:
        # 1. Download
        await update_source_status(source_id, "downloading", 0.1)
        print(f"📥 Downloading: {youtube_url}")

        download_result = download_video(youtube_url, source_id)

        # Update with metadata
        supabase.table("video_sources").update({
            "title": download_result.title,
            "youtube_id": download_result.youtube_id,
            "duration_seconds": download_result.duration,
            "description": download_result.description,
            "metadata": download_result.metadata,
            "video_storage_path": download_result.video_path,
            "audio_storage_path": download_result.audio_path,
            "file_path": download_result.video_path,  # Local path for FFmpeg
        }).eq("id", source_id).execute()

        await update_source_status(source_id, "downloading", 0.3)

        # 2. Transcribe
        await update_source_status(source_id, "transcribing", 0.4)
        print(f"🎤 Transcribing audio...")

        transcription = transcribe_audio(download_result.audio_path)

        # Save transcript
        transcript_json = [
            {"start": seg.start, "end": seg.end, "text": seg.text}
            for seg in transcription.segments
        ]

        supabase.table("video_sources").update({
            "transcript_json": transcript_json,
            "transcript_text": transcription.formatted_text,
            "status": "transcribed",
            "progress": 0.6,
        }).eq("id", source_id).execute()

        # 3. Analyze
        await update_source_status(source_id, "analyzing", 0.7)
        print(f"🤖 Analyzing with Claude...")

        analysis = analyze_transcript(
            title=download_result.title,
            transcript=transcription.formatted_text,
            context=context,
            max_clips=settings.max_clips_per_video,
        )

        # Save insights
        for insight in analysis.insights:
            supabase.table("clip_insights").insert({
                "video_source_id": source_id,
                "title": insight.title,
                "hook": insight.hook,
                "category": insight.category,
                "priority": insight.priority,
                "start_time": insight.start_time,
                "end_time": insight.end_time,
                "suggested_template": insight.suggested_template,
                "storytelling": insight.storytelling,
                "production_hints": insight.production_hints,
                "social_metadata": insight.social_metadata,
                "ai_reasoning": insight.ai_reasoning,
                "ai_model_used": settings.claude_model,
                "status": "draft",
            }).execute()

        # Done!
        await update_source_status(source_id, "analyzed", 1.0)
        print(f"✅ Analysis complete: {len(analysis.insights)} insights found")

    except Exception as e:
        print(f"❌ Pipeline error: {e}")
        await update_source_status(
            source_id,
            "error",
            error_message=sanitize_error_message(str(e)),
        )
        raise


async def produce_clips_task(source_id: str, insight_ids: list[str]):
    """
    Produce clips from approved insights
    """
    from .processors.producer import produce_clip

    try:
        # Get video source
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        source = result.data
        video_path = source.get("video_storage_path")

        if not video_path or not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Get insights
        insights_result = supabase.table("clip_insights").select("*").in_("id", insight_ids).execute()
        insights = insights_result.data

        output_dir = Path(settings.temp_dir) / source_id / "clips"
        output_dir.mkdir(parents=True, exist_ok=True)

        for insight in insights:
            insight_id = insight["id"]
            print(f"🎬 Producing clip: {insight['title']}")

            # Update status
            await update_insight_status(insight_id, "producing")

            try:
                # Get production hints
                production = insight.get("production_hints") or {}
                text_overlays = production.get("text_overlays") or production.get("textOverlays") or []

                # Produce clip
                produced = produce_clip(
                    video_path=video_path,
                    output_dir=str(output_dir),
                    clip_id=insight_id,
                    start_time=insight["start_time"],
                    end_time=insight["end_time"],
                    template=insight.get("suggested_template", "reaction"),
                    text_overlays=text_overlays,
                )

                # Upload to Supabase Storage
                horizontal_storage_path = f"{source_id}/{insight_id}_horizontal.mp4"
                thumbnail_storage_path = f"{source_id}/{insight_id}_thumb.jpg"

                # Upload files
                with open(produced.horizontal_path, "rb") as f:
                    supabase.storage.from_(settings.clips_bucket).upload(
                        horizontal_storage_path,
                        f.read(),
                        {"content-type": "video/mp4"},
                    )

                with open(produced.thumbnail_path, "rb") as f:
                    supabase.storage.from_(settings.clips_bucket).upload(
                        thumbnail_storage_path,
                        f.read(),
                        {"content-type": "image/jpeg"},
                    )

                # Save produced clip record
                supabase.table("produced_clips").insert({
                    "insight_id": insight_id,
                    "video_source_id": source_id,
                    "template_id": insight.get("suggested_template", "reaction"),
                    "horizontal_path": horizontal_storage_path,
                    "thumbnail_path": thumbnail_storage_path,
                    "duration_seconds": produced.duration_seconds,
                    "resolution": produced.resolution,
                    "file_size_bytes": produced.file_size_bytes,
                    "ffmpeg_command": produced.ffmpeg_command,
                    "status": "done",
                }).execute()

                # Update insight status
                await update_insight_status(insight_id, "done")
                print(f"✅ Clip produced: {insight['title']}")

            except Exception as e:
                print(f"❌ Error producing clip {insight_id}: {e}")
                await update_insight_status(insight_id, "error")

    except Exception as e:
        print(f"❌ Production error: {e}")
        raise


# ============================================================
# API Endpoints
# ============================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "Union Clips AI"}


@app.get("/api/stream")
async def stream_file(path: str = Query(..., description="Path to the file to stream")):
    """
    Stream a produced clip or thumbnail file (view in browser).

    Security: Only allows streaming from /tmp/ directories to prevent directory traversal.
    """
    # Security check: only allow /tmp/ paths
    if not path.startswith("/tmp/"):
        raise HTTPException(status_code=403, detail="Access denied. Only /tmp/ files allowed.")

    # Resolve path to prevent directory traversal
    resolved_path = Path(path).resolve()
    if not str(resolved_path).startswith("/tmp/"):
        raise HTTPException(status_code=403, detail="Access denied. Path traversal detected.")

    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    # Determine media type
    suffix = resolved_path.suffix.lower()
    media_types = {
        ".mp4": "video/mp4",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    media_type = media_types.get(suffix, "application/octet-stream")

    # Stream without Content-Disposition header (browser will display it)
    return FileResponse(
        path=str(resolved_path),
        media_type=media_type,
    )


@app.get("/api/download")
async def download_file(path: str = Query(..., description="Path to the file to download")):
    """
    Download a produced clip or thumbnail file (force download).

    Security: Only allows downloading from /tmp/ directories to prevent directory traversal.
    """
    # Security check: only allow /tmp/ paths
    if not path.startswith("/tmp/"):
        raise HTTPException(status_code=403, detail="Access denied. Only /tmp/ files allowed.")

    # Resolve path to prevent directory traversal
    resolved_path = Path(path).resolve()
    if not str(resolved_path).startswith("/tmp/"):
        raise HTTPException(status_code=403, detail="Access denied. Path traversal detected.")

    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    # Determine media type
    suffix = resolved_path.suffix.lower()
    media_types = {
        ".mp4": "video/mp4",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    media_type = media_types.get(suffix, "application/octet-stream")

    return FileResponse(
        path=str(resolved_path),
        filename=resolved_path.name,
        media_type=media_type,
    )


@app.post("/api/clips", response_model=CreateClipJobResponse)
async def create_clip_job(
    request: CreateClipJobRequest,
    background_tasks: BackgroundTasks,
):
    """Create a new clip processing job"""
    try:
        # Create video source record
        result = supabase.table("video_sources").insert({
            "youtube_url": request.youtube_url,
            "title": "Processando...",
            "context": request.context,
            "status": "pending",
            "progress": 0.0,
        }).execute()

        source_id = result.data[0]["id"]

        # Start background processing
        background_tasks.add_task(
            process_video_pipeline,
            source_id,
            request.youtube_url,
            request.context,
        )

        return CreateClipJobResponse(
            id=source_id,
            status="pending",
            message="Job criado com sucesso",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/clips/{source_id}")
async def get_clip_job(source_id: str):
    """Get status of a clip job"""
    try:
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        # Get insights
        insights_result = supabase.table("clip_insights").select("*").eq("video_source_id", source_id).order("priority").execute()

        # Get produced clips
        clips_result = supabase.table("produced_clips").select("*").eq("video_source_id", source_id).execute()

        return {
            "source": result.data,
            "insights": insights_result.data or [],
            "produced_clips": clips_result.data or [],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clips/{source_id}/produce")
async def produce_clips(
    source_id: str,
    request: ProduceClipsRequest,
    background_tasks: BackgroundTasks,
):
    """Produce clips from approved insights"""
    try:
        # Verify source exists
        result = supabase.table("video_sources").select("id").eq("id", source_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Source not found")

        # Start production
        background_tasks.add_task(
            produce_clips_task,
            source_id,
            request.insight_ids,
        )

        return {"status": "producing", "message": f"Producing {len(request.insight_ids)} clips"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/clips/{source_id}")
async def delete_clip_job(source_id: str):
    """Delete a clip job and all related data"""
    try:
        # Delete from database (cascade will handle related records)
        supabase.table("video_sources").delete().eq("id", source_id).execute()

        # Cleanup files
        cleanup_job_files(source_id)

        return {"status": "deleted"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# V3 Endpoints (Production Ready)
# ============================================================

async def produce_clip_v3_task(source_id: str, insight_id: str, clip_data: dict):
    """
    Produce a single clip using V3 pipeline with full production features
    """
    try:
        # Get video source
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        source = result.data
        video_path = source.get("video_storage_path")

        if not video_path or not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        output_dir = Path(settings.temp_dir) / source_id / "clips_v3"
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"🎬 [V3] Producing clip: {clip_data.get('title', 'Untitled')}")

        # Update status
        await update_insight_status(insight_id, "producing")

        # Produce clip with V3 pipeline
        produced = produce_clip_v3(
            video_path=video_path,
            clip_data=clip_data,
            output_dir=str(output_dir),
        )

        # Upload to Supabase Storage
        horizontal_storage_path = f"{source_id}/{insight_id}_horizontal_v3.mp4"
        vertical_storage_path = f"{source_id}/{insight_id}_vertical_v3.mp4"
        thumbnail_storage_path = f"{source_id}/{insight_id}_thumb_v3.jpg"

        # Upload horizontal
        with open(produced.horizontal_path, "rb") as f:
            supabase.storage.from_(settings.clips_bucket).upload(
                horizontal_storage_path,
                f.read(),
                {"content-type": "video/mp4"},
            )

        # Upload vertical if exists
        if produced.vertical_path and Path(produced.vertical_path).exists():
            with open(produced.vertical_path, "rb") as f:
                supabase.storage.from_(settings.clips_bucket).upload(
                    vertical_storage_path,
                    f.read(),
                    {"content-type": "video/mp4"},
                )

        # Upload thumbnail
        with open(produced.thumbnail_path, "rb") as f:
            supabase.storage.from_(settings.clips_bucket).upload(
                thumbnail_storage_path,
                f.read(),
                {"content-type": "image/jpeg"},
            )

        # Save produced clip record
        supabase.table("produced_clips").insert({
            "insight_id": insight_id,
            "video_source_id": source_id,
            "template_id": clip_data.get("production", {}).get("suggested_template", "reaction_v3"),
            "horizontal_path": horizontal_storage_path,
            "vertical_path": vertical_storage_path,
            "thumbnail_path": thumbnail_storage_path,
            "duration_seconds": produced.duration_seconds,
            "duration_after_cuts": produced.duration_after_cuts,
            "resolution": produced.resolution,
            "file_size_bytes": produced.file_size_bytes,
            "production_version": "v3",
            "status": "done",
        }).execute()

        # Update insight status
        await update_insight_status(insight_id, "done")
        print(f"✅ [V3] Clip produced: {clip_data.get('title', 'Untitled')}")
        print(f"   Duration: {produced.duration_seconds:.1f}s → {produced.duration_after_cuts:.1f}s (after cuts)")

    except Exception as e:
        print(f"❌ [V3] Production error: {e}")
        await update_insight_status(insight_id, "error")
        raise


async def produce_clips_v3_batch_task(source_id: str, insight_ids: list[str]):
    """
    Produce clips from insight_ids using V3 pipeline.
    Builds clip_data from database records.
    """
    try:
        # Get video source
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        source = result.data
        video_path = source.get("video_storage_path")
        transcript_json = source.get("transcript_json") or []

        if not video_path or not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Get insights
        insights_result = supabase.table("clip_insights").select("*").in_("id", insight_ids).execute()
        insights = insights_result.data

        output_dir = Path(settings.temp_dir) / source_id / "clips_v3"
        output_dir.mkdir(parents=True, exist_ok=True)

        for insight in insights:
            insight_id = insight["id"]
            print(f"🎬 [V3] Producing clip: {insight['title']}")

            # Reset status to producing
            await update_insight_status(insight_id, "producing")

            try:
                # Build clip_data from insight record
                metadata = insight.get("metadata") or {}
                production_hints = insight.get("production_hints") or {}
                social_metadata = insight.get("social_metadata") or {}

                # Build subtitles from transcript_json within time range
                start_time = insight["start_time"]
                end_time = insight["end_time"]

                subtitles = []
                for seg in transcript_json:
                    seg_start = seg.get("start", 0)
                    seg_end = seg.get("end", 0)
                    if seg_start >= start_time and seg_end <= end_time:
                        subtitles.append({
                            "start": seg_start - start_time,  # Relative to clip start
                            "end": seg_end - start_time,
                            "text": seg.get("text", ""),
                            "highlight_words": [],
                        })

                clip_data = {
                    "id": insight_id,
                    "title": insight["title"],
                    "hook": insight.get("hook"),
                    "category": insight.get("category", "viral"),
                    "priority": insight.get("priority", 1),
                    "start_time": start_time,
                    "end_time": end_time,
                    "segments": metadata.get("segments", [
                        {"start_time": start_time, "end_time": end_time, "type": "content"}
                    ]),
                    "silence_cuts": metadata.get("silence_cuts", []),
                    "subtitles": metadata.get("subtitles") or subtitles,
                    "cold_open": metadata.get("cold_open"),
                    "internal_transitions": metadata.get("internal_transitions", []),
                    "storytelling": insight.get("storytelling") or {},
                    "production": {
                        "suggested_template": insight.get("suggested_template", "reaction"),
                        "intro_title": production_hints.get("intro_title", insight["title"]),
                        "outro_cta": production_hints.get("outro_cta", "Se inscreva no canal!"),
                        "bg_music_mood": production_hints.get("bg_music_mood"),
                        "energy_curve": production_hints.get("energy_curve", "rising"),
                        "text_overlays": production_hints.get("text_overlays", []),
                        "thumbnail_time": production_hints.get("thumbnail_time"),
                    },
                    "social": {
                        "caption_instagram": social_metadata.get("caption_instagram", ""),
                        "caption_tiktok": social_metadata.get("caption_tiktok", ""),
                        "caption_twitter": social_metadata.get("caption_twitter", ""),
                        "hashtags": social_metadata.get("hashtags", []),
                        "best_platform": social_metadata.get("best_platform", "instagram"),
                        "viral_potential": social_metadata.get("viral_potential", "medium"),
                    },
                    "ai_reasoning": insight.get("ai_reasoning"),
                }

                # Produce clip with V3 pipeline
                produced = produce_clip_v3(
                    video_path=video_path,
                    clip_data=clip_data,
                    output_dir=str(output_dir),
                )

                # Delete existing clip from storage if exists (for re-processing)
                for path_suffix in ["_horizontal_v3.mp4", "_vertical_v3.mp4", "_thumb_v3.jpg"]:
                    try:
                        supabase.storage.from_(settings.clips_bucket).remove([f"{source_id}/{insight_id}{path_suffix}"])
                    except:
                        pass  # Ignore if doesn't exist

                # Upload to Supabase Storage
                horizontal_storage_path = f"{source_id}/{insight_id}_horizontal_v3.mp4"
                vertical_storage_path = f"{source_id}/{insight_id}_vertical_v3.mp4"
                thumbnail_storage_path = f"{source_id}/{insight_id}_thumb_v3.jpg"

                # Upload horizontal
                with open(produced.horizontal_path, "rb") as f:
                    supabase.storage.from_(settings.clips_bucket).upload(
                        horizontal_storage_path,
                        f.read(),
                        {"content-type": "video/mp4"},
                    )

                # Upload vertical if exists
                if produced.vertical_path and Path(produced.vertical_path).exists():
                    with open(produced.vertical_path, "rb") as f:
                        supabase.storage.from_(settings.clips_bucket).upload(
                            vertical_storage_path,
                            f.read(),
                            {"content-type": "video/mp4"},
                        )

                # Upload thumbnail
                with open(produced.thumbnail_path, "rb") as f:
                    supabase.storage.from_(settings.clips_bucket).upload(
                        thumbnail_storage_path,
                        f.read(),
                        {"content-type": "image/jpeg"},
                    )

                # Delete existing produced_clips record if exists
                supabase.table("produced_clips").delete().eq("insight_id", insight_id).execute()

                # Save produced clip record (only columns that exist in DB)
                supabase.table("produced_clips").insert({
                    "insight_id": insight_id,
                    "video_source_id": source_id,
                    "template_id": clip_data.get("production", {}).get("suggested_template", "reaction_v3"),
                    "horizontal_path": horizontal_storage_path,
                    "thumbnail_path": thumbnail_storage_path,
                    "duration_seconds": produced.duration_after_cuts,  # Use final duration
                    "resolution": produced.resolution,
                    "file_size_bytes": produced.file_size_bytes,
                    "status": "done",
                }).execute()

                # Update insight status
                await update_insight_status(insight_id, "done")
                print(f"✅ [V3] Clip produced: {insight['title']}")
                print(f"   Duration: {produced.duration_seconds:.1f}s → {produced.duration_after_cuts:.1f}s (after cuts)")

            except Exception as e:
                print(f"❌ [V3] Error producing clip {insight_id}: {e}")
                import traceback
                traceback.print_exc()
                await update_insight_status(insight_id, "error")

    except Exception as e:
        print(f"❌ [V3] Production error: {e}")
        import traceback
        traceback.print_exc()
        raise


@app.post("/api/clips/{source_id}/produce-v3")
async def produce_clips_v3_endpoint(
    source_id: str,
    request: ProduceClipsV3BatchRequest,
    background_tasks: BackgroundTasks,
):
    """
    Produce clips using V3 pipeline with full production features.
    Accepts insight_ids (same as V1) for easy frontend integration.

    Features:
    - Subtitles from transcript
    - Intro/outro cards
    - Logo overlay
    - Vertical version (coming soon)
    """
    try:
        # Verify source exists
        result = supabase.table("video_sources").select("id").eq("id", source_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Source not found")

        # Start production
        background_tasks.add_task(
            produce_clips_v3_batch_task,
            source_id,
            request.insight_ids,
        )

        return {
            "status": "producing",
            "message": f"Producing {len(request.insight_ids)} clips with V3 pipeline",
            "features": [
                "subtitles",
                "intro_outro",
                "logo_overlay",
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clips-v3", response_model=CreateClipJobResponse)
async def create_clip_job_v3(
    request: CreateClipJobV3Request,
    background_tasks: BackgroundTasks,
):
    """Create a new clip processing job using V3 prompts"""
    try:
        # Create video source record
        result = supabase.table("video_sources").insert({
            "youtube_url": request.youtube_url,
            "title": "Processando...",
            "context": request.context,
            "status": "pending",
            "progress": 0.0,
        }).execute()

        source_id = result.data[0]["id"]

        # Start background processing with V3
        background_tasks.add_task(
            process_video_pipeline_v3,
            source_id,
            request.youtube_url,
            request.context,
            request.max_clips,
        )

        return CreateClipJobResponse(
            id=source_id,
            status="pending",
            message="Job V3 criado com sucesso (prompts de produção profissional)",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_video_pipeline_v3(source_id: str, youtube_url: str, context: str | None, max_clips: int):
    """
    Full V3 pipeline: download → transcribe → analyze with v3 prompts → save insights
    """
    try:
        # 1. Download
        await update_source_status(source_id, "downloading", 0.1)
        print(f"📥 [V3] Downloading: {youtube_url}")

        download_result = download_video(youtube_url, source_id)

        # Update with metadata
        supabase.table("video_sources").update({
            "title": download_result.title,
            "youtube_id": download_result.youtube_id,
            "duration_seconds": download_result.duration,
            "description": download_result.description,
            "metadata": download_result.metadata,
            "video_storage_path": download_result.video_path,
            "audio_storage_path": download_result.audio_path,
            "file_path": download_result.video_path,  # Local path for FFmpeg
        }).eq("id", source_id).execute()

        await update_source_status(source_id, "downloading", 0.3)

        # 2. Transcribe
        await update_source_status(source_id, "transcribing", 0.4)
        print(f"🎤 [V3] Transcribing audio...")

        transcription = transcribe_audio(download_result.audio_path)

        # Save transcript
        transcript_json = [
            {"start": seg.start, "end": seg.end, "text": seg.text}
            for seg in transcription.segments
        ]

        supabase.table("video_sources").update({
            "transcript_json": transcript_json,
            "transcript_text": transcription.formatted_text,
            "status": "transcribed",
            "progress": 0.6,
        }).eq("id", source_id).execute()

        # 3. Analyze with V3 prompts
        await update_source_status(source_id, "analyzing", 0.7)
        print(f"🤖 [V3] Analyzing with Claude (production prompts)...")

        analysis = analyze_transcript_v3(
            title=download_result.title,
            transcript=transcription.formatted_text,
            context=context,
            max_clips=max_clips,
        )

        # Save V3 insights (with all production details)
        for clip in analysis.clips:
            clip_dict = clip_to_dict(clip)
            supabase.table("clip_insights").insert({
                "video_source_id": source_id,
                "title": clip.title,
                "hook": clip.hook,
                "category": clip.category,
                "priority": clip.priority,
                "start_time": clip.start_time,
                "end_time": clip.end_time,
                "suggested_template": clip.production.suggested_template,
                "storytelling": {
                    "setup": clip.storytelling.setup,
                    "build": clip.storytelling.build,
                    "climax": clip.storytelling.climax,
                    "payoff": clip.storytelling.payoff,
                },
                "production_hints": {
                    "intro_title": clip.production.intro_title,
                    "outro_cta": clip.production.outro_cta,
                    "bg_music_mood": clip.production.bg_music_mood,
                    "energy_curve": clip.production.energy_curve,
                    "text_overlays": clip.production.text_overlays,
                    "thumbnail_time": clip.production.thumbnail_time,
                },
                "social_metadata": {
                    "caption_instagram": clip.social.caption_instagram,
                    "caption_tiktok": clip.social.caption_tiktok,
                    "caption_twitter": clip.social.caption_twitter,
                    "hashtags": clip.social.hashtags,
                    "best_platform": clip.social.best_platform,
                    "viral_potential": clip.social.viral_potential,
                },
                "ai_reasoning": clip.ai_reasoning,
                "ai_model_used": settings.claude_model,
                "status": "draft",
                # V3 specific fields stored in metadata
                "metadata": {
                    "v3": True,
                    "segments": [
                        {"start_time": s.start_time, "end_time": s.end_time, "type": s.type}
                        for s in clip.segments
                    ],
                    "silence_cuts": [
                        {"start": c.start, "end": c.end, "reason": c.reason}
                        for c in clip.silence_cuts
                    ],
                    "subtitles": [
                        {"start": s.start, "end": s.end, "text": s.text, "highlight_words": s.highlight_words}
                        for s in clip.subtitles
                    ],
                    "cold_open": clip.cold_open,
                    "internal_transitions": [
                        {"timestamp": t.timestamp, "type": t.type, "reason": t.reason}
                        for t in clip.internal_transitions
                    ],
                },
            }).execute()

        # Done!
        await update_source_status(source_id, "analyzed", 1.0)
        print(f"✅ [V3] Analysis complete: {len(analysis.clips)} clips found with production details")

    except Exception as e:
        print(f"❌ [V3] Pipeline error: {e}")
        await update_source_status(
            source_id,
            "error",
            error_message=sanitize_error_message(str(e)),
        )
        raise


# ============================================================
# Resume Endpoint - Retake from where it failed
# ============================================================

class ResumeJobRequest(BaseModel):
    use_v3: bool = True  # Use v3 prompts by default
    max_clips: int = 10


@app.post("/api/clips/{source_id}/resume")
async def resume_clip_job(
    source_id: str,
    request: ResumeJobRequest,
    background_tasks: BackgroundTasks,
):
    """
    Resume a failed job from the last successful step.
    Skips download if video/audio files already exist.
    """
    try:
        # Get source record
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Source not found")

        source = result.data

        # Check what files exist
        video_path = source.get("video_storage_path")
        audio_path = source.get("audio_storage_path")
        transcript_text = source.get("transcript_text")

        has_video = video_path and Path(video_path).exists()
        has_audio = audio_path and Path(audio_path).exists()
        has_transcript = bool(transcript_text)

        # Determine resume point
        if not has_video and not has_audio:
            resume_from = "download"
        elif has_audio and not has_transcript:
            resume_from = "transcribe"
        elif has_transcript:
            resume_from = "analyze"
        else:
            resume_from = "download"

        # Clear error and reset status
        supabase.table("video_sources").update({
            "status": "pending",
            "error_message": None,
            "progress": 0.0,
        }).eq("id", source_id).execute()

        # Start background task
        background_tasks.add_task(
            resume_pipeline,
            source_id,
            resume_from,
            request.use_v3,
            request.max_clips,
        )

        return {
            "status": "resuming",
            "resume_from": resume_from,
            "message": f"Retomando pipeline a partir de: {resume_from}",
            "files_found": {
                "video": has_video,
                "audio": has_audio,
                "transcript": has_transcript,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def resume_pipeline(source_id: str, resume_from: str, use_v3: bool, max_clips: int):
    """
    Resume pipeline from a specific step
    """
    try:
        log_worker(source_id, "resume", f"Iniciando pipeline a partir de: {resume_from}")

        # Get source data
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        source = result.data

        video_path = source.get("video_storage_path")
        audio_path = source.get("audio_storage_path")
        youtube_url = source.get("youtube_url")
        context = source.get("context")
        title = source.get("title") or "Video"

        if resume_from == "download":
            # Full pipeline
            await update_source_status(source_id, "downloading", 0.1)
            log_worker(source_id, "download", f"Baixando vídeo: {youtube_url}")

            download_result = download_video(youtube_url, source_id)

            supabase.table("video_sources").update({
                "title": download_result.title,
                "youtube_id": download_result.youtube_id,
                "duration_seconds": download_result.duration,
                "description": download_result.description,
                "metadata": download_result.metadata,
                "video_storage_path": download_result.video_path,
                "audio_storage_path": download_result.audio_path,
            }).eq("id", source_id).execute()

            audio_path = download_result.audio_path
            title = download_result.title
            await update_source_status(source_id, "downloading", 0.3)
            log_worker(source_id, "download", f"Download concluído: {title}", details={"duration": download_result.duration})

        if resume_from in ["download", "transcribe"]:
            # Transcribe
            await update_source_status(source_id, "transcribing", 0.4)
            log_worker(source_id, "transcribe", f"Enviando áudio para transcrição (Whisper API)...")

            transcription = transcribe_audio(audio_path)

            transcript_json = [
                {"start": seg.start, "end": seg.end, "text": seg.text}
                for seg in transcription.segments
            ]

            supabase.table("video_sources").update({
                "transcript_json": transcript_json,
                "transcript_text": transcription.formatted_text,
                "status": "transcribed",
                "progress": 0.6,
            }).eq("id", source_id).execute()

            transcript_text = transcription.formatted_text
            log_worker(source_id, "transcribe", f"Transcrição concluída: {len(transcription.segments)} segmentos", details={"segments": len(transcription.segments), "chars": len(transcript_text)})
        else:
            transcript_text = source.get("transcript_text")
            log_worker(source_id, "transcribe", "Usando transcrição existente")

        # Analyze (always runs)
        await update_source_status(source_id, "analyzing", 0.7)
        log_worker(source_id, "analyze", f"Analisando com Claude (v3={use_v3})...")

        if use_v3:
            analysis = analyze_transcript_v3(
                title=title,
                transcript=transcript_text,
                context=context,
                max_clips=max_clips,
            )

            # Save V3 insights
            for clip in analysis.clips:
                supabase.table("clip_insights").insert({
                    "video_source_id": source_id,
                    "title": clip.title,
                    "hook": clip.hook,
                    "category": clip.category,
                    "priority": clip.priority,
                    "start_time": clip.start_time,
                    "end_time": clip.end_time,
                    "suggested_template": clip.production.suggested_template,
                    "storytelling": {
                        "setup": clip.storytelling.setup,
                        "build": clip.storytelling.build,
                        "climax": clip.storytelling.climax,
                        "payoff": clip.storytelling.payoff,
                    },
                    "production_hints": {
                        "intro_title": clip.production.intro_title,
                        "outro_cta": clip.production.outro_cta,
                        "bg_music_mood": clip.production.bg_music_mood,
                        "energy_curve": clip.production.energy_curve,
                        "text_overlays": clip.production.text_overlays,
                        "thumbnail_time": clip.production.thumbnail_time,
                    },
                    "social_metadata": {
                        "caption_instagram": clip.social.caption_instagram,
                        "caption_tiktok": clip.social.caption_tiktok,
                        "caption_twitter": clip.social.caption_twitter,
                        "hashtags": clip.social.hashtags,
                        "best_platform": clip.social.best_platform,
                        "viral_potential": clip.social.viral_potential,
                    },
                    "ai_reasoning": clip.ai_reasoning,
                    "ai_model_used": settings.claude_model,
                    "status": "draft",
                    "metadata": {
                        "v3": True,
                        "segments": [
                            {"start_time": s.start_time, "end_time": s.end_time, "type": s.type}
                            for s in clip.segments
                        ],
                        "silence_cuts": [
                            {"start": c.start, "end": c.end, "reason": c.reason}
                            for c in clip.silence_cuts
                        ],
                        "subtitles": [
                            {"start": s.start, "end": s.end, "text": s.text, "highlight_words": s.highlight_words}
                            for s in clip.subtitles
                        ],
                        "cold_open": clip.cold_open,
                        "internal_transitions": [
                            {"timestamp": t.timestamp, "type": t.type, "reason": t.reason}
                            for t in clip.internal_transitions
                        ],
                    },
                }).execute()

            clip_count = len(analysis.clips)
        else:
            analysis = analyze_transcript(
                title=title,
                transcript=transcript_text,
                context=context,
                max_clips=max_clips,
            )

            for insight in analysis.insights:
                supabase.table("clip_insights").insert({
                    "video_source_id": source_id,
                    "title": insight.title,
                    "hook": insight.hook,
                    "category": insight.category,
                    "priority": insight.priority,
                    "start_time": insight.start_time,
                    "end_time": insight.end_time,
                    "suggested_template": insight.suggested_template,
                    "storytelling": insight.storytelling,
                    "production_hints": insight.production_hints,
                    "social_metadata": insight.social_metadata,
                    "ai_reasoning": insight.ai_reasoning,
                    "ai_model_used": settings.claude_model,
                    "status": "draft",
                }).execute()

            clip_count = len(analysis.insights)

        await update_source_status(source_id, "analyzed", 1.0)
        log_worker(source_id, "analyze", f"Análise concluída: {clip_count} clips encontrados", details={"clips": clip_count, "use_v3": use_v3})

    except Exception as e:
        log_worker(source_id, "error", f"Erro no pipeline: {sanitize_error_message(str(e))}", level="error")
        import traceback
        traceback.print_exc()
        await update_source_status(
            source_id,
            "error",
            error_message=sanitize_error_message(str(e)),
        )
        raise


# ============================================================
# Crew Agents Endpoints (Multi-Agent System)
# ============================================================

from .agents import run_director, run_garimpeiro, run_cronista, run_analista, run_produtor, run_critico, AgentResult


class AnalyzeCrewRequest(BaseModel):
    """Request to analyze a video with the full crew of agents."""
    model: str = "claude-sonnet-4-20250514"  # Model for agents


class AnalyzeCrewResponse(BaseModel):
    """Response from crew analysis."""
    session_id: str
    status: str
    live_map: Optional[dict] = None
    tokens_used: int = 0
    message: str


@app.post("/api/clips/{source_id}/analyze-crew", response_model=AnalyzeCrewResponse)
async def analyze_with_crew(
    source_id: str,
    request: AnalyzeCrewRequest,
    background_tasks: BackgroundTasks,
):
    """
    Analyze a video using the multi-agent crew system.

    Pipeline:
    1. DIRETOR: Analyzes full transcript, creates thematic map
    2. (Future) CRONISTA, ANALISTA, GARIMPEIRO: Process assigned segments
    3. (Future) PRODUTOR: Synthesizes all outputs
    4. (Future) CRÍTICO: Evaluates and requests refinements

    Currently only runs the Director agent (Sprint 0+1).
    """
    try:
        # Verify source exists and has transcript
        result = supabase.table("video_sources").select("*").eq("id", source_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Source not found")

        source = result.data
        transcript = source.get("transcript_text")

        if not transcript:
            raise HTTPException(
                status_code=400,
                detail="Source has no transcript. Run analysis pipeline first."
            )

        # Create session record
        session_result = supabase.table("clip_sessions").insert({
            "video_source_id": source_id,
            "status": "director",
            "current_agent": "director",
            "progress": 0.0,
        }).execute()

        session_id = session_result.data[0]["id"]

        # Build match context from source metadata
        match_context = None
        if source.get("context"):
            match_context = source.get("context")
        elif source.get("title"):
            match_context = f"Vídeo: {source.get('title')}"

        # Run Director agent
        print(f"🎬 [Crew] Starting Director agent for session {session_id}")

        director_result = run_director(
            transcript=transcript,
            match_context=match_context,
            video_duration=source.get("duration_seconds"),
            model=request.model,
        )

        if not director_result.success:
            # Update session with error
            supabase.table("clip_sessions").update({
                "status": "error",
                "error_message": director_result.error,
            }).eq("id", session_id).execute()

            raise HTTPException(
                status_code=500,
                detail=f"Director agent failed: {director_result.error}"
            )

        # Save live map
        supabase.table("clip_live_maps").insert({
            "session_id": session_id,
            "live_summary": director_result.data.get("live_summary"),
            "duration_minutes": director_result.data.get("duration_minutes"),
            "themes": director_result.data.get("themes", []),
            "emotional_peaks": director_result.data.get("emotional_peaks", []),
            "suggested_arcs": director_result.data.get("suggested_arcs", []),
            "delegation": director_result.data.get("delegation", {}),
            "raw_response": {"text": director_result.raw_response},
            "tokens_used": director_result.total_tokens,
        }).execute()

        # Update session
        supabase.table("clip_sessions").update({
            "status": "completed",  # For now, just director
            "current_agent": None,
            "progress": 1.0,
            "total_cost_tokens": director_result.total_tokens,
        }).eq("id", session_id).execute()

        print(f"✅ [Crew] Director completed. Tokens: {director_result.total_tokens}")
        print(f"   Themes: {len(director_result.data.get('themes', []))}")
        print(f"   Peaks: {len(director_result.data.get('emotional_peaks', []))}")
        print(f"   Arcs: {len(director_result.data.get('suggested_arcs', []))}")

        return AnalyzeCrewResponse(
            session_id=session_id,
            status="completed",
            live_map=director_result.data,
            tokens_used=director_result.total_tokens,
            message=f"Director analysis complete. Found {len(director_result.data.get('themes', []))} themes, {len(director_result.data.get('suggested_arcs', []))} narrative arcs.",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Crew] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=sanitize_error_message(str(e)))


@app.get("/api/clips/{source_id}/crew-sessions")
async def get_crew_sessions(source_id: str):
    """Get all crew analysis sessions for a video source."""
    try:
        # Get sessions with all related data
        sessions_result = supabase.table("clip_sessions").select(
            "*, clip_live_maps(*), clip_agent_outputs(*), clip_production_plans(*), clip_evaluations(*)"
        ).eq("video_source_id", source_id).order("created_at", desc=True).execute()

        return {
            "sessions": sessions_result.data or [],
            "count": len(sessions_result.data or []),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/crew-sessions/{session_id}")
async def get_crew_session(session_id: str):
    """Get details of a specific crew session including live map."""
    try:
        # Get session with related data
        session_result = supabase.table("clip_sessions").select(
            "*, clip_live_maps(*), clip_agent_outputs(*), clip_production_plans(*)"
        ).eq("id", session_id).single().execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        return session_result.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RunWorkersRequest(BaseModel):
    """Request to run worker agents on a session."""
    session_id: str
    workers: list[str] = ["garimpeiro", "cronista", "analista"]  # Which workers to run
    model: str = "claude-sonnet-4-20250514"


@app.post("/api/crew-sessions/{session_id}/run-workers")
async def run_crew_workers(
    session_id: str,
    request: RunWorkersRequest,
    background_tasks: BackgroundTasks,
):
    """
    Run worker agents (Garimpeiro, Cronista, Analista) on a session.

    Requires a completed Director analysis (live_map) first.
    Workers run in parallel and save outputs to clip_agent_outputs.
    """
    try:
        # Get session with live map
        session_result = supabase.table("clip_sessions").select(
            "*, clip_live_maps(*)"
        ).eq("id", session_id).single().execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = session_result.data

        # Check if workers are already running or done - prevent duplicate calls
        current_status = session.get("status", "")
        if current_status == "workers":
            raise HTTPException(
                status_code=409,
                detail="Workers are already running for this session. Please wait."
            )

        live_maps = session.get("clip_live_maps", [])

        if not live_maps:
            raise HTTPException(
                status_code=400,
                detail="Session has no live map. Run Director analysis first."
            )

        live_map = live_maps[0]

        # Get video source with transcript
        source_result = supabase.table("video_sources").select(
            "transcript_text, context, title"
        ).eq("id", session.get("video_source_id")).single().execute()

        if not source_result.data:
            raise HTTPException(status_code=404, detail="Video source not found")

        source = source_result.data
        transcript = source.get("transcript_text")

        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript available")

        # Update session status
        supabase.table("clip_sessions").update({
            "status": "workers",
            "current_agent": "workers",
            "progress": 0.3,
        }).eq("id", session_id).execute()

        # Run workers
        results = {}
        total_tokens = 0
        delegation = live_map.get("delegation", {})

        print(f"🎬 [Crew] Running workers for session {session_id}")

        # Run Garimpeiro
        if "garimpeiro" in request.workers:
            print(f"   ⛏️ Running Garimpeiro...")
            garimpeiro_hints = delegation.get("garimpeiro", [])

            garimpeiro_result = run_garimpeiro(
                transcript_chunk=transcript,
                delegation_hints=garimpeiro_hints,
                model=request.model,
            )

            if garimpeiro_result.success:
                # Save output
                supabase.table("clip_agent_outputs").insert({
                    "session_id": session_id,
                    "agent_type": "garimpeiro",
                    "clips": garimpeiro_result.data.get("clips", []),
                    "raw_response": {"text": garimpeiro_result.raw_response},
                    "tokens_used": garimpeiro_result.total_tokens,
                }).execute()

                results["garimpeiro"] = {
                    "success": True,
                    "clips_found": len(garimpeiro_result.data.get("clips", [])),
                    "tokens": garimpeiro_result.total_tokens,
                }
                total_tokens += garimpeiro_result.total_tokens
                print(f"   ⛏️ Garimpeiro found {len(garimpeiro_result.data.get('clips', []))} clips")
            else:
                results["garimpeiro"] = {"success": False, "error": garimpeiro_result.error}
                print(f"   ❌ Garimpeiro failed: {garimpeiro_result.error}")

        # Wait before running next worker to avoid rate limit (30k tokens/min)
        if "cronista" in request.workers or "analista" in request.workers:
            wait_time = 65  # seconds - wait for rate limit to reset
            print(f"   ⏳ Waiting {wait_time}s for rate limit reset...")
            await asyncio.sleep(wait_time)

        # Run Cronista
        if "cronista" in request.workers:
            print(f"   📜 Running Cronista...")
            suggested_arcs = live_map.get("suggested_arcs", [])
            themes = live_map.get("themes", [])

            cronista_result = run_cronista(
                transcript=transcript,
                suggested_arcs=suggested_arcs,
                themes=themes,
                model=request.model,
            )

            if cronista_result.success:
                supabase.table("clip_agent_outputs").insert({
                    "session_id": session_id,
                    "agent_type": "cronista",
                    "clips": cronista_result.data.get("clips", []),
                    "raw_response": {"text": cronista_result.raw_response},
                    "tokens_used": cronista_result.total_tokens,
                }).execute()

                results["cronista"] = {
                    "success": True,
                    "clips_found": len(cronista_result.data.get("clips", [])),
                    "tokens": cronista_result.total_tokens,
                }
                total_tokens += cronista_result.total_tokens
                print(f"   📜 Cronista found {len(cronista_result.data.get('clips', []))} arcs")
            else:
                results["cronista"] = {"success": False, "error": cronista_result.error}
                print(f"   ❌ Cronista failed: {cronista_result.error}")

            # Wait before running Analista to avoid rate limit
            if "analista" in request.workers:
                wait_time = 65  # seconds
                print(f"   ⏳ Waiting {wait_time}s for rate limit reset...")
                await asyncio.sleep(wait_time)

        # Run Analista
        if "analista" in request.workers:
            print(f"   🔍 Running Analista...")
            analista_hints = delegation.get("analista", [])

            analista_result = run_analista(
                transcript_chunk=transcript,
                delegation_hints=analista_hints,
                match_context=source.get("context") or source.get("title"),
                model=request.model,
            )

            if analista_result.success:
                supabase.table("clip_agent_outputs").insert({
                    "session_id": session_id,
                    "agent_type": "analista",
                    "clips": analista_result.data.get("clips", []),
                    "raw_response": {"text": analista_result.raw_response},
                    "tokens_used": analista_result.total_tokens,
                }).execute()

                results["analista"] = {
                    "success": True,
                    "clips_found": len(analista_result.data.get("clips", [])),
                    "tokens": analista_result.total_tokens,
                }
                total_tokens += analista_result.total_tokens
                print(f"   🔍 Analista found {len(analista_result.data.get('clips', []))} insights")
            else:
                results["analista"] = {"success": False, "error": analista_result.error}
                print(f"   ❌ Analista failed: {analista_result.error}")

        # Update session
        supabase.table("clip_sessions").update({
            "status": "workers_done",
            "current_agent": None,
            "progress": 0.6,
            "total_cost_tokens": session.get("total_cost_tokens", 0) + total_tokens,
        }).eq("id", session_id).execute()

        print(f"✅ [Crew] Workers completed. Total tokens: {total_tokens}")

        return {
            "session_id": session_id,
            "status": "workers_done",
            "results": results,
            "total_tokens": total_tokens,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Crew] Workers error: {e}")
        import traceback
        traceback.print_exc()

        supabase.table("clip_sessions").update({
            "status": "error",
            "error_message": str(e),
        }).eq("id", session_id).execute()

        raise HTTPException(status_code=500, detail=sanitize_error_message(str(e)))


class RunProdutorRequest(BaseModel):
    """Request to run Produtor + Crítico on worker outputs."""
    max_clips: int = 10
    max_iterations: int = 2  # Max feedback iterations
    model: str = "claude-sonnet-4-20250514"


@app.post("/api/crew-sessions/{session_id}/run-produtor")
async def run_produtor_endpoint(
    session_id: str,
    request: RunProdutorRequest,
):
    """
    Run Produtor and Crítico agents on worker outputs.

    Pipeline:
    1. PRODUTOR: Synthesizes all worker outputs into production plan
    2. CRÍTICO: Evaluates each clip with scores and feedback
    3. (Optional) Loop back if NEEDS_WORK clips exist

    Requires completed worker outputs first.
    """
    try:
        # Get session with worker outputs
        session_result = supabase.table("clip_sessions").select(
            "*, clip_live_maps(*), clip_agent_outputs(*)"
        ).eq("id", session_id).single().execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = session_result.data
        agent_outputs = session.get("clip_agent_outputs", [])

        if not agent_outputs:
            raise HTTPException(
                status_code=400,
                detail="Session has no worker outputs. Run workers first."
            )

        # Get live map for summary
        live_maps = session.get("clip_live_maps", [])
        live_summary = live_maps[0].get("live_summary") if live_maps else None

        # Collect clips from each worker
        garimpeiro_clips = []
        cronista_clips = []
        analista_clips = []

        for output in agent_outputs:
            agent_type = output.get("agent_type")
            clips = output.get("clips", [])

            if agent_type == "garimpeiro":
                garimpeiro_clips = clips
            elif agent_type == "cronista":
                cronista_clips = clips
            elif agent_type == "analista":
                analista_clips = clips

        if not garimpeiro_clips and not cronista_clips and not analista_clips:
            raise HTTPException(
                status_code=400,
                detail="No clips found in worker outputs."
            )

        # Update session status
        supabase.table("clip_sessions").update({
            "status": "producing",
            "current_agent": "produtor",
            "progress": 0.7,
        }).eq("id", session_id).execute()

        print(f"🎬 [Crew] Running Produtor for session {session_id}")
        print(f"   Input: {len(garimpeiro_clips)} garimpeiro, {len(cronista_clips)} cronista, {len(analista_clips)} analista")

        # Run Produtor
        produtor_result = run_produtor(
            garimpeiro_clips=garimpeiro_clips,
            cronista_clips=cronista_clips,
            analista_clips=analista_clips,
            live_summary=live_summary,
            max_clips=request.max_clips,
            model=request.model,
        )

        if not produtor_result.success:
            supabase.table("clip_sessions").update({
                "status": "error",
                "error_message": f"Produtor failed: {produtor_result.error}",
            }).eq("id", session_id).execute()

            raise HTTPException(
                status_code=500,
                detail=f"Produtor agent failed: {produtor_result.error}"
            )

        production_plan = produtor_result.data.get("production_plan", {})
        final_clips = produtor_result.data.get("clips", [])

        print(f"   ✅ Produtor created plan with {len(final_clips)} clips")

        # Save production plan
        plan_result = supabase.table("clip_production_plans").insert({
            "session_id": session_id,
            "plan": production_plan,
            "clips": final_clips,
            "dropped_clips": produtor_result.data.get("dropped_clips", []),
            "summary": produtor_result.data.get("summary"),
            "raw_response": {"text": produtor_result.raw_response},
            "tokens_used": produtor_result.total_tokens,
        }).execute()

        plan_id = plan_result.data[0]["id"]
        total_tokens = produtor_result.total_tokens

        # Update session status
        supabase.table("clip_sessions").update({
            "current_agent": "critico",
            "progress": 0.85,
        }).eq("id", session_id).execute()

        print(f"🎬 [Crew] Running Crítico for session {session_id}")

        # Run Crítico
        critico_result = run_critico(
            production_plan=production_plan,
            clips=final_clips,
            iteration=1,
            model=request.model,
        )

        if not critico_result.success:
            supabase.table("clip_sessions").update({
                "status": "error",
                "error_message": f"Crítico failed: {critico_result.error}",
            }).eq("id", session_id).execute()

            raise HTTPException(
                status_code=500,
                detail=f"Crítico agent failed: {critico_result.error}"
            )

        evaluations = critico_result.data.get("evaluations", [])
        summary = critico_result.data.get("summary", {})
        total_tokens += critico_result.total_tokens

        print(f"   ✅ Crítico evaluated {len(evaluations)} clips")
        print(f"   Approved: {summary.get('approved', 0)}, Needs work: {summary.get('needs_work', 0)}, Rejected: {summary.get('rejected', 0)}")

        # Save evaluations
        supabase.table("clip_evaluations").insert({
            "plan_id": plan_id,
            "session_id": session_id,
            "evaluations": evaluations,
            "summary": summary,
            "overall_feedback": critico_result.data.get("overall_feedback"),
            "iteration": 1,
            "raw_response": {"text": critico_result.raw_response},
            "tokens_used": critico_result.total_tokens,
        }).execute()

        # Update session as complete
        supabase.table("clip_sessions").update({
            "status": "completed",
            "current_agent": None,
            "progress": 1.0,
            "total_cost_tokens": session.get("total_cost_tokens", 0) + total_tokens,
        }).eq("id", session_id).execute()

        print(f"✅ [Crew] Production complete. Total tokens: {total_tokens}")

        return {
            "session_id": session_id,
            "plan_id": plan_id,
            "status": "completed",
            "production_plan": production_plan,
            "clips_count": len(final_clips),
            "evaluation_summary": summary,
            "overall_feedback": critico_result.data.get("overall_feedback"),
            "total_tokens": total_tokens,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Crew] Produtor error: {e}")
        import traceback
        traceback.print_exc()

        supabase.table("clip_sessions").update({
            "status": "error",
            "error_message": str(e),
        }).eq("id", session_id).execute()

        raise HTTPException(status_code=500, detail=sanitize_error_message(str(e)))


# Import MCP producer (correctly extracts individual segments and concatenates)
from .processors.producer_mcp import produce_clips_mcp as produce_clips_from_crew_plan, MCPProductionResult as CrewProductionResult


class ProduceClipsRequest(BaseModel):
    """Request to produce clips from a crew plan."""
    only_approved: bool = True  # Only produce APPROVED clips (skip REJECTED)
    clip_ids: list[str] | None = None  # Optional: produce only specific clips


@app.post("/api/crew-sessions/{session_id}/produce-clips")
async def produce_clips_from_crew(
    session_id: str,
    request: ProduceClipsRequest,
    background_tasks: BackgroundTasks,
):
    """
    Produce video clips using the PRODUTOR production plan.

    Uses the production_spec from each clip to configure FFmpeg.
    Only produces APPROVED clips by default (skips REJECTED).

    Returns produced clip paths and metadata.
    """
    try:
        # Get session with production plan and evaluations
        session_result = supabase.table("clip_sessions").select(
            "*, clip_production_plans(*), clip_evaluations(*)"
        ).eq("id", session_id).single().execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = session_result.data
        production_plans = session.get("clip_production_plans", [])
        evaluations_list = session.get("clip_evaluations", [])

        if not production_plans:
            raise HTTPException(
                status_code=400,
                detail="Session has no production plan. Run PRODUTOR first."
            )

        production_plan = production_plans[0]
        clips = production_plan.get("clips", [])

        if not clips:
            raise HTTPException(
                status_code=400,
                detail="Production plan has no clips."
            )

        # Filter by clip_ids if provided
        if request.clip_ids:
            clips = [c for c in clips if c.get("id") in request.clip_ids]
            if not clips:
                raise HTTPException(
                    status_code=400,
                    detail="No matching clips found for the given IDs."
                )

        # Get evaluations for filtering
        evaluations = []
        if evaluations_list:
            evaluations = evaluations_list[0].get("evaluations", [])

        # Get video source with file path
        source_result = supabase.table("video_sources").select(
            "id, title, file_path, video_storage_path, youtube_url"
        ).eq("id", session.get("video_source_id")).single().execute()

        if not source_result.data:
            raise HTTPException(status_code=404, detail="Video source not found")

        source = source_result.data
        # Use file_path or fallback to video_storage_path
        video_path = source.get("file_path") or source.get("video_storage_path")

        if not video_path or not os.path.exists(video_path):
            raise HTTPException(
                status_code=400,
                detail=f"Video file not found: {video_path}. Please re-download the video."
            )

        # Update session status
        supabase.table("clip_sessions").update({
            "status": "producing_clips",
            "current_agent": "ffmpeg",
        }).eq("id", session_id).execute()

        print(f"🎬 [Crew] Starting clip production for session {session_id}")
        print(f"   Video: {video_path}")
        print(f"   Clips: {len(clips)}, Only approved: {request.only_approved}")

        # Create output directory
        output_dir = os.path.join(settings.temp_dir, "crew", session_id)
        os.makedirs(output_dir, exist_ok=True)

        # Produce clips
        results = produce_clips_from_crew_plan(
            video_path=video_path,
            clips=clips,
            evaluations=evaluations if request.only_approved else None,
            output_dir=output_dir,
            only_approved=request.only_approved,
        )

        # Count successes
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        print(f"✅ [Crew] Production complete: {len(successful)} success, {len(failed)} failed")

        # Upload to storage (optional - can be done async)
        uploaded_clips = []
        for result in successful:
            clip_data = {
                "clip_id": result.clip_id,
                "title": result.title,
                "horizontal_path": result.horizontal_path,
                "vertical_path": result.vertical_path,
                "thumbnail_path": result.thumbnail_path,
                "duration_seconds": result.duration_seconds,
                "file_size_bytes": result.file_size_bytes,
            }
            uploaded_clips.append(clip_data)

        # Update session status
        supabase.table("clip_sessions").update({
            "status": "clips_produced",
            "current_agent": None,
        }).eq("id", session_id).execute()

        return {
            "session_id": session_id,
            "status": "clips_produced",
            "produced": len(successful),
            "failed": len(failed),
            "clips": uploaded_clips,
            "errors": [{"clip_id": r.clip_id, "error": r.error} for r in failed],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Crew] Production error: {e}")
        import traceback
        traceback.print_exc()

        supabase.table("clip_sessions").update({
            "status": "error",
            "error_message": str(e),
        }).eq("id", session_id).execute()

        raise HTTPException(status_code=500, detail=sanitize_error_message(str(e)))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
