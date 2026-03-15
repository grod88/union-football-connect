"""
Supabase client for the worker
"""
from supabase import create_client, Client
from .config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)


async def update_source_status(
    source_id: str,
    status: str,
    progress: float = 0.0,
    error_message: str | None = None,
    **extra_fields
):
    """Update video source status in Supabase"""
    data = {
        "status": status,
        "progress": progress,
    }
    if error_message:
        data["error_message"] = error_message
    data.update(extra_fields)

    supabase.table("video_sources").update(data).eq("id", source_id).execute()


async def update_insight_status(insight_id: str, status: str, **extra_fields):
    """Update clip insight status in Supabase"""
    data = {"status": status}
    data.update(extra_fields)
    supabase.table("clip_insights").update(data).eq("id", insight_id).execute()


def log_worker(
    source_id: str,
    step: str,
    message: str,
    level: str = "info",
    details: dict | None = None,
):
    """
    Log worker activity to database for real-time monitoring.

    Args:
        source_id: UUID of the video source
        step: Current step (download, transcribe, analyze, produce)
        message: Log message
        level: Log level (debug, info, warn, error)
        details: Optional dict with extra details
    """
    try:
        # Print to console too
        emoji = {"debug": "🔍", "info": "📝", "warn": "⚠️", "error": "❌"}.get(level, "📝")
        print(f"{emoji} [{step.upper()}] {message}")

        # Save to database
        supabase.table("worker_logs").insert({
            "source_id": source_id,
            "level": level,
            "step": step,
            "message": message,
            "details": details,
        }).execute()
    except Exception as e:
        # Don't let logging errors break the pipeline
        print(f"⚠️ Failed to log: {e}")


def log_crew_event(
    source_id: str,
    session_id: str,
    agent: str,
    message: str,
    level: str = "info",
    details: dict | None = None,
):
    """Log crew activity using the shared worker_logs table with session metadata."""
    payload = {
        "session_id": session_id,
        "agent": agent,
        **(details or {}),
    }
    log_worker(
        source_id=source_id,
        step=f"crew:{agent}",
        message=message,
        level=level,
        details=payload,
    )
