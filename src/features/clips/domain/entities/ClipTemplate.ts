/**
 * ClipTemplate Entity
 * Defines visual layouts for clip production
 */

import type { TemplateId } from './ClipInsight';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type VideoZoneId = 'main' | 'secondary' | 'pip';
export type CropMode = 'fit' | 'fill' | 'stretch';
export type TransitionType = 'fade' | 'slide_left' | 'slide_right' | 'zoom_in' | 'zoom_out' | 'wipe' | 'cut' | 'none';
export type TextStyle = 'title' | 'subtitle' | 'highlight' | 'meme' | 'stat';
export type TextPosition = 'top' | 'center' | 'bottom' | 'custom';

export interface VideoZone {
  id: VideoZoneId;
  label: string;               // "Comentário", "Lance do Gol"
  required: boolean;
  position: {
    x: string;                 // FFmpeg expression: "0", "W/2", "W-w-20"
    y: string;                 // "0", "H/2", "H-h-20"
    width: string;             // "iw", "iw/2", "320"
    height: string;            // "ih", "ih/2", "180"
  };
  cropMode: CropMode;
}

export interface TextZone {
  id: string;
  label: string;
  position: TextPosition;
  style: TextStyle;
  animated: boolean;
  fontSizeBase: number;
}

export interface LogoPosition {
  x: string;
  y: string;
  scale: number;
  opacity: number;
}

export interface TemplateTransitions {
  intro: TransitionType;
  outro: TransitionType;
  betweenZones?: TransitionType;
}

export interface ClipTemplate {
  id: TemplateId;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  videoZones: VideoZone[];
  textZones: TextZone[];
  hasLogo: boolean;
  logoPosition: LogoPosition;
  transitions: TemplateTransitions;
  ffmpegPreset: string;        // Name of FFmpeg preset
}

/**
 * Built-in templates registry
 */
export const TEMPLATES: Record<TemplateId, ClipTemplate> = {
  reaction: {
    id: 'reaction',
    name: 'Reação',
    description: 'Corte simples da live com logo e texto overlay',
    aspectRatio: '16:9',
    videoZones: [
      {
        id: 'main',
        label: 'Vídeo Principal',
        required: true,
        position: { x: '0', y: '0', width: 'iw', height: 'ih' },
        cropMode: 'fill',
      },
    ],
    textZones: [
      {
        id: 'title',
        label: 'Título',
        position: 'bottom',
        style: 'title',
        animated: false,
        fontSizeBase: 48,
      },
    ],
    hasLogo: true,
    logoPosition: { x: 'W-w-20', y: '20', scale: 0.08, opacity: 0.7 },
    transitions: { intro: 'fade', outro: 'fade' },
    ffmpegPreset: 'reaction',
  },

  split_horizontal: {
    id: 'split_horizontal',
    name: 'Split Horizontal',
    description: 'Comentário em cima, lance embaixo',
    aspectRatio: '16:9',
    videoZones: [
      {
        id: 'main',
        label: 'Comentário',
        required: true,
        position: { x: '0', y: '0', width: 'iw', height: 'ih/2' },
        cropMode: 'fill',
      },
      {
        id: 'secondary',
        label: 'Lance do Gol',
        required: true,
        position: { x: '0', y: 'H/2', width: 'iw', height: 'ih/2' },
        cropMode: 'fill',
      },
    ],
    textZones: [],
    hasLogo: true,
    logoPosition: { x: 'W-w-20', y: '20', scale: 0.06, opacity: 0.7 },
    transitions: { intro: 'fade', outro: 'fade', betweenZones: 'cut' },
    ffmpegPreset: 'split_horizontal',
  },

  split_vertical: {
    id: 'split_vertical',
    name: 'Split Vertical',
    description: 'Lado a lado - comparações',
    aspectRatio: '16:9',
    videoZones: [
      {
        id: 'main',
        label: 'Esquerda',
        required: true,
        position: { x: '0', y: '0', width: 'iw/2', height: 'ih' },
        cropMode: 'fill',
      },
      {
        id: 'secondary',
        label: 'Direita',
        required: true,
        position: { x: 'W/2', y: '0', width: 'iw/2', height: 'ih' },
        cropMode: 'fill',
      },
    ],
    textZones: [],
    hasLogo: true,
    logoPosition: { x: 'W-w-20', y: '20', scale: 0.06, opacity: 0.7 },
    transitions: { intro: 'fade', outro: 'fade', betweenZones: 'cut' },
    ffmpegPreset: 'split_vertical',
  },

  pip_bottom_right: {
    id: 'pip_bottom_right',
    name: 'Picture-in-Picture',
    description: 'Vídeo principal com miniatura',
    aspectRatio: '16:9',
    videoZones: [
      {
        id: 'main',
        label: 'Vídeo Principal',
        required: true,
        position: { x: '0', y: '0', width: 'iw', height: 'ih' },
        cropMode: 'fill',
      },
      {
        id: 'pip',
        label: 'PIP',
        required: false,
        position: { x: 'W-w-20', y: 'H-h-20', width: '320', height: '180' },
        cropMode: 'fill',
      },
    ],
    textZones: [],
    hasLogo: true,
    logoPosition: { x: '20', y: '20', scale: 0.06, opacity: 0.7 },
    transitions: { intro: 'fade', outro: 'fade' },
    ffmpegPreset: 'pip',
  },

  grande_momento: {
    id: 'grande_momento',
    name: 'Grande Momento',
    description: 'Quadro especial estilo TV Cultura',
    aspectRatio: '16:9',
    videoZones: [
      {
        id: 'main',
        label: 'Vídeo do Gol',
        required: true,
        position: { x: '0', y: '80', width: 'iw', height: 'ih-160' },
        cropMode: 'fill',
      },
    ],
    textZones: [
      {
        id: 'banner',
        label: 'Banner',
        position: 'top',
        style: 'title',
        animated: true,
        fontSizeBase: 56,
      },
      {
        id: 'narrator',
        label: 'Narrador',
        position: 'bottom',
        style: 'subtitle',
        animated: false,
        fontSizeBase: 32,
      },
    ],
    hasLogo: true,
    logoPosition: { x: 'W-w-20', y: '20', scale: 0.06, opacity: 0.8 },
    transitions: { intro: 'zoom_in', outro: 'fade' },
    ffmpegPreset: 'grande_momento',
  },

  versus: {
    id: 'versus',
    name: 'Versus',
    description: 'Layout com escudos, placar e stats',
    aspectRatio: '16:9',
    videoZones: [
      {
        id: 'main',
        label: 'Vídeo do Lance',
        required: true,
        position: { x: '0', y: '100', width: 'iw', height: 'ih-200' },
        cropMode: 'fill',
      },
    ],
    textZones: [
      {
        id: 'scoreboard',
        label: 'Placar',
        position: 'top',
        style: 'title',
        animated: false,
        fontSizeBase: 48,
      },
      {
        id: 'stats',
        label: 'Estatísticas',
        position: 'bottom',
        style: 'stat',
        animated: false,
        fontSizeBase: 24,
      },
    ],
    hasLogo: false,
    logoPosition: { x: '0', y: '0', scale: 0, opacity: 0 },
    transitions: { intro: 'fade', outro: 'fade' },
    ffmpegPreset: 'versus',
  },

  stories_vertical: {
    id: 'stories_vertical',
    name: 'Stories (Vertical)',
    description: 'Formato 9:16 para Reels/Shorts/TikTok',
    aspectRatio: '9:16',
    videoZones: [
      {
        id: 'main',
        label: 'Vídeo (cropped)',
        required: true,
        position: { x: '0', y: '0', width: '1080', height: '1920' },
        cropMode: 'fill',
      },
    ],
    textZones: [
      {
        id: 'caption',
        label: 'Legenda',
        position: 'bottom',
        style: 'subtitle',
        animated: true,
        fontSizeBase: 40,
      },
    ],
    hasLogo: true,
    logoPosition: { x: '(W-w)/2', y: '30', scale: 0.1, opacity: 0.8 },
    transitions: { intro: 'fade', outro: 'fade' },
    ffmpegPreset: 'stories_vertical',
  },
};

/**
 * Get template by ID
 */
export function getTemplate(id: TemplateId): ClipTemplate {
  return TEMPLATES[id];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): ClipTemplate[] {
  return Object.values(TEMPLATES);
}

/**
 * Check if template requires secondary video
 */
export function requiresSecondaryVideo(templateId: TemplateId): boolean {
  const template = TEMPLATES[templateId];
  return template.videoZones.some(zone => zone.id === 'secondary' && zone.required);
}
