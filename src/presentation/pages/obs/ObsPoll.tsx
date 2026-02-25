/**
 * OBS Poll Page
 * /obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO
 *
 * Displays: interactive poll with question and options
 * Transparent background for OBS Browser Source
 * Votes are stored in local state (not persisted)
 */
import { useSearchParams } from 'react-router-dom';
import { OBSLayout } from '@/presentation/components/layout/OBSLayout';
import { Poll } from '@/presentation/components/poll/Poll';
import { createPollFromParams } from '@/application/services/poll.service';
import { parsePositiveInt } from '@/lib/validation';

const ObsPoll = () => {
  const [searchParams] = useSearchParams();
  const poll = createPollFromParams(searchParams);

  // Get optional simulation parameter
  const simulateVotes = parsePositiveInt(searchParams.get('simular'), 0)!;

  if (!poll) {
    return (
      <OBSLayout className="flex items-center justify-center p-4">
        <div className="text-center text-white/60">
          <p className="text-sm mb-2">Parâmetros necessários:</p>
          <code className="text-xs bg-white/10 px-2 py-1 rounded">
            ?pergunta=...&opcao1=...&opcao2=...
          </code>
          <p className="text-xs mt-4">Exemplo:</p>
          <code className="text-xs bg-white/10 px-2 py-1 rounded block mt-1">
            ?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO
          </code>
        </div>
      </OBSLayout>
    );
  }

  return (
    <div className="bg-transparent p-2 flex items-center justify-center">
      <div
        className="rounded-xl overflow-hidden p-4 w-full max-w-md"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Poll
          initialPoll={poll}
          variant="obs"
          simulateInitialVotes={simulateVotes}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ObsPoll;
