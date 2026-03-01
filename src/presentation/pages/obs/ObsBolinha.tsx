import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const EMOTION_IMAGES: Record<string, string> = {
  neutro: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-NEUTRO-preview.png`,
  gol: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-GOL-preview.png`,
  bravo: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-BRAVO-preview.png`,
  analise: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-ANALISE-preview.png`,
  sarcastico: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-SARCASTICO-preview.png`,
  tedio: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/BOLINHA-TEDIO-preview.png`,
};

interface BolinhaMessage {
  text: string;
  emotion: string;
  teamId?: number;
  audioBase64?: string;
  timestamp?: string;
}

const SIZE_MAP: Record<string, string> = { sm: '200px', md: '300px', lg: '400px' };

const EMOTION_ANIM_MAP: Record<string, string> = {
  gol: 'bolinha-emotion-gol',
  bravo: 'bolinha-emotion-bravo',
  tedio: 'bolinha-emotion-tedio',
  sarcastico: 'bolinha-emotion-sarcastico',
  analise: 'bolinha-emotion-analise',
  neutro: 'bolinha-idle',
};

/* ── Split text into cinema-style subtitle blocks ── */
function splitIntoSubtitles(text: string, maxCharsPerBlock = 80): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const blocks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if ((current + ' ' + trimmed).trim().length <= maxCharsPerBlock) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) blocks.push(current);
      if (trimmed.length > maxCharsPerBlock) {
        const words = trimmed.split(' ');
        let chunk = '';
        for (const word of words) {
          if ((chunk + ' ' + word).trim().length <= maxCharsPerBlock) {
            chunk = (chunk + ' ' + word).trim();
          } else {
            if (chunk) blocks.push(chunk);
            chunk = word;
          }
        }
        current = chunk || '';
      } else {
        current = trimmed;
      }
    }
  }
  if (current) blocks.push(current);
  return blocks.length > 0 ? blocks : [text.substring(0, maxCharsPerBlock)];
}

/* ── Main component ── */
const ObsBolinha = () => {
  const [searchParams] = useSearchParams();
  const size = searchParams.get('size') || 'md';
  const bolinhaSize = SIZE_MAP[size] || '300px';

  const [currentEmotion, setCurrentEmotion] = useState('neutro');
  const [animClass, setAnimClass] = useState('bolinha-idle');

  // Subtitle state
  const [subtitleBlocks, setSubtitleBlocks] = useState<string[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [showSubtitle, setShowSubtitle] = useState(false);

  const messageTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const blockIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload images
  useEffect(() => {
    Object.values(EMOTION_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const clearAllTimers = useCallback(() => {
    if (messageTimerRef.current) { clearTimeout(messageTimerRef.current); messageTimerRef.current = null; }
    if (enterTimerRef.current) { clearTimeout(enterTimerRef.current); enterTimerRef.current = null; }
    if (blockIntervalRef.current) { clearInterval(blockIntervalRef.current); blockIntervalRef.current = null; }
  }, []);

  const resetBolinha = useCallback(() => {
    clearAllTimers();
    // Fade out subtitle
    setShowSubtitle(false);

    // After subtitle fades (400ms), reset bolinha
    setTimeout(() => {
      setCurrentEmotion('neutro');
      setAnimClass('bolinha-idle');
      setSubtitleBlocks([]);
      setCurrentBlockIndex(0);
    }, 400);
  }, [clearAllTimers]);

  const startSubtitleCycle = useCallback((blocks: string[], timePerBlock: number) => {
    if (blockIntervalRef.current) clearInterval(blockIntervalRef.current);
    let idx = 0;
    blockIntervalRef.current = window.setInterval(() => {
      idx++;
      if (idx < blocks.length) {
        setCurrentBlockIndex(idx);
      } else {
        if (blockIntervalRef.current) clearInterval(blockIntervalRef.current);
        blockIntervalRef.current = null;
      }
    }, timePerBlock);
  }, []);

  const handleNewMessage = useCallback((msg: BolinhaMessage) => {
    // Clear everything from previous message
    clearAllTimers();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const blocks = splitIntoSubtitles(msg.text, 80);

    // 1. Set emotion + entry animation
    setCurrentEmotion(msg.emotion || 'neutro');
    setAnimClass('bolinha-enter');
    setSubtitleBlocks(blocks);
    setCurrentBlockIndex(0);
    setShowSubtitle(true);

    // 2. After entry (600ms) → emotion-specific animation (infinite)
    enterTimerRef.current = window.setTimeout(() => {
      setAnimClass(EMOTION_ANIM_MAP[msg.emotion] || 'bolinha-idle');
    }, 600);

    // 3. Audio handling
    if (msg.audioBase64) {
      try {
        const audio = new Audio(msg.audioBase64);
        audioRef.current = audio;

        audio.addEventListener('ended', () => {
          resetBolinha();
        });
        audio.addEventListener('error', () => {
          resetBolinha();
        });

        audio.play().then(() => {
          // Audio playing — cycle subtitles based on audio duration when available
          if (audio.duration && isFinite(audio.duration)) {
            const timePerBlock = Math.max(2000, (audio.duration * 1000) / blocks.length);
            startSubtitleCycle(blocks, timePerBlock);
          } else {
            audio.addEventListener('loadedmetadata', () => {
              const timePerBlock = Math.max(2000, (audio.duration * 1000) / blocks.length);
              startSubtitleCycle(blocks, timePerBlock);
            }, { once: true });
            // Fallback if metadata never loads
            startSubtitleCycle(blocks, 3000);
          }
        }).catch(() => {
          // Autoplay blocked — use timer-based fallback
          startSubtitleCycle(blocks, 3000);
          const totalDuration = blocks.length * 3000 + 1000;
          messageTimerRef.current = window.setTimeout(resetBolinha, totalDuration);
        });

        // Safety fallback — 30s max
        messageTimerRef.current = window.setTimeout(resetBolinha, 30000);
      } catch {
        startSubtitleCycle(blocks, 3000);
        const totalDuration = blocks.length * 3000 + 1000;
        messageTimerRef.current = window.setTimeout(resetBolinha, totalDuration);
      }
    } else {
      // No audio — timer based on block count
      startSubtitleCycle(blocks, 3000);
      const totalDuration = blocks.length * 3000 + 1000;
      messageTimerRef.current = window.setTimeout(resetBolinha, totalDuration);
    }
  }, [clearAllTimers, resetBolinha, startSubtitleCycle]);

  // Subscribe to Realtime
  useEffect(() => {
    const channel = supabase
      .channel('bolinha')
      .on('broadcast', { event: 'comment' }, (payload) => {
        handleNewMessage(payload.payload as BolinhaMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearAllTimers();
    };
  }, [handleNewMessage, clearAllTimers]);

  const activeFilter = showSubtitle
    ? 'drop-shadow(0 8px 25px rgba(212,175,55,0.3)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
    : 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))';

  const currentSubtitle = subtitleBlocks[currentBlockIndex] || '';

  return (
    <OBSLayout className="flex items-end justify-center pb-2.5">
      <div className="relative flex flex-col items-center">
        {/* Cinema-style subtitle */}
        {showSubtitle && currentSubtitle && (
          <div className={`subtitle-container mb-3 ${showSubtitle ? '' : 'subtitle-fade-out'}`}>
            <div
              key={currentBlockIndex}
              className="subtitle-fade-enter rounded-xl bg-black/80 px-5 py-3 text-center shadow-lg backdrop-blur-sm"
            >
              <p
                className="font-heading font-bold leading-snug text-white"
                style={{
                  fontSize: '22px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {currentSubtitle}
              </p>
            </div>
          </div>
        )}

        {/* Bolinha image */}
        <img
          src={EMOTION_IMAGES[currentEmotion] || EMOTION_IMAGES.neutro}
          alt={`Bolinha ${currentEmotion}`}
          className={animClass}
          style={{
            width: bolinhaSize,
            height: bolinhaSize,
            objectFit: 'contain',
            filter: activeFilter,
            transition: 'filter 0.3s ease',
          }}
        />
      </div>
    </OBSLayout>
  );
};

export default ObsBolinha;
