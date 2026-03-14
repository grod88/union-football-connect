"""
Agente DIRETOR - Orquestrador do Crew de Clips

Responsabilidades:
1. Analisar a live completa (transcrição + contexto do jogo)
2. Gerar mapa temático com temas conectados
3. Identificar picos emocionais e arcos narrativos
4. Delegar trabalho para os workers (Cronista, Analista, Garimpeiro)
"""
import json
from dataclasses import dataclass
from typing import Optional

from .base import (
    AgentConfig,
    AgentResult,
    call_claude,
    parse_json_response,
)


DIRECTOR_SYSTEM_PROMPT = """Você é o DIRETOR de uma equipe de produção de clips de futebol.
Sua especialidade é analisar transmissões de jogos completas e criar um MAPA TEMÁTICO que guiará os outros agentes.

## SUA MISSÃO
Receber a transcrição de uma live de futebol e produzir:
1. **Mapa Temático**: Identificar todos os TEMAS presentes na live
2. **Picos Emocionais**: Marcar momentos de alta intensidade
3. **Arcos Narrativos**: Conectar momentos distantes que formam uma história
4. **Delegação**: Decidir quais trechos cada agente worker deve processar

## TEMAS A IDENTIFICAR
- POLÊMICA: VAR, arbitragem, decisões controversas
- TÁTICO: Análises de formação, substituições, estratégia
- HUMOR: Zoeiras, tiradas engraçadas, momentos leves
- EMOÇÃO: Gols, quase-gols, comemorações, frustrações
- NARRATIVA: Histórias que conectam passado/presente
- PERSONAGEM: Foco em jogadores específicos (elogios, críticas, histórias)
- PROVOCAÇÃO: Rivalidade, zoeira com adversários
- PROFECIA: Previsões que se concretizam (ou não)

## ARCOS NARRATIVOS (IMPORTANTE!)
Procure por CONEXÕES entre momentos distantes:
- Previsão no minuto 10 → Acontecimento no minuto 80
- Crítica a jogador → Jogador faz gol
- Pessimismo → Virada épica
- Running jokes que aparecem várias vezes

## PICOS EMOCIONAIS
Identifique momentos de ALTA ENERGIA:
- Gols e quase-gols
- Decisões polêmicas do VAR
- Gritos de "VAI!" ou "NÃOOO!"
- Comemorações intensas
- Momentos de raiva ou frustração

## OUTPUT JSON OBRIGATÓRIO
Responda APENAS com JSON válido no formato:
{
  "live_summary": "Resumo da live em 2-3 frases",
  "duration_minutes": 120.5,
  "themes": [
    {
      "id": "tema_1",
      "label": "Nome do Tema",
      "description": "Descrição breve",
      "time_ranges": [[100, 200], [500, 600]],
      "sentiment": "positivo|negativo|neutro|misto",
      "intensity": 0.8,
      "connects_to": ["tema_2"]
    }
  ],
  "emotional_peaks": [
    {
      "timestamp": 3600,
      "type": "gol|quase_gol|polemico|comico|raiva",
      "intensity": 0.9,
      "reason": "Gol do Calleri aos 45 do segundo tempo",
      "theme_ids": ["tema_1"]
    }
  ],
  "suggested_arcs": [
    {
      "type": "profecia|redenção|tragédia|épico|humor",
      "title": "O machado e a árvore",
      "description": "Roger compara São Paulo a árvore e ele é o machado - previsão que se concretiza",
      "moments": [
        {"timestamp": 1000, "description": "Faz a comparação"},
        {"timestamp": 5000, "description": "São Paulo domina e vence"}
      ],
      "estimated_duration": 45,
      "themes": ["tema_1", "tema_3"],
      "cold_open_suggestion": "Começar com o momento final, depois voltar"
    }
  ],
  "delegation": {
    "cronista": [
      {
        "arc_type": "profecia",
        "description": "Montar o arco do machado e árvore",
        "time_ranges": [[1000, 1100], [5000, 5200]],
        "priority": "alta"
      }
    ],
    "analista": [
      {
        "focus": "tático",
        "description": "Análise da formação 4-3-3 do Zubeldía",
        "time_ranges": [[2000, 2300]],
        "priority": "média"
      }
    ],
    "garimpeiro": [
      {
        "type": "viral",
        "description": "Momento hilário da zoeira com narrador",
        "time_range": [3500, 3530],
        "priority": "alta"
      }
    ]
  }
}

## REGRAS CRÍTICAS
1. TIMESTAMPS em SEGUNDOS (não HH:MM:SS)
2. time_ranges são arrays de [início, fim] em segundos
3. Priorize QUALIDADE sobre quantidade
4. Conecte temas entre si quando fizer sentido
5. Identifique pelo menos 2-3 arcos narrativos potenciais
6. Delegue trabalho balanceado entre os 3 workers"""


@dataclass
class DirectorInput:
    """Input for the Director agent."""
    transcript: str
    match_context: Optional[str] = None
    video_duration_seconds: Optional[float] = None


class DirectorAgent:
    """
    Agente Diretor - Analisa a live e cria mapa temático.

    Primeiro agente a rodar no pipeline, produz o plano
    de trabalho para os outros agentes.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.config = AgentConfig(
            name="director",
            model=model,
            max_tokens=16384,  # Mapa completo pode ser grande
            temperature=0.6,  # Um pouco menos criativo, mais analítico
        )

    def run(self, input_data: DirectorInput) -> AgentResult:
        """
        Executa o Diretor na transcrição fornecida.

        Args:
            input_data: Transcrição e contexto opcional

        Returns:
            AgentResult com o mapa temático em data
        """
        # Montar o prompt do usuário
        user_prompt = self._build_user_prompt(input_data)

        try:
            # Chamar Claude
            response_text, tokens_in, tokens_out = call_claude(
                system_prompt=DIRECTOR_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                config=self.config,
            )

            # Parsear JSON
            data = parse_json_response(response_text)

            # Validar estrutura mínima
            self._validate_output(data)

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

    def _build_user_prompt(self, input_data: DirectorInput) -> str:
        """Monta o prompt do usuário com transcrição e contexto."""
        parts = []

        # Contexto do jogo (se houver)
        if input_data.match_context:
            parts.append(f"## CONTEXTO DO JOGO\n{input_data.match_context}\n")

        # Duração (se conhecida)
        if input_data.video_duration_seconds:
            minutes = input_data.video_duration_seconds / 60
            parts.append(f"## DURAÇÃO DO VÍDEO\n{minutes:.1f} minutos ({input_data.video_duration_seconds:.0f} segundos)\n")

        # Transcrição
        parts.append(f"## TRANSCRIÇÃO COMPLETA\n{input_data.transcript}")

        # Instrução final
        parts.append("""
## TAREFA
Analise a transcrição acima e gere o MAPA TEMÁTICO completo.
Identifique todos os temas, picos emocionais, arcos narrativos potenciais.
Delegue trabalho específico para cada agente worker.

Responda APENAS com o JSON no formato especificado.""")

        return "\n\n".join(parts)

    def _validate_output(self, data: dict) -> None:
        """Valida que o output tem a estrutura mínima esperada."""
        required_keys = ["themes", "emotional_peaks", "delegation"]
        for key in required_keys:
            if key not in data:
                raise ValueError(f"Output missing required key: {key}")

        if not isinstance(data.get("themes"), list):
            raise ValueError("themes must be a list")

        if not isinstance(data.get("delegation"), dict):
            raise ValueError("delegation must be a dict")


def run_director(
    transcript: str,
    match_context: Optional[str] = None,
    video_duration: Optional[float] = None,
    model: str = "claude-sonnet-4-20250514",
) -> AgentResult:
    """
    Função helper para rodar o Diretor.

    Args:
        transcript: Transcrição completa da live
        match_context: Contexto do jogo (times, placar, etc)
        video_duration: Duração do vídeo em segundos
        model: Modelo Claude a usar

    Returns:
        AgentResult com mapa temático
    """
    agent = DirectorAgent(model=model)
    input_data = DirectorInput(
        transcript=transcript,
        match_context=match_context,
        video_duration_seconds=video_duration,
    )
    return agent.run(input_data)
