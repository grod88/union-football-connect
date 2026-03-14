/**
 * Poll Service
 * Simple local state management for polls (OBS overlay)
 * No persistence - votes are lost on page refresh
 */

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  votedOptionId: string | null;
}

/**
 * Create a poll from URL parameters
 * Example: ?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO&opcao3=Não+sei
 */
export const createPollFromParams = (searchParams: URLSearchParams): Poll | null => {
  const question = searchParams.get('pergunta');
  if (!question) return null;

  const options: PollOption[] = [];

  for (let i = 1; i <= 4; i++) {
    const optionText = searchParams.get(`opcao${i}`);
    if (optionText) {
      options.push({
        id: `option-${i}`,
        text: optionText,
        votes: 0,
      });
    }
  }

  if (options.length < 2) return null;

  return {
    question,
    options,
    totalVotes: 0,
    hasVoted: false,
    votedOptionId: null,
  };
};

/**
 * Calculate percentage for an option
 */
export const getOptionPercentage = (option: PollOption, totalVotes: number): number => {
  if (totalVotes === 0) return 0;
  return Math.round((option.votes / totalVotes) * 100);
};

/**
 * Add a vote to a poll (returns new poll state)
 */
export const addVoteToPoll = (poll: Poll, optionId: string): Poll => {
  if (poll.hasVoted) return poll;

  const newOptions = poll.options.map((opt) =>
    opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
  );

  return {
    ...poll,
    options: newOptions,
    totalVotes: poll.totalVotes + 1,
    hasVoted: true,
    votedOptionId: optionId,
  };
};

/**
 * Simulate random votes (for demo/testing)
 */
export const simulateVotes = (poll: Poll, count: number = 10): Poll => {
  let newPoll = { ...poll };

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * poll.options.length);
    const randomOptionId = poll.options[randomIndex].id;

    newPoll = {
      ...newPoll,
      options: newPoll.options.map((opt) =>
        opt.id === randomOptionId ? { ...opt, votes: opt.votes + 1 } : opt
      ),
      totalVotes: newPoll.totalVotes + 1,
    };
  }

  return newPoll;
};
