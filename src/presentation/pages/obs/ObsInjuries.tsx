import { useSearchParams } from 'react-router-dom';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { useInjuries } from '@/application/hooks/useInjuries';
import { HeartPulse } from 'lucide-react';
import type { Injury } from '@/core/domain/entities/injury';

const InjuryRow = ({ injury }: { injury: Injury }) => {
  const isSuspension = injury.player?.type?.toLowerCase().includes('suspen') || injury.player?.reason?.toLowerCase().includes('card');
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSuspension ? 'bg-yellow-400' : 'bg-red-500'}`} />
      {injury.player?.photo && (
        <img src={injury.player.photo} alt="" className="w-5 h-5 rounded-full object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-white/80 text-xs truncate font-semibold">{injury.player?.name ?? 'Desconhecido'}</div>
        <div className="text-white/30 text-[9px] truncate">{injury.player?.reason}</div>
      </div>
    </div>
  );
};

const ObsInjuries = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = Number(searchParams.get('fixture')) || 0;

  const { data: fixture } = useFixtureForOBS(fixtureId);
  const homeTeamId = fixture?.homeTeam?.id ?? 0;
  const { homeInjuries, awayInjuries, total, isLoading } = useInjuries(fixtureId, homeTeamId, !!fixture);

  if (!fixtureId) return null;

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
          <HeartPulse className="w-4 h-4 text-amber-400" />
          <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Desfalques</span>
        </div>

        {isLoading ? (
          <div className="text-white/40 text-xs text-center py-4">Carregando...</div>
        ) : total === 0 ? (
          <div className="text-white/30 text-xs text-center py-4">Sem desfalques registrados</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-2 text-center">
                {fixture?.homeTeam?.name}
              </div>
              {homeInjuries.length === 0 ? (
                <div className="text-white/20 text-[10px] text-center">—</div>
              ) : (
                homeInjuries.map((inj, i) => <InjuryRow key={i} injury={inj} />)
              )}
            </div>
            <div>
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-2 text-center">
                {fixture?.awayTeam?.name}
              </div>
              {awayInjuries.length === 0 ? (
                <div className="text-white/20 text-[10px] text-center">—</div>
              ) : (
                awayInjuries.map((inj, i) => <InjuryRow key={i} injury={inj} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObsInjuries;
