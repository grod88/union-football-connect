import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Bot, Zap } from 'lucide-react';

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

const QUICK_ACTIONS = [
  { icon: '⚽', label: 'GOL!', prompt: 'Acabou de sair um gol! Comemora com energia!' },
  { icon: '🟨', label: 'Cartão!', prompt: 'Acabou de sair um cartão amarelo polêmico. Comente com sarcasmo.' },
  { icon: '🔄', label: 'Substituição', prompt: 'O técnico fez uma substituição. Faça um comentário rápido.' },
  { icon: '😡', label: 'Juiz ladrão!', prompt: 'O juiz errou feio! Lance polêmico absurdo. Fique indignado!' },
  { icon: '😴', label: 'Jogo chato', prompt: 'O jogo está sem graça, sem emoção, morno. Reclame com humor.' },
  { icon: '👏', label: 'Golaço!', prompt: 'Que golaço absurdo! Elogie a jogada mesmo se for do adversário.' },
  { icon: '📊', label: 'Intervalo', prompt: 'É intervalo. Faça um resumo rápido e sarcástico do primeiro tempo.' },
  { icon: '🏁', label: 'Fim de Jogo', prompt: 'Acabou o jogo! Dê seu veredito final sobre a partida.' },
  { icon: '👋', label: 'Olá galera!', prompt: 'Cumprimente a galera que está chegando na live. Seja receptivo.' },
];

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

export default function AdminBolinha() {
  // Manual mode state
  const [manualText, setManualText] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('neutro');
  const [manualTTS, setManualTTS] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // AI mode state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTTS, setAiTTS] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('');

  // Quick action loading
  const [quickLoading, setQuickLoading] = useState<number | null>(null);

  // History
  const [history, setHistory] = useState<HistoryMessage[]>([]);

  // Channel ref for manual broadcast
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch history
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

    // Realtime subscription for live updates
    const channel = supabase
      .channel('bolinha-history')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bolinha_messages' },
        (payload) => {
          const newMsg = payload.new as HistoryMessage;
          setHistory((prev) => [newMsg, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Setup broadcast channel
  useEffect(() => {
    channelRef.current = supabase.channel('bolinha');
    channelRef.current.subscribe();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // Manual send
  const sendManual = useCallback(async () => {
    if (!manualText.trim()) return;
    setIsSending(true);
    try {
      let audioBase64: string | null = null;

      if (manualTTS) {
        const res = await supabase.functions.invoke('bolinha-tts', {
          body: { text: manualText },
        });
        audioBase64 = res.data?.audioBase64 || null;
      }

      // Broadcast
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'comment',
        payload: { text: manualText, emotion: selectedEmotion, teamId: null, audioBase64 },
      });

      // Persist
      await supabase.from('bolinha_messages').insert({
        text: manualText,
        emotion: selectedEmotion,
        event_type: 'manual',
      });

      setManualText('');
    } catch (e) {
      console.error('Manual send error:', e);
    } finally {
      setIsSending(false);
    }
  }, [manualText, selectedEmotion, manualTTS]);

  // AI send
  const sendAI = useCallback(async (prompt: string, withAudio: boolean, quickIdx?: number) => {
    if (!prompt.trim()) return;
    if (quickIdx !== undefined) setQuickLoading(quickIdx);
    else setIsGenerating(true);

    try {
      const res = await supabase.functions.invoke('bolinha-comment', {
        body: { custom_prompt: prompt, generate_audio: withAudio },
      });
      setLastGenerated(res.data?.text || 'Erro ao gerar');
    } catch (e) {
      console.error('AI send error:', e);
      setLastGenerated('Erro ao gerar');
    } finally {
      setIsGenerating(false);
      setQuickLoading(null);
    }
  }, []);

  const formatTime = (ts: string | null) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🎮 BOLINHA — PAINEL DE CONTROLE
        </h1>

        {/* Manual Mode */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Send className="w-5 h-5" /> MODO MANUAL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite o texto do Bolinha..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />

            {/* Emotion selector */}
            <div>
              <Label className="text-gray-400 text-sm mb-2 block">Emoção:</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => setSelectedEmotion(e.key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      selectedEmotion === e.key
                        ? 'ring-2 ring-yellow-500 bg-yellow-500/10 border-yellow-500'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <img src={EMOTION_IMAGE(e.key)} alt={e.label} className="w-12 h-12 object-contain" />
                    <span className="text-xs text-gray-300">{e.emoji} {e.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="manual-tts"
                  checked={manualTTS}
                  onCheckedChange={(c) => setManualTTS(!!c)}
                />
                <Label htmlFor="manual-tts" className="text-gray-400 text-sm cursor-pointer">
                  Gerar áudio (TTS)
                </Label>
              </div>

              <Button
                onClick={sendManual}
                disabled={isSending || !manualText.trim()}
                className="bg-yellow-500 text-black font-bold hover:bg-yellow-400 px-6"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                ENVIAR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Mode */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Bot className="w-5 h-5" /> MODO IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Ex: Comenta sobre o gol do Calleri aos 32 minutos"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-tts"
                  checked={aiTTS}
                  onCheckedChange={(c) => setAiTTS(!!c)}
                />
                <Label htmlFor="ai-tts" className="text-gray-400 text-sm cursor-pointer">
                  Gerar áudio (TTS)
                </Label>
              </div>

              <Button
                onClick={() => sendAI(aiPrompt, aiTTS)}
                disabled={isGenerating || !aiPrompt.trim()}
                className="bg-purple-600 text-white font-bold hover:bg-purple-500 px-6"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                GERAR COM IA + ENVIAR
              </Button>
            </div>

            {lastGenerated && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300">
                <span className="text-gray-500 text-xs block mb-1">Último gerado:</span>
                {lastGenerated}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Zap className="w-5 h-5" /> ATALHOS RÁPIDOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendAI(action.prompt, true, idx)}
                  disabled={quickLoading !== null}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 text-sm text-center transition-colors disabled:opacity-50"
                >
                  {quickLoading === idx ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                  ) : (
                    <span className="text-xl block mb-1">{action.icon}</span>
                  )}
                  <span className="text-gray-300">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">👁️ PREVIEW AO VIVO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-950 border-2 border-gray-700 rounded-lg overflow-hidden w-full max-w-sm h-80 mx-auto">
              <iframe
                src="/obs/bolinha?size=sm"
                title="Bolinha Preview"
                className="w-full h-full border-0"
                style={{ background: 'transparent' }}
              />
            </div>
            <p className="text-center text-gray-500 text-xs mt-2">
              O que aparecer aqui é EXATAMENTE o que aparece no OBS
            </p>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">📜 HISTÓRICO RECENTE</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhuma mensagem ainda.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((msg) => (
                  <div key={msg.id} className="flex items-center gap-3 text-sm border-b border-gray-800 pb-2">
                    <span className="text-gray-500 font-mono text-xs whitespace-nowrap">
                      {formatTime(msg.created_at)}
                    </span>
                    <Badge className={`${EMOTION_BADGE_COLORS[msg.emotion] || 'bg-gray-600'} text-white text-xs px-2 py-0`}>
                      {msg.emotion}
                    </Badge>
                    <span className="text-gray-300 truncate">{msg.text}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
