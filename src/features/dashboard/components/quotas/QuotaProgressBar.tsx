/**
 * Composant de barre de progression pour afficher l'utilisation d'un quota
 */

import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotaProgressBarProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  showPercentage?: boolean;
  className?: string;
}

export const QuotaProgressBar = ({
  label,
  current,
  max,
  unit = '',
  showPercentage = true,
  className,
}: QuotaProgressBarProps) => {
  // Calculer le pourcentage
  const isUnlimited = max >= 999999;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  
  // Déterminer le statut et la couleur
  const getStatus = () => {
    if (isUnlimited) return 'unlimited';
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'normal';
  };

  const status = getStatus();

  const statusConfig = {
    unlimited: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      progressColor: 'bg-blue-500',
      icon: CheckCircle2,
      message: 'Illimité',
    },
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      progressColor: 'bg-red-500',
      icon: AlertCircle,
      message: 'Limite atteinte',
    },
    warning: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      progressColor: 'bg-orange-500',
      icon: AlertTriangle,
      message: 'Proche de la limite',
    },
    normal: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      progressColor: 'bg-green-500',
      icon: CheckCircle2,
      message: 'Disponible',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.color)} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {isUnlimited ? 'Illimité' : `${current} / ${max}`}
            {unit && ` ${unit}`}
          </span>
          {showPercentage && !isUnlimited && (
            <span className={cn('text-xs font-medium', config.color)}>
              ({percentage.toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="relative">
          <Progress 
            value={percentage} 
            className={cn('h-2', config.bgColor)}
            indicatorClassName={config.progressColor}
          />
        </div>
      )}

      {/* Status Message */}
      {status !== 'normal' && (
        <div className={cn('flex items-center gap-1 text-xs', config.color)}>
          <span>{config.message}</span>
        </div>
      )}
    </div>
  );
};
