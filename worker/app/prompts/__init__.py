# Prompts module

from .system_union import SYSTEM_PROMPT
from .analyze_live import build_analyze_prompt
from .system_union_v3 import SYSTEM_PROMPT_V3
from .analyze_live_v3 import build_analyze_prompt_v3
from .crew_v2 import (
    DIRECTOR_SYSTEM_PROMPT_V2,
    CRONISTA_SYSTEM_PROMPT_V2,
    GARIMPEIRO_SYSTEM_PROMPT_V2,
    ANALISTA_SYSTEM_PROMPT_V2,
    PRODUTOR_SYSTEM_PROMPT_V2,
    CRITICO_SYSTEM_PROMPT_V2,
    EDITOR_CHEFE_SYSTEM_PROMPT_V1,
)

__all__ = [
    "SYSTEM_PROMPT",
    "build_analyze_prompt",
    "SYSTEM_PROMPT_V3",
    "build_analyze_prompt_v3",
    "DIRECTOR_SYSTEM_PROMPT_V2",
    "CRONISTA_SYSTEM_PROMPT_V2",
    "GARIMPEIRO_SYSTEM_PROMPT_V2",
    "ANALISTA_SYSTEM_PROMPT_V2",
    "PRODUTOR_SYSTEM_PROMPT_V2",
    "CRITICO_SYSTEM_PROMPT_V2",
    "EDITOR_CHEFE_SYSTEM_PROMPT_V1",
]
