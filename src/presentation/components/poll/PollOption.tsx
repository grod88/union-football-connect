/**
 * PollOption Component
 * Single option in a poll with progress bar
 */
import { cn } from '@/lib/utils';
import type { PollOption as PollOptionType } from '@/application/services/poll.service';
import { getOptionPercentage } from '@/application/services/poll.service';

interface PollOptionProps {
  option: PollOptionType;
  totalVotes: number;
  isSelected: boolean;
  hasVoted: boolean;
  onVote: (optionId: string) => void;
  variant?: 'default' | 'obs';
}

export const PollOption = ({
  option,
  totalVotes,
  isSelected,
  hasVoted,
  onVote,
  variant = 'default',
}: PollOptionProps) => {
  const percentage = getOptionPercentage(option, totalVotes);

  if (variant === 'obs') {
    return (
      <button
        onClick={() => !hasVoted && onVote(option.id)}
        disabled={hasVoted}
        className={cn(
          'relative w-full py-3 px-4 rounded-lg overflow-hidden transition-all',
          hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02]',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        {/* Background progress bar */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-500',
            isSelected ? 'bg-primary/40' : 'bg-white/20'
          )}
          style={{ width: hasVoted ? `${percentage}%` : '0%' }}
        />

        {/* Content */}
        <div className="relative flex justify-between items-center">
          <span className="font-bold text-white">{option.text}</span>
          {hasVoted && (
            <span className="font-mono font-bold text-white">{percentage}%</span>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => !hasVoted && onVote(option.id)}
      disabled={hasVoted}
      className={cn(
        'relative w-full py-4 px-6 rounded-xl overflow-hidden transition-all',
        'border border-primary/30',
        hasVoted ? 'cursor-default' : 'cursor-pointer hover:border-primary hover:bg-primary/5',
        isSelected && 'border-primary bg-primary/10'
      )}
    >
      {/* Background progress bar */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-500',
          isSelected ? 'bg-primary/20' : 'bg-muted/50'
        )}
        style={{ width: hasVoted ? `${percentage}%` : '0%' }}
      />

      {/* Content */}
      <div className="relative flex justify-between items-center">
        <span className="font-semibold text-foreground">{option.text}</span>
        {hasVoted && (
          <span className="font-mono font-bold gold-text">{percentage}%</span>
        )}
      </div>
    </button>
  );
};

export default PollOption;
