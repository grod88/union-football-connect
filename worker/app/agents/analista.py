"""
Agente ANALISTA - Extrator de Insights Táticos

Responsabilidades:
1. Extrair análises táticas e técnicas
2. Criar conteúdo educacional sobre futebol
3. Gerar clips de 30-60 segundos com insights profundos
"""
from dataclasses import dataclass
from typing import Optional, List

from .base import (
    AgentConfig,
    AgentResult,
    call_claude,
    parse_json_response,
)


ANALISTA_SYSTEM_PROMPT = """Você é o ANALISTA, especialista em INSIGHTS TÁTICOS de futebol.

## SUA MISSÃO
Extrair análises táticas, técnicas e educacionais das transmissões.
Criar clips que ensinam algo sobre futebol de forma acessível.

## TIPOS DE ANÁLISE

### 1. ANÁLISE TÁTICA
- Formações, posicionamentos, movimentações
- "Por que o técnico escalou assim"
- Explicações de jogadas e estratégias

### 2. ANÁLISE DE JOGADOR
- Características técnicas específicas
- Comparações com outros jogadores
- Evolução ou declínio de performance

### 3. ANÁLISE DE JOGO
- Momentos decisivos e por quê
- O que mudou no segundo tempo
- Substituições e impactos

### 4. ANÁLISE HISTÓRICA
- Contexto histórico de rivalidades
- Recordes, estatísticas relevantes
- Comparações com jogos passados

### 5. ANÁLISE DE ARBITRAGEM
- Explicação de regras
- Decisões polêmicas e suas justificativas
- VAR: quando e por que

## FORMATO DO CLIP
- **Duração**: 30-60 segundos
- **Tom**: Educacional mas acessível
- **Estrutura**: Contexto → Insight → Conclusão
- **Visual**: Pode pedir overlays explicativos

## OUTPUT JSON OBRIGATÓRIO
Responda APENAS com JSON válido:
{
  "clips": [
    {
      "id": "insight_001",
      "title": "TÍTULO DO INSIGHT",
      "hook": "Pergunta ou gancho inicial",
      "analysis_type": "tática|jogador|jogo|histórica|arbitragem",
      "start_time": 2000,
      "end_time": 2045,
      "duration": 45,
      "key_insight": "O insight principal em uma frase",
      "explanation": "Explicação mais detalhada do insight",
      "context_needed": "Contexto que o espectador precisa saber",
      "segments": [
        {
          "start_time": 2000,
          "end_time": 2045,
          "type": "analysis",
          "content_description": "O que está sendo dito"
        }
      ],
      "visual_aids": [
        {
          "timestamp": 2010,
          "type": "text_overlay|arrow|circle|highlight",
          "content": "4-3-3 com laterais projetados",
          "position": "center|bottom|top"
        }
      ],
      "educational_value": {
        "topic": "Formação tática",
        "difficulty": "básico|intermediário|avançado",
        "target_audience": "Torcedor casual que quer entender mais"
      },
      "production": {
        "suggested_template": "analysis",
        "graphics_needed": ["formação", "setas"],
        "background_music": "none|subtle",
        "pacing": "calm|moderate"
      },
      "social": {
        "best_platform": "youtube",
        "hashtags": ["#tática", "#futebol", "#análise"],
        "engagement_question": "Você concorda com essa formação?"
      }
    }
  ],
  "summary": "Resumo das análises encontradas"
}

## REGRAS CRÍTICAS
1. TIMESTAMPS em SEGUNDOS
2. O insight deve ser ESPECÍFICO e ÚTIL
3. Linguagem acessível (não muito técnica)
4. Duração entre 30-60 segundos
5. Foque em momentos onde há ANÁLISE REAL sendo feita
6. Não inclua momentos genéricos sem conteúdo educacional"""


@dataclass
class AnalistaInput:
    """Input for the Analista agent."""
    transcript_chunk: str
    time_offset: float = 0
    delegation_hints: Optional[List[dict]] = None  # From director
    match_context: Optional[str] = None


class AnalistaAgent:
    """
    Agente Analista - Extrai insights táticos.

    Processa trechos de transcrição onde há análises
    e cria clips educacionais sobre futebol.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.config = AgentConfig(
            name="analista",
            model=model,
            max_tokens=8192,
            temperature=0.5,  # Mais preciso para análises
        )

    def run(self, input_data: AnalistaInput) -> AgentResult:
        """
        Executa o Analista no chunk de transcrição.

        Args:
            input_data: Chunk de transcrição e contexto

        Returns:
            AgentResult com insights táticos
        """
        user_prompt = self._build_user_prompt(input_data)

        try:
            response_text, tokens_in, tokens_out = call_claude(
                system_prompt=ANALISTA_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                config=self.config,
            )

            data = parse_json_response(response_text)

            # Adjust timestamps with offset
            if input_data.time_offset > 0:
                for clip in data.get("clips", []):
                    clip["start_time"] += input_data.time_offset
                    clip["end_time"] += input_data.time_offset
                    for seg in clip.get("segments", []):
                        seg["start_time"] += input_data.time_offset
                        seg["end_time"] += input_data.time_offset

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

    def _build_user_prompt(self, input_data: AnalistaInput) -> str:
        """Build user prompt with context and hints."""
        parts = []

        # Match context
        if input_data.match_context:
            parts.append(f"## CONTEXTO DO JOGO\n{input_data.match_context}\n")

        # Delegation hints
        if input_data.delegation_hints:
            parts.append("## DICAS DO DIRETOR (trechos com potencial analítico)")
            for hint in input_data.delegation_hints:
                focus = hint.get('focus', 'análise')
                desc = hint.get('description', '')
                parts.append(f"- [{focus}] {desc}")
            parts.append("")

        # Transcript
        parts.append("## TRANSCRIÇÃO")
        parts.append(input_data.transcript_chunk)

        # Task
        parts.append("""
## TAREFA
Extraia INSIGHTS TÁTICOS e ANÁLISES EDUCACIONAIS.
Foque em momentos onde há explicações úteis sobre futebol.
Clips de 30-60 segundos com conteúdo que ENSINA algo.
Retorne APENAS JSON no formato especificado.""")

        return "\n".join(parts)


def run_analista(
    transcript_chunk: str,
    time_offset: float = 0,
    delegation_hints: Optional[List[dict]] = None,
    match_context: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514",
) -> AgentResult:
    """
    Função helper para rodar o Analista.

    Args:
        transcript_chunk: Trecho da transcrição
        time_offset: Offset para timestamps
        delegation_hints: Dicas do Diretor
        match_context: Contexto do jogo
        model: Modelo Claude a usar

    Returns:
        AgentResult com insights táticos
    """
    agent = AnalistaAgent(model=model)
    input_data = AnalistaInput(
        transcript_chunk=transcript_chunk,
        time_offset=time_offset,
        delegation_hints=delegation_hints,
        match_context=match_context,
    )
    return agent.run(input_data)
