/**
 * Calendar Page (/calendario)
 * Shows upcoming fixtures for D+1, D+2, D+3 grouped by league
 * with inline pre-match details on expand
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PreMatchDetailPanel } from '@/presentation/components/live/PreMatchDetailPanel';
import { useCalendarFixtures } from '@/application/hooks/useCalendarFixtures';
import { getMatchTimezones } from '@/application/services/timezone.service';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';

/** Build date labels for D+1, D+2, D+3 */
const buildDayOptions = () => {
  const today = new Date();
  return [1, 2, 3].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    return { offset, dateStr, label };
  });
};

const FixtureRow = ({
  fixture,
  isExpanded,
  onToggle,
}: {
  fixture: Fixture;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const timezones = getMatchTimezones(fixture.date);

  return (
    <div className="card-surface rounded-xl overflow-hidden transition-colors">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
      >
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm truncate max-w-[100px] text-right">
            {fixture.homeTeam.shortName || fixture.homeTeam.name}
          </span>
          <img src={fixture.homeTeam.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
        </div>

        {/* Time */}
        <div className="text-center min-w-[50px]">
          <span className="font-heading text-lg text-primary">
            {timezones[0]?.time}
          </span>
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          <img src={fixture.awayTeam.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
          <span className="text-sm truncate max-w-[100px]">
            {fixture.awayTeam.shortName || fixture.awayTeam.name}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground shrink-0 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Timezone hints */}
      {!isExpanded && (
        <div className="flex justify-center gap-2 pb-3 -mt-1">
          {timezones.slice(0, 2).map((tz) => (
            <span key={tz.label} className="text-[10px] text-muted-foreground">
              {tz.flag} {tz.time}
            </span>
          ))}
        </div>
      )}

      {/* Expanded pre-match details */}
      <AnimatePresence>
        {isExpanded && <PreMatchDetailPanel fixture={fixture} />}
      </AnimatePresence>
    </div>
  );
};

const CalendarPage = () => {
  const dayOptions = useMemo(buildDayOptions, []);
  const [selectedDay, setSelectedDay] = useState(1);
  const [expandedFixtureId, setExpandedFixtureId] = useState<number | null>(null);

  const dateStr = dayOptions.find((d) => d.offset === selectedDay)!.dateStr;
  const { data: fixtures, isLoading } = useCalendarFixtures(dateStr);

  // Group by league
  const groupedByLeague = useMemo(() => {
    if (!fixtures) return {};
    const groups: Record<string, { league: Fixture['league']; fixtures: Fixture[] }> = {};
    for (const f of fixtures) {
      const key = `${f.league.id}`;
      if (!groups[key]) {
        groups[key] = { league: f.league, fixtures: [] };
      }
      groups[key].fixtures.push(f);
    }
    return groups;
  }, [fixtures]);

  const leagueKeys = Object.keys(groupedByLeague);

  const toggleFixture = (id: number) => {
    setExpandedFixtureId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <CalendarDays size={20} className="text-primary" />
              <span className="text-primary font-heading uppercase tracking-wider text-sm">
                Próximos Jogos
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl uppercase gold-text mb-6">
              Calendário
            </h1>
          </motion.div>

          {/* D+1 / D+2 / D+3 filter */}
          <div className="flex justify-center gap-2 mb-8">
            {dayOptions.map((opt) => (
              <button
                key={opt.offset}
                onClick={() => {
                  setSelectedDay(opt.offset);
                  setExpandedFixtureId(null);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-heading uppercase transition-colors capitalize',
                  selectedDay === opt.offset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && leagueKeys.length === 0 && (
            <div className="card-surface rounded-xl p-12 text-center">
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhum jogo encontrado para este dia</p>
            </div>
          )}

          {/* Grouped by league */}
          {leagueKeys.map((key) => {
            const group = groupedByLeague[key];
            return (
              <div key={key} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {group.league.logo && (
                    <img src={group.league.logo} alt="" className="w-5 h-5 object-contain" />
                  )}
                  <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                    {group.league.name}
                  </h2>
                </div>
                <div className="space-y-3">
                  {group.fixtures.map((fixture) => (
                    <FixtureRow
                      key={fixture.id}
                      fixture={fixture}
                      isExpanded={expandedFixtureId === fixture.id}
                      onToggle={() => toggleFixture(fixture.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CalendarPage;
