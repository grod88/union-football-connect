"""
Agente GARIMPEIRO - Caçador de Momentos Virais

Responsabilidades:
1. Encontrar momentos curtos (15-30s) com alto potencial viral
2. Priorizar reações autênticas, tiradas engraçadas, frases de efeito
3. Gerar clips que funcionam standalone (não precisam de contexto)
"""
from dataclasses import dataclass
from typing import Optional, List

from .base import (
    AgentConfig,
    AgentResult,
    call_claude,
    parse_json_response,
)


GARIMPEIRO_SYSTEM_PROMPT = """Você é o GARIMPEIRO, especialista em encontrar MOMENTOS VIRAIS em transmissões de futebol.

## SUA MISSÃO
Receber trechos de transcrição e encontrar clips CURTOS (15-30 segundos) com ALTO POTENCIAL VIRAL.

## O QUE VOCÊ PROCURA
1. **FRASES DE EFEITO** - Bordões, citações memoráveis
2. **REAÇÕES AUTÊNTICAS** - Gritos, risadas, surpresas genuínas
3. **TIRADAS ENGRAÇADAS** - Zoeiras, piadas, comentários inesperados
4. **MOMENTOS WTF** - Situações absurdas, erros de arbitragem bizarros
5. **TAKES POLÊMICOS** - Opiniões fortes que geram debate

## CRITÉRIOS DE VIRAL
- Funciona SEM contexto (qualquer um entende)
- Provoca reação emocional imediata
- É compartilhável (pessoas vão querer mandar pra amigos)
- Tem "frase clipável" clara
- Funciona bem no formato vertical (TikTok/Reels/Shorts)

## CARACTERÍSTICAS DO CLIP IDEAL
- **Duração**: 15-30 segundos (MÁXIMO 45s em casos excepcionais)
- **Entrada forte**: Começa já no momento de impacto
- **Saída limpa**: Termina no payoff, sem arrastar
- **Auto-contido**: Não precisa de explicação externa

## OUTPUT JSON OBRIGATÓRIO
Responda APENAS com JSON válido:
{
  "clips": [
    {
      "id": "viral_001",
      "title": "TÍTULO EM CAPS CHAMATIVO",
      "hook": "Texto curto que aparece nos primeiros 3 segundos",
      "start_time": 1234,
      "end_time": 1260,
      "duration": 26,
      "viral_type": "frase_de_efeito|reacao|tirada|wtf|take_polemico",
      "key_phrase": "A frase exata que torna isso viral",
      "why_viral": "Explicação de por que isso viraliza",
      "hashtags": ["#futebol", "#spfc"],
      "energy_level": 0.9,
      "platforms": ["tiktok", "reels", "shorts"],
      "subtitles": [
        {"start": 0, "end": 3, "text": "Texto...", "highlight_words": ["PALAVRA"]}
      ],
      "production": {
        "suggested_template": "reaction",
        "text_overlays": [
          {"time": 2, "text": "OLHA ISSO", "style": "impact"}
        ],
        "sound_effects": [],
        "thumbnail_frame": 15
      }
    }
  ],
  "summary": "Resumo do que foi encontrado"
}

## REGRAS CRÍTICAS
1. TIMESTAMPS em SEGUNDOS (não HH:MM:SS)
2. Duração MÁXIMA de 45 segundos
3. Priorize QUALIDADE sobre quantidade
4. Cada clip deve ter uma "frase clipável" clara
5. Pense: "Isso funciona no feed do TikTok?"
6. Se não tem potencial viral REAL, não inclua"""


@dataclass
class GarimpeiroInput:
    """Input for the Garimpeiro agent."""
    transcript_chunk: str
    time_offset: float = 0  # Add to all timestamps
    delegation_hints: Optional[List[dict]] = None  # From director


class GarimpeiroAgent:
    """
    Agente Garimpeiro - Encontra momentos virais curtos.

    Processa chunks de transcrição delegados pelo Diretor
    e retorna clips de 15-30 segundos com alto potencial viral.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.config = AgentConfig(
            name="garimpeiro",
            model=model,
            max_tokens=8192,
            temperature=0.8,  # Mais criativo para encontrar viral
        )

    def run(self, input_data: GarimpeiroInput) -> AgentResult:
        """
        Executa o Garimpeiro no chunk de transcrição.

        Args:
            input_data: Chunk de transcrição e dicas do Diretor

        Returns:
            AgentResult com clips virais encontrados
        """
        user_prompt = self._build_user_prompt(input_data)

        try:
            response_text, tokens_in, tokens_out = call_claude(
                system_prompt=GARIMPEIRO_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                config=self.config,
            )

            data = parse_json_response(response_text)

            # Adjust timestamps with offset
            if input_data.time_offset > 0:
                for clip in data.get("clips", []):
                    clip["start_time"] += input_data.time_offset
                    clip["end_time"] += input_data.time_offset

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

    def _build_user_prompt(self, input_data: GarimpeiroInput) -> str:
        """Build user prompt with transcript and hints."""
        parts = []

        # Delegation hints from director
        if input_data.delegation_hints:
            parts.append("## DICAS DO DIRETOR (momentos para investigar)")
            for hint in input_data.delegation_hints:
                parts.append(f"- {hint.get('description', '')} ({hint.get('type', 'viral')})")
            parts.append("")

        # Transcript chunk
        parts.append("## TRANSCRIÇÃO")
        parts.append(input_data.transcript_chunk)

        # Task
        parts.append("""
## TAREFA
Analise a transcrição e encontre MOMENTOS VIRAIS.
Foque em clips de 15-30 segundos que funcionam standalone.
Retorne APENAS JSON no formato especificado.""")

        return "\n".join(parts)


def run_garimpeiro(
    transcript_chunk: str,
    time_offset: float = 0,
    delegation_hints: Optional[List[dict]] = None,
    model: str = "claude-sonnet-4-20250514",
) -> AgentResult:
    """
    Função helper para rodar o Garimpeiro.

    Args:
        transcript_chunk: Trecho da transcrição para analisar
        time_offset: Offset para adicionar aos timestamps
        delegation_hints: Dicas do Diretor sobre o que procurar
        model: Modelo Claude a usar

    Returns:
        AgentResult com clips virais
    """
    agent = GarimpeiroAgent(model=model)
    input_data = GarimpeiroInput(
        transcript_chunk=transcript_chunk,
        time_offset=time_offset,
        delegation_hints=delegation_hints,
    )
    return agent.run(input_data)
