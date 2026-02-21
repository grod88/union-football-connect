/**
 * OBS Match Time Widget
 * /obs/tempo?fixture=FIXTURE_ID
 * Displays match elapsed time and status
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';
import { getElapsedDisplay } from '@/core/domain/entities/fixture';
import { getMatchStatusText, isMatchLive } from '@/core/domain/enums/match-status';

const ObsMatchTime = () => {
  const [searchParams] = useSearchParams();
  const fixtureIdNum = parsePositiveInt(searchParams.get('fixture'));

  const { data: fixture, isLoading, error, refetch } = useFixtureForOBS(fixtureIdNum);

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
        <ErrorMessage message="Erro" onRetry={() => refetch()} />
      </OBSLayout>
    );
  }

  const elapsed = getElapsedDisplay(fixture);
  const statusText = getMatchStatusText(fixture.status);
  const isLive = isMatchLive(fixture.status);

  return (
    <OBSLayout className="flex items-center justify-center p-1">
      <div
        className="rounded-lg px-6 py-2 flex items-center justify-center gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(212,168,83,0.4)',
        }}
      >
        {elapsed ? (
          <span
            className="font-mono text-2xl font-bold tabular-nums"
            style={{ color: isLive ? '#c0392b' : 'rgba(255,255,255,0.9)' }}
          >
            {elapsed}
          </span>
        ) : null}
        <span
          className="font-heading text-sm uppercase tracking-widest font-semibold"
          style={{ color: isLive ? '#c0392b' : 'rgba(212,168,83,0.85)' }}
        >
          {statusText}
        </span>
      </div>
    </OBSLayout>
  );
};

export default ObsMatchTime;
