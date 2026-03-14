/**
 * Timezone Service
 * Handles timezone conversions for the app
 * Shows times in BRT (Brazil), NZDT (New Zealand), and visitor's local time
 */

export interface TimezoneDisplay {
  label: string;
  labelEn: string;
  time: string;
  flag: string;
}

// Fixed timezones for the app
export const TIMEZONES = {
  BRAZIL: 'America/Sao_Paulo',
  NEW_ZEALAND: 'Pacific/Auckland',
} as const;

/**
 * Format a date in a specific timezone
 */
export const formatInTimezone = (
  date: Date | string | number,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };

  try {
    return dateObj.toLocaleTimeString('pt-BR', defaultOptions);
  } catch {
    return '--:--';
  }
};

/**
 * Get the visitor's local timezone
 */
export const getLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/**
 * Get timezone displays for a match (Brazil, NZ, Local)
 */
export const getMatchTimezones = (date: Date | string | number): TimezoneDisplay[] => {
  const localTz = getLocalTimezone();

  return [
    {
      label: 'Brasil',
      labelEn: 'Brazil',
      time: formatInTimezone(date, TIMEZONES.BRAZIL),
      flag: '🇧🇷',
    },
    {
      label: 'Nova Zelândia',
      labelEn: 'New Zealand',
      time: formatInTimezone(date, TIMEZONES.NEW_ZEALAND),
      flag: '🇳🇿',
    },
    {
      label: 'Seu horário',
      labelEn: 'Your time',
      time: formatInTimezone(date, localTz),
      flag: '📍',
    },
  ];
};

/**
 * Format date for display (full date with day of week)
 */
export const formatMatchDate = (
  date: Date | string | number,
  locale: 'pt-BR' | 'en' = 'pt-BR'
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);

  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format short date (day/month)
 */
export const formatShortDate = (
  date: Date | string | number,
  locale: 'pt-BR' | 'en' = 'pt-BR'
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);

  return dateObj.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
  });
};

/**
 * Get relative time (e.g., "em 2 dias", "há 3 horas")
 */
export const getRelativeTime = (
  date: Date | string | number,
  locale: 'pt-BR' | 'en' = 'pt-BR'
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return rtf.format(diffMinutes, 'minute');
    }
    return rtf.format(diffHours, 'hour');
  }

  return rtf.format(diffDays, 'day');
};
