/**
 * PreMatchDetailPanel Component
 * Inline expanded panel for pre-match details:
 * timezones, venue, predictions, H2H, injuries, lineups
 */
import { Clock, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { PredictionWidget } from '@/presentation/components/predictions/PredictionWidget';
import { H2HCard } from '@/presentation/components/match/H2HCard';
import { InjuriesPanel } from '@/presentation/components/injuries/InjuriesPanel';
import { useFixtureLineups } from '@/application/hooks/useFixtureLineups';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { getMatchTimezones } from '@/application/services/timezone.service';
import type { Fixture } from '@/core/domain/entities/fixture';

interface PreMatchDetailPanelProps {
  fixture: Fixture;
}

export const PreMatchDetailPanel = ({ fixture }: PreMatchDetailPanelProps) => {
  const timezones = getMatchTimezones(fixture.date);
  const { data: lineups, isLoading: lineupsLoading } = useFixtureLineups(fixture.id);

  const homeLineup = lineups?.home;
  const awayLineup = lineups?.away;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-3 sm:px-6 py-4 bg-primary/5 border-b border-border/30">
        {/* Header: badges + VS + time */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col items-center gap-1">
            <img
              src={fixture.homeTeam.logo}
              alt={fixture.homeTeam.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-xs font-heading uppercase text-foreground text-center max-w-[80px] truncate">
              {fixture.homeTeam.shortName || fixture.homeTeam.name}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-heading text-xl text-muted-foreground">VS</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <img
              src={fixture.awayTeam.logo}
              alt={fixture.awayTeam.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-xs font-heading uppercase text-foreground text-center max-w-[80px] truncate">
              {fixture.awayTeam.shortName || fixture.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Timezones */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {timezones.map((tz) => (
            <div key={tz.label} className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
              <Clock size={12} className="text-primary" />
              <span className="text-xs text-muted-foreground">{tz.flag} {tz.label}</span>
              <span className="text-xs font-semibold text-foreground">{tz.time}</span>
            </div>
          ))}
        </div>

        {/* Venue + Referee */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mb-6">
          {fixture.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              <span>{fixture.venue.name}{fixture.venue.city ? `, ${fixture.venue.city}` : ''}</span>
            </div>
          )}
          {fixture.referee && (
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-primary" />
              <span>{fixture.referee}</span>
            </div>
          )}
        </div>

        {/* Predictions + H2H */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <PredictionWidget
            fixtureId={fixture.id}
            homeTeam={fixture.homeTeam}
            awayTeam={fixture.awayTeam}
          />
          <H2HCard
            teamId1={fixture.homeTeam.id}
            teamId2={fixture.awayTeam.id}
            team1={{ name: fixture.homeTeam.shortName || fixture.homeTeam.name, logo: fixture.homeTeam.logo }}
            team2={{ name: fixture.awayTeam.shortName || fixture.awayTeam.name, logo: fixture.awayTeam.logo }}
          />
        </div>

        {/* Injuries */}
        <InjuriesPanel
          fixtureId={fixture.id}
          homeTeamId={fixture.homeTeam.id}
          homeTeamName={fixture.homeTeam.shortName || fixture.homeTeam.name}
          awayTeamName={fixture.awayTeam.shortName || fixture.awayTeam.name}
          className="mb-4"
        />

        {/* Lineups */}
        <div>
          <h4 className="text-xs font-heading uppercase text-muted-foreground mb-3">
            📋 Escalação
          </h4>
          {lineupsLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : homeLineup || awayLineup ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {homeLineup && (
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-heading text-foreground">
                      {fixture.homeTeam.shortName || fixture.homeTeam.name}
                    </span>
                    {homeLineup.formation && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {homeLineup.formation}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {homeLineup.startXI.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-5 text-right">{p.number}</span>
                        <span className="text-foreground">{p.name}</span>
                        <span className="text-muted-foreground ml-auto">{p.pos}</span>
                      </div>
                    ))}
                  </div>
                  {homeLineup.substitutes.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground mt-3 mb-1 font-heading uppercase">Reservas</p>
                      <div className="space-y-1">
                        {homeLineup.substitutes.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="w-5 text-right">{p.number}</span>
                            <span>{p.name}</span>
                            <span className="ml-auto">{p.pos}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {awayLineup && (
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-heading text-foreground">
                      {fixture.awayTeam.shortName || fixture.awayTeam.name}
                    </span>
                    {awayLineup.formation && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {awayLineup.formation}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {awayLineup.startXI.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-5 text-right">{p.number}</span>
                        <span className="text-foreground">{p.name}</span>
                        <span className="text-muted-foreground ml-auto">{p.pos}</span>
                      </div>
                    ))}
                  </div>
                  {awayLineup.substitutes.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground mt-3 mb-1 font-heading uppercase">Reservas</p>
                      <div className="space-y-1">
                        {awayLineup.substitutes.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="w-5 text-right">{p.number}</span>
                            <span>{p.name}</span>
                            <span className="ml-auto">{p.pos}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Escalação não disponível ainda.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
