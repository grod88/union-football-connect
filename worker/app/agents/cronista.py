"""
Agente CRONISTA - Construtor de Arcos Narrativos

Responsabilidades:
1. Montar narrativas que conectam momentos distantes
2. Criar cold opens (começar pelo clímax, depois voltar)
3. Gerar clips de 45-90 segundos com storytelling forte
"""
from dataclasses import dataclass
from typing import Optional, List

from .base import (
    AgentConfig,
    AgentResult,
    call_claude,
    parse_json_response,
)
from ..prompts import CRONISTA_SYSTEM_PROMPT_V2
from ..utils.agent_runtime import get_agent_runtime_preset


CRONISTA_SYSTEM_PROMPT = """Você é o CRONISTA, especialista em STORYTELLING para clips de futebol.

## SUA MISSÃO
Construir NARRATIVAS que conectam diferentes momentos da transmissão, criando arcos com setup → payoff.

## TIPOS DE ARCOS QUE VOCÊ CONSTRÓI

### 1. PROFECIA REALIZADA
- Previsão no início → Acontecimento no fim
- "Ele disse que ia fazer gol... e fez!"
- Cold open: Mostrar o gol primeiro, depois a previsão

### 2. REDENÇÃO
- Crítica a jogador → Jogador brilha depois
- "Todo mundo xingando o cara... e ele cala a boca de todo mundo"
- Cold open: O momento de glória, depois as críticas

### 3. TRAGÉDIA ANUNCIADA
- Otimismo inicial → Desastre
- "Estávamos tão confiantes..."
- Cold open: O desastre, depois o otimismo que precedeu

### 4. ARCO ÉPICO
- Sequência de eventos que constroem tensão
- Momentos conectados que criam uma jornada
- Cold open: O clímax da jornada

### 5. HUMOR RECORRENTE
- Running joke que aparece várias vezes
- Compilação de momentos engraçados conectados
- Cold open: O momento mais engraçado

## TÉCNICA DE COLD OPEN
1. COMECE pelo PAYOFF (3-5 segundos do momento de impacto)
2. CORTE para texto "X minutos antes..."
3. DESENVOLVA o setup
4. VOLTE ao payoff com contexto completo

## CARACTERÍSTICAS DO CLIP IDEAL
- **Duração**: 45-90 segundos
- **Estrutura**: Setup → Build → Climax → (opcional) Resolution
- **Momentos**: 2-4 trechos conectados tematicamente
- **Transições**: Claras e intencionais entre momentos

## OUTPUT JSON OBRIGATÓRIO
Responda APENAS com JSON válido:
{
  "clips": [
    {
      "id": "arc_001",
      "title": "TÍTULO QUE RESUME O ARCO",
      "hook": "Texto dos primeiros segundos",
      "arc_type": "profecia|redenção|tragédia|épico|humor",
      "story_summary": "Resumo da história em 1-2 frases",
      "total_duration": 75,
      "segments": [
        {
          "order": 1,
          "type": "cold_open",
          "start_time": 5000,
          "end_time": 5005,
          "description": "O momento de impacto",
          "role_in_story": "payoff"
        },
        {
          "order": 2,
          "type": "transition",
          "text": "45 minutos antes...",
          "duration": 2
        },
        {
          "order": 3,
          "type": "content",
          "start_time": 500,
          "end_time": 530,
          "description": "A previsão inicial",
          "role_in_story": "setup"
        },
        {
          "order": 4,
          "type": "content",
          "start_time": 5000,
          "end_time": 5030,
          "description": "A realização da previsão",
          "role_in_story": "climax"
        }
      ],
      "storytelling": {
        "setup": "O que estabelece a premissa",
        "build": "O que cria tensão/expectativa",
        "climax": "O momento de maior impacto",
        "payoff": "A conclusão satisfatória"
      },
      "key_quotes": [
        {"timestamp": 500, "quote": "Frase importante do setup"},
        {"timestamp": 5000, "quote": "Frase do climax"}
      ],
      "production": {
        "suggested_template": "storytelling",
        "intro_text": "Texto de abertura",
        "transition_style": "fade|cut|zoom",
        "background_music": "tense|triumphant|comedic",
        "energy_curve": "building|fluctuating|explosive"
      }
    }
  ],
  "summary": "Resumo dos arcos encontrados"
}

## REGRAS CRÍTICAS
1. TIMESTAMPS em SEGUNDOS
2. Cada arco DEVE ter pelo menos 2 momentos conectados
3. Cold open é OBRIGATÓRIO para arcos de profecia e redenção
4. Duração total entre 45-90 segundos
5. Os momentos devem estar CLARAMENTE conectados tematicamente
6. Explique POR QUE esses momentos formam um arco"""


@dataclass
class CronistaInput:
    """Input for the Cronista agent."""
    transcript: str
    suggested_arcs: Optional[List[dict]] = None
    themes: Optional[List[dict]] = None
    delegation_hints: Optional[List[dict]] = None


class CronistaAgent:
    """
    Agente Cronista - Constrói arcos narrativos.

    Recebe a transcrição completa ou trechos relevantes
    e monta narrativas com cold open e storytelling.
    """

    def __init__(self, model: Optional[str] = None, prompt_version: str = "v1"):
        runtime = get_agent_runtime_preset("cronista", model_override=model)
        self.config = AgentConfig(
            name="cronista",
            model=runtime.model,
            max_tokens=runtime.max_tokens,
            temperature=runtime.temperature,
            top_p=runtime.top_p,
        )
        self.system_prompt = CRONISTA_SYSTEM_PROMPT_V2 if prompt_version == "v2" else CRONISTA_SYSTEM_PROMPT

    def run(self, input_data: CronistaInput) -> AgentResult:
        """
        Executa o Cronista na transcrição.

        Args:
            input_data: Transcrição e dicas do Diretor

        Returns:
            AgentResult com arcos narrativos
        """
        user_prompt = self._build_user_prompt(input_data)

        try:
            response_text, tokens_in, tokens_out = call_claude(
                system_prompt=self.system_prompt,
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

    def _build_user_prompt(self, input_data: CronistaInput) -> str:
        """Build user prompt with arcs, themes, and director briefs."""
        parts = []

        if input_data.delegation_hints:
            parts.append("## BRIEFS DO DIRETOR")
            for hint in input_data.delegation_hints:
                title = hint.get("brief") or hint.get("description") or hint.get("task_id") or "Tarefa"
                parts.append(f"### {title}")
                if hint.get("priority"):
                    parts.append(f"Prioridade: {hint.get('priority')}")
                if hint.get("angle"):
                    parts.append(f"Ângulo: {hint.get('angle')}")
                if hint.get("duration_target"):
                    parts.append(f"Duração alvo: {hint.get('duration_target')}")
                if hint.get("must_include"):
                    parts.append(f"Must include: {hint.get('must_include')}")
                if hint.get("must_avoid"):
                    parts.append(f"Must avoid: {hint.get('must_avoid')}")
                parts.append("")

        if input_data.suggested_arcs:
            parts.append("## ARCOS SUGERIDOS PELO DIRETOR")
            for arc in input_data.suggested_arcs:
                parts.append(f"### {arc.get('title', 'Sem título')}")
                parts.append(f"Tipo: {arc.get('type', 'unknown')}")
                parts.append(f"Descrição: {arc.get('description', '')}")
                if arc.get("moments"):
                    parts.append("Momentos:")
                    for moment in arc["moments"]:
                        parts.append(f"  - {moment.get('timestamp', '?')}s: {moment.get('description', '')}")
                parts.append("")

        if input_data.themes:
            parts.append("## TEMAS CONECTADOS")
            for theme in input_data.themes:
                if theme.get("connects_to"):
                    parts.append(f"- {theme.get('label')} conecta com: {theme.get('connects_to')}")
            parts.append("")

        parts.append("## TRANSCRIÇÃO COMPLETA")
        parts.append(input_data.transcript)

        parts.append(
            """
## TAREFA
Construa ARCOS NARRATIVOS conectando momentos da transcrição.
Use a técnica de COLD OPEN quando apropriado.
Foque em histórias com setup → payoff claro.
Retorne APENAS JSON no formato especificado."""
        )

        return "\n".join(parts)


def run_cronista(
    transcript: str,
    suggested_arcs: Optional[List[dict]] = None,
    themes: Optional[List[dict]] = None,
    delegation_hints: Optional[List[dict]] = None,
    model: Optional[str] = None,
    prompt_version: str = "v1",
) -> AgentResult:
    """
    Função helper para rodar o Cronista.

    Args:
        transcript: Transcrição completa ou relevante
        suggested_arcs: Arcos sugeridos pelo Diretor
        themes: Temas conectados identificados
        delegation_hints: Briefs detalhados do Diretor
        model: Modelo Claude a usar

    Returns:
        AgentResult com arcos narrativos
    """
    agent = CronistaAgent(model=model, prompt_version=prompt_version)
    input_data = CronistaInput(
        transcript=transcript,
        suggested_arcs=suggested_arcs,
        themes=themes,
        delegation_hints=delegation_hints,
    )
    return agent.run(input_data)
