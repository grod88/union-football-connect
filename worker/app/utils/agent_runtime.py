"""Runtime presets for worker agents based on the implementation plan."""

from dataclasses import dataclass
from typing import Optional


SONNET_MODEL = "claude-sonnet-4-20250514"
HAIKU_MODEL = "claude-3-5-haiku-20241022"


@dataclass(frozen=True)
class AgentRuntimePreset:
    model: str
    temperature: float
    max_tokens: int
    top_p: float


AGENT_RUNTIME_PRESETS: dict[str, AgentRuntimePreset] = {
    "director": AgentRuntimePreset(
        model=SONNET_MODEL,
        temperature=0.3,
        max_tokens=8192,
        top_p=0.9,
    ),
    "cronista": AgentRuntimePreset(
        model=SONNET_MODEL,
        temperature=0.7,
        max_tokens=6144,
        top_p=0.95,
    ),
    "garimpeiro": AgentRuntimePreset(
        model=HAIKU_MODEL,
        temperature=0.5,
        max_tokens=4096,
        top_p=0.9,
    ),
    "analista": AgentRuntimePreset(
        model=HAIKU_MODEL,
        temperature=0.2,
        max_tokens=4096,
        top_p=0.85,
    ),
    "produtor": AgentRuntimePreset(
        model=SONNET_MODEL,
        temperature=0.3,
        max_tokens=8192,
        top_p=0.9,
    ),
    "critico": AgentRuntimePreset(
        model=HAIKU_MODEL,
        temperature=0.1,
        max_tokens=4096,
        top_p=0.85,
    ),
    "editor-chefe": AgentRuntimePreset(
        model=SONNET_MODEL,
        temperature=0.4,
        max_tokens=8192,
        top_p=0.9,
    ),
}


def get_agent_runtime_preset(agent_name: str, model_override: Optional[str] = None) -> AgentRuntimePreset:
    """Return runtime preset for an agent, optionally overriding the model."""
    preset = AGENT_RUNTIME_PRESETS[agent_name]
    if model_override:
        return AgentRuntimePreset(
            model=model_override,
            temperature=preset.temperature,
            max_tokens=preset.max_tokens,
            top_p=preset.top_p,
        )
    return preset
