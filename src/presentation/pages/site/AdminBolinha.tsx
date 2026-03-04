import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Send, Bot, Zap, RefreshCw, Eye, Satellite } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const EMOTIONS = [
  { key: 'neutro', label: 'Neutro', emoji: '😏' },
  { key: 'gol', label: 'Gol', emoji: '⚽' },
  { key: 'bravo', label: 'Bravo', emoji: '😡' },
  { key: 'analise', label: 'Análise', emoji: '🤓' },
  { key: 'sarcastico', label: 'Sarcástico', emoji: '😒' },
  { key: 'tedio', label: 'Tédio', emoji: '😴' },
] as const;

const EMOTION_IMAGE = (emotion: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-${emotion.toUpperCase()}.png`;

const EMOTION_BADGE_COLORS: Record<string, string> = {
  gol: 'bg-green-500',
  bravo: 'bg-red-500',
  analise: 'bg-blue-500',
  sarcastico: 'bg-yellow-500 text-black',
  tedio: 'bg-gray-500',
  neutro: 'bg-gray-600',
};

interface HistoryMessage {
  id: string;
  text: string;
  emotion: string;
  created_at: string | null;
  event_type: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MatchContext = any;

/* ────────────────────────────── helpers ────────────────────────────── */

function summarizeH2H(h2hData: unknown, homeId: number | null, awayId: number | null) {
  if (!Array.isArray(h2hData) || h2hData.length === 0) return null;
  let homeWins = 0, awayWins = 0, draws = 0;
  for (const match of h2hData) {
    const hGoals = match?.goals?.home ?? 0;
    const aGoals = match?.goals?.away ?? 0;
    const hTeamId = match?.teams?.home?.id;
    if (hGoals === aGoals) { draws++; continue; }
    const winnerIsHome = hGoals > aGoals;
    if ((winnerIsHome && hTeamId === homeId) || (!winnerIsHome && hTeamId !== homeId)) homeWins++;
    else awayWins++;
  }
  return { homeWins, awayWins, draws, total: h2hData.length };
}

function summarizePredictions(predData: unknown) {
  if (!predData || typeof predData !== 'object') return null;
  const pred = predData as Record<string, unknown>;
  const winner = (pred.predictions as Record<string, unknown>)?.winner as Record<string, unknown> | undefined;
  if (!winner) return null;
  return { name: winner.name as string, comment: winner.comment as string };
}

function summarizeInjuries(injData: unknown) {
  if (!Array.isArray(injData)) return 0;
  return injData.length;
}

/* ════════════════════════════════════════════════════════════════════ */

export default function AdminBolinha() {
  // Match context
  const [fixtureId, setFixtureId] = useState('');
  const [matchContext, setMatchContext] = useState<MatchContext>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync timer
  const [syncAgo, setSyncAgo] = useState('');
  const [syncStale, setSyncStale] = useState(false);

  // Auto-sync
  const [autoSync, setAutoSync] = useState(false);
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Quick actions
  const [generateAudio, setGenerateAudio] = useState(true);
  const [quickLoading, setQuickLoading] = useState<number | null>(null);

  // Manual mode
  const [manualText, setManualText] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('neutro');
  const [manualTTS, setManualTTS] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // AI mode
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTTS, setAiTTS] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('');

  // History
  const [history, setHistory] = useState<HistoryMessage[]>([]);

  // Broadcast channel
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* ── load active match on mount ── */
  useEffect(() => {
    const loadActive = async () => {
      const { data } = await supabase
        .from('bolinha_match_context')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (data) {
        setMatchContext(data);
        setFixtureId(String(data.fixture_id));
      }
    };
    loadActive();
  }, []);

  /* ── history + realtime ── */
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('bolinha_messages')
        .select('id, text, emotion, created_at, event_type')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setHistory(data);
    };
    fetchHistory();

    const channel = supabase
      .channel('bolinha-history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bolinha_messages' }, (payload) => {
        const newMsg = payload.new as HistoryMessage;
        setHistory((prev) => [newMsg, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── broadcast channel ── */
  useEffect(() => {
    channelRef.current = supabase.channel('bolinha');
    channelRef.current.subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  /* ── sync ago timer ── */
  useEffect(() => {
    const compute = () => {
      const ts = matchContext?.last_synced_at;
      if (!ts) { setSyncAgo(''); setSyncStale(false); return; }
      const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
      if (diff < 60) { setSyncAgo(`há ${diff}s`); }
      else if (diff < 3600) { setSyncAgo(`há ${Math.floor(diff / 60)} min`); }
      else { setSyncAgo(`há ${Math.floor(diff / 3600)}h`); }
      setSyncStale(diff > 600);
    };
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [matchContext?.last_synced_at]);

  /* ── sync match ── */
  const syncMatch = useCallback(async () => {
    if (!fixtureId.trim()) return;
    setIsSyncing(true);
    try {
      const { data } = await supabase.functions.invoke('bolinha-sync-match', {
        body: { fixture_id: Number(fixtureId) },
      });
      if (data?.success) {
        const { data: updated } = await supabase
          .from('bolinha_match_context')
          .select('*')
          .eq('fixture_id', Number(fixtureId))
          .maybeSingle();
        setMatchContext(updated);
        const eventsCount = Array.isArray(updated?.events_data) ? updated.events_data.length : 0;
        const fixtureData = updated?.fixture_data as Record<string, any> | null;
        const scoreH = fixtureData?.goals?.home ?? '-';
        const scoreA = fixtureData?.goals?.away ?? '-';
        toast.success(`✅ Dados atualizados — Placar: ${scoreH} x ${scoreA} | ${eventsCount} eventos`);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [fixtureId]);

  /* ── auto-sync (2 min interval) ── */
  useEffect(() => {
    if (autoSync && fixtureId.trim()) {
      autoSyncRef.current = setInterval(() => {
        syncMatch();
      }, 120_000); // 2 minutes
      // Sync immediately when toggled on
      syncMatch();
    }
    return () => {
      if (autoSyncRef.current) {
        clearInterval(autoSyncRef.current);
        autoSyncRef.current = null;
      }
    };
  }, [autoSync, fixtureId, syncMatch]);

  /* ── quick actions (context-aware) ── */
  const homeName = matchContext?.home_team_name || 'Time Casa';
  const awayName = matchContext?.away_team_name || 'Time Fora';
  const leagueName = matchContext?.league_name || 'campeonato';

  const quickActions = useMemo(() => ({
    preGame: [
      { icon: '👋', label: 'Olá galera!', prompt: `Cumprimente a galera da live do Union Football Live! É dia de ${homeName} x ${awayName} pelo ${leagueName}! Diga que o Bolinha tá pronto pra resenha! Use DADOS PRÉ-JOGO se disponíveis.` },
      { icon: '📊', label: 'Pré-jogo', prompt: `Faça uma análise pré-jogo de ${homeName} x ${awayName}. Use os DADOS PRÉ-JOGO: predição, H2H, lesões e escalações. Traga curiosidades e sua opinião sobre quem leva.` },
      { icon: '🔮', label: 'Predição', prompt: `Dê seu palpite para ${homeName} x ${awayName}. Use os DADOS PRÉ-JOGO: predição e comparação. Seja opinativo e divertido.` },
      { icon: '🏥', label: 'Desfalques', prompt: `Comente sobre os desfalques e lesões no jogo ${homeName} x ${awayName}. Use DADOS PRÉ-JOGO: lista de jogadores lesionados.` },
    ],
    live: [
      { icon: '⚽', label: `Gol ${homeName.split(' ')[0]}!`, prompt: `GOL DO ${homeName.toUpperCase()} contra o ${awayName}! Comemora com energia! Use DADOS AO VIVO: placar, chutes no gol, posse. NÃO use predições.` },
      { icon: '⚽', label: `Gol ${awayName.split(' ')[0]}`, prompt: `Gol do ${awayName} contra o ${homeName}! Comente o gol. Use DADOS AO VIVO: placar, finalizações, posse. NÃO use predições.` },
      { icon: '🟨', label: 'Cartão!', prompt: `Saiu cartão no jogo ${homeName} x ${awayName}! Use DADOS AO VIVO: total de faltas, cartões já dados, tensão do jogo. NÃO use dados de predição.` },
      { icon: '😡', label: 'Juiz errou!', prompt: `O juiz errou feio em ${homeName} x ${awayName}! Lance polêmico! Fique indignado! Use DADOS AO VIVO se disponíveis.` },
      { icon: '👏', label: 'Que jogada!', prompt: `Que jogada linda em ${homeName} x ${awayName}! Elogie a qualidade técnica. Use DADOS AO VIVO.` },
      { icon: '😴', label: 'Jogo parado', prompt: `O jogo ${homeName} x ${awayName} tá sem emoção. Use DADOS AO VIVO: chutes no gol, finalizações, posse pra justificar o tédio.` },
    ],
    postGame: [
      { icon: '📊', label: 'Intervalo', prompt: `É intervalo em ${homeName} x ${awayName} pelo ${leagueName}. Faça um resumo do primeiro tempo. Use DADOS AO VIVO: posse, finalizações, chutes no gol, escanteios, faltas, eventos.` },
      { icon: '🏁', label: 'Fim de jogo!', prompt: `Acabou ${homeName} x ${awayName} pelo ${leagueName}! Dê seu veredito final. Use DADOS AO VIVO: placar, posse, finalizações, eventos do jogo.` },
    ],
  }), [homeName, awayName, leagueName]);

  // Flat list for index-based handler
  const allQuickActions = useMemo(() => [
    ...quickActions.preGame,
    ...quickActions.live,
    ...quickActions.postGame,
  ], [quickActions]);

  /* ── handlers ── */
  const handleQuickAction = useCallback(async (idx: number) => {
    setQuickLoading(idx);
    try {
      const res = await supabase.functions.invoke('bolinha-comment', {
        body: { custom_prompt: allQuickActions[idx].prompt, generate_audio: generateAudio },
      });
      setLastGenerated(res.data?.text || '');
    } catch (e) {
      console.error('Quick action error:', e);
    } finally {
      setQuickLoading(null);
    }
  }, [allQuickActions, generateAudio]);

  const sendManual = useCallback(async () => {
    if (!manualText.trim()) return;
    setIsSending(true);
    try {
      let audioBase64: string | null = null;
      if (manualTTS) {
        const res = await supabase.functions.invoke('bolinha-tts', { body: { text: manualText } });
        audioBase64 = res.data?.audioBase64 || null;
      }
      await channelRef.current?.send({
        type: 'broadcast', event: 'comment',
        payload: { text: manualText, emotion: selectedEmotion, teamId: null, audioBase64 },
      });
      await supabase.from('bolinha_messages').insert({
        text: manualText, emotion: selectedEmotion, event_type: 'manual',
      });
      setManualText('');
    } catch (e) { console.error('Manual send error:', e); }
    finally { setIsSending(false); }
  }, [manualText, selectedEmotion, manualTTS]);

  const sendAI = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await supabase.functions.invoke('bolinha-comment', {
        body: { custom_prompt: aiPrompt, generate_audio: aiTTS },
      });
      setLastGenerated(res.data?.text || 'Erro ao gerar');
    } catch (e) { console.error('AI error:', e); setLastGenerated('Erro ao gerar'); }
    finally { setIsGenerating(false); }
  }, [aiPrompt, aiTTS]);

  const formatTime = (ts: string | null) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  /* ── derived match data ── */
  const h2h = useMemo(() => summarizeH2H(matchContext?.h2h_data, matchContext?.home_team_id, matchContext?.away_team_id), [matchContext]);
  const prediction = useMemo(() => summarizePredictions(matchContext?.predictions_data), [matchContext]);
  const injuryCount = useMemo(() => summarizeInjuries(matchContext?.injuries_data), [matchContext]);
  const hasLineups = useMemo(() => Array.isArray(matchContext?.lineups_data) && matchContext.lineups_data.length > 0, [matchContext]);

  /* ════════════════════════════════ RENDER ════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2 font-['Oswald']">
            🎮 BOLINHA — PAINEL DE CONTROLE
          </h1>
          {syncAgo && (
            <span className={`text-xs ${syncStale ? 'text-yellow-400' : 'text-gray-500'}`}>
              Último sync: {syncAgo}
            </span>
          )}
        </div>

        {/* ═══════ 1. PARTIDA ATIVA ═══════ */}
        <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Oswald']">
              <Satellite className="w-5 h-5 text-yellow-500" /> PARTIDA ATIVA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fixture ID input + sync */}
            <div className="flex gap-2">
              <Input
                placeholder="Fixture ID (ex: 1526432)"
                value={fixtureId}
                onChange={(e) => setFixtureId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 max-w-[200px]"
              />
              <Button onClick={syncMatch} disabled={isSyncing || !fixtureId.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                SINCRONIZAR
              </Button>
            </div>

            {/* Match info card */}
            {matchContext && (
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="text-lg font-bold text-white font-['Oswald']">
                  ✅ {matchContext.home_team_name} vs {matchContext.away_team_name}
                </p>
                <p className="text-gray-400">
                  {matchContext.league_name} — {matchContext.league_round}
                </p>
                {matchContext.venue_name && (
                  <p className="text-gray-400">{matchContext.venue_name} — {matchContext.match_date ? new Date(matchContext.match_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-gray-300 pt-2 border-t border-gray-700">
                  {prediction && (
                    <p>📊 Predição: <span className="text-white">{prediction.name}</span> {prediction.comment && <span className="text-gray-500">({prediction.comment})</span>}</p>
                  )}
                  <p>🏥 Lesões: <span className="text-white">{injuryCount} jogadores</span></p>
                  {h2h && (
                    <p>⚔️ H2H: <span className="text-white">{h2h.homeWins}V {homeName.split(' ')[0]}, {h2h.awayWins}V {awayName.split(' ')[0]}, {h2h.draws}E</span> <span className="text-gray-500">(últimos {h2h.total})</span></p>
                  )}
                  <p>📋 Escalações: {hasLineups ? <span className="text-green-400">✅ disponíveis</span> : <span className="text-gray-500">❌ indisponíveis</span>}</p>
                  <p className="text-gray-500">Último sync: {formatTime(matchContext.last_synced_at)}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={syncMatch} disabled={isSyncing} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Atualizar dados
                  </Button>
                  <Button
                    onClick={() => setAutoSync((prev) => !prev)}
                    variant="outline"
                    size="sm"
                    className={autoSync
                      ? 'border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }
                  >
                    <RefreshCw className={`w-3 h-3 ${autoSync ? 'animate-spin' : ''}`} />
                    {autoSync ? '⏹ Auto-sync ON (2min)' : '▶ Auto-sync'}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Eye className="w-3 h-3" /> Ver contexto completo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Contexto completo da partida</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto max-h-[60vh] space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-yellow-400 mb-1">📊 DADOS PRÉ-JOGO</h3>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 p-3 rounded-lg">
                            {matchContext.pre_match_summary || matchContext.context_summary || 'Sem dados pré-jogo.'}
                          </pre>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-green-400 mb-1">⚡ DADOS AO VIVO</h3>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 p-3 rounded-lg">
                            {matchContext.live_summary || 'Sem dados ao vivo (jogo não começou ou sem sync recente).'}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {!matchContext && !isSyncing && (
              <p className="text-gray-500 text-sm">Nenhuma partida ativa. Insira um Fixture ID e sincronize.</p>
            )}
          </CardContent>
        </Card>

        {/* ═══════ 2. ATALHOS RÁPIDOS ═══════ */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Oswald']">
              <Zap className="w-5 h-5 text-yellow-500" /> ATALHOS RÁPIDOS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox id="quick-tts" checked={generateAudio} onCheckedChange={(c) => setGenerateAudio(!!c)} />
              <Label htmlFor="quick-tts" className="text-gray-400 text-sm cursor-pointer">🔊 Gerar com áudio (TTS)</Label>
            </div>

            {/* PRÉ-JOGO */}
            <div>
              <p className="text-xs font-bold text-yellow-500 mb-1.5 uppercase tracking-wider">📋 Pré-jogo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickActions.preGame.map((action, idx) => (
                  <button
                    key={`pre-${idx}`}
                    onClick={() => handleQuickAction(idx)}
                    disabled={quickLoading !== null}
                    className="bg-gray-800 hover:bg-gray-700 border border-yellow-500/20 hover:border-yellow-500/50 rounded-lg p-3 text-center transition-all duration-200 disabled:opacity-50 relative"
                  >
                    {quickLoading === idx ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-yellow-500" />
                    ) : (
                      <span className="text-xl block mb-1">{action.icon}</span>
                    )}
                    <span className="text-gray-300 text-xs">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AO VIVO */}
            <div>
              <p className="text-xs font-bold text-green-500 mb-1.5 uppercase tracking-wider">⚡ Ao vivo</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {quickActions.live.map((action, idx) => {
                  const globalIdx = quickActions.preGame.length + idx;
                  return (
                    <button
                      key={`live-${idx}`}
                      onClick={() => handleQuickAction(globalIdx)}
                      disabled={quickLoading !== null}
                      className="bg-gray-800 hover:bg-gray-700 border border-green-500/20 hover:border-green-500/50 rounded-lg p-3 text-center transition-all duration-200 disabled:opacity-50 relative"
                    >
                      {quickLoading === globalIdx ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-green-500" />
                      ) : (
                        <span className="text-xl block mb-1">{action.icon}</span>
                      )}
                      <span className="text-gray-300 text-xs">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTERVALO / FIM */}
            <div>
              <p className="text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider">🏁 Intervalo / Fim</p>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                {quickActions.postGame.map((action, idx) => {
                  const globalIdx = quickActions.preGame.length + quickActions.live.length + idx;
                  return (
                    <button
                      key={`post-${idx}`}
                      onClick={() => handleQuickAction(globalIdx)}
                      disabled={quickLoading !== null}
                      className="bg-gray-800 hover:bg-gray-700 border border-blue-400/20 hover:border-blue-400/50 rounded-lg p-3 text-center transition-all duration-200 disabled:opacity-50 relative"
                    >
                      {quickLoading === globalIdx ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-400" />
                      ) : (
                        <span className="text-xl block mb-1">{action.icon}</span>
                      )}
                      <span className="text-gray-300 text-xs">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ 3. MODO LIVRE ═══════ */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white font-['Oswald']">💬 MODO LIVRE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manual */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-1"><Send className="w-4 h-4" /> Manual</h3>
                <Textarea
                  placeholder="Texto do Bolinha..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[70px]"
                />
                <div className="grid grid-cols-3 gap-1">
                  {EMOTIONS.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => setSelectedEmotion(e.key)}
                      className={`flex items-center gap-1 p-1.5 rounded border text-xs transition-all ${
                        selectedEmotion === e.key
                          ? 'ring-2 ring-yellow-500 bg-yellow-500/10 border-yellow-500'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <img src={EMOTION_IMAGE(e.key)} alt={e.label} className="w-8 h-8 object-contain" />
                      <span className="text-gray-300">{e.emoji} {e.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="manual-tts" checked={manualTTS} onCheckedChange={(c) => setManualTTS(!!c)} />
                    <Label htmlFor="manual-tts" className="text-gray-400 text-xs cursor-pointer">TTS</Label>
                  </div>
                  <Button onClick={sendManual} disabled={isSending || !manualText.trim()} className="bg-yellow-500 text-black font-bold hover:bg-yellow-400 px-4" size="sm">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} ENVIAR
                  </Button>
                </div>
              </div>

              {/* IA */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-1"><Bot className="w-4 h-4" /> IA</h3>
                <Textarea
                  placeholder="Ex: Comenta sobre o gol do Calleri..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[70px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="ai-tts" checked={aiTTS} onCheckedChange={(c) => setAiTTS(!!c)} />
                    <Label htmlFor="ai-tts" className="text-gray-400 text-xs cursor-pointer">TTS</Label>
                  </div>
                  <Button onClick={sendAI} disabled={isGenerating || !aiPrompt.trim()} className="bg-purple-600 text-white font-bold hover:bg-purple-500 px-4" size="sm">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} GERAR COM IA
                  </Button>
                </div>
                {lastGenerated && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300">
                    <span className="text-gray-500 block mb-1">Último gerado:</span>
                    {lastGenerated}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ 4. PREVIEW + HISTÓRICO ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">👁️ PREVIEW</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-950 border-2 border-gray-700 rounded-lg overflow-hidden w-full max-w-xs h-72 mx-auto">
                <iframe src="/obs/bolinha?size=sm" title="Bolinha Preview" className="w-full h-full border-0" style={{ background: 'transparent' }} />
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">📜 HISTÓRICO</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Nenhuma mensagem ainda.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {history.map((msg) => (
                    <div key={msg.id} className="flex items-center gap-2 text-xs border-b border-gray-800 pb-1.5">
                      <span className="text-gray-500 font-mono whitespace-nowrap">{formatTime(msg.created_at)}</span>
                      <Badge className={`${EMOTION_BADGE_COLORS[msg.emotion] || 'bg-gray-600'} text-white text-[10px] px-1.5 py-0`}>{msg.emotion}</Badge>
                      <span className="text-gray-300 truncate">{msg.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating re-sync FAB */}
      {matchContext && (
        <button
          onClick={syncMatch}
          disabled={isSyncing}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50"
          title="Atualizar dados do jogo"
        >
          <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
