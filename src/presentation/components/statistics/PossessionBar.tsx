/**
 * PossessionBar Component
 * Special prominent display for ball possession
 */
import { cn } from '@/lib/utils';
import type { Team } from '@/core/domain/entities/team';

interface PossessionBarProps {
  homeTeam: Team;
  awayTeam: Team;
  homePossession: number;
  awayPossession: number;
  className?: string;
  variant?: 'default' | 'obs';
}

export const PossessionBar = ({
  homeTeam,
  awayTeam,
  homePossession,
  awayPossession,
  className,
  variant = 'default',
}: PossessionBarProps) => {
  if (variant === 'obs') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6" />
            <span className="font-bold text-2xl text-white tabular-nums">
              {homePossession}%
            </span>
          </div>
          <span className="text-white/60 text-sm uppercase tracking-wider">
            Posse de Bola
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl text-white tabular-nums">
              {awayPossession}%
            </span>
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6" />
          </div>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-white/10">
          <div
            className="bg-primary transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${homePossession}%` }}
          >
            {homePossession > 20 && (
              <span className="text-xs font-bold text-primary-foreground">
                {homePossession}%
              </span>
            )}
          </div>
          <div
            className="bg-red-500 transition-all duration-500 flex items-center justify-start pl-2"
            style={{ width: `${awayPossession}%` }}
          >
            {awayPossession > 20 && (
              <span className="text-xs font-bold text-white">
                {awayPossession}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8" />
          <span className="font-bold text-3xl gold-text tabular-nums">
            {homePossession}%
          </span>
        </div>
        <span className="text-muted-foreground text-sm uppercase tracking-wider">
          Posse de Bola
        </span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-3xl gold-text tabular-nums">
            {awayPossession}%
          </span>
          <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8" />
        </div>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
        <div
          className="bg-primary transition-all duration-500"
          style={{ width: `${homePossession}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${awayPossession}%` }}
        />
      </div>
    </div>
  );
};

export default PossessionBar;
