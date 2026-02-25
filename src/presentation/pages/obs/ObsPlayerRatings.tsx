import { useSearchParams } from 'react-router-dom';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { useFixturePlayers } from '@/application/hooks/useFixturePlayers';
import { sortByRating } from '@/core/domain/entities/player-fixture-stats';
import { Star } from 'lucide-react';

const getRatingColor = (rating: number | null) => {
  if (!rating) return 'text-white/40';
  if (rating >= 8) return 'text-amber-400';
  if (rating >= 7) return 'text-emerald-400';
  return 'text-white/60';
};

const getRatingBg = (rating: number | null) => {
  if (!rating) return 'bg-white/5';
  if (rating >= 8) return 'bg-amber-400/15';
  if (rating >= 7) return 'bg-emerald-400/10';
  return 'bg-white/5';
};

const ObsPlayerRatings = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = Number(searchParams.get('fixture')) || 0;

  const { data: fixture } = useFixtureForOBS(fixtureId);
  const homeTeamId = fixture?.homeTeam?.id ?? 0;
  const { homePlayers, awayPlayers, isLoading } = useFixturePlayers(fixtureId, homeTeamId, !!fixture);

  const topHome = sortByRating(homePlayers).slice(0, 5);
  const topAway = sortByRating(awayPlayers).slice(0, 5);

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
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Melhores em Campo</span>
        </div>

        {isLoading ? (
          <div className="text-white/40 text-xs text-center py-4">Carregando...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Home */}
            <div className="space-y-1.5">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-2 text-center">
                {fixture?.homeTeam?.name}
              </div>
              {topHome.map((p) => (
                <div key={p.player.id} className={`flex items-center gap-2 ${getRatingBg(p.games.rating)} rounded-lg px-2 py-1.5`}>
                  {p.player.photo && (
                    <img src={p.player.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-xs font-semibold truncate">{p.player.name}</div>
                    <div className="text-white/30 text-[9px]">{p.games.position}</div>
                  </div>
                  <span className={`text-sm font-bold ${getRatingColor(p.games.rating)}`}>
                    {p.games.rating?.toFixed(1) ?? '-'}
                  </span>
                </div>
              ))}
            </div>

            {/* Away */}
            <div className="space-y-1.5">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-2 text-center">
                {fixture?.awayTeam?.name}
              </div>
              {topAway.map((p) => (
                <div key={p.player.id} className={`flex items-center gap-2 ${getRatingBg(p.games.rating)} rounded-lg px-2 py-1.5`}>
                  {p.player.photo && (
                    <img src={p.player.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-xs font-semibold truncate">{p.player.name}</div>
                    <div className="text-white/30 text-[9px]">{p.games.position}</div>
                  </div>
                  <span className={`text-sm font-bold ${getRatingColor(p.games.rating)}`}>
                    {p.games.rating?.toFixed(1) ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObsPlayerRatings;
