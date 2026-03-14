"""
Clip analysis using Claude API
"""
import json
from dataclasses import dataclass
from anthropic import Anthropic
from ..config import settings
from ..prompts.system_union import SYSTEM_PROMPT
from ..prompts.analyze_live import build_analyze_prompt


@dataclass
class ClipInsightData:
    title: str
    hook: str | None
    category: str
    priority: int
    start_time: float
    end_time: float
    suggested_template: str
    needs_secondary_video: bool
    storytelling: dict | None
    production_hints: dict | None
    social_metadata: dict | None
    ai_reasoning: str | None


@dataclass
class AnalysisResult:
    live_summary: str
    live_energy: str
    total_clipable_minutes: float
    insights: list[ClipInsightData]
    raw_response: dict


def analyze_transcript(
    title: str,
    transcript: str,
    context: str | None = None,
    max_clips: int = 10,
) -> AnalysisResult:
    """
    Analyze transcript using Claude and return clip insights.
    """
    client = Anthropic(api_key=settings.anthropic_api_key)

    user_prompt = build_analyze_prompt(
        title=title,
        transcript=transcript,
        context=context,
        max_clips=max_clips,
    )

    # Call Claude
    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    # Parse JSON response
    raw_text = response.content[0].text

    # Clean up response (remove markdown code blocks if present)
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        # Remove first and last lines (```json and ```)
        lines = [l for l in lines if not l.startswith("```")]
        raw_text = "\n".join(lines)

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        # Try to extract JSON from the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', raw_text)
        if json_match:
            data = json.loads(json_match.group())
        else:
            raise ValueError(f"Failed to parse Claude response as JSON: {e}")

    # Map insights
    insights = []
    for i, insight_data in enumerate(data.get("insights", [])):
        insights.append(ClipInsightData(
            title=insight_data.get("title", f"Clip {i+1}"),
            hook=insight_data.get("hook"),
            category=insight_data.get("category", "viral"),
            priority=insight_data.get("priority", i + 1),
            start_time=float(insight_data.get("start_time", 0)),
            end_time=float(insight_data.get("end_time", 0)),
            suggested_template=insight_data.get("suggested_template", "reaction"),
            needs_secondary_video=insight_data.get("needs_secondary_video", False),
            storytelling=insight_data.get("storytelling"),
            production_hints=insight_data.get("production"),
            social_metadata=insight_data.get("social"),
            ai_reasoning=insight_data.get("ai_reasoning"),
        ))

    return AnalysisResult(
        live_summary=data.get("live_summary", ""),
        live_energy=data.get("live_energy", "medium"),
        total_clipable_minutes=float(data.get("total_clipable_minutes", 0)),
        insights=insights,
        raw_response=data,
    )
