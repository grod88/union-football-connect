/**
 * InjuriesPanel Component
 * Displays injured/suspended players split by team
 */
import { ShieldAlert, CheckCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInjuries } from '@/application/hooks/useInjuries';
import type { Injury } from '@/core/domain/entities/injury';
import { Skeleton } from '@/components/ui/skeleton';

interface InjuriesPanelProps {
  fixtureId: number;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  className?: string;
}

const InjuryItem = ({ injury }: { injury: Injury }) => {
  const isMissing = injury.player.type === 'Missing Fixture';

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
      {injury.player.photo ? (
        <img
          src={injury.player.photo}
          alt={injury.player.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User size={14} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{injury.player.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className={cn(
            'inline-block w-2 h-2 rounded-full',
            isMissing ? 'bg-destructive' : 'bg-primary'
          )} />
          {injury.player.reason}
        </p>
      </div>
    </div>
  );
};

export const InjuriesPanel = ({
  fixtureId,
  homeTeamId,
  homeTeamName,
  awayTeamName,
  className,
}: InjuriesPanelProps) => {
  const { homeInjuries, awayInjuries, total, isLoading, error } = useInjuries(fixtureId, homeTeamId);

  if (error) return null;

  if (isLoading) {
    return (
      <div className={cn('card-surface rounded-xl p-4 md:p-6', className)}>
        <Skeleton className="h-5 w-40 mx-auto mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card-surface rounded-xl p-4 md:p-6', className)}>
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <ShieldAlert size={18} className="text-primary" />
        <h3 className="font-heading text-primary text-lg uppercase tracking-wider">
          Desfalques
        </h3>
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <CheckCircle size={16} className="text-primary" />
          <p className="text-sm text-muted-foreground">Nenhum desfalque confirmado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Home */}
          <div>
            <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {homeTeamName} ({homeInjuries.length})
            </h4>
            <div className="space-y-1.5">
              {homeInjuries.map((injury) => (
                <InjuryItem key={injury.player.id} injury={injury} />
              ))}
              {homeInjuries.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">Sem desfalques</p>
              )}
            </div>
          </div>

          {/* Away */}
          <div>
            <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {awayTeamName} ({awayInjuries.length})
            </h4>
            <div className="space-y-1.5">
              {awayInjuries.map((injury) => (
                <InjuryItem key={injury.player.id} injury={injury} />
              ))}
              {awayInjuries.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">Sem desfalques</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InjuriesPanel;
