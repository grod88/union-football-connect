import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Film, Play, Download, Trash2, RefreshCw, Scissors, CheckCircle2, XCircle, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import type { VideoSource, VideoSourceStatus } from '../../domain/entities/VideoSource';
import type { ClipInsight, ClipInsightStatus, TemplateId } from '../../domain/entities/ClipInsight';
import type { ProducedClip } from '../../domain/entities/ProducedClip';
import { TEMPLATES, getAllTemplates } from '../../domain/entities/ClipTemplate';

const API_BASE = 'http://localhost:8000';

const STATUS_COLORS: Record<VideoSourceStatus, string> = {
  pending: 'bg-gray-500',
  downloading: 'bg-blue-500',
  transcribing: 'bg-purple-500',
  transcribed: 'bg-cyan-500',
  analyzing: 'bg-yellow-500',
  analyzed: 'bg-green-500',
  error: 'bg-red-500',
};

const STATUS_LABELS: Record<VideoSourceStatus, string> = {
  pending: 'Pendente',
  downloading: 'Baixando...',
  transcribing: 'Transcrevendo...',
  transcribed: 'Transcrito',
  analyzing: 'Analisando...',
  analyzed: 'Analisado',
  error: 'Erro',
};

const INSIGHT_STATUS_COLORS: Record<ClipInsightStatus, string> = {
  draft: 'bg-gray-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  producing: 'bg-yellow-500',
  done: 'bg-emerald-500',
  error: 'bg-red-600',
};

const CATEGORY_COLORS: Record<string, string> = {
  viral: 'bg-red-500',
  analise: 'bg-blue-500',
  debate: 'bg-orange-500',
  storytelling: 'bg-purple-500',
  bolinha: 'bg-green-500',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

function sanitizeErrorMessage(error: string): string {
  // Remove API keys from error messages for display
  let sanitized = error
    .replace(/sk-[a-zA-Z0-9\-_]{20,}/g, 'sk-***')
    .replace(/sk-ant-[a-zA-Z0-9\-_]{20,}/g, 'sk-ant-***')
    .replace(/sk-proj-[a-zA-Z0-9\-_]{20,}/g, 'sk-proj-***')
    .replace(/eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, '***JWT***');

  // Simplify common errors
  if (sanitized.includes('invalid_api_key')) {
    return 'Erro: API key inválida ou expirada';
  }
  if (sanitized.includes('rate_limit')) {
    return 'Erro: Limite de requisições atingido';
  }

  return sanitized.length > 80 ? sanitized.substring(0, 80) + '...' : sanitized;
}

export default function AdminClips() {
  // New job form
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video sources list
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // Clip insights for selected source
  const [insights, setInsights] = useState<ClipInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Produced clips
  const [producedClips, setProducedClips] = useState<ProducedClip[]>([]);

  // Production state - track which insight is being produced
  const [producingInsightId, setProducingInsightId] = useState<string | null>(null);

  // Resume state
  const [resumingSourceId, setResumingSourceId] = useState<string | null>(null);

  // Polling interval ref
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Load video sources
  const loadVideoSources = useCallback(async () => {
    const { data, error } = await supabase
      .from('video_sources')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading video sources:', error);
      return;
    }

    // Map to entity
    const mapped: VideoSource[] = (data || []).map((row) => ({
      id: row.id,
      youtubeUrl: row.youtube_url,
      youtubeId: row.youtube_id,
      title: row.title,
      description: row.description,
      durationSeconds: row.duration_seconds,
      context: row.context,
      videoStoragePath: row.video_storage_path,
      audioStoragePath: row.audio_storage_path,
      transcriptJson: row.transcript_json,
      transcriptText: row.transcript_text,
      status: row.status as VideoSourceStatus,
      errorMessage: row.error_message,
      progress: Number(row.progress) || 0,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    setVideoSources(mapped);
    setIsLoadingSources(false);
  }, []);

  // Load insights for selected source
  const loadInsights = useCallback(async (sourceId: string) => {
    setIsLoadingInsights(true);
    const { data, error } = await supabase
      .from('clip_insights')
      .select('*')
      .eq('video_source_id', sourceId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error loading insights:', error);
      setIsLoadingInsights(false);
      return;
    }

    const mapped: ClipInsight[] = (data || []).map((row) => ({
      id: row.id,
      videoSourceId: row.video_source_id,
      title: row.title,
      hook: row.hook,
      category: row.category,
      priority: row.priority,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      storytelling: row.storytelling,
      productionHints: row.production_hints,
      socialMetadata: row.social_metadata,
      aiReasoning: row.ai_reasoning,
      suggestedTemplate: row.suggested_template || 'reaction',
      aiModelUsed: row.ai_model_used,
      status: row.status as ClipInsightStatus,
      editorNotes: row.editor_notes,
      editorTemplateOverride: row.editor_template_override,
      editorTimeOverride: row.editor_time_override,
      secondaryVideoUrl: row.secondary_video_url,
      secondaryVideoPath: row.secondary_video_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    setInsights(mapped);
    setIsLoadingInsights(false);

    // Also load produced clips
    const { data: clips } = await supabase
      .from('produced_clips')
      .select('*')
      .eq('video_source_id', sourceId);

    if (clips) {
      setProducedClips(clips.map((row) => ({
        id: row.id,
        insightId: row.insight_id,
        videoSourceId: row.video_source_id,
        templateId: row.template_id,
        horizontalPath: row.horizontal_path,
        verticalPath: row.vertical_path,
        thumbnailPath: row.thumbnail_path,
        durationSeconds: row.duration_seconds,
        resolution: row.resolution,
        fileSizeBytes: row.file_size_bytes,
        ffmpegCommand: row.ffmpeg_command,
        status: row.status,
        errorMessage: row.error_message,
        renderTimeSeconds: row.render_time_seconds,
        publishedPlatforms: row.published_platforms,
        createdAt: row.created_at,
      })));
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVideoSources();
  }, [loadVideoSources]);

  // Load insights when source selected
  useEffect(() => {
    if (selectedSourceId) {
      loadInsights(selectedSourceId);
    } else {
      setInsights([]);
      setProducedClips([]);
    }
  }, [selectedSourceId, loadInsights]);

  // Start polling for active jobs
  useEffect(() => {
    const hasActiveJob = videoSources.some(
      (s) => ['pending', 'downloading', 'transcribing', 'analyzing'].includes(s.status)
    );

    if (hasActiveJob && !pollInterval) {
      const interval = setInterval(() => {
        loadVideoSources();
        if (selectedSourceId) {
          loadInsights(selectedSourceId);
        }
      }, 3000);
      setPollInterval(interval);
    } else if (!hasActiveJob && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [videoSources, pollInterval, loadVideoSources, selectedSourceId, loadInsights]);

  // Submit new job
  const handleSubmit = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Cole uma URL do YouTube');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          context: context || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar job');
      }

      const data = await response.json();
      toast.success(`Job criado: ${data.id}`);
      setYoutubeUrl('');
      setContext('');
      loadVideoSources();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar job');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve/reject insight
  const handleInsightAction = async (insightId: string, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('clip_insights')
      .update({ status: newStatus })
      .eq('id', insightId);

    if (error) {
      toast.error('Erro ao atualizar insight');
      return;
    }

    toast.success(action === 'approve' ? 'Clip aprovado!' : 'Clip rejeitado');
    if (selectedSourceId) loadInsights(selectedSourceId);
  };

  // Produce single clip (V1 or V3)
  const handleProduceSingle = async (insightId: string, version: 'v1' | 'v3') => {
    setProducingInsightId(insightId);
    try {
      const endpoint = version === 'v3'
        ? `${API_BASE}/api/clips/${selectedSourceId}/produce-v3`
        : `${API_BASE}/api/clips/${selectedSourceId}/produce`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insight_ids: [insightId],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Erro ao produzir clip ${version.toUpperCase()}`);
      }

      toast.success(`Produção ${version.toUpperCase()} iniciada! Acompanhe o status do clip.`);
      // Reload to see status change to "producing"
      if (selectedSourceId) loadInsights(selectedSourceId);
    } catch (error) {
      console.error(`Error producing ${version}:`, error);
      toast.error(error instanceof Error ? error.message : `Erro ao produzir ${version}`);
    } finally {
      setProducingInsightId(null);
    }
  };

  // Resume failed job
  const handleResumeJob = async (sourceId: string) => {
    setResumingSourceId(sourceId);
    try {
      const response = await fetch(`${API_BASE}/api/clips/${sourceId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_v3: true,
          max_clips: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao retomar job');
      }

      const data = await response.json();
      toast.success(`Retomando: ${data.resume_from}`);
      loadVideoSources();
    } catch (error) {
      console.error('Error resuming job:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao retomar job');
    } finally {
      setResumingSourceId(null);
    }
  };

  // Delete source
  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Tem certeza que quer deletar este vídeo e todos os clips?')) return;

    const { error } = await supabase
      .from('video_sources')
      .delete()
      .eq('id', sourceId);

    if (error) {
      toast.error('Erro ao deletar');
      return;
    }

    toast.success('Vídeo deletado');
    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
    }
    loadVideoSources();
  };

  const selectedSource = videoSources.find((s) => s.id === selectedSourceId);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2 font-['Oswald']">
            <Scissors className="w-6 h-6 text-yellow-500" />
            UNION CLIPS AI — PAINEL DE CONTROLE
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

        {/* New Job Form */}
        <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Oswald']">
              <Film className="w-5 h-5 text-yellow-500" />
              NOVO VÍDEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !youtubeUrl.trim()}
                className="bg-yellow-500 text-black font-bold hover:bg-yellow-400"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                PROCESSAR
              </Button>
            </div>
            <Textarea
              placeholder="Contexto (opcional): Palmeiras 3x1 Santos - Brasileirão Rodada 20"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[60px]"
            />
          </CardContent>
        </Card>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Video Sources List */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white font-['Oswald']">
                VÍDEOS ({videoSources.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSources ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : videoSources.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhum vídeo processado ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {videoSources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSourceId(source.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSourceId === source.id
                          ? 'bg-gray-800 border-yellow-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {source.title || 'Sem título'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {source.youtubeId || source.youtubeUrl}
                          </p>
                        </div>
                        <Badge className={`${STATUS_COLORS[source.status]} text-white text-[10px] shrink-0`}>
                          {STATUS_LABELS[source.status]}
                        </Badge>
                      </div>
                      {['downloading', 'transcribing', 'analyzing'].includes(source.status) && (
                        <Progress value={source.progress * 100} className="mt-2 h-1" />
                      )}
                      {source.status === 'error' && (
                        <div className="mt-2 space-y-1">
                          {source.errorMessage && (
                            <p className="text-xs text-red-400 truncate">
                              {sanitizeErrorMessage(source.errorMessage)}
                            </p>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResumeJob(source.id);
                            }}
                            disabled={resumingSourceId === source.id}
                            size="sm"
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-xs h-6"
                          >
                            {resumingSourceId === source.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <RotateCcw className="w-3 h-3 mr-1" />
                            )}
                            RETOMAR
                          </Button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Board */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white font-['Oswald']">
                REVIEW BOARD
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSourceId ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Film className="w-12 h-12 mb-3 opacity-50" />
                  <p>Selecione um vídeo para ver os insights</p>
                </div>
              ) : isLoadingInsights ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : selectedSource?.status !== 'analyzed' ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mb-3 opacity-50" />
                  <p>Aguardando análise...</p>
                  <p className="text-xs mt-1">Status: {STATUS_LABELS[selectedSource?.status || 'pending']}</p>
                </div>
              ) : insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>Nenhum momento identificado pela IA</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {insights.map((insight, idx) => {
                    const produced = producedClips.find((c) => c.insightId === insight.id);
                    return (
                      <div
                        key={insight.id}
                        className={`p-4 rounded-lg border ${
                          insight.status === 'approved'
                            ? 'bg-green-900/20 border-green-500/50'
                            : insight.status === 'rejected'
                            ? 'bg-red-900/20 border-red-500/50 opacity-50'
                            : 'bg-gray-800/50 border-gray-700'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-yellow-500 font-bold">P{idx + 1}</span>
                              <Badge className={`${CATEGORY_COLORS[insight.category] || 'bg-gray-500'} text-white text-[10px]`}>
                                {insight.category}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
                                {TEMPLATES[insight.suggestedTemplate as TemplateId]?.name || insight.suggestedTemplate}
                              </Badge>
                            </div>
                            <h3 className="text-white font-bold text-lg leading-tight">
                              "{insight.title}"
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-mono text-gray-400">
                              {formatTimestamp(insight.startTime)} → {formatTimestamp(insight.endTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDuration(insight.duration)}
                            </p>
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        {insight.aiReasoning && (
                          <p className="text-sm text-gray-400 mb-3 italic">
                            IA diz: "{insight.aiReasoning}"
                          </p>
                        )}

                        {/* Hook */}
                        {insight.hook && (
                          <p className="text-sm text-gray-300 mb-3">
                            <span className="text-gray-500">Gancho:</span> {insight.hook}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 mt-2">
                          {/* Status & Approve/Reject Row */}
                          <div className="flex items-center gap-2">
                            {insight.status === 'draft' && (
                              <>
                                <Button
                                  onClick={() => handleInsightAction(insight.id, 'approve')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Aprovar
                                </Button>
                                <Button
                                  onClick={() => handleInsightAction(insight.id, 'reject')}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Descartar
                                </Button>
                              </>
                            )}
                            {insight.status === 'approved' && (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Aprovado
                              </Badge>
                            )}
                            {insight.status === 'done' && (
                              <Badge className="bg-emerald-500 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Produzido
                              </Badge>
                            )}
                            {insight.status === 'producing' && (
                              <Badge className="bg-yellow-500 text-black">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Renderizando...
                              </Badge>
                            )}
                            {insight.status === 'error' && (
                              <Badge className="bg-red-600 text-white">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Erro
                              </Badge>
                            )}
                            {insight.status === 'rejected' && (
                              <Badge className="bg-red-500 text-white">
                                <XCircle className="w-3 h-3 mr-1" />
                                Descartado
                              </Badge>
                            )}
                          </div>

                          {/* Production & Download Row */}
                          {insight.status !== 'rejected' && insight.status !== 'draft' && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                              {/* Produce Buttons */}
                              <Button
                                onClick={() => handleProduceSingle(insight.id, 'v1')}
                                disabled={producingInsightId === insight.id || insight.status === 'producing'}
                                size="sm"
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                              >
                                {producingInsightId === insight.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Scissors className="w-3 h-3" />
                                )}
                                V1
                              </Button>
                              <Button
                                onClick={() => handleProduceSingle(insight.id, 'v3')}
                                disabled={producingInsightId === insight.id || insight.status === 'producing'}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {producingInsightId === insight.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Film className="w-3 h-3" />
                                )}
                                V3
                              </Button>

                              {/* Download Button */}
                              {produced && produced.status === 'done' && produced.horizontalPath && (
                                <a
                                  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/clips/${produced.horizontalPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delete source button */}
              {selectedSourceId && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <Button
                    onClick={() => handleDeleteSource(selectedSourceId)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar vídeo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
