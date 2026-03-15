"""Versioned crew prompts for the Union Clips worker.

These prompts are additive and do not replace the legacy prompts yet.
They exist so the worker can migrate safely in phases.
"""

from .director_v2 import DIRECTOR_SYSTEM_PROMPT_V2
from .cronista_v2 import CRONISTA_SYSTEM_PROMPT_V2
from .garimpeiro_v2 import GARIMPEIRO_SYSTEM_PROMPT_V2
from .analista_v2 import ANALISTA_SYSTEM_PROMPT_V2
from .produtor_v2 import PRODUTOR_SYSTEM_PROMPT_V2
from .critico_v2 import CRITICO_SYSTEM_PROMPT_V2
from .editor_chefe_v1 import EDITOR_CHEFE_SYSTEM_PROMPT_V1

__all__ = [
    "DIRECTOR_SYSTEM_PROMPT_V2",
    "CRONISTA_SYSTEM_PROMPT_V2",
    "GARIMPEIRO_SYSTEM_PROMPT_V2",
    "ANALISTA_SYSTEM_PROMPT_V2",
    "PRODUTOR_SYSTEM_PROMPT_V2",
    "CRITICO_SYSTEM_PROMPT_V2",
    "EDITOR_CHEFE_SYSTEM_PROMPT_V1",
]
