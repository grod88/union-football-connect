/**
 * OBS Home Team Widget
 * /obs/home?fixture=FIXTURE_ID
 * Displays home team name with logo watermark background
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';

const ObsHomeTeam = () => {
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

  return (
    <OBSLayout className="flex items-center justify-center p-1">
      <div
        className="relative overflow-hidden rounded-lg px-6 py-3 min-w-[180px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(212,168,83,0.4)',
        }}
      >
        {/* Watermark logo */}
        <img
          src={fixture.homeTeam.logo}
          alt=""
          className="absolute inset-0 m-auto w-16 h-16 opacity-15 pointer-events-none select-none"
          style={{ filter: 'grayscale(50%)' }}
        />
        <span
          className="relative font-heading text-base sm:text-lg uppercase tracking-wider font-bold text-white z-10"
        >
          {fixture.homeTeam.name}
        </span>
      </div>
    </OBSLayout>
  );
};

export default ObsHomeTeam;
