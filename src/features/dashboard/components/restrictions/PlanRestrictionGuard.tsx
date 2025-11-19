/**
 * Plan Restriction Guard
 * Composant pour bloquer les actions si les limites du plan sont atteintes
 * Affiche des avertissements et propose l'upgrade
 */

import { ReactNode } from 'react';
import { AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCheckRestriction } from '../../hooks/usePlanRestrictionsRealtime';

interface PlanRestrictionGuardProps {
  restrictionType: 'schools' | 'students' | 'staff' | 'storage';
  children: ReactNode;
  onUpgradeClick?: () => void;
  showWarningAt?: number; // Pourcentage pour afficher l'avertissement (défaut: 80%)
}

export const PlanRestrictionGuard = ({
  restrictionType,
  children,
  onUpgradeClick,
  showWarningAt = 80,
}: PlanRestrictionGuardProps) => {
  const { data: restriction, isLoading } = useCheckRestriction(restrictionType);

  if (isLoading) {
    return <>{children}</>;
  }

  if (!restriction) {
    return <>{children}</>;
  }

  const { allowed, current, limit, remaining, usagePercent } = restriction;

  // Labels selon le type
  const labels = {
    schools: { singular: 'école', plural: 'écoles', icon: '🏫' },
    students: { singular: 'élève', plural: 'élèves', icon: '👨‍🎓' },
    staff: { singular: 'membre du personnel', plural: 'membres du personnel', icon: '👥' },
    storage: { singular: 'Go', plural: 'Go', icon: '💾' },
  };

  const label = labels[restrictionType];

  // Limite atteinte - Bloquer
  if (!allowed) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <Lock className="h-5 w-5 text-red-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-red-900 mb-1">
                  {label.icon} Limite atteinte
                </h4>
                <p className="text-sm text-red-700">
                  Vous avez atteint la limite de votre plan: <strong>{limit} {label.plural}</strong>
                  <br />
                  Actuellement: <strong>{current}/{limit}</strong>
                </p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600">Usage</span>
                  <Badge variant="destructive">{usagePercent}%</Badge>
                </div>
                <Progress value={usagePercent} className="h-2 bg-red-100" />
              </div>

              {/* Bouton upgrade */}
              {onUpgradeClick && (
                <Button
                  onClick={onUpgradeClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Mettre à niveau mon plan
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Contenu désactivé */}
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  // Avertissement - Proche de la limite
  if (usagePercent >= showWarningAt) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-300 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">
                  {label.icon} Attention - Limite bientôt atteinte
                </h4>
                <p className="text-sm text-orange-700">
                  Il vous reste <strong>{remaining} {remaining > 1 ? label.plural : label.singular}</strong> disponibles
                  <br />
                  Usage: <strong>{current}/{limit}</strong>
                </p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600">Usage</span>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                    {usagePercent}%
                  </Badge>
                </div>
                <Progress value={usagePercent} className="h-2 bg-orange-100" />
              </div>

              {/* Bouton upgrade */}
              {onUpgradeClick && (
                <Button
                  onClick={onUpgradeClick}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Augmenter ma limite
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Contenu actif */}
        {children}
      </div>
    );
  }

  // Tout va bien - Afficher normalement
  return <>{children}</>;
};
