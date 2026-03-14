"""
Configuration settings for the worker
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str

    # OpenAI (Whisper)
    openai_api_key: str

    # Anthropic (Claude)
    anthropic_api_key: str

    # Storage
    clips_bucket: str = "clips"
    temp_dir: str = "/tmp/union-clips"

    # Processing
    max_clips_per_video: int = 10
    whisper_model: str = "whisper-1"  # OpenAI Whisper model
    claude_model: str = "claude-sonnet-4-20250514"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure temp directory exists
Path(settings.temp_dir).mkdir(parents=True, exist_ok=True)
