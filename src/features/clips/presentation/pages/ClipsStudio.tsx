import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Film,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Clock,
  Zap,
  Layers,
  Target,
  Users,
  ArrowRight,
  Pickaxe,
  BookOpen,
  Search,
  Play,
  Clapperboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Video,
  Download,
  Eye,
  Brain,
  Trophy,
  TrendingUp,
  FileDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const API_BASE = 'http://localhost:8000';

// Types for crew session
interface Theme {
  id: string;
  label: string;
  description?: string;
  time_ranges: [number, number][];
  sentiment?: string;
  intensity?: number;
  connects_to?: string[];
}

interface EmotionalPeak {
  timestamp: number;
  type: string;
  intensity?: number;
  reason: string;
  theme_ids?: string[];
}

interface SuggestedArc {
  type: string;
  title: string;
  description: string;
  moments?: { timestamp: number; description: string }[];
  estimated_duration?: number;
  themes?: string[];
  cold_open_suggestion?: string;
}

interface Delegation {
  cronista?: { arc_type: string; description: string; time_ranges: [number, number][]; priority: string }[];
  analista?: { focus: string; description: string; time_ranges: [number, number][]; priority: string }[];
  garimpeiro?: { type: string; description: string; time_range: [number, number]; priority: string }[];
}

interface LiveMap {
  id: string;
  session_id: string;
  live_summary?: string;
  duration_minutes?: number;
  themes: Theme[];
  emotional_peaks: EmotionalPeak[];
  suggested_arcs: SuggestedArc[];
  delegation: Delegation;
  tokens_used?: number;
}

interface AgentOutput {
  id: string;
  session_id: string;
  agent_type: string;
  clips: any[];
  tokens_used?: number;
  created_at: string;
}

interface ClipEvaluation {
  clip_id: string;
  verdict: 'APPROVED' | 'NEEDS_WORK' | 'REJECTED';
  scores: {
    hook: number;
    storytelling: number;
    production: number;
    virality: number;
    brand: number;
  };
  final_score: number;
  strengths: string[];
  weaknesses: string[];
  feedback?: {
    issues?: string[];
    suggestions?: string[];
    send_back_to?: string;
  };
}

interface ProductionPlan {
  id: string;
  session_id: string;
  plan: {
    total_clips: number;
    estimated_total_duration?: number;
    breakdown?: {
      viral_short?: number;
      narrative_medium?: number;
      educational_long?: number;
    };
  };
  clips: any[];
  dropped_clips?: any[];
  summary?: string;
  tokens_used?: number;
}

interface ClipEvaluationRecord {
  id: string;
  plan_id: string;
  session_id: string;
  evaluations: ClipEvaluation[];
  summary?: {
    total_evaluated: number;
    approved: number;
    needs_work: number;
    rejected: number;
    average_score: number;
  };
  overall_feedback?: string;
  iteration: number;
  tokens_used?: number;
}

interface CrewSession {
  id: string;
  video_source_id: string;
  status: string;
  current_agent?: string;
  progress: number;
  total_cost_tokens?: number;
  error_message?: string;
  created_at: string;
  clip_live_maps?: LiveMap[];
  clip_agent_outputs?: AgentOutput[];
  clip_production_plans?: ProductionPlan[];
  clip_evaluations?: ClipEvaluationRecord[];
}

interface VideoSource {
  id: string;
  title: string;
  youtube_id?: string;
  youtube_url: string;
  status: string;
  duration_seconds?: number;
  created_at: string;
}

function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positivo: 'bg-green-500',
  negativo: 'bg-red-500',
  neutro: 'bg-gray-500',
  misto: 'bg-purple-500',
};

const PEAK_TYPE_COLORS: Record<string, string> = {
  gol: 'bg-green-500',
  quase_gol: 'bg-yellow-500',
  polemico: 'bg-red-500',
  comico: 'bg-blue-500',
  raiva: 'bg-orange-500',
};

const ARC_TYPE_COLORS: Record<string, string> = {
  profecia: 'bg-purple-500',
  redenção: 'bg-green-500',
  tragédia: 'bg-red-500',
  épico: 'bg-yellow-500',
  humor: 'bg-blue-500',
};

export default function ClipsStudio() {
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  const [crewSessions, setCrewSessions] = useState<CrewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CrewSession | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRunningWorkers, setIsRunningWorkers] = useState(false);
  const [isRunningProdutor, setIsRunningProdutor] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [workerOutputs, setWorkerOutputs] = useState<AgentOutput[]>([]);
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);
  const [evaluations, setEvaluations] = useState<ClipEvaluationRecord | null>(null);
  const [producedClips, setProducedClips] = useState<any[]>([]);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [producingClipId, setProducingClipId] = useState<string | null>(null);

  // Load video sources that are analyzed
  const loadVideoSources = useCallback(async () => {
    const { data, error } = await supabase
      .from('video_sources')
      .select('id, title, youtube_id, youtube_url, status, duration_seconds, created_at')
      .eq('status', 'analyzed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading video sources:', error);
      return;
    }

    setVideoSources(data || []);
    setIsLoadingSources(false);
  }, []);

  // Load crew sessions for selected source
  const loadCrewSessions = useCallback(async (sourceId: string) => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${API_BASE}/api/clips/${sourceId}/crew-sessions`);
      if (!response.ok) throw new Error('Failed to load sessions');

      const data = await response.json();
      setCrewSessions(data.sessions || []);

      // Auto-select the latest completed session
      const completed = data.sessions?.find((s: CrewSession) => s.status === 'completed');
      if (completed) {
        setSelectedSession(completed);
      } else {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error loading crew sessions:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Run crew analysis
  const runCrewAnalysis = async () => {
    if (!selectedSourceId) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/api/clips/${selectedSourceId}/analyze-crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start analysis');
      }

      const data = await response.json();
      toast.success(`Análise completa! ${data.message}`);

      // Reload sessions
      loadCrewSessions(selectedSourceId);
    } catch (error) {
      console.error('Error running crew analysis:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run worker agents
  const runWorkers = async () => {
    if (!selectedSession) return;

    setIsRunningWorkers(true);
    try {
      const response = await fetch(`${API_BASE}/api/crew-sessions/${selectedSession.id}/run-workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession.id,
          workers: ['garimpeiro', 'cronista', 'analista'],
          model: 'claude-sonnet-4-20250514',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to run workers');
      }

      const data = await response.json();
      toast.success(`Workers concluídos! Tokens: ${data.total_tokens}`);

      // Reload session to get worker outputs
      if (selectedSourceId) {
        loadCrewSessions(selectedSourceId);
      }
    } catch (error) {
      console.error('Error running workers:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao rodar workers');
    } finally {
      setIsRunningWorkers(false);
    }
  };

  // Run Produtor + Crítico
  const runProdutor = async () => {
    if (!selectedSession) return;

    setIsRunningProdutor(true);
    try {
      const response = await fetch(`${API_BASE}/api/crew-sessions/${selectedSession.id}/run-produtor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_clips: 10,
          model: 'claude-sonnet-4-20250514',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to run produtor');
      }

      const data = await response.json();
      toast.success(`Plano de produção criado! ${data.clips_count} clips, score médio: ${data.evaluation_summary?.average_score?.toFixed(1) || 'N/A'}`);

      // Reload session to get production plan
      if (selectedSourceId) {
        loadCrewSessions(selectedSourceId);
      }
    } catch (error) {
      console.error('Error running produtor:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao rodar produtor');
    } finally {
      setIsRunningProdutor(false);
    }
  };

  // Open production modal
  const openProductionModal = () => {
    setShowProductionModal(true);
  };

  // Toggle clip selection
  const toggleClipSelection = (clipId: string) => {
    const newSelected = new Set(selectedClipIds);
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId);
    } else {
      newSelected.add(clipId);
    }
    setSelectedClipIds(newSelected);
  };

  // Check if clip is already produced
  const isClipProduced = (clipId: string) => {
    return producedClips.some((pc) => pc.clip_id === clipId);
  };

  // Get produced clip data
  const getProducedClip = (clipId: string) => {
    return producedClips.find((pc) => pc.clip_id === clipId);
  };

  // Produce a single clip
  const produceSingleClip = async (clipId: string) => {
    if (!selectedSession || !productionPlan) return;

    setProducingClipId(clipId);
    try {
      const response = await fetch(`${API_BASE}/api/crew-sessions/${selectedSession.id}/produce-clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_ids: [clipId],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to produce clip');
      }

      const data = await response.json();
      if (data.clips && data.clips.length > 0) {
        setProducedClips((prev) => [...prev, ...data.clips]);
        toast.success(`Clip produzido com sucesso!`);
      } else {
        toast.error('Erro ao produzir clip');
      }
    } catch (error) {
      console.error('Error producing clip:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao produzir clip');
    } finally {
      setProducingClipId(null);
      setSelectedClipIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }
  };

  // Produce selected clips one by one
  const produceSelectedClips = async () => {
    const clipIds = Array.from(selectedClipIds);
    for (const clipId of clipIds) {
      await produceSingleClip(clipId);
    }
  };

  // Generate Markdown report
  const generateInsightsMarkdown = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR');

    let md = `# Relatório de Insights - Crew de Agentes\n\n`;
    md += `**Data:** ${date} às ${time}\n`;
    md += `**Vídeo:** ${selectedSource?.title || 'N/A'}\n`;
    md += `**Sessão:** ${selectedSession?.id || 'N/A'}\n\n`;
    md += `---\n\n`;

    // KPIs Section
    md += `## 📊 KPIs da Sessão\n\n`;
    md += `| Métrica | Valor |\n`;
    md += `|---------|-------|\n`;
    md += `| Tokens Totais | ${selectedSession?.total_cost_tokens?.toLocaleString() || 0} |\n`;
    md += `| Temas Identificados | ${liveMap?.themes?.length || 0} |\n`;
    md += `| Clips Workers | ${workerOutputs.reduce((acc, o) => acc + (o.clips?.length || 0), 0)} |\n`;
    md += `| Clips Finais | ${productionPlan?.clips?.length || 0} |\n`;

    if (evaluations?.summary) {
      md += `| Aprovados | ${evaluations.summary.approved} |\n`;
      md += `| Ajustes | ${evaluations.summary.needs_work} |\n`;
      md += `| Rejeitados | ${evaluations.summary.rejected} |\n`;
      md += `| Score Médio | ${evaluations.summary.average_score?.toFixed(1)} |\n`;
      const taxaAprovacao = evaluations.summary.total_evaluated > 0
        ? Math.round((evaluations.summary.approved / evaluations.summary.total_evaluated) * 100)
        : 0;
      md += `| Taxa de Aprovação | ${taxaAprovacao}% |\n`;
    }
    md += `\n`;

    // Director Section
    if (liveMap) {
      md += `## 🎬 Agente DIRETOR\n\n`;

      if (liveMap.live_summary) {
        md += `### Resumo da Live\n\n`;
        md += `${liveMap.live_summary}\n\n`;
        md += `- **Duração:** ${liveMap.duration_minutes?.toFixed(0)} minutos\n`;
        md += `- **Tokens:** ${liveMap.tokens_used?.toLocaleString()}\n\n`;
      }

      if (liveMap.themes?.length) {
        md += `### Temas Identificados (${liveMap.themes.length})\n\n`;
        liveMap.themes.forEach((theme, idx) => {
          md += `**${idx + 1}. ${theme.label}** [${theme.sentiment || 'neutro'}]\n`;
          if (theme.description) md += `   ${theme.description}\n`;
          if (theme.time_ranges?.length) {
            const ranges = theme.time_ranges.map(([s, e]) => `${formatTimestamp(s)}-${formatTimestamp(e)}`).join(', ');
            md += `   _Timestamps:_ ${ranges}\n`;
          }
          md += `\n`;
        });
      }

      if (liveMap.emotional_peaks?.length) {
        md += `### Picos Emocionais (${liveMap.emotional_peaks.length})\n\n`;
        liveMap.emotional_peaks.forEach((peak) => {
          md += `- **${formatTimestamp(peak.timestamp)}** [${peak.type}] — ${peak.reason}\n`;
        });
        md += `\n`;
      }

      if (liveMap.suggested_arcs?.length) {
        md += `### Arcos Narrativos Sugeridos (${liveMap.suggested_arcs.length})\n\n`;
        liveMap.suggested_arcs.forEach((arc, idx) => {
          md += `**${idx + 1}. ${arc.title}** [${arc.type}]\n`;
          md += `   ${arc.description}\n`;
          if (arc.cold_open_suggestion) md += `   _Cold Open:_ ${arc.cold_open_suggestion}\n`;
          if (arc.estimated_duration) md += `   _Duração estimada:_ ~${arc.estimated_duration}s\n`;
          md += `\n`;
        });
      }
    }

    // Workers Section
    if (workerOutputs.length > 0) {
      md += `## ⛏️ Agentes WORKERS\n\n`;

      workerOutputs.forEach((output) => {
        const icon = output.agent_type === 'garimpeiro' ? '⛏️' : output.agent_type === 'cronista' ? '📜' : '🔍';
        md += `### ${icon} ${output.agent_type.toUpperCase()} (${output.clips?.length || 0} clips)\n\n`;
        md += `_Tokens:_ ${output.tokens_used?.toLocaleString()}\n\n`;

        output.clips?.forEach((clip: any, idx: number) => {
          md += `**${idx + 1}. ${clip.title}**\n`;
          md += `   - _Tempo:_ ${formatTimestamp(clip.start_time)} - ${formatTimestamp(clip.end_time)} (${clip.duration || (clip.end_time - clip.start_time)}s)\n`;
          if (clip.hook) md += `   - _Hook:_ ${clip.hook}\n`;
          if (clip.key_phrase) md += `   - _Frase-chave:_ "${clip.key_phrase}"\n`;
          if (clip.key_insight) md += `   - _Insight:_ ${clip.key_insight}\n`;
          if (clip.story_summary) md += `   - _Resumo:_ ${clip.story_summary}\n`;
          if (clip.why_viral) md += `   - _Por que viraliza:_ ${clip.why_viral}\n`;
          md += `\n`;
        });
      });
    }

    // Produtor Section
    if (productionPlan) {
      md += `## 🎥 Agente PRODUTOR\n\n`;

      if (productionPlan.plan?.breakdown) {
        md += `### Breakdown do Plano\n\n`;
        md += `| Categoria | Quantidade |\n`;
        md += `|-----------|------------|\n`;
        md += `| Virais (curtos) | ${productionPlan.plan.breakdown.viral_short || 0} |\n`;
        md += `| Narrativos (médios) | ${productionPlan.plan.breakdown.narrative_medium || 0} |\n`;
        md += `| Educacionais (longos) | ${productionPlan.plan.breakdown.educational_long || 0} |\n`;
        md += `| **TOTAL** | **${productionPlan.clips?.length || 0}** |\n\n`;
      }

      if (productionPlan.summary) {
        md += `### Resumo\n\n${productionPlan.summary}\n\n`;
      }

      if (productionPlan.clips?.length) {
        md += `### Clips Finais (${productionPlan.clips.length})\n\n`;
        productionPlan.clips.forEach((clip: any) => {
          const ev = evaluations?.evaluations?.find((e) => e.clip_id === clip.id);
          const verdictIcon = ev?.verdict === 'APPROVED' ? '✅' : ev?.verdict === 'NEEDS_WORK' ? '⚠️' : ev?.verdict === 'REJECTED' ? '❌' : '⏳';

          md += `**#${clip.priority} ${clip.title}** ${verdictIcon}\n`;
          md += `   - _Categoria:_ ${clip.category}\n`;
          md += `   - _Tempo:_ ${formatTimestamp(clip.start_time)} - ${formatTimestamp(clip.end_time)}\n`;
          md += `   - _Fonte:_ ${clip.source_agent}\n`;
          if (clip.reasoning) md += `   - _Justificativa:_ ${clip.reasoning}\n`;
          if (ev) md += `   - _Score:_ **${ev.final_score.toFixed(1)}/10**\n`;
          md += `\n`;
        });
      }

      if (productionPlan.dropped_clips?.length) {
        md += `### Clips Descartados (${productionPlan.dropped_clips.length})\n\n`;
        productionPlan.dropped_clips.forEach((clip: any) => {
          md += `- ❌ ${clip.title || clip.id}`;
          if (clip.reason) md += ` — ${clip.reason}`;
          md += `\n`;
        });
        md += `\n`;
      }
    }

    // Critico Section
    if (evaluations) {
      md += `## ⭐ Agente CRÍTICO\n\n`;

      if (evaluations.overall_feedback) {
        md += `### Feedback Geral\n\n${evaluations.overall_feedback}\n\n`;
      }

      if (evaluations.evaluations?.length) {
        md += `### Avaliações Detalhadas\n\n`;

        // Sort by score descending
        const sortedEvals = [...evaluations.evaluations].sort((a, b) => b.final_score - a.final_score);

        sortedEvals.forEach((ev) => {
          const clip = productionPlan?.clips?.find((c: any) => c.id === ev.clip_id);
          const verdictIcon = ev.verdict === 'APPROVED' ? '✅' : ev.verdict === 'NEEDS_WORK' ? '⚠️' : '❌';

          md += `#### ${verdictIcon} ${clip?.title || ev.clip_id} — **${ev.final_score.toFixed(1)}/10**\n\n`;
          md += `| Dimensão | Score |\n`;
          md += `|----------|-------|\n`;
          md += `| Gancho | ${ev.scores.hook} |\n`;
          md += `| Storytelling | ${ev.scores.storytelling} |\n`;
          md += `| Produção | ${ev.scores.production} |\n`;
          md += `| Viralidade | ${ev.scores.virality} |\n`;
          md += `| Identidade | ${ev.scores.brand} |\n\n`;

          if (ev.strengths?.length) {
            md += `**Pontos Fortes:** ${ev.strengths.join(' | ')}\n\n`;
          }
          if (ev.weaknesses?.length) {
            md += `**Pontos Fracos:** ${ev.weaknesses.join(' | ')}\n\n`;
          }
          if (ev.feedback?.suggestions?.length) {
            md += `**Sugestões:** ${ev.feedback.suggestions.join(' | ')}\n\n`;
          }
          md += `---\n\n`;
        });
      }
    }

    md += `\n---\n\n_Relatório gerado automaticamente pelo Union Clips AI_\n`;

    return md;
  };

  // Download Markdown file
  const downloadInsightsMarkdown = () => {
    const md = generateInsightsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    const title = selectedSource?.title?.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30) || 'insights';
    a.download = `crew_insights_${title}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Relatório baixado!');
  };

  // Load worker outputs, production plan, and evaluations when session changes
  useEffect(() => {
    if (selectedSession?.clip_agent_outputs) {
      setWorkerOutputs(selectedSession.clip_agent_outputs);
    } else {
      setWorkerOutputs([]);
    }

    if (selectedSession?.clip_production_plans?.length) {
      setProductionPlan(selectedSession.clip_production_plans[0]);
    } else {
      setProductionPlan(null);
    }

    if (selectedSession?.clip_evaluations?.length) {
      setEvaluations(selectedSession.clip_evaluations[0]);
    } else {
      setEvaluations(null);
    }
  }, [selectedSession]);

  // Initial load
  useEffect(() => {
    loadVideoSources();
  }, [loadVideoSources]);

  // Load sessions when source selected
  useEffect(() => {
    if (selectedSourceId) {
      loadCrewSessions(selectedSourceId);
    } else {
      setCrewSessions([]);
      setSelectedSession(null);
    }
  }, [selectedSourceId, loadCrewSessions]);

  const selectedSource = videoSources.find((s) => s.id === selectedSourceId);
  const liveMap = selectedSession?.clip_live_maps?.[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2 font-['Oswald']">
            <Sparkles className="w-6 h-6 text-purple-500" />
            CLIPS STUDIO — CREW DE AGENTES
          </h1>
          <Button
            onClick={loadVideoSources}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Sources List */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white font-['Oswald']">
                VÍDEOS ANALISADOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSources ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : videoSources.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhum vídeo analisado ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {videoSources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSourceId(source.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSourceId === source.id
                          ? 'bg-gray-800 border-purple-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {source.title || 'Sem título'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {source.youtube_id || source.youtube_url}
                      </p>
                      {source.duration_seconds && (
                        <p className="text-xs text-gray-600 mt-1">
                          {Math.floor(source.duration_seconds / 60)} min
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedSourceId ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Film className="w-16 h-16 text-gray-700 mb-4" />
                  <p className="text-gray-500">Selecione um vídeo para iniciar</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Action Bar */}
                <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-purple-500">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {selectedSource?.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {crewSessions.length} análises realizadas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={runCrewAnalysis}
                          disabled={isAnalyzing}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          DIRETOR
                        </Button>
                        <Button
                          onClick={runWorkers}
                          disabled={isRunningWorkers || !selectedSession}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isRunningWorkers ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          WORKERS
                        </Button>
                        <Button
                          onClick={runProdutor}
                          disabled={isRunningProdutor || !selectedSession || workerOutputs.length === 0}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isRunningProdutor ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Clapperboard className="w-4 h-4 mr-2" />
                          )}
                          PRODUTOR
                        </Button>
                        <Button
                          onClick={openProductionModal}
                          disabled={!productionPlan}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          PRODUZIR
                        </Button>

                        {/* Agent Insights Modal */}
                        {selectedSession && (liveMap || workerOutputs.length > 0 || productionPlan) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                              >
                                <Brain className="w-4 h-4 mr-2" />
                                INSIGHTS
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] bg-gray-900 border-gray-700 text-white p-0">
                              <DialogHeader className="p-6 pb-0">
                                <div className="flex items-center justify-between">
                                  <DialogTitle className="text-white text-xl flex items-center gap-2 font-['Oswald']">
                                    <Brain className="w-5 h-5 text-cyan-400" />
                                    VISAO COMPLETA DOS AGENTES
                                  </DialogTitle>
                                  <Button
                                    onClick={downloadInsightsMarkdown}
                                    variant="outline"
                                    size="sm"
                                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                                  >
                                    <FileDown className="w-4 h-4 mr-1" />
                                    Baixar .md
                                  </Button>
                                </div>
                              </DialogHeader>
                              <Tabs defaultValue="summary" className="p-6 pt-4">
                                <TabsList className="bg-gray-800 border-gray-700 mb-4">
                                  <TabsTrigger value="summary" className="data-[state=active]:bg-cyan-600">
                                    <TrendingUp className="w-4 h-4 mr-1" /> KPIs
                                  </TabsTrigger>
                                  <TabsTrigger value="director" className="data-[state=active]:bg-purple-600">
                                    <Target className="w-4 h-4 mr-1" /> Diretor
                                  </TabsTrigger>
                                  <TabsTrigger value="workers" className="data-[state=active]:bg-green-600">
                                    <Pickaxe className="w-4 h-4 mr-1" /> Workers
                                  </TabsTrigger>
                                  <TabsTrigger value="produtor" className="data-[state=active]:bg-orange-600">
                                    <Clapperboard className="w-4 h-4 mr-1" /> Produtor
                                  </TabsTrigger>
                                  <TabsTrigger value="critico" className="data-[state=active]:bg-yellow-600">
                                    <Star className="w-4 h-4 mr-1" /> Critico
                                  </TabsTrigger>
                                </TabsList>

                                <ScrollArea className="h-[60vh]">
                                  {/* KPIs Tab */}
                                  <TabsContent value="summary" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {/* Session Stats */}
                                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-cyan-400">
                                          {selectedSession.total_cost_tokens?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">Tokens Totais</p>
                                      </div>
                                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-purple-400">
                                          {liveMap?.themes?.length || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">Temas Identificados</p>
                                      </div>
                                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-green-400">
                                          {workerOutputs.reduce((acc, o) => acc + (o.clips?.length || 0), 0)}
                                        </p>
                                        <p className="text-xs text-gray-500">Clips Workers</p>
                                      </div>
                                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-orange-400">
                                          {productionPlan?.clips?.length || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">Clips Finais</p>
                                      </div>
                                    </div>

                                    {/* Evaluation KPIs */}
                                    {evaluations?.summary && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                                          <Trophy className="w-4 h-4" /> AVALIACAO DO CRITICO
                                        </h3>
                                        <div className="grid grid-cols-4 gap-4 text-center">
                                          <div>
                                            <p className="text-2xl font-bold text-green-400">{evaluations.summary.approved}</p>
                                            <p className="text-xs text-gray-500">Aprovados</p>
                                          </div>
                                          <div>
                                            <p className="text-2xl font-bold text-yellow-400">{evaluations.summary.needs_work}</p>
                                            <p className="text-xs text-gray-500">Ajustes</p>
                                          </div>
                                          <div>
                                            <p className="text-2xl font-bold text-red-400">{evaluations.summary.rejected}</p>
                                            <p className="text-xs text-gray-500">Rejeitados</p>
                                          </div>
                                          <div>
                                            <p className="text-2xl font-bold text-cyan-400">{evaluations.summary.average_score?.toFixed(1)}</p>
                                            <p className="text-xs text-gray-500">Score Medio</p>
                                          </div>
                                        </div>
                                        <div className="mt-4">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-gray-500">Taxa de Aprovacao:</span>
                                            <span className="text-sm font-bold text-white">
                                              {evaluations.summary.total_evaluated > 0
                                                ? Math.round((evaluations.summary.approved / evaluations.summary.total_evaluated) * 100)
                                                : 0}%
                                            </span>
                                          </div>
                                          <Progress
                                            value={(evaluations.summary.approved / evaluations.summary.total_evaluated) * 100}
                                            className="h-2"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Score Distribution by Clip */}
                                    {evaluations?.evaluations && evaluations.evaluations.length > 0 && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h3 className="text-sm font-bold text-yellow-400 mb-3">SCORES POR CLIP</h3>
                                        <div className="space-y-2">
                                          {evaluations.evaluations
                                            .sort((a, b) => b.final_score - a.final_score)
                                            .map((ev, idx) => {
                                              const clip = productionPlan?.clips?.find((c: any) => c.id === ev.clip_id);
                                              return (
                                                <div key={idx} className="flex items-center gap-3">
                                                  <div className="w-8 text-center">
                                                    {ev.verdict === 'APPROVED' && <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />}
                                                    {ev.verdict === 'NEEDS_WORK' && <AlertCircle className="w-4 h-4 text-yellow-400 mx-auto" />}
                                                    {ev.verdict === 'REJECTED' && <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{clip?.title || ev.clip_id}</p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Progress value={ev.final_score * 10} className="w-20 h-2" />
                                                    <span className="text-sm font-bold text-white w-8">{ev.final_score.toFixed(1)}</span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      </div>
                                    )}
                                  </TabsContent>

                                  {/* Director Tab */}
                                  <TabsContent value="director" className="space-y-4 mt-0">
                                    {liveMap ? (
                                      <>
                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-purple-400 mb-2">RESUMO DA LIVE</h3>
                                          <p className="text-white">{liveMap.live_summary || 'Sem resumo disponivel'}</p>
                                          <p className="text-xs text-gray-500 mt-2">
                                            Duracao: {liveMap.duration_minutes?.toFixed(0)} min | Tokens: {liveMap.tokens_used?.toLocaleString()}
                                          </p>
                                        </div>

                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-purple-400 mb-2">
                                            TEMAS ({liveMap.themes?.length || 0})
                                          </h3>
                                          <div className="space-y-2">
                                            {liveMap.themes?.map((theme, idx) => (
                                              <div key={idx} className="flex items-start gap-2 p-2 bg-gray-900/50 rounded">
                                                <Badge className={`${SENTIMENT_COLORS[theme.sentiment || 'neutro']} text-white text-[10px] shrink-0`}>
                                                  {theme.sentiment}
                                                </Badge>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-white font-bold">{theme.label}</p>
                                                  {theme.description && <p className="text-xs text-gray-400">{theme.description}</p>}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-purple-400 mb-2">
                                            PICOS EMOCIONAIS ({liveMap.emotional_peaks?.length || 0})
                                          </h3>
                                          <div className="space-y-1">
                                            {liveMap.emotional_peaks?.map((peak, idx) => (
                                              <div key={idx} className="flex items-center gap-2 text-sm">
                                                <span className="font-mono text-gray-500 w-16">{formatTimestamp(peak.timestamp)}</span>
                                                <Badge className={`${PEAK_TYPE_COLORS[peak.type] || 'bg-gray-500'} text-white text-[10px]`}>
                                                  {peak.type}
                                                </Badge>
                                                <span className="text-white flex-1">{peak.reason}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-purple-400 mb-2">
                                            ARCOS SUGERIDOS ({liveMap.suggested_arcs?.length || 0})
                                          </h3>
                                          <div className="space-y-2">
                                            {liveMap.suggested_arcs?.map((arc, idx) => (
                                              <div key={idx} className="p-2 bg-gray-900/50 rounded">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <Badge className={`${ARC_TYPE_COLORS[arc.type] || 'bg-gray-500'} text-white text-[10px]`}>
                                                    {arc.type}
                                                  </Badge>
                                                  <span className="text-white font-bold">{arc.title}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{arc.description}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-gray-500 text-center py-8">Diretor ainda nao executado</p>
                                    )}
                                  </TabsContent>

                                  {/* Workers Tab */}
                                  <TabsContent value="workers" className="space-y-4 mt-0">
                                    {workerOutputs.length > 0 ? (
                                      workerOutputs.map((output) => (
                                        <div key={output.id} className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                                            output.agent_type === 'garimpeiro' ? 'text-green-400' :
                                            output.agent_type === 'cronista' ? 'text-purple-400' : 'text-blue-400'
                                          }`}>
                                            {output.agent_type === 'garimpeiro' && <Pickaxe className="w-4 h-4" />}
                                            {output.agent_type === 'cronista' && <BookOpen className="w-4 h-4" />}
                                            {output.agent_type === 'analista' && <Search className="w-4 h-4" />}
                                            {output.agent_type.toUpperCase()} ({output.clips?.length || 0} clips)
                                            <span className="text-xs text-gray-500 font-normal ml-auto">
                                              {output.tokens_used?.toLocaleString()} tokens
                                            </span>
                                          </h3>
                                          <div className="space-y-2">
                                            {output.clips?.map((clip: any, idx: number) => (
                                              <div key={idx} className="p-2 bg-gray-900/50 rounded text-sm">
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold">{clip.title}</p>
                                                    {clip.hook && <p className="text-gray-400 text-xs">{clip.hook}</p>}
                                                    {clip.key_phrase && <p className="text-green-400 text-xs italic">"{clip.key_phrase}"</p>}
                                                    {clip.key_insight && <p className="text-blue-400 text-xs">{clip.key_insight}</p>}
                                                    {clip.story_summary && <p className="text-purple-400 text-xs">{clip.story_summary}</p>}
                                                    {clip.why_viral && <p className="text-yellow-400 text-xs">Viral: {clip.why_viral}</p>}
                                                  </div>
                                                  <div className="text-right shrink-0 ml-2">
                                                    <p className="font-mono text-xs text-gray-500">
                                                      {formatTimestamp(clip.start_time)}-{formatTimestamp(clip.end_time)}
                                                    </p>
                                                    <p className="text-xs text-gray-600">{clip.duration || (clip.end_time - clip.start_time)}s</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-gray-500 text-center py-8">Workers ainda nao executados</p>
                                    )}
                                  </TabsContent>

                                  {/* Produtor Tab */}
                                  <TabsContent value="produtor" className="space-y-4 mt-0">
                                    {productionPlan ? (
                                      <>
                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-orange-400 mb-2">PLANO DE PRODUCAO</h3>
                                          <div className="grid grid-cols-3 gap-4 text-center mb-4">
                                            <div className="bg-green-900/30 rounded p-3">
                                              <p className="text-2xl font-bold text-green-400">{productionPlan.plan?.breakdown?.viral_short || 0}</p>
                                              <p className="text-xs text-gray-500">Virais</p>
                                            </div>
                                            <div className="bg-purple-900/30 rounded p-3">
                                              <p className="text-2xl font-bold text-purple-400">{productionPlan.plan?.breakdown?.narrative_medium || 0}</p>
                                              <p className="text-xs text-gray-500">Narrativos</p>
                                            </div>
                                            <div className="bg-blue-900/30 rounded p-3">
                                              <p className="text-2xl font-bold text-blue-400">{productionPlan.plan?.breakdown?.educational_long || 0}</p>
                                              <p className="text-xs text-gray-500">Educacionais</p>
                                            </div>
                                          </div>
                                          {productionPlan.summary && (
                                            <p className="text-sm text-gray-300 italic">{productionPlan.summary}</p>
                                          )}
                                        </div>

                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-orange-400 mb-2">
                                            CLIPS FINAIS ({productionPlan.clips?.length || 0})
                                          </h3>
                                          <div className="space-y-2">
                                            {productionPlan.clips?.map((clip: any, idx: number) => (
                                              <div key={idx} className="p-2 bg-gray-900/50 rounded text-sm">
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <Badge className="bg-gray-700 text-white text-[10px]">#{clip.priority}</Badge>
                                                      <Badge className={`text-[10px] text-white ${
                                                        clip.category === 'viral' ? 'bg-green-600' :
                                                        clip.category === 'narrativo' ? 'bg-purple-600' : 'bg-blue-600'
                                                      }`}>{clip.category}</Badge>
                                                      <span className="text-xs text-gray-500">via {clip.source_agent}</span>
                                                    </div>
                                                    <p className="text-white font-bold">{clip.title}</p>
                                                    {clip.reasoning && <p className="text-gray-400 text-xs">{clip.reasoning}</p>}
                                                  </div>
                                                  <div className="text-right shrink-0 ml-2">
                                                    <p className="font-mono text-xs text-gray-500">
                                                      {formatTimestamp(clip.start_time)}-{formatTimestamp(clip.end_time)}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {productionPlan.dropped_clips && productionPlan.dropped_clips.length > 0 && (
                                          <div className="bg-gray-800/50 rounded-lg p-4">
                                            <h3 className="text-sm font-bold text-red-400 mb-2">
                                              CLIPS DESCARTADOS ({productionPlan.dropped_clips.length})
                                            </h3>
                                            <div className="space-y-1">
                                              {productionPlan.dropped_clips.map((clip: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                                                  <XCircle className="w-3 h-3 text-red-400" />
                                                  <span>{clip.title || clip.id}</span>
                                                  {clip.reason && <span className="text-xs text-gray-600">- {clip.reason}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-gray-500 text-center py-8">Produtor ainda nao executado</p>
                                    )}
                                  </TabsContent>

                                  {/* Critico Tab */}
                                  <TabsContent value="critico" className="space-y-4 mt-0">
                                    {evaluations ? (
                                      <>
                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-yellow-400 mb-2">FEEDBACK GERAL</h3>
                                          <p className="text-white">{evaluations.overall_feedback || 'Sem feedback geral'}</p>
                                        </div>

                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                          <h3 className="text-sm font-bold text-yellow-400 mb-3">
                                            AVALIACOES DETALHADAS ({evaluations.evaluations?.length || 0})
                                          </h3>
                                          <div className="space-y-3">
                                            {evaluations.evaluations?.map((ev, idx) => {
                                              const clip = productionPlan?.clips?.find((c: any) => c.id === ev.clip_id);
                                              return (
                                                <div
                                                  key={idx}
                                                  className={`p-3 rounded border ${
                                                    ev.verdict === 'APPROVED' ? 'bg-green-900/20 border-green-500/30' :
                                                    ev.verdict === 'NEEDS_WORK' ? 'bg-yellow-900/20 border-yellow-500/30' :
                                                    'bg-red-900/20 border-red-500/30'
                                                  }`}
                                                >
                                                  <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                      <p className="text-white font-bold">{clip?.title || ev.clip_id}</p>
                                                      <Badge className={`text-[10px] ${
                                                        ev.verdict === 'APPROVED' ? 'bg-green-600' :
                                                        ev.verdict === 'NEEDS_WORK' ? 'bg-yellow-600' : 'bg-red-600'
                                                      } text-white`}>
                                                        {ev.verdict}
                                                      </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                      <p className="text-2xl font-bold text-yellow-400">{ev.final_score.toFixed(1)}</p>
                                                      <p className="text-xs text-gray-500">/10</p>
                                                    </div>
                                                  </div>

                                                  <div className="grid grid-cols-5 gap-2 text-xs text-center bg-gray-900/50 rounded p-2 mb-2">
                                                    <div>
                                                      <p className="text-gray-500">Gancho</p>
                                                      <p className="text-white font-bold">{ev.scores.hook}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-500">Story</p>
                                                      <p className="text-white font-bold">{ev.scores.storytelling}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-500">Prod</p>
                                                      <p className="text-white font-bold">{ev.scores.production}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-500">Viral</p>
                                                      <p className="text-white font-bold">{ev.scores.virality}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-gray-500">Brand</p>
                                                      <p className="text-white font-bold">{ev.scores.brand}</p>
                                                    </div>
                                                  </div>

                                                  {ev.strengths?.length > 0 && (
                                                    <p className="text-xs text-green-400">
                                                      <span className="font-bold">Pontos fortes:</span> {ev.strengths.join(' | ')}
                                                    </p>
                                                  )}
                                                  {ev.weaknesses?.length > 0 && (
                                                    <p className="text-xs text-yellow-400">
                                                      <span className="font-bold">Pontos fracos:</span> {ev.weaknesses.join(' | ')}
                                                    </p>
                                                  )}
                                                  {ev.feedback?.suggestions && ev.feedback.suggestions.length > 0 && (
                                                    <p className="text-xs text-blue-400 mt-1">
                                                      <span className="font-bold">Sugestoes:</span> {ev.feedback.suggestions.join(' | ')}
                                                    </p>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-gray-500 text-center py-8">Critico ainda nao executado</p>
                                    )}
                                  </TabsContent>
                                </ScrollArea>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Production Selection Modal */}
                        <Dialog open={showProductionModal} onOpenChange={setShowProductionModal}>
                          <DialogContent className="max-w-3xl max-h-[85vh] bg-gray-900 border-gray-700 text-white">
                            <DialogHeader>
                              <DialogTitle className="text-white text-xl flex items-center gap-2 font-['Oswald']">
                                <Video className="w-5 h-5 text-red-500" />
                                SELECIONAR CLIPS PARA PRODUCAO
                              </DialogTitle>
                            </DialogHeader>

                            <ScrollArea className="h-[60vh] pr-4">
                              <div className="space-y-3">
                                {productionPlan?.clips?.map((clip: any) => {
                                  const evaluation = evaluations?.evaluations?.find(
                                    (e) => e.clip_id === clip.id
                                  );
                                  const produced = isClipProduced(clip.id);
                                  const producedData = getProducedClip(clip.id);
                                  const isProducingThis = producingClipId === clip.id;

                                  return (
                                    <div
                                      key={clip.id}
                                      className={`p-4 rounded-lg border transition-all ${
                                        produced
                                          ? 'bg-green-900/20 border-green-500/50'
                                          : isProducingThis
                                          ? 'bg-yellow-900/20 border-yellow-500/50 animate-pulse'
                                          : selectedClipIds.has(clip.id)
                                          ? 'bg-red-900/20 border-red-500/50'
                                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                      }`}
                                    >
                                      <div className="flex items-start gap-4">
                                        {/* Checkbox or Status */}
                                        <div className="pt-1">
                                          {produced ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                          ) : isProducingThis ? (
                                            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                                          ) : (
                                            <Checkbox
                                              checked={selectedClipIds.has(clip.id)}
                                              onCheckedChange={() => toggleClipSelection(clip.id)}
                                              className="border-gray-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                          )}
                                        </div>

                                        {/* Clip Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <Badge className="bg-gray-700 text-white text-[10px]">
                                              #{clip.priority}
                                            </Badge>
                                            <span className="font-bold text-white">{clip.title}</span>
                                            {evaluation && (
                                              <Badge
                                                className={`text-[10px] ${
                                                  evaluation.verdict === 'APPROVED'
                                                    ? 'bg-green-600'
                                                    : evaluation.verdict === 'NEEDS_WORK'
                                                    ? 'bg-yellow-600'
                                                    : 'bg-red-600'
                                                } text-white`}
                                              >
                                                {evaluation.verdict}
                                              </Badge>
                                            )}
                                            {evaluation && (
                                              <span className="text-sm text-yellow-400 font-bold">
                                                {evaluation.final_score.toFixed(1)}/10
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="font-mono">
                                              {formatTimestamp(clip.start_time)} - {formatTimestamp(clip.end_time)}
                                            </span>
                                            <span>
                                              {clip.duration || (clip.end_time - clip.start_time)}s
                                            </span>
                                            <Badge
                                              className={`text-[10px] ${
                                                clip.category === 'viral'
                                                  ? 'bg-green-600/50'
                                                  : clip.category === 'narrativo'
                                                  ? 'bg-purple-600/50'
                                                  : 'bg-blue-600/50'
                                              } text-white`}
                                            >
                                              {clip.category}
                                            </Badge>
                                          </div>

                                          {/* Download buttons for produced clips */}
                                          {produced && producedData && (
                                            <div className="flex items-center gap-2 mt-3">
                                              <span className="text-xs text-green-400">Produzido:</span>
                                              {producedData.horizontal_path && (
                                                <a
                                                  href={`http://localhost:8000/api/stream?path=${encodeURIComponent(producedData.horizontal_path)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                                >
                                                  <Download className="w-3 h-3" />
                                                  Horizontal
                                                </a>
                                              )}
                                              {producedData.vertical_path && (
                                                <a
                                                  href={`http://localhost:8000/api/stream?path=${encodeURIComponent(producedData.vertical_path)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                                                >
                                                  <Download className="w-3 h-3" />
                                                  Vertical
                                                </a>
                                              )}
                                              <span className="text-xs text-gray-500 ml-2">
                                                {producedData.duration_seconds?.toFixed(1)}s |{' '}
                                                {(producedData.file_size_bytes / (1024 * 1024)).toFixed(1)}MB
                                              </span>
                                            </div>
                                          )}

                                          {/* Producing status */}
                                          {isProducingThis && (
                                            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                              Produzindo clip...
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>

                            <DialogFooter className="border-t border-gray-700 pt-4">
                              <div className="flex items-center justify-between w-full">
                                <div className="text-sm text-gray-400">
                                  {selectedClipIds.size > 0 ? (
                                    <span>{selectedClipIds.size} clip(s) selecionado(s)</span>
                                  ) : (
                                    <span>Selecione os clips para produzir</span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowProductionModal(false)}
                                    className="border-gray-600 text-gray-300"
                                  >
                                    Fechar
                                  </Button>
                                  <Button
                                    onClick={produceSelectedClips}
                                    disabled={selectedClipIds.size === 0 || producingClipId !== null}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {producingClipId ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Produzindo...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Produzir Selecionados
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sessions List */}
                {crewSessions.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {crewSessions.map((session) => (
                      <Button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        variant={selectedSession?.id === session.id ? 'default' : 'outline'}
                        size="sm"
                        className={
                          selectedSession?.id === session.id
                            ? 'bg-purple-600 text-white'
                            : 'border-gray-700 text-gray-400'
                        }
                      >
                        {session.status === 'completed' ? (
                          <Sparkles className="w-3 h-3 mr-1" />
                        ) : session.status === 'error' ? (
                          <Zap className="w-3 h-3 mr-1 text-red-500" />
                        ) : (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {new Date(session.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Live Map Display */}
                {isLoadingSessions ? (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </CardContent>
                  </Card>
                ) : !selectedSession ? (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="w-12 h-12 text-gray-700 mb-3" />
                      <p className="text-gray-500">
                        Clique em "RODAR DIRETOR" para analisar com IA
                      </p>
                    </CardContent>
                  </Card>
                ) : !liveMap ? (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="py-8">
                      <p className="text-center text-gray-500">
                        Nenhum mapa gerado nesta sessão
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Summary */}
                    {liveMap.live_summary && (
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Resumo da Live
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-white">{liveMap.live_summary}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Tokens: {liveMap.tokens_used?.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Themes */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Temas Identificados ({liveMap.themes?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {liveMap.themes?.map((theme) => (
                            <div
                              key={theme.id}
                              className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  className={`${
                                    SENTIMENT_COLORS[theme.sentiment || 'neutro']
                                  } text-white text-[10px]`}
                                >
                                  {theme.sentiment || 'neutro'}
                                </Badge>
                                <span className="font-bold text-white">{theme.label}</span>
                              </div>
                              {theme.description && (
                                <p className="text-sm text-gray-400 mb-2">{theme.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {theme.time_ranges?.map(([start, end], idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-[10px] border-gray-600 text-gray-400"
                                  >
                                    {formatTimestamp(start)} - {formatTimestamp(end)}
                                  </Badge>
                                ))}
                              </div>
                              {theme.intensity && (
                                <Progress
                                  value={theme.intensity * 100}
                                  className="mt-2 h-1"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Emotional Peaks */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Picos Emocionais ({liveMap.emotional_peaks?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {liveMap.emotional_peaks?.map((peak, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2 bg-gray-800/30 rounded"
                            >
                              <Badge
                                className={`${
                                  PEAK_TYPE_COLORS[peak.type] || 'bg-gray-500'
                                } text-white shrink-0`}
                              >
                                {peak.type}
                              </Badge>
                              <span className="font-mono text-sm text-gray-400 shrink-0">
                                {formatTimestamp(peak.timestamp)}
                              </span>
                              <span className="text-sm text-white flex-1">{peak.reason}</span>
                              {peak.intensity && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(peak.intensity * 100)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggested Arcs */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                          <ChevronRight className="w-4 h-4" />
                          Arcos Narrativos Sugeridos ({liveMap.suggested_arcs?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {liveMap.suggested_arcs?.map((arc, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  className={`${
                                    ARC_TYPE_COLORS[arc.type] || 'bg-gray-500'
                                  } text-white`}
                                >
                                  {arc.type}
                                </Badge>
                                <span className="font-bold text-white text-lg">{arc.title}</span>
                              </div>
                              <p className="text-sm text-gray-400 mb-3">{arc.description}</p>

                              {/* Moments timeline */}
                              {arc.moments && arc.moments.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                  {arc.moments.map((moment, mIdx) => (
                                    <div key={mIdx} className="flex items-center shrink-0">
                                      <div className="bg-gray-700 px-3 py-1.5 rounded">
                                        <p className="text-xs text-gray-400">
                                          {formatTimestamp(moment.timestamp)}
                                        </p>
                                        <p className="text-sm text-white">{moment.description}</p>
                                      </div>
                                      {mIdx < arc.moments!.length - 1 && (
                                        <ArrowRight className="w-4 h-4 text-gray-600 mx-2" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {arc.cold_open_suggestion && (
                                <p className="text-xs text-purple-400 mt-2 italic">
                                  Cold Open: {arc.cold_open_suggestion}
                                </p>
                              )}

                              {arc.estimated_duration && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Duração estimada: ~{arc.estimated_duration}s
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Delegation */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Delegação para Workers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Cronista */}
                          <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                            <h4 className="text-sm font-bold text-purple-400 mb-2">
                              CRONISTA ({liveMap.delegation?.cronista?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {liveMap.delegation?.cronista?.map((task, idx) => (
                                <div key={idx} className="text-xs text-gray-400">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-purple-500/50 text-purple-400 mb-1"
                                  >
                                    {task.priority}
                                  </Badge>
                                  <p className="text-white">{task.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Analista */}
                          <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                            <h4 className="text-sm font-bold text-blue-400 mb-2">
                              ANALISTA ({liveMap.delegation?.analista?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {liveMap.delegation?.analista?.map((task, idx) => (
                                <div key={idx} className="text-xs text-gray-400">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-blue-500/50 text-blue-400 mb-1"
                                  >
                                    {task.priority}
                                  </Badge>
                                  <p className="text-white">{task.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Garimpeiro */}
                          <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                            <h4 className="text-sm font-bold text-green-400 mb-2">
                              GARIMPEIRO ({liveMap.delegation?.garimpeiro?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {liveMap.delegation?.garimpeiro?.map((task, idx) => (
                                <div key={idx} className="text-xs text-gray-400">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-green-500/50 text-green-400 mb-1"
                                  >
                                    {task.priority}
                                  </Badge>
                                  <p className="text-white">{task.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Worker Outputs */}
                    {workerOutputs.length > 0 && (
                      <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                            <Pickaxe className="w-4 h-4" />
                            Clips Encontrados pelos Workers ({workerOutputs.reduce((acc, o) => acc + (o.clips?.length || 0), 0)})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {workerOutputs.map((output) => (
                              <div key={output.id}>
                                <div className="flex items-center gap-2 mb-3">
                                  {output.agent_type === 'garimpeiro' && <Pickaxe className="w-4 h-4 text-green-400" />}
                                  {output.agent_type === 'cronista' && <BookOpen className="w-4 h-4 text-purple-400" />}
                                  {output.agent_type === 'analista' && <Search className="w-4 h-4 text-blue-400" />}
                                  <h4 className="font-bold text-white uppercase">{output.agent_type}</h4>
                                  <Badge variant="outline" className="text-[10px] border-gray-600">
                                    {output.clips?.length || 0} clips
                                  </Badge>
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {output.tokens_used?.toLocaleString()} tokens
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {output.clips?.map((clip: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <p className="font-bold text-white">{clip.title}</p>
                                          {clip.hook && (
                                            <p className="text-sm text-gray-400">{clip.hook}</p>
                                          )}
                                          {clip.key_phrase && (
                                            <p className="text-sm text-green-400 italic mt-1">"{clip.key_phrase}"</p>
                                          )}
                                          {clip.key_insight && (
                                            <p className="text-sm text-blue-400 mt-1">{clip.key_insight}</p>
                                          )}
                                          {clip.story_summary && (
                                            <p className="text-sm text-purple-400 mt-1">{clip.story_summary}</p>
                                          )}
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="font-mono text-sm text-gray-400">
                                            {formatTimestamp(clip.start_time)} - {formatTimestamp(clip.end_time)}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {clip.duration || (clip.end_time - clip.start_time)}s
                                          </p>
                                        </div>
                                      </div>
                                      {clip.why_viral && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          Por que viraliza: {clip.why_viral}
                                        </p>
                                      )}
                                      {clip.arc_type && (
                                        <Badge className="mt-2 bg-purple-600 text-white text-[10px]">
                                          {clip.arc_type}
                                        </Badge>
                                      )}
                                      {clip.viral_type && (
                                        <Badge className="mt-2 bg-green-600 text-white text-[10px]">
                                          {clip.viral_type}
                                        </Badge>
                                      )}
                                      {clip.analysis_type && (
                                        <Badge className="mt-2 bg-blue-600 text-white text-[10px]">
                                          {clip.analysis_type}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Production Plan */}
                    {productionPlan && (
                      <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                            <Clapperboard className="w-4 h-4" />
                            Plano de Produção Final ({productionPlan.plan?.total_clips || productionPlan.clips?.length || 0} clips)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Plan Summary */}
                          {productionPlan.summary && (
                            <p className="text-sm text-gray-400 mb-4 italic">{productionPlan.summary}</p>
                          )}

                          {/* Breakdown */}
                          {productionPlan.plan?.breakdown && (
                            <div className="flex gap-4 mb-4">
                              <div className="text-center px-4 py-2 bg-green-900/30 rounded-lg">
                                <p className="text-2xl font-bold text-green-400">{productionPlan.plan.breakdown.viral_short || 0}</p>
                                <p className="text-xs text-gray-500">Virais</p>
                              </div>
                              <div className="text-center px-4 py-2 bg-purple-900/30 rounded-lg">
                                <p className="text-2xl font-bold text-purple-400">{productionPlan.plan.breakdown.narrative_medium || 0}</p>
                                <p className="text-xs text-gray-500">Narrativos</p>
                              </div>
                              <div className="text-center px-4 py-2 bg-blue-900/30 rounded-lg">
                                <p className="text-2xl font-bold text-blue-400">{productionPlan.plan.breakdown.educational_long || 0}</p>
                                <p className="text-xs text-gray-500">Educacionais</p>
                              </div>
                            </div>
                          )}

                          {/* Clips List */}
                          <div className="space-y-3">
                            {productionPlan.clips?.map((clip: any, idx: number) => {
                              // Find evaluation for this clip
                              const evaluation = evaluations?.evaluations?.find(
                                (e) => e.clip_id === clip.id
                              );

                              return (
                                <div
                                  key={idx}
                                  className={`p-4 bg-gray-800/50 rounded-lg border ${
                                    evaluation?.verdict === 'APPROVED'
                                      ? 'border-green-500/50'
                                      : evaluation?.verdict === 'NEEDS_WORK'
                                      ? 'border-yellow-500/50'
                                      : evaluation?.verdict === 'REJECTED'
                                      ? 'border-red-500/50'
                                      : 'border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-gray-700 text-white text-[10px]">
                                          #{clip.priority}
                                        </Badge>
                                        <Badge
                                          className={`text-[10px] ${
                                            clip.category === 'viral'
                                              ? 'bg-green-600'
                                              : clip.category === 'narrativo'
                                              ? 'bg-purple-600'
                                              : 'bg-blue-600'
                                          } text-white`}
                                        >
                                          {clip.category}
                                        </Badge>
                                        {evaluation && (
                                          <Badge
                                            className={`text-[10px] ${
                                              evaluation.verdict === 'APPROVED'
                                                ? 'bg-green-600'
                                                : evaluation.verdict === 'NEEDS_WORK'
                                                ? 'bg-yellow-600'
                                                : 'bg-red-600'
                                            } text-white`}
                                          >
                                            {evaluation.verdict === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {evaluation.verdict === 'NEEDS_WORK' && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {evaluation.verdict === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                                            {evaluation.verdict}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="font-bold text-white text-lg">{clip.title}</p>
                                      {clip.reasoning && (
                                        <p className="text-sm text-gray-400 mt-1">{clip.reasoning}</p>
                                      )}

                                      {/* Production Spec */}
                                      {clip.production_spec && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
                                            {clip.production_spec.template}
                                          </Badge>
                                          <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
                                            {clip.production_spec.format}
                                          </Badge>
                                          {clip.production_spec.audio?.background_music !== 'none' && (
                                            <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
                                              🎵 {clip.production_spec.audio.background_music}
                                            </Badge>
                                          )}
                                        </div>
                                      )}

                                      {/* Evaluation Scores */}
                                      {evaluation && (
                                        <div className="mt-3 p-2 bg-gray-900/50 rounded">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Star className="w-4 h-4 text-yellow-400" />
                                            <span className="text-lg font-bold text-yellow-400">
                                              {evaluation.final_score.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-500">/ 10</span>
                                          </div>
                                          <div className="grid grid-cols-5 gap-2 text-xs">
                                            <div className="text-center">
                                              <p className="text-gray-500">Gancho</p>
                                              <p className="text-white">{evaluation.scores.hook}</p>
                                            </div>
                                            <div className="text-center">
                                              <p className="text-gray-500">Story</p>
                                              <p className="text-white">{evaluation.scores.storytelling}</p>
                                            </div>
                                            <div className="text-center">
                                              <p className="text-gray-500">Prod</p>
                                              <p className="text-white">{evaluation.scores.production}</p>
                                            </div>
                                            <div className="text-center">
                                              <p className="text-gray-500">Viral</p>
                                              <p className="text-white">{evaluation.scores.virality}</p>
                                            </div>
                                            <div className="text-center">
                                              <p className="text-gray-500">Brand</p>
                                              <p className="text-white">{evaluation.scores.brand}</p>
                                            </div>
                                          </div>
                                          {evaluation.strengths?.length > 0 && (
                                            <p className="text-xs text-green-400 mt-2">
                                              ✓ {evaluation.strengths.join(' • ')}
                                            </p>
                                          )}
                                          {evaluation.weaknesses?.length > 0 && (
                                            <p className="text-xs text-yellow-400 mt-1">
                                              ! {evaluation.weaknesses.join(' • ')}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-mono text-sm text-gray-400">
                                        {formatTimestamp(clip.start_time)} - {formatTimestamp(clip.end_time)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {clip.duration || (clip.end_time - clip.start_time)}s
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        via {clip.source_agent}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Social */}
                                  {clip.social && (
                                    <div className="mt-3 pt-2 border-t border-gray-700">
                                      <p className="text-xs text-gray-500">
                                        📱 {clip.social.best_platform} • {clip.social.caption}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Overall Evaluation */}
                          {evaluations?.overall_feedback && (
                            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                              <p className="text-sm text-gray-300">{evaluations.overall_feedback}</p>
                              {evaluations.summary && (
                                <div className="flex gap-4 mt-2 text-xs">
                                  <span className="text-green-400">✓ {evaluations.summary.approved} aprovados</span>
                                  <span className="text-yellow-400">⚠ {evaluations.summary.needs_work} ajustes</span>
                                  <span className="text-red-400">✗ {evaluations.summary.rejected} rejeitados</span>
                                  <span className="text-gray-400">Média: {evaluations.summary.average_score?.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tokens */}
                          <p className="text-xs text-gray-500 mt-2">
                            Tokens: {productionPlan.tokens_used?.toLocaleString()}
                            {evaluations?.tokens_used && ` + ${evaluations.tokens_used.toLocaleString()} (crítico)`}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Produced Clips */}
                    {producedClips.length > 0 && (
                      <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400 uppercase flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Clips Produzidos ({producedClips.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {producedClips.map((clip, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                              >
                                <p className="font-bold text-white mb-2">{clip.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                  <span>{clip.duration_seconds?.toFixed(1)}s</span>
                                  <span>•</span>
                                  <span>{(clip.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                                </div>
                                <div className="flex gap-2">
                                  {clip.horizontal_path && (
                                    <a
                                      href={`http://localhost:8000/api/stream?path=${encodeURIComponent(clip.horizontal_path)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                                    >
                                      <Download className="w-3 h-3" />
                                      Horizontal
                                    </a>
                                  )}
                                  {clip.vertical_path && (
                                    <a
                                      href={`http://localhost:8000/api/stream?path=${encodeURIComponent(clip.vertical_path)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs text-white"
                                    >
                                      <Download className="w-3 h-3" />
                                      Vertical
                                    </a>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 truncate">
                                  {clip.horizontal_path}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
