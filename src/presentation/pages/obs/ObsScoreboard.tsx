/**
 * OBS Scoreboard Page
 * /obs/placar?fixture=FIXTURE_ID
 *
 * Displays: team badges, score, match time
 * Transparent background for OBS Browser Source
 * Auto-refreshes every 15 seconds
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { Scoreboard } from '@/presentation/components/match/Scoreboard';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { parsePositiveInt } from '@/lib/validation';

const ObsScoreboard = () => {
  const [searchParams] = useSearchParams();
  const fixtureIdNum = parsePositiveInt(searchParams.get('fixture'));

  const {
    data: fixture,
    isLoading,
    error,
    refetch,
  } = useFixtureForOBS(fixtureIdNum);

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
        <ErrorMessage
          message="Erro ao carregar jogo"
          onRetry={() => refetch()}
        />
      </OBSLayout>
    );
  }

  return (
    <OBSLayout className="flex items-center justify-center p-6">
      <Scoreboard
        fixture={fixture}
        size="lg"
        variant="obs"
        showTimer={true}
        showLiveBadge={false}
      />
    </OBSLayout>
  );
};

export default ObsScoreboard;
