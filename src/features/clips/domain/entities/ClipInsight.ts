/**
 * ClipInsight Entity
 * Represents an AI-suggested clip before human approval
 */

export type ClipCategory = 'viral' | 'analise' | 'debate' | 'storytelling' | 'bolinha';

export type ClipInsightStatus = 'draft' | 'approved' | 'rejected' | 'producing' | 'done' | 'error';

export type TemplateId =
  | 'reaction'
  | 'split_horizontal'
  | 'split_vertical'
  | 'pip_bottom_right'
  | 'grande_momento'
  | 'versus'
  | 'stories_vertical';

export interface Storytelling {
  setup: string;    // What was happening before
  climax: string;   // The main moment
  payoff: string;   // Why this clip works
}

export interface TextOverlay {
  text: string;
  relativeTime: number;  // seconds from clip start
  duration: number;      // seconds
  position: 'top' | 'center' | 'bottom';
  style: 'title' | 'subtitle' | 'highlight' | 'meme' | 'stat';
}

export interface ProductionHints {
  textOverlays: TextOverlay[];
  transitionIn: 'fade' | 'cut' | 'zoom_in';
  transitionOut: 'fade' | 'cut' | 'zoom_out';
  thumbnailOffset: number;  // seconds from start
  energyLevel: 'high' | 'medium' | 'low';
  suggestedMusicVibe?: 'none' | 'hype' | 'emotional' | 'dramatic' | 'funny';
}

export interface SocialMetadata {
  captionReels: string;
  captionTwitter: string;
  hashtags: string[];
  bestPlatform: 'reels' | 'shorts' | 'tiktok' | 'twitter';
  whyPlatform?: string;
}

export interface TimeOverride {
  startTime: number;
  endTime: number;
}

export interface ClipInsight {
  id: string;
  videoSourceId: string;

  // AI-generated content
  title: string;
  hook: string | null;
  category: ClipCategory;
  priority: number;

  // Timestamps (seconds)
  startTime: number;
  endTime: number;
  duration: number;

  // Storytelling
  storytelling: Storytelling | null;

  // Production hints
  productionHints: ProductionHints | null;

  // Social media
  socialMetadata: SocialMetadata | null;

  // AI info
  aiReasoning: string | null;
  suggestedTemplate: TemplateId;
  aiModelUsed: string | null;

  // Human review
  status: ClipInsightStatus;
  editorNotes: string | null;
  editorTemplateOverride: TemplateId | null;
  editorTimeOverride: TimeOverride | null;

  // Secondary video
  secondaryVideoUrl: string | null;
  secondaryVideoPath: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps database row to ClipInsight entity
 */
export function mapToClipInsight(row: Record<string, unknown>): ClipInsight {
  const productionHints = row.production_hints as Record<string, unknown> | null;
  const socialMetadata = row.social_metadata as Record<string, unknown> | null;

  return {
    id: row.id as string,
    videoSourceId: row.video_source_id as string,
    title: row.title as string,
    hook: row.hook as string | null,
    category: row.category as ClipCategory,
    priority: row.priority as number,
    startTime: row.start_time as number,
    endTime: row.end_time as number,
    duration: row.duration as number,
    storytelling: row.storytelling as Storytelling | null,
    productionHints: productionHints ? {
      textOverlays: (productionHints.text_overlays || productionHints.textOverlays || []) as TextOverlay[],
      transitionIn: (productionHints.transition_in || productionHints.transitionIn || 'fade') as ProductionHints['transitionIn'],
      transitionOut: (productionHints.transition_out || productionHints.transitionOut || 'fade') as ProductionHints['transitionOut'],
      thumbnailOffset: (productionHints.thumbnail_offset || productionHints.thumbnailOffset || 5) as number,
      energyLevel: (productionHints.energy_level || productionHints.energyLevel || 'medium') as ProductionHints['energyLevel'],
      suggestedMusicVibe: productionHints.suggested_music_vibe as ProductionHints['suggestedMusicVibe'],
    } : null,
    socialMetadata: socialMetadata ? {
      captionReels: (socialMetadata.caption_reels || socialMetadata.captionReels || '') as string,
      captionTwitter: (socialMetadata.caption_twitter || socialMetadata.captionTwitter || '') as string,
      hashtags: (socialMetadata.hashtags || []) as string[],
      bestPlatform: (socialMetadata.best_platform || socialMetadata.bestPlatform || 'reels') as SocialMetadata['bestPlatform'],
      whyPlatform: socialMetadata.why_platform as string | undefined,
    } : null,
    aiReasoning: row.ai_reasoning as string | null,
    suggestedTemplate: (row.suggested_template || 'reaction') as TemplateId,
    aiModelUsed: row.ai_model_used as string | null,
    status: row.status as ClipInsightStatus,
    editorNotes: row.editor_notes as string | null,
    editorTemplateOverride: row.editor_template_override as TemplateId | null,
    editorTimeOverride: row.editor_time_override as TimeOverride | null,
    secondaryVideoUrl: row.secondary_video_url as string | null,
    secondaryVideoPath: row.secondary_video_path as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Get the effective template for a clip (editor override > suggested)
 */
export function getEffectiveTemplate(insight: ClipInsight): TemplateId {
  return insight.editorTemplateOverride || insight.suggestedTemplate;
}

/**
 * Get the effective time range (editor override > original)
 */
export function getEffectiveTimeRange(insight: ClipInsight): { startTime: number; endTime: number } {
  if (insight.editorTimeOverride) {
    return {
      startTime: insight.editorTimeOverride.startTime,
      endTime: insight.editorTimeOverride.endTime,
    };
  }
  return {
    startTime: insight.startTime,
    endTime: insight.endTime,
  };
}
