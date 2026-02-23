/**
 * OBS Score Widget
 * /obs/score?fixture=FIXTURE_ID
 * Displays only the score with goal flash animation
 */
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';
import { cn } from '@/lib/utils';

const ObsScore = () => {
  const [searchParams] = useSearchParams();
  const fixtureIdNum = parsePositiveInt(searchParams.get('fixture'));

  const { data: fixture, isLoading, error } = useFixtureForOBS(fixtureIdNum);

  // Goal animation
  const [goalFlash, setGoalFlash] = useState(false);
  const prevHome = useRef<number | null>(null);
  const prevAway = useRef<number | null>(null);

  useEffect(() => {
    if (!fixture) return;
    const h = fixture.goalsHome ?? 0;
    const a = fixture.goalsAway ?? 0;
    if (prevHome.current !== null && prevAway.current !== null) {
      if (h !== prevHome.current || a !== prevAway.current) {
        setGoalFlash(true);
        const t = setTimeout(() => setGoalFlash(false), 2000);
        return () => clearTimeout(t);
      }
    }
    prevHome.current = h;
    prevAway.current = a;
  }, [fixture?.goalsHome, fixture?.goalsAway]);

  if (!fixtureIdNum) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <p className="text-white/60 text-sm">Parâmetro ?fixture=ID necessário</p>
      </OBSLayout>
    );
  }

  if (isLoading) {
    return (
      <OBSLayout className="flex items-center justify-center p-2">
        <LoadingSpinner size="sm" />
      </OBSLayout>
    );
  }

  if (error || !fixture) {
    return (
      <OBSLayout className="flex items-center justify-center p-2">
        <div className="animate-pulse text-white/40 text-sm">Carregando...</div>
      </OBSLayout>
    );
  }

  const homeScore = fixture.goalsHome ?? 0;
  const awayScore = fixture.goalsAway ?? 0;
  const isNotStarted = fixture.status === 'NS';

  return (
    <OBSLayout className="flex items-center justify-center p-1">
      <div
        className={cn(
          'rounded-lg px-8 py-2 flex items-center justify-center gap-4 transition-all duration-300',
          goalFlash && 'scale-110'
        )}
        style={{
          background: goalFlash
            ? 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(212,168,83,0.4) 100%)'
            : 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: `1px solid ${goalFlash ? 'rgba(255,255,255,0.6)' : 'rgba(212,168,83,0.4)'}`,
        }}
      >
        <span className={cn(
          'font-heading text-5xl font-bold tabular-nums text-white transition-transform duration-300',
          goalFlash && 'scale-110'
        )}>
          {isNotStarted ? 0 : homeScore}
        </span>
        <span className="font-heading text-3xl" style={{ color: 'rgba(212,168,83,0.8)' }}>
          ×
        </span>
        <span className={cn(
          'font-heading text-5xl font-bold tabular-nums text-white transition-transform duration-300',
          goalFlash && 'scale-110'
        )}>
          {isNotStarted ? 0 : awayScore}
        </span>
      </div>
    </OBSLayout>
  );
};

export default ObsScore;
