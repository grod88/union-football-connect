/**
 * OBS Stats Page
 * /obs/stats?fixture=FIXTURE_ID
 *
 * Displays: horizontal comparison bars for match statistics
 * Transparent background for OBS Browser Source
 * Auto-refreshes every 30 seconds
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { StatComparison } from '@/presentation/components/statistics/StatComparison';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { useFixtureStatisticsForOBS } from '@/application/hooks/useFixtureStatistics';

const ObsStats = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = searchParams.get('fixture');
  const fixtureIdNum = fixtureId ? parseInt(fixtureId, 10) : undefined;

  const {
    data: fixture,
    isLoading: isLoadingFixture,
  } = useFixtureForOBS(fixtureIdNum);

  const {
    data: statistics,
    isLoading: isLoadingStats,
    error,
    refetch,
  } = useFixtureStatisticsForOBS(fixtureIdNum);

  if (!fixtureId) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <p className="text-white/60 text-sm">
          Parâmetro ?fixture=ID necessário
        </p>
      </OBSLayout>
    );
  }

  if (isLoadingFixture || isLoadingStats) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </OBSLayout>
    );
  }

  if (error || !statistics) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <ErrorMessage
          message="Estatísticas não disponíveis"
          onRetry={() => refetch()}
        />
      </OBSLayout>
    );
  }

  return (
    <OBSLayout className="p-4">
      {/* Team headers */}
      {fixture && (
        <div className="flex justify-between items-center mb-4 px-2">
          <TeamBadge
            team={fixture.homeTeam}
            size="sm"
            showName={false}
          />
          <span className="text-white/60 text-xs uppercase tracking-wider">
            Estatísticas
          </span>
          <TeamBadge
            team={fixture.awayTeam}
            size="sm"
            showName={false}
          />
        </div>
      )}

      {/* Statistics bars */}
      <StatComparison
        statistics={statistics}
        variant="obs"
        maxStats={7}
      />
    </OBSLayout>
  );
};

export default ObsStats;
