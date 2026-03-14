"""
Prompt for analyzing live transcription
"""


def build_analyze_prompt(
    title: str,
    transcript: str,
    context: str | None = None,
    max_clips: int = 10,
) -> str:
    """Build the analysis prompt for Claude"""

    context_block = ""
    if context:
        context_block = f"""## Contexto
{context}

"""

    return f"""Analise a transcrição da live "{title}" do Union Football Live.

{context_block}## Templates Disponíveis
reaction, split_horizontal, split_vertical, pip_bottom_right, grande_momento, versus, stories_vertical

## Transcrição Completa (com timestamps)
{transcript}

---

Identifique até {max_clips} momentos para cortes.

Retorne este JSON:
{{
  "live_summary": "Resumo da live em 2-3 frases",
  "live_energy": "high | medium | low",
  "total_clipable_minutes": 0.0,
  "insights": [
    {{
      "title": "Título viral (max 60 chars, CAPS para impacto)",
      "hook": "O que aparece/acontece nos primeiros 3 segundos",
      "category": "viral | analise | debate | storytelling | bolinha",
      "priority": 1,
      "start_time": 1234.5,
      "end_time": 1289.0,
      "suggested_template": "reaction",
      "needs_secondary_video": false,
      "storytelling": {{
        "setup": "O que estava acontecendo antes (contexto)",
        "climax": "O momento principal",
        "payoff": "Por que esse corte funciona / reação esperada"
      }},
      "production": {{
        "text_overlays": [
          {{
            "text": "Texto para overlay",
            "relative_time": 5.0,
            "duration": 3.0,
            "position": "top | center | bottom",
            "style": "title | subtitle | highlight | meme | stat"
          }}
        ],
        "transition_in": "fade | cut | zoom_in",
        "transition_out": "fade | cut | zoom_out",
        "thumbnail_offset": 10.0,
        "energy_level": "high | medium | low"
      }},
      "social": {{
        "caption_reels": "Legenda para Instagram (max 150 chars)",
        "caption_twitter": "Legenda para Twitter/X (max 200 chars)",
        "hashtags": ["#UnionFootball", "#Brasileirão"],
        "best_platform": "reels | shorts | tiktok | twitter"
      }},
      "ai_reasoning": "Por que esse momento merece ser um corte (2-3 frases)"
    }}
  ]
}}"""
