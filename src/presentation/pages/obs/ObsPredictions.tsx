import { useSearchParams } from 'react-router-dom';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { usePredictions } from '@/application/hooks/usePredictions';
import { parsePercentage } from '@/core/domain/entities/prediction';
import { TrendingUp } from 'lucide-react';

const ComparisonBar = ({ label, home, away }: { label: string; home: string; away: string }) => {
  const h = parsePercentage(home);
  const a = parsePercentage(away);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px]">
        <span className="text-white/50">{home}</span>
        <span className="text-white/30 uppercase tracking-wider">{label}</span>
        <span className="text-white/50">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="bg-emerald-500/70 transition-all" style={{ width: `${h}%` }} />
        <div className="flex-1" />
        <div className="bg-red-500/70 transition-all" style={{ width: `${a}%` }} />
      </div>
    </div>
  );
};

const ObsPredictions = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = Number(searchParams.get('fixture')) || 0;

  const { data: fixture } = useFixtureForOBS(fixtureId);
  const { prediction, isLoading } = usePredictions(fixtureId, !!fixture);

  if (!fixtureId) return null;

  const pHome = parsePercentage(prediction?.percentages?.home ?? null);
  const pDraw = parsePercentage(prediction?.percentages?.draw ?? null);
  const pAway = parsePercentage(prediction?.percentages?.away ?? null);

  return (
    <div className="bg-transparent p-2">
      <div
        className="rounded-xl overflow-hidden p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Predição</span>
        </div>

        {isLoading ? (
          <div className="text-white/40 text-xs text-center py-4">Carregando...</div>
        ) : !prediction ? (
          <div className="text-white/30 text-xs text-center py-4">Predição indisponível</div>
        ) : (
          <div className="space-y-4">
            {/* Probability bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/60">{fixture?.homeTeam?.name}</span>
                <span className="text-white/30">Empate</span>
                <span className="text-white/60">{fixture?.awayTeam?.name}</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 flex items-center justify-center" style={{ width: `${pHome}%` }}>
                  <span className="text-[8px] text-white font-bold">{pHome}%</span>
                </div>
                <div className="bg-yellow-500/80 flex items-center justify-center" style={{ width: `${pDraw}%` }}>
                  <span className="text-[8px] text-black/70 font-bold">{pDraw}%</span>
                </div>
                <div className="bg-red-500 flex items-center justify-center" style={{ width: `${pAway}%` }}>
                  <span className="text-[8px] text-white font-bold">{pAway}%</span>
                </div>
              </div>
            </div>

            {/* Advice */}
            {prediction.advice && (
              <div className="text-center text-white/60 text-[11px] italic bg-white/5 rounded-lg px-3 py-1.5">
                {prediction.advice}
              </div>
            )}

            {/* Comparison bars */}
            <div className="space-y-2">
              <ComparisonBar label="Forma" home={prediction.comparison.form.home} away={prediction.comparison.form.away} />
              <ComparisonBar label="Ataque" home={prediction.comparison.attack.home} away={prediction.comparison.attack.away} />
              <ComparisonBar label="Defesa" home={prediction.comparison.defense.home} away={prediction.comparison.defense.away} />
              <ComparisonBar label="H2H" home={prediction.comparison.headToHead.home} away={prediction.comparison.headToHead.away} />
              <ComparisonBar label="Gols" home={prediction.comparison.goals.home} away={prediction.comparison.goals.away} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObsPredictions;
