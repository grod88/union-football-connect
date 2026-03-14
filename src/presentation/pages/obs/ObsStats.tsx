/**
 * OBS Stats Page
 * /obs/stats?fixture=FIXTURE_ID&widget=full|top|bottom
 *
 * Widgets:
 *   full   → 9 indicadores (padrão)
 *   top    → 4 primeiros indicadores
 *   bottom → 4 últimos indicadores (5-8)
 *
 * Transparent background for OBS Browser Source
 * Auto-refreshes every 30 seconds
 */
import { useSearchParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { StatComparison } from '@/presentation/components/statistics/StatComparison';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { ErrorMessage } from '@/presentation/components/common/ErrorMessage';
import { useFixtureStatisticsForOBS } from '@/application/hooks/useFixtureStatistics';
import { parsePositiveInt } from '@/lib/validation';
import { DISPLAY_STATISTICS } from '@/core/domain/entities/statistic';

type WidgetVariant = 'full' | 'top' | 'bottom';

const getStatsSlice = (variant: WidgetVariant) => {
  const total = DISPLAY_STATISTICS.length; // 9
  switch (variant) {
    case 'top':
      return { start: 0, end: 4 };
    case 'bottom':
      return { start: 4, end: total };
    case 'full':
    default:
      return { start: 0, end: total };
  }
};

const ObsStats = () => {
  const [searchParams] = useSearchParams();
  const fixtureIdNum = parsePositiveInt(searchParams.get('fixture'));
  const widget = (searchParams.get('widget') || 'full') as WidgetVariant;

  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useFixtureStatisticsForOBS(fixtureIdNum);

  if (!fixtureIdNum) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <p className="text-white/60 text-sm">
          Parâmetro ?fixture=ID necessário
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-transparent flex items-center justify-center p-4">
        <div className="animate-pulse text-white/40 text-sm">Carregando...</div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="bg-transparent p-2">
        <div
          className="rounded-xl overflow-hidden p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-white/50 text-sm">
            Estatísticas não disponíveis para esta competição
          </p>
        </div>
      </div>
    );
  }

  const { start, end } = getStatsSlice(widget);
  const showHeader = widget === 'full' || widget === 'top';

  return (
    <div className="bg-transparent p-2">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Estatísticas
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="px-4 pb-4 pt-1">
          <StatComparison
            statistics={statistics}
            variant="obs"
            statsSlice={{ start, end }}
          />
        </div>
      </div>
    </div>
  );
};

export default ObsStats;
