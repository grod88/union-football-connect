import { useSearchParams } from 'react-router-dom';
import { useFixtureForOBS } from '@/application/hooks/useFixture';
import { useFixtureLineups } from '@/application/hooks/useFixtureLineups';
import { getPlayersByPosition } from '@/core/domain/entities/lineup';
import type { TeamLineup, Player } from '@/core/domain/entities/lineup';
import { Users } from 'lucide-react';

const posLabel: Record<string, string> = { G: 'GOL', D: 'DEF', M: 'MEI', F: 'ATA' };

const PlayerRow = ({ player }: { player: Player }) => (
  <div className="flex items-center gap-1.5 py-0.5">
    <span className="text-amber-400/70 text-[10px] font-mono w-4 text-right">{player.number}</span>
    <span className="text-white/80 text-xs truncate">{player.name}</span>
  </div>
);

const TeamColumn = ({ lineup, label }: { lineup: TeamLineup; label: string }) => {
  const positions = getPlayersByPosition(lineup);
  const groups = [
    { key: 'G', players: positions.goalkeepers },
    { key: 'D', players: positions.defenders },
    { key: 'M', players: positions.midfielders },
    { key: 'F', players: positions.forwards },
  ];

  return (
    <div className="space-y-2">
      <div className="text-center">
        <div className="text-white/50 text-[10px] uppercase tracking-wider">{label}</div>
        <div className="text-amber-400 text-xs font-bold">{lineup.formation}</div>
      </div>
      {groups.map(({ key, players }) =>
        players.length > 0 ? (
          <div key={key}>
            <div className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">{posLabel[key]}</div>
            {players.map((p) => <PlayerRow key={p.id || p.number} player={p} />)}
          </div>
        ) : null
      )}
      {lineup.coach.name && (
        <div className="border-t border-white/5 pt-1 mt-2">
          <div className="text-white/30 text-[9px] uppercase">Técnico</div>
          <div className="text-white/60 text-xs">{lineup.coach.name}</div>
        </div>
      )}
    </div>
  );
};

const ObsLineups = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = Number(searchParams.get('fixture')) || 0;

  const { data: fixture } = useFixtureForOBS(fixtureId);
  const { data: lineups, isLoading } = useFixtureLineups(fixtureId, { enabled: !!fixture });

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
          <Users className="w-4 h-4 text-amber-400" />
          <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Escalação</span>
        </div>

        {isLoading ? (
          <div className="text-white/40 text-xs text-center py-4">Carregando...</div>
        ) : !lineups ? (
          <div className="text-white/30 text-xs text-center py-4">Escalação indisponível</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <TeamColumn lineup={lineups.home} label={fixture?.homeTeam?.name ?? 'Casa'} />
            <TeamColumn lineup={lineups.away} label={fixture?.awayTeam?.name ?? 'Fora'} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ObsLineups;
