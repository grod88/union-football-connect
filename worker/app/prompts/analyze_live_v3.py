"""
Prompt for analyzing live transcription - V3 (Production Ready)
"""


def build_analyze_prompt_v3(
    title: str,
    transcript: str,
    context: str | None = None,
    max_clips: int = 10,
) -> str:
    """Build the v3 analysis prompt for Claude with full production details"""

    context_block = ""
    if context:
        context_block = f"""## Contexto da Live
{context}

"""

    return f"""Analise a transcrição da live "{title}" e gere planos de corte profissionais.

{context_block}## Transcrição com Timestamps:
{transcript}

---

Retorne um JSON com esta estrutura EXATA:

{{
  "live_summary": "Resumo da live em 2-3 frases",
  "total_clips": 0,
  "clips": [
    {{
      "id": "clip_01",
      "title": "Título curto e viral (max 50 chars)",
      "hook": "Frase de abertura que prende nos 3 primeiros segundos",
      "category": "viral|analise|debate|storytelling|bolinha",
      "priority": 1,
      "cold_open": false,

      "segments": [
        {{
          "start_time": 1234.5,
          "end_time": 1289.0,
          "type": "main",
          "description": "Contexto do que acontece nesse trecho"
        }}
      ],

      "silence_cuts": [
        {{
          "start": 1245.2,
          "end": 1247.8,
          "reason": "Pausa longa entre frases"
        }}
      ],

      "subtitles": [
        {{
          "start": 1234.5,
          "end": 1237.2,
          "text": "Mano, você viu esse lance?",
          "highlight_words": ["lance"],
          "speaker": "guru"
        }},
        {{
          "start": 1237.5,
          "end": 1241.0,
          "text": "O VAR simplesmente **ignorou** isso",
          "highlight_words": ["ignorou"],
          "speaker": "guru"
        }}
      ],

      "internal_transitions": [
        {{
          "timestamp": 1255.0,
          "type": "emphasis_zoom",
          "reason": "Momento do clímax — reação ao replay"
        }}
      ],

      "storytelling": {{
        "setup": "Guru está analisando o lance do pênalti",
        "build": "Mostra indignação crescente com a arbitragem",
        "climax": "Explode quando vê o replay pela segunda vez",
        "payoff": "Frase de efeito que fecha o raciocínio"
      }},

      "production": {{
        "intro_title": "O VAR PERDEU A MÃO",
        "outro_cta": "Inscreva-se e ative o sininho!",
        "bg_music_mood": "tense",
        "bg_music_energy": "medium",
        "energy_curve": "rising",
        "text_overlays": [
          {{
            "text": "LANCE POLÊMICO",
            "start": 1240.0,
            "duration": 3.0,
            "position": "top_center",
            "style": "alert"
          }}
        ],
        "suggested_template": "reaction",
        "thumbnail_time": 1255.0,
        "needs_secondary_video": false,
        "secondary_video_description": null
      }},

      "social": {{
        "caption_instagram": "O VAR decidiu tirar o dia de folga #Brasileirão #VAR",
        "caption_tiktok": "quando o VAR resolve que não quer trabalhar hoje...",
        "caption_twitter": "Alguém avisa o VAR que o jogo tá rolando",
        "hashtags": ["#UnionFootball", "#Brasileirão", "#VAR", "#Futebol"],
        "best_platform": "reels",
        "viral_potential": "high"
      }},

      "ai_reasoning": "Selecionei este trecho porque a reação é genuína e o tema VAR sempre gera engajamento. O cold_open com a frase de impacto prende a atenção imediatamente."
    }}
  ]
}}

## Regras IMPORTANTES:
1. Gere entre 5-12 clips por live (qualidade > quantidade)
2. Cada clip deve ter entre 25-120 segundos de conteúdo ÚTIL (após remover silêncios)
3. Os subtitles DEVEM cobrir 100% das falas do clip — sem lacunas
4. Silence_cuts: marque TODA pausa > 1.5s — o ritmo final depende disso
5. Highlight_words: marque 1-2 palavras-chave por frase para destaque visual
6. O campo "segments" permite clips com múltiplos trechos não-contíguos
   (ex: começa com a reação, volta pro contexto, retorna pro clímax)
7. bg_music_mood: "hype" | "tense" | "chill" | "epic" | "funny"
8. energy_curve: "rising" (cresce) | "peak" (mantém alto) | "valley_peak"
   (baixa e sobe) | "steady" (constante)
9. Limite máximo: {max_clips} clips

## CRÍTICO - TIMESTAMPS:
A transcrição usa formato [XXXs-YYYs] onde XXX e YYY são SEGUNDOS.
Exemplo: [6206s-6209s] significa start_time=6206.0, end_time=6209.0

ANTES de gerar cada clip:
1. LOCALIZE o texto exato na transcrição
2. COPIE os números de segundos EXATAMENTE como aparecem
3. Se "São Paulo é a árvore" aparece em [6206s-6209s], então start_time = 6206.0"""
