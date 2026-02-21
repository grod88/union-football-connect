/**
 * LiveBadge Component
 * Animated "AO VIVO" badge with pulsing effect
 */
import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export const LiveBadge = ({
  className,
  size = 'md',
  text = 'AO VIVO',
}: LiveBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded',
        'bg-red-600 text-white',
        'animate-pulse',
        sizeClasses[size],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      {text}
    </span>
  );
};

export default LiveBadge;
