/**
 * EventItem Component
 * Single event display with icon, time, player, and details
 */
import { cn } from '@/lib/utils';
import type { FixtureEvent } from '@/core/domain/entities/event';
import { getEventTimeDisplay } from '@/core/domain/entities/event';
import { EventIcon } from './EventIcon';
import { EventType } from '@/core/domain/enums/event-type';

interface EventItemProps {
  event: FixtureEvent;
  isHomeTeam: boolean;
  className?: string;
  variant?: 'default' | 'obs';
}

export const EventItem = ({
  event,
  isHomeTeam,
  className,
  variant = 'default',
}: EventItemProps) => {
  const time = getEventTimeDisplay(event);

  // For substitutions, show player out → player in
  const playerDisplay =
    event.type === EventType.SUBSTITUTION && event.assist?.name
      ? `${event.assist.name} → ${event.player.name}`
      : event.player.name;

  if (variant === 'obs') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 py-2',
          isHomeTeam ? 'flex-row' : 'flex-row-reverse',
          className
        )}
      >
        <span className="text-base font-bold font-mono text-white/60 w-12 text-center">
          {time}
        </span>
        <EventIcon type={event.type} detail={event.detail} size="md" />
        <div
          className={cn(
            'flex flex-col',
            isHomeTeam ? 'items-start' : 'items-end'
          )}
        >
          <span className="text-lg font-bold text-white">
            {playerDisplay}
          </span>
          {event.detail && event.type === EventType.GOAL && (
            <span className="text-sm font-bold text-white/60">
              {event.assist?.name && `Assist: ${event.assist.name}`}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 py-3 px-4 rounded-lg bg-card/50',
        isHomeTeam ? 'flex-row' : 'flex-row-reverse',
        className
      )}
    >
      <span className="text-sm font-mono text-muted-foreground w-12 text-center">
        {time}
      </span>
      <EventIcon type={event.type} detail={event.detail} size="md" />
      <div
        className={cn(
          'flex flex-col flex-1',
          isHomeTeam ? 'items-start' : 'items-end'
        )}
      >
        <span className="font-semibold text-foreground">{playerDisplay}</span>
        {event.assist?.name && event.type === EventType.GOAL && (
          <span className="text-sm text-muted-foreground">
            Assist: {event.assist.name}
          </span>
        )}
        {event.comments && (
          <span className="text-xs text-muted-foreground">{event.comments}</span>
        )}
      </div>
      <img
        src={event.team.logo}
        alt={event.team.name}
        className="w-6 h-6 opacity-50"
      />
    </div>
  );
};

export default EventItem;
