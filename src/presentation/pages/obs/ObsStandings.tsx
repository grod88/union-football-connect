import { useSearchParams } from 'react-router-dom';
import { useStandings } from '@/application/hooks/useStandings';
import { Trophy } from 'lucide-react';

const ObsStandings = () => {
  const [searchParams] = useSearchParams();
  const leagueId = Number(searchParams.get('league')) || 71;
  const season = Number(searchParams.get('season')) || 2026;
  const max = Number(searchParams.get('max')) || 0;
  const highlightId = Number(searchParams.get('highlight')) || 0;

  const { data: standings, isLoading } = useStandings({ leagueId, season });

  const rows = standings?.standings?.[0] ?? [];
  const displayRows = max > 0 ? rows.slice(0, max) : rows;

  return (
    <div className="bg-transparent p-2">
      <div
        className="rounded-xl overflow-hidden p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-white/80 text-xs uppercase tracking-widest font-bold">
            {standings?.leagueName ?? 'Classificação'}
          </span>
        </div>

        {isLoading ? (
          <div className="text-white/40 text-xs text-center py-4">Carregando...</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 text-[9px] uppercase">
                <th className="text-left w-5 pb-1">#</th>
                <th className="text-left pb-1">Time</th>
                <th className="text-center pb-1 w-6">P</th>
                <th className="text-center pb-1 w-6">J</th>
                <th className="text-center pb-1 w-6">V</th>
                <th className="text-center pb-1 w-6">E</th>
                <th className="text-center pb-1 w-6">D</th>
                <th className="text-center pb-1 w-7">SG</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((entry) => {
                const isHighlighted = highlightId > 0 && entry.team.id === highlightId;
                return (
                  <tr
                    key={entry.team.id}
                    className={`border-t border-white/5 ${isHighlighted ? 'bg-amber-400/10' : ''}`}
                  >
                    <td className="py-1 text-white/40 font-mono">{entry.rank}</td>
                    <td className="py-1">
                      <div className="flex items-center gap-1.5">
                        {entry.team.logo && (
                          <img src={entry.team.logo} alt="" className="w-4 h-4 object-contain" />
                        )}
                        <span className={`truncate ${isHighlighted ? 'text-amber-400 font-bold' : 'text-white/80'}`}>
                          {entry.team.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-center text-white font-bold">{entry.points}</td>
                    <td className="text-center text-white/50">{entry.all.played}</td>
                    <td className="text-center text-emerald-400/70">{entry.all.win}</td>
                    <td className="text-center text-yellow-400/70">{entry.all.draw}</td>
                    <td className="text-center text-red-400/70">{entry.all.lose}</td>
                    <td className="text-center text-white/50">{entry.goalsDiff > 0 ? `+${entry.goalsDiff}` : entry.goalsDiff}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ObsStandings;
