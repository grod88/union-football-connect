/**
 * OBS Scoreboard Page
 * /obs/placar?fixture=FIXTURE_ID
 *
 * Displays: team badges, score, match time with goal flash animation
 * Transparent background for OBS Browser Source
 * Auto-refreshes every 15 seconds
 */
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { Scoreboard } from '@/presentation/components/match/Scoreboard';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';
import { cn } from '@/lib/utils';

const ObsScoreboard = () => {
  const [searchParams] = useSearchParams();
  const fixtureIdNum = parsePositiveInt(searchParams.get('fixture'));

  const {
    data: fixture,
    isLoading,
    error,
  } = useFixtureForOBS(fixtureIdNum);

  // Goal flash animation
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
        <p className="text-white/60 text-sm">
          Parâmetro ?fixture=ID necessário
        </p>
      </OBSLayout>
    );
  }

  if (isLoading) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </OBSLayout>
    );
  }

  if (error || !fixture) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <div className="animate-pulse text-white/40 text-sm">Carregando...</div>
      </OBSLayout>
    );
  }

  return (
    <div className="bg-transparent p-2">
      <div
        className={cn(
          'rounded-xl overflow-hidden p-6 transition-all duration-300',
          goalFlash && 'scale-105'
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: `1px solid ${goalFlash ? 'rgba(212,168,83,0.4)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <Scoreboard
          fixture={fixture}
          size="lg"
          variant="obs"
          showTimer={true}
          showLiveBadge={false}
        />
      </div>
    </div>
  );
};

export default ObsScoreboard;
