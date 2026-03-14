/**
 * VideoSource Entity
 * Represents a YouTube video/live being processed for clips
 */

export type VideoSourceStatus =
  | 'pending'
  | 'downloading'
  | 'transcribing'
  | 'transcribed'
  | 'analyzing'
  | 'analyzed'
  | 'error';

export interface TranscriptSegment {
  start: number;  // seconds
  end: number;    // seconds
  text: string;
}

export interface VideoSourceMetadata {
  channel?: string;
  uploadDate?: string;
  viewCount?: number;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export interface VideoSource {
  id: string;
  youtubeUrl: string;
  youtubeId: string | null;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  context: string | null;

  // Storage paths
  videoStoragePath: string | null;
  audioStoragePath: string | null;

  // Transcription
  transcriptJson: TranscriptSegment[] | null;
  transcriptText: string | null;

  // Pipeline status
  status: VideoSourceStatus;
  errorMessage: string | null;
  progress: number;  // 0.00 to 1.00

  // Metadata
  metadata: VideoSourceMetadata | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps database row to VideoSource entity
 */
export function mapToVideoSource(row: Record<string, unknown>): VideoSource {
  return {
    id: row.id as string,
    youtubeUrl: row.youtube_url as string,
    youtubeId: row.youtube_id as string | null,
    title: row.title as string,
    description: row.description as string | null,
    durationSeconds: row.duration_seconds as number | null,
    context: row.context as string | null,
    videoStoragePath: row.video_storage_path as string | null,
    audioStoragePath: row.audio_storage_path as string | null,
    transcriptJson: row.transcript_json as TranscriptSegment[] | null,
    transcriptText: row.transcript_text as string | null,
    status: row.status as VideoSourceStatus,
    errorMessage: row.error_message as string | null,
    progress: Number(row.progress) || 0,
    metadata: row.metadata as VideoSourceMetadata | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
