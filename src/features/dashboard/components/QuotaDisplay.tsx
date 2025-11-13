/**
 * Composant pour afficher les quotas d'utilisation du plan
 * Affiche une barre de progression avec le nombre actuel/maximum
 * @module QuotaDisplay
 */

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCheckPlanLimit } from '../hooks/useCheckPlanLimit';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuotaDisplayProps {
  schoolGroupId: string;
  resourceType: 'schools' | 'users' | 'storage' | 'modules';
  label: string;
  icon?: React.ReactNode;
  className?: string;
  showUpgradeButton?: boolean;
}

/**
 * Composant pour afficher un quota avec barre de progression
 */
export const QuotaDisplay = ({
  schoolGroupId,
  resourceType,
  label,
  icon,
  className,
  showUpgradeButton = true,
}: QuotaDisplayProps) => {
  const navigate = useNavigate();
  const { data: limitCheck, isLoading } = useCheckPlanLimit(schoolGroupId, resourceType);

  // Calculer le pourcentage d'utilisation
  const percentage = useMemo(() => {
    if (!limitCheck) return 0;
    if (limitCheck.maxLimit === -1) return 0; // Illimité
    return Math.min(100, (limitCheck.currentCount / limitCheck.maxLimit) * 100);
  }, [limitCheck]);

  // Déterminer la couleur selon le pourcentage
  const getColor = (pct: number) => {
    if (pct >= 90) return 'text-red-600';
    if (pct >= 75) return 'text-orange-600';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-600';
    if (pct >= 75) return 'bg-orange-600';
    if (pct >= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getIcon = (pct: number) => {
    if (pct >= 90) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (pct >= 75) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!limitCheck) return null;

  const isUnlimited = limitCheck.maxLimit === -1;
  const isNearLimit = percentage >= 75;
  const isAtLimit = !limitCheck.allowed;

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        {!isUnlimited && getIcon(percentage)}
      </div>

      {/* Barre de progression */}
      {!isUnlimited && (
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className="h-2"
            indicatorClassName={getProgressColor(percentage)}
          />
          <div className="flex items-center justify-between text-sm">
            <span className={cn('font-medium', getColor(percentage))}>
              {limitCheck.currentCount} / {limitCheck.maxLimit}
            </span>
            <span className="text-gray-500">
              {percentage.toFixed(0)}% utilisé
            </span>
          </div>
        </div>
      )}

      {/* Message illimité */}
      {isUnlimited && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Illimité</span>
        </div>
      )}

      {/* Alerte si proche de la limite */}
      {isNearLimit && !isAtLimit && !isUnlimited && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-900 font-medium">
                Attention : {limitCheck.remaining} restant(s)
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Vous approchez de la limite de votre plan {limitCheck.planName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerte si limite atteinte */}
      {isAtLimit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-900 font-medium">
                Limite atteinte
              </p>
              <p className="text-xs text-red-700 mt-1">
                {limitCheck.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton upgrade */}
      {showUpgradeButton && (isNearLimit || isAtLimit) && !isUnlimited && (
        <Button
          onClick={() => navigate('/dashboard/plans')}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          size="sm"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Mettre à niveau le plan
        </Button>
      )}

      {/* Badge plan */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-gray-500">Plan actuel</span>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          {limitCheck.planName}
        </Badge>
      </div>
    </div>
  );
};

/**
 * Composant pour afficher tous les quotas d'un groupe
 */
export const QuotasDashboard = ({ schoolGroupId }: { schoolGroupId: string }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <QuotaDisplay
        schoolGroupId={schoolGroupId}
        resourceType="schools"
        label="Écoles"
        icon={<span className="text-2xl">🏫</span>}
      />
      <QuotaDisplay
        schoolGroupId={schoolGroupId}
        resourceType="users"
        label="Utilisateurs"
        icon={<span className="text-2xl">👥</span>}
      />
      <QuotaDisplay
        schoolGroupId={schoolGroupId}
        resourceType="storage"
        label="Stockage"
        icon={<span className="text-2xl">💾</span>}
      />
      <QuotaDisplay
        schoolGroupId={schoolGroupId}
        resourceType="modules"
        label="Modules"
        icon={<span className="text-2xl">📦</span>}
      />
    </div>
  );
};
