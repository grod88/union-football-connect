/**
 * EventIcon Component
 * Visual icon for match events (goals, cards, substitutions)
 */
import { cn } from '@/lib/utils';
import { EventType, getEventIcon, isRedCard, isYellowCard } from '@/core/domain/enums/event-type';

interface EventIconProps {
  type: EventType;
  detail: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export const EventIcon = ({
  type,
  detail,
  size = 'md',
  className,
}: EventIconProps) => {
  // For cards, we can show colored divs instead of emoji
  if (type === EventType.CARD) {
    const isRed = isRedCard(detail);
    return (
      <div
        className={cn(
          'rounded-sm',
          isRed ? 'bg-red-500' : 'bg-yellow-400',
          size === 'sm' && 'w-3 h-4',
          size === 'md' && 'w-4 h-5',
          size === 'lg' && 'w-5 h-6',
          className
        )}
      />
    );
  }

  // For other events, use emoji
  const icon = getEventIcon(type, detail);

  return (
    <span className={cn(sizeClasses[size], className)} role="img" aria-label={detail}>
      {icon}
    </span>
  );
};

export default EventIcon;
