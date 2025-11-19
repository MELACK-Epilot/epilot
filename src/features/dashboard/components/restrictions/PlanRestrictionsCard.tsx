/**
 * Plan Restrictions Card
 * Affiche l'usage actuel vs limites du plan
 * Avec barres de progression et alertes
 */

import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanRestrictions } from '../../hooks/usePlanRestrictionsRealtime';

interface PlanRestrictionsCardProps {
  onUpgradeClick?: () => void;
}

export const PlanRestrictionsCard = ({ onUpgradeClick }: PlanRestrictionsCardProps) => {
  const { data: restrictions, isLoading } = usePlanRestrictions();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!restrictions) {
    return null;
  }

  const items = [
    {
      key: 'schools',
      label: 'Écoles',
      icon: '🏫',
      data: restrictions.schools,
    },
    {
      key: 'students',
      label: 'Élèves',
      icon: '👨‍🎓',
      data: restrictions.students,
    },
    {
      key: 'staff',
      label: 'Personnel',
      icon: '👥',
      data: restrictions.staff,
    },
    {
      key: 'storage',
      label: 'Stockage',
      icon: '💾',
      data: restrictions.storage,
      unit: 'Go',
    },
  ];

  // Vérifier s'il y a des limites atteintes
  const hasLimitReached = items.some((item) => !item.data.allowed);
  const hasWarning = items.some((item) => item.data.usagePercent >= 80 && item.data.allowed);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Limites du Plan</h3>
          <p className="text-sm text-gray-600">Usage actuel de vos ressources</p>
        </div>
        {(hasLimitReached || hasWarning) && onUpgradeClick && (
          <Button
            onClick={onUpgradeClick}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        )}
      </div>

      {/* Liste des restrictions */}
      <div className="space-y-4">
        {items.map((item) => {
          const { current, limit, remaining, usagePercent, allowed } = item.data;
          
          // Déterminer la couleur
          let progressColor = 'bg-green-500';
          let badgeVariant: 'default' | 'destructive' | 'outline' = 'default';
          let badgeClass = 'bg-green-100 text-green-700 border-green-300';

          if (!allowed) {
            progressColor = 'bg-red-500';
            badgeVariant = 'destructive';
            badgeClass = '';
          } else if (usagePercent >= 80) {
            progressColor = 'bg-orange-500';
            badgeClass = 'bg-orange-100 text-orange-700 border-orange-300';
          }

          return (
            <div key={item.key} className="space-y-2">
              {/* Label et valeurs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {current} / {limit} {item.unit || ''}
                  </span>
                  <Badge variant={badgeVariant} className={badgeClass}>
                    {usagePercent}%
                  </Badge>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="relative">
                <Progress 
                  value={usagePercent} 
                  className="h-2"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${progressColor} transition-all`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>

              {/* Message */}
              <div className="flex items-center gap-1 text-xs">
                {!allowed ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 font-medium">Limite atteinte</span>
                  </>
                ) : usagePercent >= 80 ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-600">
                      {remaining} {item.unit || ''} restant{remaining > 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">
                      {remaining} {item.unit || ''} disponible{remaining > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
