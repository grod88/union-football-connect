/**
 * NextMatchCard Component
 * Displays the next match with countdown, timezones, and calendar buttons
 * Uses real API data from useNextMatch hook
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useNextMatch } from '@/application/hooks/useNextMatch';
import { getMatchTimezones, formatMatchDate } from '@/application/services/timezone.service';
import { downloadICSFile, getGoogleCalendarUrl } from '@/application/services/calendar.service';
import { TeamBadge } from './TeamBadge';
import type { Fixture } from '@/core/domain/entities/fixture';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeRemaining = (targetDate: Date): TimeRemaining => {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const items = [
    { value: timeLeft.days, label: 'Dias' },
    { value: timeLeft.hours, label: 'Horas' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Seg' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-md mx-auto mb-8">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="card-surface rounded-lg p-3 sm:p-4 gold-border border">
            <span className="font-heading text-3xl sm:text-5xl gold-text">
              {String(item.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-2 block uppercase tracking-wider">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

interface NextMatchCardProps {
  teamId?: number;
  fixture?: Fixture;
  youtubeLink?: string;
  className?: string;
}

export const NextMatchCard = ({
  teamId,
  fixture: fixtureProp,
  youtubeLink = '',
  className = '',
}: NextMatchCardProps) => {
  const { data: fetchedFixture, isLoading, error } = useNextMatch({ teamId, enabled: !fixtureProp });
  const fixture = fixtureProp || fetchedFixture;

  if (isLoading && !fixtureProp) {
    return (
      <div className={`card-surface rounded-xl p-10 flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !fixture) {
    return (
      <div className={`card-surface rounded-xl p-10 text-center ${className}`}>
        <p className="text-muted-foreground">
          Não foi possível carregar o próximo jogo.
        </p>
      </div>
    );
  }

  const timezones = getMatchTimezones(fixture.date);
  const formattedDate = formatMatchDate(fixture.date);

  const handleDownloadICS = () => {
    downloadICSFile(fixture);
  };

  const handleGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(fixture), '_blank');
  };

  return (
    <motion.div
      className={`card-surface rounded-xl p-6 sm:p-10 gold-glow ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
    >
      {/* League info */}
      <div className="text-center mb-6">
        <span className="text-primary font-heading uppercase tracking-wider text-sm">
          {fixture.league.name}
          {fixture.league.round && ` — ${fixture.league.round}`}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8">
        <TeamBadge
          team={fixture.homeTeam}
          size="lg"
          namePosition="bottom"
          className="text-center"
        />
        <span className="font-heading text-4xl sm:text-5xl text-primary">VS</span>
        <TeamBadge
          team={fixture.awayTeam}
          size="lg"
          namePosition="bottom"
          className="text-center"
        />
      </div>

      {/* Date */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
        <Calendar size={16} />
        <span className="capitalize">{formattedDate}</span>
      </div>

      {/* Timezones */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {timezones.map((tz) => (
          <div
            key={tz.label}
            className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg"
          >
            <Clock size={14} className="text-primary" />
            <span className="text-sm text-muted-foreground">{tz.flag} {tz.label}</span>
            <span className="text-sm font-semibold text-foreground">{tz.time}</span>
          </div>
        ))}
      </div>

      {/* Countdown */}
      <CountdownTimer targetDate={fixture.date} />

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {youtubeLink && (
          <a
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 gold-gradient text-primary-foreground font-heading uppercase tracking-wider px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={18} />
            Assistir Live
          </a>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadICS}
            className="inline-flex items-center gap-2 border border-primary/30 text-primary font-heading uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-primary/10 transition-colors text-sm"
          >
            <Calendar size={16} />
            .ics
          </button>
          <button
            onClick={handleGoogleCalendar}
            className="inline-flex items-center gap-2 border border-primary/30 text-primary font-heading uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-primary/10 transition-colors text-sm"
          >
            <Calendar size={16} />
            Google
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NextMatchCard;
