/**
 * ProducedClip Entity
 * Represents a clip after FFmpeg rendering
 */

import type { TemplateId } from './ClipInsight';

export type ProducedClipStatus = 'rendering' | 'done' | 'error';

export interface PublishedPlatform {
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter';
  url: string;
  publishedAt: string;
}

export interface ProducedClip {
  id: string;
  insightId: string;
  videoSourceId: string;
  templateId: TemplateId;

  // Final files (Supabase Storage paths)
  horizontalPath: string | null;  // 16:9
  verticalPath: string | null;    // 9:16
  thumbnailPath: string | null;

  // Production metadata
  durationSeconds: number | null;
  resolution: string | null;      // "1920x1080"
  fileSizeBytes: number | null;
  ffmpegCommand: string | null;   // For debugging

  // Rendering status
  status: ProducedClipStatus;
  errorMessage: string | null;
  renderTimeSeconds: number | null;

  // Publication tracking
  publishedPlatforms: PublishedPlatform[] | null;

  // Timestamps
  createdAt: string;
}

/**
 * Maps database row to ProducedClip entity
 */
export function mapToProducedClip(row: Record<string, unknown>): ProducedClip {
  return {
    id: row.id as string,
    insightId: row.insight_id as string,
    videoSourceId: row.video_source_id as string,
    templateId: row.template_id as TemplateId,
    horizontalPath: row.horizontal_path as string | null,
    verticalPath: row.vertical_path as string | null,
    thumbnailPath: row.thumbnail_path as string | null,
    durationSeconds: row.duration_seconds as number | null,
    resolution: row.resolution as string | null,
    fileSizeBytes: row.file_size_bytes as number | null,
    ffmpegCommand: row.ffmpeg_command as string | null,
    status: row.status as ProducedClipStatus,
    errorMessage: row.error_message as string | null,
    renderTimeSeconds: row.render_time_seconds as number | null,
    publishedPlatforms: row.published_platforms as PublishedPlatform[] | null,
    createdAt: row.created_at as string,
  };
}

/**
 * Get public URL for a clip file from Supabase Storage
 */
export function getClipPublicUrl(
  supabaseUrl: string,
  bucketName: string,
  path: string | null
): string | null {
  if (!path) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
}
