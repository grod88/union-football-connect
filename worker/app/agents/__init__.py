"""
Union Clips AI - Crew de Agentes

Sistema multi-agente para análise e produção de clips inteligentes.
Baseado nos padrões Orchestrator-Workers e Evaluator-Optimizer do Anthropic Cookbook.

Agentes:
- DIRETOR: Analisa a live completa, gera mapa temático, identifica arcos narrativos
- GARIMPEIRO: Encontra momentos virais curtos (15-30s)
- CRONISTA: Monta arcos narrativos não-lineares com cold open
- ANALISTA: Extrai insights táticos e educacionais
- PRODUTOR: Sintetiza outputs dos workers em plano de produção final
- CRITICO: Avalia qualidade e devolve feedback para refinamento
"""

from .director import DirectorAgent, run_director
from .garimpeiro import GarimpeiroAgent, run_garimpeiro
from .cronista import CronistaAgent, run_cronista
from .analista import AnalistaAgent, run_analista
from .produtor import ProdutorAgent, run_produtor
from .critico import CriticoAgent, run_critico
from .base import AgentResult, AgentConfig

__all__ = [
    # Orchestrator
    "DirectorAgent",
    "run_director",
    # Workers
    "GarimpeiroAgent",
    "run_garimpeiro",
    "CronistaAgent",
    "run_cronista",
    "AnalistaAgent",
    "run_analista",
    # Synthesizer
    "ProdutorAgent",
    "run_produtor",
    # Evaluator
    "CriticoAgent",
    "run_critico",
    # Base
    "AgentResult",
    "AgentConfig",
]
