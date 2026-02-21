/**
 * OBS Score Widget
 * /obs/score?fixture=FIXTURE_ID
 * Displays only the score (no badges, no timer)
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';

const ObsScore = () => {
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

  const homeScore = fixture.goalsHome ?? '-';
  const awayScore = fixture.goalsAway ?? '-';

  return (
    <OBSLayout className="flex items-center justify-center p-1">
      <div
        className="rounded-lg px-8 py-2 flex items-center justify-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(212,168,83,0.4)',
        }}
      >
        <span className="font-heading text-5xl font-bold tabular-nums text-white">
          {homeScore}
        </span>
        <span className="font-heading text-3xl" style={{ color: 'rgba(212,168,83,0.8)' }}>
          ×
        </span>
        <span className="font-heading text-5xl font-bold tabular-nums text-white">
          {awayScore}
        </span>
      </div>
    </OBSLayout>
  );
};

export default ObsScore;
