/**
 * LoadingSpinner Component
 * Animated loading indicator with Union Football Live styling
 */
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export const LoadingSpinner = ({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-primary/20 border-t-primary',
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
