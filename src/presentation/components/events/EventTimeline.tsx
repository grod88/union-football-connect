/**
 * EventTimeline Component
 * Vertical timeline of match events
 */
import { cn } from '@/lib/utils';
import type { FixtureEvent } from '@/core/domain/entities/event';
import { sortEventsByTime } from '@/core/domain/entities/event';
import { EventItem } from './EventItem';

interface EventTimelineProps {
  events: FixtureEvent[];
  homeTeamId: number;
  className?: string;
  variant?: 'default' | 'obs';
  maxEvents?: number;
}

export const EventTimeline = ({
  events,
  homeTeamId,
  className,
  variant = 'default',
  maxEvents,
}: EventTimelineProps) => {
  const sortedEvents = sortEventsByTime(events);
  const displayEvents = maxEvents
    ? sortedEvents.slice(-maxEvents) // Show most recent events
    : sortedEvents;

  if (displayEvents.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        Nenhum evento registrado
      </div>
    );
  }

  if (variant === 'obs') {
    return (
      <div className={cn('flex flex-col divide-y divide-white/10', className)}>
        {displayEvents.map((event) => (
          <EventItem
            key={`${event.timeElapsed}-${event.player.name}-${event.type}`}
            event={event}
            isHomeTeam={event.team.id === homeTeamId}
            variant="obs"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {displayEvents.map((event) => (
        <EventItem
          key={`${event.timeElapsed}-${event.player.name}-${event.type}`}
          event={event}
          isHomeTeam={event.team.id === homeTeamId}
          variant="default"
        />
      ))}
    </div>
  );
};

export default EventTimeline;
