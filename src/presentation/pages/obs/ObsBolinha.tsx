import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const EMOTION_IMAGES: Record<string, string> = {
  neutro: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-neutro.png`,
  gol: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-gol.png`,
  bravo: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-bravo.png`,
  analise: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-analise.png`,
  sarcastico: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-sarcastico.png`,
  tedio: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-tedio.png`,
};

interface BolinhaMessage {
  text: string;
  emotion: string;
  teamId?: number;
  audioBase64?: string;
  timestamp?: string;
}

const SIZE_MAP: Record<string, string> = { sm: '140px', md: '200px', lg: '280px' };

const ObsBolinha = () => {
  const [searchParams] = useSearchParams();
  const size = searchParams.get('size') || 'md';
  const bolinhaSize = SIZE_MAP[size] || '200px';

  const [currentEmotion, setCurrentEmotion] = useState('neutro');
  const [messageText, setMessageText] = useState('');
  const [isShowingMessage, setIsShowingMessage] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isBalloonFading, setIsBalloonFading] = useState(false);

  const dismissTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload all images
  useEffect(() => {
    Object.values(EMOTION_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const resetToIdle = useCallback(() => {
    setIsBalloonFading(true);
    setTimeout(() => {
      setIsShowingMessage(false);
      setMessageText('');
      setIsBalloonFading(false);
      setCurrentEmotion('neutro');
    }, 500);
  }, []);

  const handleNewMessage = useCallback((msg: BolinhaMessage) => {
    // Clear any pending timer
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsBalloonFading(false);
    setCurrentEmotion(msg.emotion || 'neutro');
    setMessageText(msg.text);
    setIsShowingMessage(true);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    let audioDuration = 0;

    if (msg.audioBase64) {
      try {
        const audio = new Audio(msg.audioBase64);
        audioRef.current = audio;
        audio.play().catch(() => {});
        audio.onended = () => { audioDuration = 0; };
        // estimate duration — we'll use the longer of 8s or audio
        audio.onloadedmetadata = () => {
          audioDuration = (audio.duration || 0) * 1000;
          const delay = Math.max(8000, audioDuration + 500);
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = window.setTimeout(resetToIdle, delay);
        };
      } catch {
        // audio failed, fall through to default timer
      }
    }

    // Default 8s timer (overridden above if audio is longer)
    dismissTimerRef.current = window.setTimeout(resetToIdle, 8000);
  }, [resetToIdle]);

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
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [handleNewMessage]);

  return (
    <OBSLayout className="flex items-end justify-center p-4">
      <div className="relative flex flex-col items-center">
        {/* Speech balloon */}
        {isShowingMessage && messageText && (
          <div
            className={`mb-3 transition-opacity duration-500 ${isBalloonFading ? 'opacity-0' : 'animate-balloonIn'}`}
            style={{ maxWidth: '320px' }}
          >
            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-lg">
              <p className="font-heading text-sm font-semibold leading-snug text-gray-900 md:text-base">
                {messageText}
              </p>
            </div>
            {/* Triangle pointer */}
            <div className="flex justify-center">
              <div
                className="h-0 w-0"
                style={{
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '10px solid white',
                }}
              />
            </div>
          </div>
        )}

        {/* Bolinha image */}
        <img
          src={EMOTION_IMAGES[currentEmotion] || EMOTION_IMAGES.neutro}
          alt={`Bolinha ${currentEmotion}`}
          className={`object-contain ${isBouncing ? 'animate-bolinhaBounce' : ''} ${!isShowingMessage ? 'animate-bolinhaFloat' : ''}`}
          style={{ width: bolinhaSize, height: bolinhaSize }}
        />
      </div>
    </OBSLayout>
  );
};

export default ObsBolinha;
