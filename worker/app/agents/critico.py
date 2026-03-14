"""
Agente CRÍTICO - Avaliador de Qualidade

Responsabilidades:
1. Avaliar cada clip do plano de produção
2. Dar scores em múltiplas dimensões (gancho, storytelling, produção, viralidade, identidade)
3. Aprovar, pedir refinamentos ou rejeitar clips
4. Sugerir melhorias específicas quando necessário
"""
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

from .base import (
    AgentConfig,
    AgentResult,
    call_claude,
    parse_json_response,
)


CRITICO_SYSTEM_PROMPT = """Você é o CRÍTICO, especialista em avaliar a qualidade de clips de futebol.

## SUA MISSÃO
Avaliar cada clip do plano de produção e decidir:
- APPROVED: Clip está pronto para produção
- NEEDS_WORK: Clip tem potencial mas precisa de ajustes
- REJECTED: Clip não deve ser produzido

## DIMENSÕES DE AVALIAÇÃO (0-10)

### 1. GANCHO (hook_score)
- Os primeiros 3 segundos prendem atenção?
- Tem uma frase ou imagem de impacto inicial?
- Faz o espectador querer continuar assistindo?

### 2. STORYTELLING (story_score)
- Tem início, meio e fim claros?
- O payoff é satisfatório?
- A progressão faz sentido?

### 3. PRODUÇÃO (production_score)
- As specs de produção estão adequadas?
- O template escolhido é o correto?
- Os overlays e efeitos fazem sentido?

### 4. VIRALIDADE (viral_score)
- É compartilhável?
- Funciona sem contexto?
- Provoca reação emocional?

### 5. IDENTIDADE (brand_score)
- Combina com a identidade do canal?
- Mantém o tom Union FC?
- O público-alvo vai se identificar?

## SCORE FINAL
- Média ponderada: (gancho × 2 + story × 1.5 + produção × 1 + viralidade × 2 + identidade × 1.5) / 8
- Score ≥ 7.0: APPROVED
- Score 5.0-6.9: NEEDS_WORK
- Score < 5.0: REJECTED

## OUTPUT JSON OBRIGATÓRIO
{
  "evaluations": [
    {
      "clip_id": "final_001",
      "verdict": "APPROVED|NEEDS_WORK|REJECTED",
      "scores": {
        "hook": 8.5,
        "storytelling": 7.0,
        "production": 8.0,
        "virality": 9.0,
        "brand": 7.5
      },
      "final_score": 8.1,
      "strengths": [
        "Frase de abertura muito forte",
        "Potencial viral alto"
      ],
      "weaknesses": [
        "Poderia ter um payoff mais claro"
      ],
      "feedback": {
        "issues": [],
        "suggestions": [],
        "send_back_to": null
      }
    },
    {
      "clip_id": "final_002",
      "verdict": "NEEDS_WORK",
      "scores": {
        "hook": 6.0,
        "storytelling": 5.5,
        "production": 7.0,
        "virality": 6.5,
        "brand": 7.0
      },
      "final_score": 6.3,
      "strengths": [
        "Conteúdo interessante"
      ],
      "weaknesses": [
        "Gancho fraco nos primeiros segundos",
        "Transição entre momentos não está clara"
      ],
      "feedback": {
        "issues": [
          "O início não prende atenção",
          "Falta clareza na conexão entre os momentos"
        ],
        "suggestions": [
          "Começar com a frase de impacto do minuto 45",
          "Adicionar texto explicando a conexão temporal"
        ],
        "send_back_to": "cronista"
      }
    }
  ],
  "summary": {
    "total_evaluated": 8,
    "approved": 5,
    "needs_work": 2,
    "rejected": 1,
    "average_score": 7.2
  },
  "overall_feedback": "Feedback geral sobre a qualidade do plano"
}

## REGRAS CRÍTICAS
1. Seja HONESTO e CONSTRUTIVO
2. Dê feedback específico e acionável
3. Não aprove clips medíocres só para não rejeitar
4. Priorize qualidade sobre quantidade
5. Considere o público-alvo: torcedores de futebol que acompanham lives"""


@dataclass
class CriticoInput:
    """Input for the Crítico agent."""
    production_plan: Dict[str, Any]
    clips: List[Dict[str, Any]]
    iteration: int = 1  # Which iteration of review


class CriticoAgent:
    """
    Agente Crítico - Avalia qualidade dos clips.

    Recebe o plano de produção e avalia cada clip,
    aprovando, pedindo refinamentos ou rejeitando.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.config = AgentConfig(
            name="critico",
            model=model,
            max_tokens=12288,
            temperature=0.3,  # Mais consistente nas avaliações
        )

    def run(self, input_data: CriticoInput) -> AgentResult:
        """
        Executa o Crítico no plano de produção.

        Args:
            input_data: Plano de produção com clips

        Returns:
            AgentResult com avaliações
        """
        user_prompt = self._build_user_prompt(input_data)

        try:
            response_text, tokens_in, tokens_out = call_claude(
                system_prompt=CRITICO_SYSTEM_PROMPT,
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

    def _build_user_prompt(self, input_data: CriticoInput) -> str:
        """Build user prompt with production plan."""
        import json

        parts = []

        parts.append(f"## ITERAÇÃO DE REVIEW: {input_data.iteration}")
        if input_data.iteration > 1:
            parts.append("Esta é uma re-avaliação após refinamentos. Seja ainda mais criterioso.")
        parts.append("")

        # Production plan overview
        plan = input_data.production_plan
        parts.append("## VISÃO GERAL DO PLANO")
        parts.append(f"Total de clips: {plan.get('total_clips', len(input_data.clips))}")
        breakdown = plan.get('breakdown', {})
        if breakdown:
            parts.append(f"- Virais curtos: {breakdown.get('viral_short', 0)}")
            parts.append(f"- Narrativos médios: {breakdown.get('narrative_medium', 0)}")
            parts.append(f"- Educacionais longos: {breakdown.get('educational_long', 0)}")
        parts.append("")

        # Clips to evaluate
        parts.append("## CLIPS PARA AVALIAR")
        parts.append(json.dumps(input_data.clips, ensure_ascii=False, indent=2))

        parts.append("""
## TAREFA
Avalie CADA clip do plano usando os critérios especificados.
Dê scores honestos e feedback construtivo.
Retorne APENAS JSON no formato especificado.""")

        return "\n".join(parts)


def run_critico(
    production_plan: Dict[str, Any],
    clips: List[Dict[str, Any]],
    iteration: int = 1,
    model: str = "claude-sonnet-4-20250514",
) -> AgentResult:
    """
    Função helper para rodar o Crítico.

    Args:
        production_plan: Plano de produção do Produtor
        clips: Lista de clips para avaliar
        iteration: Número da iteração de review
        model: Modelo Claude a usar

    Returns:
        AgentResult com avaliações
    """
    agent = CriticoAgent(model=model)
    input_data = CriticoInput(
        production_plan=production_plan,
        clips=clips,
        iteration=iteration,
    )
    return agent.run(input_data)
