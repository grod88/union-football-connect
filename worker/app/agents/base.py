"""
Base classes and utilities for the Crew agents.
"""
from dataclasses import dataclass, field
from typing import Any, Optional
from anthropic import Anthropic
from ..config import settings


@dataclass
class AgentConfig:
    """Configuration for an agent."""
    name: str
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 8192
    temperature: float = 0.7
    top_p: Optional[float] = None


@dataclass
class AgentResult:
    """Result from an agent execution."""
    agent_name: str
    success: bool
    data: dict = field(default_factory=dict)
    raw_response: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0
    error: Optional[str] = None

    @property
    def total_tokens(self) -> int:
        return self.tokens_input + self.tokens_output


def call_claude(
    system_prompt: str,
    user_prompt: str,
    config: AgentConfig,
) -> tuple[str, int, int]:
    """
    Call Claude API with the given prompts.
    Returns: (response_text, input_tokens, output_tokens)
    """
    client = Anthropic(api_key=settings.anthropic_api_key)

    request_kwargs = {
        "model": config.model,
        "max_tokens": config.max_tokens,
        "temperature": config.temperature,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    if config.top_p is not None:
        request_kwargs["top_p"] = config.top_p

    response = client.messages.create(**request_kwargs)

    text = response.content[0].text
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens

    return text, input_tokens, output_tokens


def parse_json_response(text: str) -> dict:
    """
    Parse JSON from Claude response, handling markdown code blocks.
    """
    import json
    import re

    # Remove markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        text = "\n".join(lines)

    # Try to parse directly
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError(f"Could not parse JSON from response: {text[:200]}...")


def format_timestamp(seconds: float) -> str:
    """Format seconds as HH:MM:SS."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def seconds_to_timestamp(seconds: float) -> str:
    """Alias for format_timestamp."""
    return format_timestamp(seconds)


def timestamp_to_seconds(timestamp: str) -> float:
    """Convert HH:MM:SS to seconds."""
    parts = timestamp.split(":")
    if len(parts) == 3:
        h, m, s = map(float, parts)
        return h * 3600 + m * 60 + s
    elif len(parts) == 2:
        m, s = map(float, parts)
        return m * 60 + s
    else:
        return float(parts[0])
