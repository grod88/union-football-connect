/**
 * TeamBadge Component
 * Displays team logo with name
 */
import { cn } from '@/lib/utils';
import type { Team } from '@/core/domain/entities/team';

interface TeamBadgeProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
  namePosition?: 'bottom' | 'right';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const nameSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const TeamBadge = ({
  team,
  size = 'md',
  showName = true,
  className,
  namePosition = 'bottom',
}: TeamBadgeProps) => {
  const isHorizontal = namePosition === 'right';

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      <img
        src={team.logo}
        alt={team.name}
        className={cn('object-contain', sizeClasses[size])}
        loading="lazy"
      />
      {showName && (
        <span
          className={cn(
            'font-heading uppercase text-foreground text-center',
            nameSizeClasses[size]
          )}
        >
          {team.shortName || team.name}
        </span>
      )}
    </div>
  );
};

export default TeamBadge;
