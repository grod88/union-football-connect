import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Info,
  Bug,
  Eye,
  Clock,
  Sparkles,
  Zap,
  Play,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

interface CrewSession {
  id: string;
  video_source_id: string;
  status: string;
  current_agent: string | null;
  progress: number;
  total_cost_tokens: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  video_sources?: {
    id: string;
    title: string;
    youtube_url: string;
  };
  clip_live_maps?: any[];
  clip_agent_outputs?: any[];
  clip_production_plans?: any[];
  clip_evaluations?: any[];
}

interface WorkerLog {
  id: string;
  source_id: string;
  level: string;
  step: string;
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface CrewLogDetails extends Record<string, unknown> {
  session_id?: string;
  agent?: string;
  prompt_version?: string;
  model_override?: string | null;
  tokens_used?: number;
  clips_found?: number;
  [key: string]: unknown;
}

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-gray-500',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-500',
  analyzing: 'bg-purple-500',
  running_workers: 'bg-green-500',
  running_produtor: 'bg-orange-500',
  completed: 'bg-green-600',
  error: 'bg-red-500',
  clips_produced: 'bg-cyan-500',
};

const AGENT_EMOJIS: Record<string, string> = {
  director: '🎬',
  garimpeiro: '⛏️',
  cronista: '📜',
  analista: '🔍',
  produtor: '🎥',
  critico: '⭐',
  ffmpeg: '🎞️',
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLogDetails(details: CrewLogDetails | null | undefined): string[] {
  if (!details) return [];

  return Object.entries(details)
    .filter(([key, value]) => key !== 'session_id' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const formattedValue = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

      return `${key}: ${formattedValue}`;
    });
}

function getLogAgent(log: WorkerLog): string {
  const details = log.details as CrewLogDetails | null;
  const detailsAgent = details?.agent;
  if (typeof detailsAgent === 'string' && detailsAgent.length > 0) {
    return detailsAgent;
  }

  if (log.step.startsWith('crew:')) {
    return log.step.replace('crew:', '');
  }

  return log.step;
}

function generateSessionLog(session: CrewSession, logs: WorkerLog[]): string {
  const lines: string[] = [];
  const divider = '═'.repeat(60);

  lines.push(divider);
  lines.push(`CREW SESSION LOG`);
  lines.push(`Session ID: ${session.id}`);
  lines.push(`Status: ${session.status.toUpperCase()}`);
  lines.push(`Created: ${formatDateTime(session.created_at)}`);
  lines.push(divider);
  lines.push('');

  // Video info
  if (session.video_sources) {
    lines.push(`📹 VIDEO SOURCE`);
    lines.push(`   Title: ${session.video_sources.title || 'N/A'}`);
    lines.push(`   URL: ${session.video_sources.youtube_url}`);
    lines.push('');
  }

  // Director (Live Map)
  if (session.clip_live_maps && session.clip_live_maps.length > 0) {
    const liveMap = session.clip_live_maps[0];
    lines.push(`🎬 DIRETOR (Live Map)`);
    lines.push(`   Tokens: ${liveMap.tokens_used?.toLocaleString() || 'N/A'}`);
    lines.push(`   Duration: ${liveMap.duration_minutes?.toFixed(0) || 'N/A'} min`);
    lines.push(`   Themes: ${liveMap.themes?.length || 0}`);
    lines.push(`   Emotional Peaks: ${liveMap.emotional_peaks?.length || 0}`);
    lines.push(`   Suggested Arcs: ${liveMap.suggested_arcs?.length || 0}`);
    if (liveMap.live_summary) {
      lines.push('');
      lines.push(`   Summary:`);
      lines.push(`   ${liveMap.live_summary.substring(0, 200)}...`);
    }
    lines.push('');
  }

  // Workers
  if (session.clip_agent_outputs && session.clip_agent_outputs.length > 0) {
    lines.push(`⛏️ WORKERS`);
    session.clip_agent_outputs.forEach((output: any) => {
      const emoji = AGENT_EMOJIS[output.agent_type] || '🤖';
      lines.push(`   ${emoji} ${output.agent_type.toUpperCase()}`);
      lines.push(`      Clips: ${output.clips?.length || 0}`);
      lines.push(`      Tokens: ${output.tokens_used?.toLocaleString() || 'N/A'}`);
      if (output.clips?.length > 0) {
        output.clips.slice(0, 3).forEach((clip: any, idx: number) => {
          lines.push(`      ${idx + 1}. ${clip.title} (${clip.start_time}s - ${clip.end_time}s)`);
        });
        if (output.clips.length > 3) {
          lines.push(`      ... and ${output.clips.length - 3} more`);
        }
      }
      lines.push('');
    });
  }

  // Produtor
  if (session.clip_production_plans && session.clip_production_plans.length > 0) {
    const plan = session.clip_production_plans[0];
    lines.push(`🎥 PRODUTOR (Production Plan)`);
    lines.push(`   Total Clips: ${plan.clips?.length || 0}`);
    lines.push(`   Tokens: ${plan.tokens_used?.toLocaleString() || 'N/A'}`);
    if (plan.plan?.breakdown) {
      lines.push(`   Breakdown:`);
      lines.push(`      Virais: ${plan.plan.breakdown.viral_short || 0}`);
      lines.push(`      Narrativos: ${plan.plan.breakdown.narrative_medium || 0}`);
      lines.push(`      Educacionais: ${plan.plan.breakdown.educational_long || 0}`);
    }
    if (plan.dropped_clips?.length > 0) {
      lines.push(`   Dropped: ${plan.dropped_clips.length} clips`);
    }
    if (plan.summary) {
      lines.push('');
      lines.push(`   Summary: ${plan.summary.substring(0, 150)}...`);
    }
    lines.push('');
  }

  // Critico
  if (session.clip_evaluations && session.clip_evaluations.length > 0) {
    const evaluation = session.clip_evaluations[0];
    lines.push(`⭐ CRITICO (Evaluations)`);
    lines.push(`   Tokens: ${evaluation.tokens_used?.toLocaleString() || 'N/A'}`);
    if (evaluation.summary) {
      lines.push(`   Total Evaluated: ${evaluation.summary.total_evaluated || 0}`);
      lines.push(`   Approved: ${evaluation.summary.approved || 0}`);
      lines.push(`   Needs Work: ${evaluation.summary.needs_work || 0}`);
      lines.push(`   Rejected: ${evaluation.summary.rejected || 0}`);
      lines.push(`   Average Score: ${evaluation.summary.average_score?.toFixed(1) || 'N/A'}`);
    }
    if (evaluation.evaluations?.length > 0) {
      lines.push('');
      lines.push(`   Evaluations:`);
      evaluation.evaluations.forEach((ev: any) => {
        const icon = ev.verdict === 'APPROVED' ? '✅' : ev.verdict === 'NEEDS_WORK' ? '⚠️' : '❌';
        lines.push(`      ${icon} ${ev.clip_id?.substring(0, 8)}... — ${ev.final_score?.toFixed(1)}/10 (${ev.verdict})`);
      });
    }
    if (evaluation.overall_feedback) {
      lines.push('');
      lines.push(`   Feedback: ${evaluation.overall_feedback.substring(0, 150)}...`);
    }
    lines.push('');
  }

  // Error
  if (session.error_message) {
    lines.push(`❌ ERROR`);
    lines.push(`   ${session.error_message}`);
    lines.push('');
  }

  // Total tokens
  if (session.total_cost_tokens) {
    lines.push(divider);
    lines.push(`💰 TOTAL TOKENS: ${session.total_cost_tokens.toLocaleString()}`);
    lines.push(divider);
  }

  if (logs.length > 0) {
    lines.push('');
    lines.push(divider);
    lines.push('TERMINAL DA SESSÃO');
    lines.push(divider);
    logs.forEach((log) => {
      const agent = getLogAgent(log);
      const emoji = AGENT_EMOJIS[agent] || '🤖';
      const details = formatLogDetails(log.details as CrewLogDetails | null);
      lines.push(`${formatTime(log.created_at)} ${emoji} [${log.level.toUpperCase()}] ${agent} :: ${log.message}`);
      details.forEach((detail) => lines.push(`   ${detail}`));
    });
  }

  return lines.join('\n');
}

export default function ClipsLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<CrewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CrewSession | null>(null);
  const [logs, setLogs] = useState<WorkerLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sessionIdInput, setSessionIdInput] = useState('');

  // Get session ID from URL
  const urlSessionId = searchParams.get('session');

  // Load sessions
  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('clip_sessions')
      .select(`
        *,
        video_sources (id, title, youtube_url),
        clip_live_maps (*),
        clip_agent_outputs (*),
        clip_production_plans (*),
        clip_evaluations (*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    setSessions(data || []);
    setIsLoading(false);

    // Auto-select session from URL or first one
    if (urlSessionId && data) {
      const session = data.find((s) => s.id === urlSessionId);
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [urlSessionId]);

  // Load worker logs for selected session's video source
  const loadLogs = useCallback(async () => {
    if (!selectedSession?.video_source_id) {
      setLogs([]);
      return;
    }

    const { data } = await supabase
      .from('worker_logs')
      .select('*')
      .eq('source_id', selectedSession.video_source_id)
      .order('created_at', { ascending: true })
      .limit(500);

    if (data) {
      setLogs(data);
    }
  }, [selectedSession?.video_source_id]);

  const sessionLogs = useMemo(() => {
    if (!selectedSession) return [];

    return logs.filter((log) => {
      const details = log.details as CrewLogDetails | null;
      if (details?.session_id) {
        return details.session_id === selectedSession.id;
      }

      return false;
    });
  }, [logs, selectedSession]);

  const sourceOnlyLogs = useMemo(() => {
    return logs.filter((log) => {
      const details = log.details as CrewLogDetails | null;
      return !details?.session_id;
    });
  }, [logs]);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load logs when session changes
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSessions();
      loadLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadSessions, loadLogs]);

  // Handle session selection
  const selectSession = (session: CrewSession) => {
    setSelectedSession(session);
    setSearchParams({ session: session.id });
  };

  // Search session by ID
  const searchSession = async () => {
    if (!sessionIdInput.trim()) return;

    const { data } = await supabase
      .from('clip_sessions')
      .select(`
        *,
        video_sources (id, title, youtube_url),
        clip_live_maps (*),
        clip_agent_outputs (*),
        clip_production_plans (*),
        clip_evaluations (*)
      `)
      .eq('id', sessionIdInput.trim())
      .single();

    if (data) {
      setSelectedSession(data);
      setSearchParams({ session: data.id });
      // Add to sessions list if not there
      setSessions((prev) => {
        const exists = prev.find((s) => s.id === data.id);
        if (!exists) {
          return [data, ...prev];
        }
        return prev;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 font-['Oswald']">
            <Terminal className="w-6 h-6 text-green-500" />
            CREW SESSION LOGS
          </h1>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.CLIPS_STUDIO}>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                ← Studio
              </Button>
            </Link>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'border-gray-600 text-gray-300'}
            >
              {autoRefresh ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button
              onClick={() => { loadSessions(); loadLogs(); }}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search by Session ID */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Colar Session ID aqui..."
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && searchSession()}
              />
              <Button onClick={searchSession} className="bg-purple-600 hover:bg-purple-700">
                <Search className="w-4 h-4 mr-1" /> Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">SESSOES RECENTES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Nenhuma sessao encontrada</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedSession?.id === session.id
                        ? 'bg-purple-900/30 border-purple-500'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={`${STATUS_COLORS[session.status] || 'bg-gray-500'} text-white text-[10px]`}>
                        {session.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDateTime(session.created_at)}</span>
                    </div>
                    <p className="text-sm text-white truncate">
                      {session.video_sources?.title || session.video_source_id?.substring(0, 8)}
                    </p>
                    {session.current_agent && (
                      <p className="text-xs text-yellow-400 mt-1">
                        {AGENT_EMOJIS[session.current_agent] || '🤖'} {session.current_agent}
                      </p>
                    )}
                    {session.total_cost_tokens && (
                      <p className="text-xs text-gray-500 mt-1">
                        {session.total_cost_tokens.toLocaleString()} tokens
                      </p>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white font-['Oswald'] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-green-500" />
                {selectedSession ? 'DETALHES DA SESSAO' : 'SELECIONE UMA SESSAO'}
              </CardTitle>
              {selectedSession && (
                <Button
                  onClick={() => setShowLogModal(true)}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                >
                  <Eye className="w-4 h-4 mr-1" /> Ver Log Completo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedSession ? (
                <div className="text-center py-12 text-gray-500">
                  <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecione uma sessao na lista ou cole um Session ID</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Session Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={`${STATUS_COLORS[selectedSession.status] || 'bg-gray-500'} text-white mt-1`}>
                        {selectedSession.status}
                      </Badge>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Tokens</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {selectedSession.total_cost_tokens?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Workers</p>
                      <p className="text-lg font-bold text-green-400">
                        {selectedSession.clip_agent_outputs?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Clips</p>
                      <p className="text-lg font-bold text-purple-400">
                        {selectedSession.clip_production_plans?.[0]?.clips?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Pipeline Steps */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">PIPELINE</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Director */}
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        selectedSession.clip_live_maps?.length ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        <Sparkles className="w-4 h-4" />
                        Diretor
                        {selectedSession.clip_live_maps?.length ? <CheckCircle2 className="w-3 h-3" /> : null}
                      </div>
                      <Zap className="w-4 h-4 text-gray-600" />

                      {/* Workers */}
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        selectedSession.clip_agent_outputs?.length ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        <Play className="w-4 h-4" />
                        Workers ({selectedSession.clip_agent_outputs?.length || 0})
                        {selectedSession.clip_agent_outputs?.length ? <CheckCircle2 className="w-3 h-3" /> : null}
                      </div>
                      <Zap className="w-4 h-4 text-gray-600" />

                      {/* Produtor */}
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        selectedSession.clip_production_plans?.length ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        🎥 Produtor
                        {selectedSession.clip_production_plans?.length ? <CheckCircle2 className="w-3 h-3" /> : null}
                      </div>
                      <Zap className="w-4 h-4 text-gray-600" />

                      {/* Critico */}
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        selectedSession.clip_evaluations?.length ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        ⭐ Critico
                        {selectedSession.clip_evaluations?.length ? <CheckCircle2 className="w-3 h-3" /> : null}
                      </div>
                    </div>
                  </div>

                  {/* Error if any */}
                  {selectedSession.error_message && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> ERRO
                      </h3>
                      <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">
                        {selectedSession.error_message}
                      </pre>
                    </div>
                  )}

                  {/* Session Terminal */}
                  {sessionLogs.length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-green-500" /> TERMINAL DA SESSÃO ({sessionLogs.length})
                      </h3>
                      <div className="space-y-2 max-h-[360px] overflow-y-auto font-mono text-xs bg-black/40 rounded-lg p-3 border border-gray-700">
                        {sessionLogs.map((log) => {
                          const details = log.details as CrewLogDetails | null;
                          const agent = getLogAgent(log);
                          const detailLines = formatLogDetails(details);

                          return (
                            <div key={log.id} className="border-b border-gray-800 pb-2 last:border-b-0 last:pb-0">
                              <div className="flex items-start gap-2 flex-wrap">
                                <span className="text-gray-600 shrink-0">{formatTime(log.created_at)}</span>
                                <span className={`shrink-0 w-14 ${LEVEL_COLORS[log.level] || 'text-gray-500'}`}>
                                  [{log.level}]
                                </span>
                                <span className="text-purple-400 shrink-0">{AGENT_EMOJIS[agent] || '🤖'} {agent}</span>
                                <span className="text-gray-200 flex-1">{log.message}</span>
                              </div>
                              {detailLines.length > 0 && (
                                <div className="mt-1 pl-[132px] text-gray-500 space-y-1">
                                  {detailLines.map((detail) => (
                                    <div key={`${log.id}-${detail}`}>↳ {detail}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Source Logs */}
                  {sourceOnlyLogs.length > 0 && (
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> LOGS DO PIPELINE BASE ({sourceOnlyLogs.length})
                      </h3>
                      <div className="space-y-1 max-h-[220px] overflow-y-auto font-mono text-xs">
                        {sourceOnlyLogs.slice(-40).map((log) => (
                          <div key={log.id} className="flex items-start gap-2">
                            <span className="text-gray-600 shrink-0">{formatTime(log.created_at)}</span>
                            <span className={`shrink-0 w-12 ${LEVEL_COLORS[log.level] || 'text-gray-500'}`}>
                              [{log.level}]
                            </span>
                            <span className="text-purple-400 shrink-0 w-24">[{log.step}]</span>
                            <span className="text-gray-400">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session ID */}
                  <div className="text-xs text-gray-600 text-center pt-2 border-t border-gray-800">
                    Session ID: <code className="text-gray-400">{selectedSession.id}</code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full Log Modal */}
        <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-950 border-gray-700 text-white p-0">
            <DialogHeader className="p-4 border-b border-gray-800">
              <DialogTitle className="text-white flex items-center gap-2 font-mono">
                <Terminal className="w-5 h-5 text-green-500" />
                LOG COMPLETO — {selectedSession?.id?.substring(0, 8)}...
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[75vh] p-4">
              <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono bg-black p-4 rounded-lg leading-relaxed">
                {selectedSession ? generateSessionLog(selectedSession, sessionLogs) : 'No session selected'}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
