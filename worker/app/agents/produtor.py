"""
Agente PRODUTOR - Sintetizador do Plano de Produção Final

Responsabilidades:
1. Receber outputs de todos os workers (Garimpeiro, Cronista, Analista)
2. Eliminar duplicatas e sobreposições
3. Priorizar e ordenar clips por potencial de engajamento
4. Gerar especificações técnicas de produção para cada clip
"""
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

from .base import (
    AgentConfig,
    AgentResult,
    call_claude,
    parse_json_response,
)


PRODUTOR_SYSTEM_PROMPT = """Você é o PRODUTOR, responsável por criar o PLANO DE PRODUÇÃO FINAL.

## SUA MISSÃO
Receber os clips sugeridos por todos os workers e:
1. Eliminar duplicatas (clips que cobrem o mesmo momento)
2. Resolver conflitos (quando 2+ workers sugeriram o mesmo trecho)
3. Priorizar por potencial de engajamento
4. Gerar especificações técnicas de produção

## CRITÉRIOS DE PRIORIZAÇÃO
1. **VIRAL (Garimpeiro)** - Alta prioridade se:
   - Tem frase clipável forte
   - Funciona sem contexto
   - Duração ideal (15-30s)

2. **NARRATIVO (Cronista)** - Alta prioridade se:
   - Arco tem setup e payoff claros
   - Cold open funciona bem
   - Conecta momentos de forma surpreendente

3. **EDUCACIONAL (Analista)** - Alta prioridade se:
   - Insight é único e valioso
   - Tem apelo para público amplo
   - Pode gerar discussão

## RESOLUÇÃO DE CONFLITOS
- Se 2 workers sugeriram o mesmo trecho: escolha a versão com melhor storytelling
- Se trechos se sobrepõem parcialmente: decida se mescla ou separa
- Mantenha diversidade: não deixe todos os clips serem do mesmo tipo

## ESPECIFICAÇÕES DE PRODUÇÃO
Para cada clip final, especifique:
- Template de edição a usar
- Tratamento de áudio (boost, trilha, efeitos)
- Texto na tela (overlays, legendas, CTAs)
- Formato de exportação (horizontal, vertical, ambos)
- Thumbnail sugerido (timestamp do frame)

## OUTPUT JSON OBRIGATÓRIO
{
  "production_plan": {
    "total_clips": 8,
    "estimated_total_duration": 320,
    "breakdown": {
      "viral_short": 4,
      "narrative_medium": 2,
      "educational_long": 2
    }
  },
  "clips": [
    {
      "id": "final_001",
      "priority": 1,
      "source_agent": "garimpeiro|cronista|analista",
      "source_clip_id": "viral_001",
      "title": "TÍTULO FINAL",
      "category": "viral|narrativo|educacional",
      "start_time": 1234,
      "end_time": 1260,
      "duration": 26,
      "segments": [
        {"start": 1234, "end": 1260, "type": "content"}
      ],
      "production_spec": {
        "template": "reaction|storytelling|analysis|highlight",
        "format": "horizontal|vertical|both",
        "audio": {
          "boost_db": 6,
          "background_music": "none|hype|emotional|suspense",
          "music_volume": 0.3
        },
        "text_overlays": [
          {"time": 0, "duration": 3, "text": "OLHA ISSO", "style": "impact", "position": "top"}
        ],
        "subtitles": true,
        "intro": {"type": "none|quick|full", "duration": 2},
        "outro": {"type": "none|cta|subscribe", "duration": 3},
        "thumbnail": {
          "timestamp": 1250,
          "text_overlay": "FRASE DE IMPACTO"
        }
      },
      "social": {
        "best_platform": "tiktok|instagram|youtube|twitter",
        "caption": "Caption sugerido...",
        "hashtags": ["#spfc", "#futebol"]
      },
      "reasoning": "Por que este clip foi incluído e priorizado assim"
    }
  ],
  "dropped_clips": [
    {
      "source_agent": "cronista",
      "source_clip_id": "arc_002",
      "reason": "Sobrepõe com viral_001, priorizamos a versão viral por ser mais clipável"
    }
  ],
  "summary": "Resumo do plano de produção"
}

## REGRAS CRÍTICAS
1. MÁXIMO 10-12 clips no plano final
2. Mantenha pelo menos 1 clip de cada tipo (viral, narrativo, educacional)
3. Ordene por prioridade (1 = mais importante)
4. Justifique cada inclusão e exclusão
5. Seja específico nas specs de produção
6. TIMESTAMPS em SEGUNDOS"""


@dataclass
class ProdutorInput:
    """Input for the Produtor agent."""
    garimpeiro_clips: List[Dict[str, Any]]
    cronista_clips: List[Dict[str, Any]]
    analista_clips: List[Dict[str, Any]]
    live_summary: Optional[str] = None
    max_clips: int = 10


class ProdutorAgent:
    """
    Agente Produtor - Sintetiza outputs dos workers.

    Recebe clips de todos os workers, resolve conflitos,
    prioriza e gera especificações de produção.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.config = AgentConfig(
            name="produtor",
            model=model,
            max_tokens=16384,
            temperature=0.5,  # Mais consistente
        )

    def run(self, input_data: ProdutorInput) -> AgentResult:
        """
        Executa o Produtor nos clips dos workers.

        Args:
            input_data: Clips de todos os workers

        Returns:
            AgentResult com plano de produção
        """
        user_prompt = self._build_user_prompt(input_data)

        try:
            response_text, tokens_in, tokens_out = call_claude(
                system_prompt=PRODUTOR_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                config=self.config,
            )

            data = parse_json_response(response_text)

            return AgentResult(
                agent_name=self.config.name,
                success=True,
                data=data,
                raw_response=response_text,
                tokens_input=tokens_in,
                tokens_output=tokens_out,
            )

        except Exception as e:
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                error=str(e),
            )

    def _build_user_prompt(self, input_data: ProdutorInput) -> str:
        """Build user prompt with all worker outputs."""
        import json

        parts = []

        if input_data.live_summary:
            parts.append(f"## RESUMO DA LIVE\n{input_data.live_summary}\n")

        parts.append(f"## LIMITE\nMáximo de {input_data.max_clips} clips no plano final.\n")

        # Garimpeiro clips
        parts.append("## CLIPS DO GARIMPEIRO (Virais)")
        parts.append(f"Total: {len(input_data.garimpeiro_clips)} clips")
        for clip in input_data.garimpeiro_clips:
            parts.append(f"- [{clip.get('id')}] {clip.get('title')} ({clip.get('start_time')}-{clip.get('end_time')}s)")
            if clip.get('key_phrase'):
                parts.append(f"  Frase: \"{clip.get('key_phrase')}\"")
        parts.append("")

        # Cronista clips
        parts.append("## CLIPS DO CRONISTA (Narrativos)")
        parts.append(f"Total: {len(input_data.cronista_clips)} clips")
        for clip in input_data.cronista_clips:
            parts.append(f"- [{clip.get('id')}] {clip.get('title')} ({clip.get('arc_type', 'arco')})")
            if clip.get('story_summary'):
                parts.append(f"  História: {clip.get('story_summary')}")
        parts.append("")

        # Analista clips
        parts.append("## CLIPS DO ANALISTA (Educacionais)")
        parts.append(f"Total: {len(input_data.analista_clips)} clips")
        for clip in input_data.analista_clips:
            parts.append(f"- [{clip.get('id')}] {clip.get('title')} ({clip.get('analysis_type', 'análise')})")
            if clip.get('key_insight'):
                parts.append(f"  Insight: {clip.get('key_insight')}")
        parts.append("")

        # Full data for reference
        parts.append("## DADOS COMPLETOS (JSON)")
        parts.append("### Garimpeiro")
        parts.append(json.dumps(input_data.garimpeiro_clips, ensure_ascii=False, indent=2))
        parts.append("\n### Cronista")
        parts.append(json.dumps(input_data.cronista_clips, ensure_ascii=False, indent=2))
        parts.append("\n### Analista")
        parts.append(json.dumps(input_data.analista_clips, ensure_ascii=False, indent=2))

        parts.append("""
## TAREFA
Analise todos os clips acima e crie o PLANO DE PRODUÇÃO FINAL.
Elimine duplicatas, resolva conflitos, priorize e gere specs de produção.
Retorne APENAS JSON no formato especificado.""")

        return "\n".join(parts)


def run_produtor(
    garimpeiro_clips: List[Dict[str, Any]],
    cronista_clips: List[Dict[str, Any]],
    analista_clips: List[Dict[str, Any]],
    live_summary: Optional[str] = None,
    max_clips: int = 10,
    model: str = "claude-sonnet-4-20250514",
) -> AgentResult:
    """
    Função helper para rodar o Produtor.

    Args:
        garimpeiro_clips: Clips do Garimpeiro
        cronista_clips: Clips do Cronista
        analista_clips: Clips do Analista
        live_summary: Resumo da live (do Diretor)
        max_clips: Máximo de clips no plano final
        model: Modelo Claude a usar

    Returns:
        AgentResult com plano de produção
    """
    agent = ProdutorAgent(model=model)
    input_data = ProdutorInput(
        garimpeiro_clips=garimpeiro_clips,
        cronista_clips=cronista_clips,
        analista_clips=analista_clips,
        live_summary=live_summary,
        max_clips=max_clips,
    )
    return agent.run(input_data)
