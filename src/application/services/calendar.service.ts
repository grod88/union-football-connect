/**
 * Calendar Service
 * Generates .ics files for adding matches to calendar
 */
import type { Fixture } from '@/core/domain/entities/fixture';

/**
 * Generate ICS content for a fixture
 */
export const generateICSContent = (fixture: Fixture): string => {
  const startDate = fixture.date;
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const title = `${fixture.homeTeam.name} x ${fixture.awayTeam.name}`;
  const description = [
    `${fixture.league.name}${fixture.league.round ? ` - ${fixture.league.round}` : ''}`,
    '',
    'Assista ao vivo no Union Football Live!',
    'https://youtube.com/@UnionFootballLive',
    '',
    'O Futebol é Melhor Junto!',
  ].join('\\n');

  const location = fixture.venue
    ? `${fixture.venue.name}, ${fixture.venue.city}`
    : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Union Football Live//Match Calendar//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : '',
    `UID:fixture-${fixture.id}@unionfootball.live`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title} começa em 30 minutos!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
};

/**
 * Download ICS file for a fixture
 */
export const downloadICSFile = (fixture: Fixture): void => {
  const icsContent = generateICSContent(fixture);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const filename = `union-football-${fixture.homeTeam.name}-vs-${fixture.awayTeam.name}.ics`
    .toLowerCase()
    .replace(/\s+/g, '-');

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL for a fixture
 */
export const getGoogleCalendarUrl = (fixture: Fixture): string => {
  const startDate = fixture.date;
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: `${fixture.league.name}\n\nAssista ao vivo: https://youtube.com/@UnionFootballLive`,
    location: fixture.venue ? `${fixture.venue.name}, ${fixture.venue.city}` : '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
