/**
 * Poll Component
 * Interactive poll display with voting
 */
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Poll as PollType } from '@/application/services/poll.service';
import { addVoteToPoll, simulateVotes } from '@/application/services/poll.service';
import { PollOption } from './PollOption';

interface PollProps {
  initialPoll: PollType;
  className?: string;
  variant?: 'default' | 'obs';
  simulateInitialVotes?: number;
}

export const Poll = ({
  initialPoll,
  className,
  variant = 'default',
  simulateInitialVotes = 0,
}: PollProps) => {
  const [poll, setPoll] = useState<PollType>(() => {
    if (simulateInitialVotes > 0) {
      return simulateVotes(initialPoll, simulateInitialVotes);
    }
    return initialPoll;
  });

  const handleVote = (optionId: string) => {
    setPoll((prev) => addVoteToPoll(prev, optionId));
  };

  if (variant === 'obs') {
    return (
      <div className={cn('flex flex-col gap-4 p-4', className)}>
        <h3 className="text-xl font-bold text-white text-center">
          {poll.question}
        </h3>

        <div className="flex flex-col gap-2">
          {poll.options.map((option) => (
            <PollOption
              key={option.id}
              option={option}
              totalVotes={poll.totalVotes}
              isSelected={poll.votedOptionId === option.id}
              hasVoted={poll.hasVoted}
              onVote={handleVote}
              variant="obs"
            />
          ))}
        </div>

        <p className="text-sm text-white/60 text-center">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'voto' : 'votos'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6 p-6 rounded-xl card-surface', className)}>
      <h3 className="text-2xl font-heading gold-text text-center">
        {poll.question}
      </h3>

      <div className="flex flex-col gap-3">
        {poll.options.map((option) => (
          <PollOption
            key={option.id}
            option={option}
            totalVotes={poll.totalVotes}
            isSelected={poll.votedOptionId === option.id}
            hasVoted={poll.hasVoted}
            onVote={handleVote}
            variant="default"
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {poll.totalVotes} {poll.totalVotes === 1 ? 'voto' : 'votos'}
      </p>
    </div>
  );
};

export default Poll;
