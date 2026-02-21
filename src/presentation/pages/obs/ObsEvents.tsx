/**
 * OBS Events Page
 * /obs/eventos?fixture=FIXTURE_ID
 *
 * Displays: timeline of match events (goals, cards, substitutions)
 * Transparent background for OBS Browser Source
 * Auto-refreshes every 15 seconds
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { EventTimeline } from '@/presentation/components/events/EventTimeline';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { useFixtureEventsForOBS } from '@/application/hooks/useFixtureEvents';

const ObsEvents = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = searchParams.get('fixture');
  const maxEvents = searchParams.get('max')
    ? parseInt(searchParams.get('max')!, 10)
    : 8;
  const fixtureIdNum = fixtureId ? parseInt(fixtureId, 10) : undefined;

  const {
    data: fixture,
    isLoading: isLoadingFixture,
  } = useFixtureForOBS(fixtureIdNum);

  const {
    data: events,
    isLoading: isLoadingEvents,
    error,
    refetch,
  } = useFixtureEventsForOBS(fixtureIdNum);

  if (!fixtureId) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <p className="text-white/60 text-sm">
          Parâmetro ?fixture=ID necessário
        </p>
      </OBSLayout>
    );
  }

  if (isLoadingFixture || isLoadingEvents) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </OBSLayout>
    );
  }

  if (error) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <ErrorMessage
          message="Erro ao carregar eventos"
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
            namePosition="right"
          />
          <span className="text-white/60 text-xs uppercase tracking-wider">
            Eventos
          </span>
          <TeamBadge
            team={fixture.awayTeam}
            size="sm"
            namePosition="right"
          />
        </div>
      )}

      {/* Events timeline */}
      {fixture && events && (
        <EventTimeline
          events={events}
          homeTeamId={fixture.homeTeam.id}
          variant="obs"
          maxEvents={maxEvents}
        />
      )}

      {events?.length === 0 && (
        <div className="text-center py-8 text-white/40">
          Aguardando eventos...
        </div>
      )}
    </OBSLayout>
  );
};

export default ObsEvents;
