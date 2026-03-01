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

/* ── Typewriter sub-component ── */
function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const done = displayed.length === text.length;

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <>
      {displayed}
      {!done && <span className="typewriter-cursor">|</span>}
    </>
  );
}

/* ── Main component ── */
const ObsBolinha = () => {
  const [searchParams] = useSearchParams();
  const size = searchParams.get('size') || 'md';
  const bolinhaSize = SIZE_MAP[size] || '300px';

  const [currentEmotion, setCurrentEmotion] = useState('neutro');
  const [messageText, setMessageText] = useState('');
  const [isShowingMessage, setIsShowingMessage] = useState(false);
  const [animClass, setAnimClass] = useState('bolinha-idle');
  const [balloonClass, setBalloonClass] = useState('balloon-enter');

  const dismissTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload images
  useEffect(() => {
    Object.values(EMOTION_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const resetToIdle = useCallback(() => {
    setBalloonClass('balloon-exit');
    setTimeout(() => {
      setIsShowingMessage(false);
      setMessageText('');
      setBalloonClass('balloon-enter');
      setCurrentEmotion('neutro');
      setAnimClass('bolinha-idle');
    }, 500);
  }, []);

  const handleNewMessage = useCallback((msg: BolinhaMessage) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 1. Entry animation
    setCurrentEmotion(msg.emotion || 'neutro');
    setMessageText(msg.text);
    setIsShowingMessage(true);
    setBalloonClass('balloon-enter');
    setAnimClass('bolinha-enter');

    // 2. After entry → emotion-specific animation
    enterTimerRef.current = window.setTimeout(() => {
      setAnimClass(EMOTION_ANIM_MAP[msg.emotion] || 'bolinha-idle');
    }, 600);

    // Audio handling
    if (msg.audioBase64) {
      try {
        const audio = new Audio(msg.audioBase64);
        audioRef.current = audio;
        audio.play().catch(() => {});
        audio.onloadedmetadata = () => {
          const audioDuration = (audio.duration || 0) * 1000;
          const delay = Math.max(8000, audioDuration + 500);
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = window.setTimeout(resetToIdle, delay);
        };
      } catch {
        // fall through to default timer
      }
    }

    // Default 8s dismiss
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
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, [handleNewMessage]);

  const activeFilter = isShowingMessage
    ? 'drop-shadow(0 8px 25px rgba(212,175,55,0.3)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
    : 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))';

  return (
    <OBSLayout className="flex items-end justify-center pb-2.5">
      <div className="relative flex flex-col items-center">
        {/* Speech balloon */}
        {isShowingMessage && messageText && (
          <div className={`mb-3 ${balloonClass}`} style={{ maxWidth: '420px' }}>
            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-lg">
              <p
                className="font-heading font-semibold leading-snug text-gray-900"
                style={{ fontSize: '19px' }}
              >
                <TypewriterText text={messageText} speed={30} />
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
