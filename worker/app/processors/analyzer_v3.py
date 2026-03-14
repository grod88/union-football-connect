"""
Clip analysis using Claude API - V3 (Production Ready)
"""
import json
import re
from dataclasses import dataclass, field
from typing import Optional
from anthropic import Anthropic
from ..config import settings
from ..prompts.system_union_v3 import SYSTEM_PROMPT_V3
from ..prompts.analyze_live_v3 import build_analyze_prompt_v3


@dataclass
class SubtitleEntry:
    start: float
    end: float
    text: str
    highlight_words: list[str] = field(default_factory=list)
    speaker: Optional[str] = None


@dataclass
class SilenceCut:
    start: float
    end: float
    reason: str


@dataclass
class Segment:
    start_time: float
    end_time: float
    type: str
    description: str


@dataclass
class InternalTransition:
    timestamp: float
    type: str  # emphasis_zoom, beat_cut, flash
    reason: str


@dataclass
class Storytelling:
    setup: str
    build: str
    climax: str
    payoff: str


@dataclass
class Production:
    intro_title: str
    outro_cta: str
    bg_music_mood: str
    bg_music_energy: str
    energy_curve: str
    text_overlays: list[dict]
    suggested_template: str
    thumbnail_time: float
    needs_secondary_video: bool
    secondary_video_description: Optional[str]


@dataclass
class Social:
    caption_instagram: str
    caption_tiktok: str
    caption_twitter: str
    hashtags: list[str]
    best_platform: str
    viral_potential: str


@dataclass
class ClipInsightV3:
    id: str
    title: str
    hook: str
    category: str
    priority: int
    cold_open: bool
    segments: list[Segment]
    silence_cuts: list[SilenceCut]
    subtitles: list[SubtitleEntry]
    internal_transitions: list[InternalTransition]
    storytelling: Storytelling
    production: Production
    social: Social
    ai_reasoning: str

    # Computed
    start_time: float = 0
    end_time: float = 0
    duration: float = 0


@dataclass
class AnalysisResultV3:
    live_summary: str
    total_clips: int
    clips: list[ClipInsightV3]
    raw_response: dict


def parse_clip_v3(clip_data: dict) -> ClipInsightV3:
    """Parse a clip from Claude's response into ClipInsightV3 dataclass."""

    # Parse segments
    segments = []
    for seg in clip_data.get("segments", []):
        segments.append(Segment(
            start_time=float(seg.get("start_time", 0)),
            end_time=float(seg.get("end_time", 0)),
            type=seg.get("type", "main"),
            description=seg.get("description", "")
        ))

    # Parse silence cuts
    silence_cuts = []
    for cut in clip_data.get("silence_cuts", []):
        silence_cuts.append(SilenceCut(
            start=float(cut.get("start", 0)),
            end=float(cut.get("end", 0)),
            reason=cut.get("reason", "")
        ))

    # Parse subtitles
    subtitles = []
    for sub in clip_data.get("subtitles", []):
        subtitles.append(SubtitleEntry(
            start=float(sub.get("start", 0)),
            end=float(sub.get("end", 0)),
            text=sub.get("text", ""),
            highlight_words=sub.get("highlight_words", []),
            speaker=sub.get("speaker")
        ))

    # Parse transitions
    transitions = []
    for trans in clip_data.get("internal_transitions", []):
        transitions.append(InternalTransition(
            timestamp=float(trans.get("timestamp", 0)),
            type=trans.get("type", "beat_cut"),
            reason=trans.get("reason", "")
        ))

    # Parse storytelling
    story_data = clip_data.get("storytelling", {})
    storytelling = Storytelling(
        setup=story_data.get("setup", ""),
        build=story_data.get("build", ""),
        climax=story_data.get("climax", ""),
        payoff=story_data.get("payoff", "")
    )

    # Parse production
    prod_data = clip_data.get("production", {})
    production = Production(
        intro_title=prod_data.get("intro_title", clip_data.get("title", "")),
        outro_cta=prod_data.get("outro_cta", "Inscreva-se!"),
        bg_music_mood=prod_data.get("bg_music_mood", "chill"),
        bg_music_energy=prod_data.get("bg_music_energy", "medium"),
        energy_curve=prod_data.get("energy_curve", "steady"),
        text_overlays=prod_data.get("text_overlays", []),
        suggested_template=prod_data.get("suggested_template", "reaction"),
        thumbnail_time=float(prod_data.get("thumbnail_time", 5)),
        needs_secondary_video=prod_data.get("needs_secondary_video", False),
        secondary_video_description=prod_data.get("secondary_video_description")
    )

    # Parse social
    social_data = clip_data.get("social", {})
    social = Social(
        caption_instagram=social_data.get("caption_instagram", ""),
        caption_tiktok=social_data.get("caption_tiktok", ""),
        caption_twitter=social_data.get("caption_twitter", ""),
        hashtags=social_data.get("hashtags", ["#UnionFootball"]),
        best_platform=social_data.get("best_platform", "reels"),
        viral_potential=social_data.get("viral_potential", "medium")
    )

    # Compute times
    start_time = min(s.start_time for s in segments) if segments else 0
    end_time = max(s.end_time for s in segments) if segments else 0
    duration = end_time - start_time

    return ClipInsightV3(
        id=clip_data.get("id", "clip_01"),
        title=clip_data.get("title", "Untitled Clip"),
        hook=clip_data.get("hook", ""),
        category=clip_data.get("category", "viral"),
        priority=int(clip_data.get("priority", 1)),
        cold_open=clip_data.get("cold_open", False),
        segments=segments,
        silence_cuts=silence_cuts,
        subtitles=subtitles,
        internal_transitions=transitions,
        storytelling=storytelling,
        production=production,
        social=social,
        ai_reasoning=clip_data.get("ai_reasoning", ""),
        start_time=start_time,
        end_time=end_time,
        duration=duration
    )


def analyze_transcript_v3(
    title: str,
    transcript: str,
    context: Optional[str] = None,
    max_clips: int = 10,
) -> AnalysisResultV3:
    """
    Analyze transcript using Claude V3 prompts.
    Returns production-ready clip insights with subtitles, silence cuts, etc.
    """
    client = Anthropic(api_key=settings.anthropic_api_key)

    user_prompt = build_analyze_prompt_v3(
        title=title,
        transcript=transcript,
        context=context,
        max_clips=max_clips,
    )

    # Call Claude
    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=16384,  # Increased for v3 detailed output
        system=SYSTEM_PROMPT_V3,
        messages=[{"role": "user", "content": user_prompt}],
    )

    # Parse JSON response
    raw_text = response.content[0].text

    # Clean up response (remove markdown code blocks if present)
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        raw_text = "\n".join(lines)

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', raw_text)
        if json_match:
            data = json.loads(json_match.group())
        else:
            raise ValueError(f"Failed to parse Claude response as JSON: {e}")

    # Parse clips
    clips = []
    for clip_data in data.get("clips", []):
        clips.append(parse_clip_v3(clip_data))

    return AnalysisResultV3(
        live_summary=data.get("live_summary", ""),
        total_clips=data.get("total_clips", len(clips)),
        clips=clips,
        raw_response=data
    )


def clip_to_dict(clip: ClipInsightV3) -> dict:
    """Convert ClipInsightV3 to dict for JSON serialization."""
    return {
        "id": clip.id,
        "title": clip.title,
        "hook": clip.hook,
        "category": clip.category,
        "priority": clip.priority,
        "cold_open": clip.cold_open,
        "start_time": clip.start_time,
        "end_time": clip.end_time,
        "duration": clip.duration,
        "segments": [
            {
                "start_time": s.start_time,
                "end_time": s.end_time,
                "type": s.type,
                "description": s.description
            }
            for s in clip.segments
        ],
        "silence_cuts": [
            {
                "start": c.start,
                "end": c.end,
                "reason": c.reason
            }
            for c in clip.silence_cuts
        ],
        "subtitles": [
            {
                "start": s.start,
                "end": s.end,
                "text": s.text,
                "highlight_words": s.highlight_words,
                "speaker": s.speaker
            }
            for s in clip.subtitles
        ],
        "internal_transitions": [
            {
                "timestamp": t.timestamp,
                "type": t.type,
                "reason": t.reason
            }
            for t in clip.internal_transitions
        ],
        "storytelling": {
            "setup": clip.storytelling.setup,
            "build": clip.storytelling.build,
            "climax": clip.storytelling.climax,
            "payoff": clip.storytelling.payoff
        },
        "production": {
            "intro_title": clip.production.intro_title,
            "outro_cta": clip.production.outro_cta,
            "bg_music_mood": clip.production.bg_music_mood,
            "bg_music_energy": clip.production.bg_music_energy,
            "energy_curve": clip.production.energy_curve,
            "text_overlays": clip.production.text_overlays,
            "suggested_template": clip.production.suggested_template,
            "thumbnail_time": clip.production.thumbnail_time,
            "needs_secondary_video": clip.production.needs_secondary_video,
            "secondary_video_description": clip.production.secondary_video_description
        },
        "social": {
            "caption_instagram": clip.social.caption_instagram,
            "caption_tiktok": clip.social.caption_tiktok,
            "caption_twitter": clip.social.caption_twitter,
            "hashtags": clip.social.hashtags,
            "best_platform": clip.social.best_platform,
            "viral_potential": clip.social.viral_potential
        },
        "ai_reasoning": clip.ai_reasoning
    }
