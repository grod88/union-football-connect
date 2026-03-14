/**
 * EmptyLiveState Component
 * Shown when no live fixtures match current filters
 */
import { Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNextMatch } from '@/application/hooks/useNextMatch';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { getMatchTimezones, getRelativeTime } from '@/application/services/timezone.service';
import { ROUTES } from '@/config/routes';

export const EmptyLiveState = () => {
  const { data: nextMatch } = useNextMatch();

  return (
    <div className="card-surface rounded-xl p-8 sm:p-12 text-center">
      <Tv className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
      <h2 className="font-heading text-lg sm:text-xl mb-2">
        Nenhum jogo ao vivo agora
      </h2>

      {nextMatch && (
        <div className="mt-6 inline-block p-4 bg-secondary/30 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Próximo jogo monitorado
          </p>
          <div className="flex items-center justify-center gap-4 mb-3">
            <TeamBadge team={nextMatch.homeTeam} size="sm" />
            <span className="text-muted-foreground font-heading">VS</span>
            <TeamBadge team={nextMatch.awayTeam} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">{nextMatch.league.name}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {getMatchTimezones(nextMatch.date).slice(0, 2).map((tz) => (
              <span key={tz.label} className="text-xs text-muted-foreground">
                {tz.flag} {tz.time}
              </span>
            ))}
          </div>
          <p className="text-xs text-primary mb-3">
            ⏱️ {getRelativeTime(nextMatch.date)}
          </p>
          <div className="flex items-center gap-2 justify-center">
            <Link
              to={`/pre-jogo/${nextMatch.id}`}
              className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors"
            >
              Ver Pré-Jogo
            </Link>
            <Link
              to={ROUTES.CALENDAR}
              className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:border-primary/50 transition-colors"
            >
              Calendário
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
