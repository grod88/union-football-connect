import { useSearchParams } from 'react-router-dom';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { useH2H } from '@/application/hooks/useH2H';
import { Swords } from 'lucide-react';
import { format } from 'date-fns';

const ObsH2H = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = Number(searchParams.get('fixture')) || 0;

  const { data: fixture } = useFixtureForOBS(fixtureId);
  const homeId = fixture?.homeTeam?.id ?? 0;
  const awayId = fixture?.awayTeam?.id ?? 0;

  const { matches, stats, isLoading } = useH2H(homeId, awayId, 6);

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
          <Swords className="w-4 h-4 text-amber-400" />
          <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Confronto Direto</span>
        </div>

        {isLoading ? (
          <div className="text-white/40 text-xs text-center py-4">Carregando...</div>
        ) : stats.total === 0 ? (
          <div className="text-white/30 text-xs text-center py-4">Sem confrontos anteriores</div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-center gap-4 text-center">
              <div>
                <div className="text-emerald-400 text-lg font-bold">{stats.team1Wins}</div>
                <div className="text-white/40 text-[9px] uppercase">{fixture?.homeTeam?.name}</div>
              </div>
              <div>
                <div className="text-yellow-400/80 text-lg font-bold">{stats.draws}</div>
                <div className="text-white/40 text-[9px] uppercase">Empates</div>
              </div>
              <div>
                <div className="text-red-400 text-lg font-bold">{stats.team2Wins}</div>
                <div className="text-white/40 text-[9px] uppercase">{fixture?.awayTeam?.name}</div>
              </div>
            </div>

            {/* Match list */}
            <div className="space-y-1">
              {matches.map((m) => {
                const dateStr = m.date ? format(new Date(m.date), 'dd/MM/yy') : '';
                return (
                  <div key={m.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5">
                    <span className="text-white/30 text-[9px] w-12">{dateStr}</span>
                    <div className="flex-1 flex items-center justify-end gap-1">
                      <span className="text-white/70 text-xs truncate text-right">{m.homeTeam.name}</span>
                      {m.homeTeam.logo && <img src={m.homeTeam.logo} alt="" className="w-4 h-4 object-contain" />}
                    </div>
                    <span className="text-white font-bold text-xs px-1.5">
                      {m.goalsHome ?? 0} - {m.goalsAway ?? 0}
                    </span>
                    <div className="flex-1 flex items-center gap-1">
                      {m.awayTeam.logo && <img src={m.awayTeam.logo} alt="" className="w-4 h-4 object-contain" />}
                      <span className="text-white/70 text-xs truncate">{m.awayTeam.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObsH2H;
