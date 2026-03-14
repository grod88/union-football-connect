/**
 * MatchStatus Component
 * Displays match status badge
 */
import { cn } from '@/lib/utils';
import { MatchStatus as MatchStatusEnum, getMatchStatusText, isMatchLive, isMatchFinished } from '@/core/domain/enums/match-status';

interface MatchStatusProps {
  status: MatchStatusEnum;
  className?: string;
  locale?: 'pt-BR' | 'en';
}

export const MatchStatus = ({
  status,
  className,
  locale = 'pt-BR',
}: MatchStatusProps) => {
  const text = getMatchStatusText(status, locale);
  const isLive = isMatchLive(status);
  const isFinished = isMatchFinished(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider',
        isLive && 'bg-red-600 text-white animate-pulse',
        isFinished && 'bg-muted text-muted-foreground',
        !isLive && !isFinished && 'bg-primary/10 text-primary',
        className
      )}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {text}
    </span>
  );
};

export default MatchStatus;
