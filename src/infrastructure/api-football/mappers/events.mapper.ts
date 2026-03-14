/**
 * Events Mapper
 * Converts API-Football events DTOs to domain entities
 */
import type { EventDTO } from '../dtos/events.dto';
import type { FixtureEvent } from '@/core/domain/entities/event';
import { EventType } from '@/core/domain/enums';

const mapEventType = (type: string): EventType => {
  switch (type.toLowerCase()) {
    case 'goal':
      return EventType.GOAL;
    case 'card':
      return EventType.CARD;
    case 'subst':
      return EventType.SUBSTITUTION;
    case 'var':
      return EventType.VAR;
    default:
      return EventType.VAR; // fallback
  }
};

export const mapEventFromDTO = (dto: EventDTO, fixtureId: number, index: number): FixtureEvent => {
  return {
    id: index, // API doesn't provide event IDs
    fixtureId,
    timeElapsed: dto.time.elapsed,
    timeExtra: dto.time.extra,
    team: {
      id: dto.team.id,
      name: dto.team.name,
      logo: dto.team.logo,
    },
    player: {
      id: dto.player.id,
      name: dto.player.name,
    },
    assist: dto.assist.name
      ? {
          id: dto.assist.id,
          name: dto.assist.name,
        }
      : null,
    type: mapEventType(dto.type),
    detail: dto.detail,
    comments: dto.comments,
  };
};

export const mapEventsFromDTO = (fixtureId: number, dtos: EventDTO[]): FixtureEvent[] => {
  return dtos.map((dto, index) => mapEventFromDTO(dto, fixtureId, index));
};
