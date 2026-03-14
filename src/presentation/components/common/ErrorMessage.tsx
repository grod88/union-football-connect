/**
 * ErrorMessage Component
 * Displays error states with retry option
 */
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage = ({
  message = 'Ocorreu um erro ao carregar os dados',
  onRetry,
  className,
}: ErrorMessageProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-6 text-center',
        className
      )}
    >
      <AlertCircle className="w-12 h-12 text-red-500" />
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
