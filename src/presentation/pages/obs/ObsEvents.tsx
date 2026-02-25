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
import { parsePositiveInt } from '@/lib/validation';

const ObsEvents = () => {
  const [searchParams] = useSearchParams();
  const maxEvents = parsePositiveInt(searchParams.get('max'), 10)!;
  const fixtureIdNum = parsePositiveInt(searchParams.get('fixture'));

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

  if (!fixtureIdNum) {
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
        <div className="animate-pulse text-white/40 text-sm">Carregando...</div>
      </OBSLayout>
    );
  }

  if (error) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <div className="animate-pulse text-white/40 text-sm">Carregando...</div>
      </OBSLayout>
    );
  }

  return (
    <OBSLayout className="p-2">
      <div
        className="rounded-xl overflow-hidden p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
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
      </div>
    </OBSLayout>
  );
};

export default ObsEvents;
