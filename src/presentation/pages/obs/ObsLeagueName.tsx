/**
 * OBS League Name Widget
 * /obs/liga?fixture=FIXTURE_ID
 * Displays league name + round in a styled bar
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';

const ObsLeagueName = () => {
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
        <ErrorMessage message="Erro ao carregar" onRetry={() => refetch()} />
      </OBSLayout>
    );
  }

  const roundText = fixture.league.round
    ? ` — ${fixture.league.round}`
    : '';

  return (
    <OBSLayout className="flex items-center justify-center p-1">
      <div
        className="px-6 py-2 rounded-lg text-center w-full max-w-[500px]"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(212,168,83,0.4)',
        }}
      >
        <span
          className="font-heading text-sm sm:text-base uppercase tracking-widest font-bold"
          style={{ color: 'rgba(212,168,83,0.95)' }}
        >
          {fixture.league.name}{roundText}
        </span>
      </div>
    </OBSLayout>
  );
};

export default ObsLeagueName;
