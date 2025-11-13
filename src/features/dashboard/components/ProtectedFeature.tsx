/**
 * Composant pour protéger les fonctionnalités selon le plan
 * Vérifie les permissions avant d'afficher/activer une fonctionnalité
 * @module ProtectedFeature
 */

import { ReactNode } from 'react';
import { usePlanRestrictions } from '../hooks/usePlanRestrictions';
import { PlanLimits } from '../config/planRestrictions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProtectedFeatureProps {
  feature: keyof PlanLimits['features'];
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
  mode?: 'hide' | 'disable' | 'show-locked';
}

/**
 * Composant pour protéger une fonctionnalité selon le plan
 * 
 * @example
 * // Cacher complètement si pas accès
 * <ProtectedFeature feature="exportData" mode="hide">
 *   <Button>Exporter</Button>
 * </ProtectedFeature>
 * 
 * @example
 * // Désactiver si pas accès
 * <ProtectedFeature feature="bulkOperations" mode="disable">
 *   <Button>Actions groupées</Button>
 * </ProtectedFeature>
 * 
 * @example
 * // Afficher verrouillé avec upgrade
 * <ProtectedFeature feature="api" mode="show-locked" showUpgradeButton>
 *   <Button>Accès API</Button>
 * </ProtectedFeature>
 */
export const ProtectedFeature = ({
  feature,
  children,
  fallback,
  showUpgradeButton = true,
  mode = 'hide',
}: ProtectedFeatureProps) => {
  const { can, planLimits, needsUpgrade } = usePlanRestrictions();
  const navigate = useNavigate();

  const hasAccess = can(feature);

  // Si l'utilisateur a accès, afficher normalement
  if (hasAccess) {
    return <>{children}</>;
  }

  // Mode "hide" : Cacher complètement
  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  // Mode "disable" : Désactiver l'élément
  if (mode === 'disable') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        {showUpgradeButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Badge className="bg-orange-500 text-white">
              <Lock className="w-3 h-3 mr-1" />
              {planLimits?.name === 'Gratuit' ? 'Premium' : 'Pro'}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Mode "show-locked" : Afficher avec message de verrouillage
  if (mode === 'show-locked') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 mb-2">
              Fonctionnalité réservée au plan {planLimits?.name === 'Gratuit' ? 'Premium' : 'Pro'}
            </p>
            {showUpgradeButton && (
              <Button
                size="sm"
                onClick={() => navigate('/dashboard/my-modules')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrader
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Hook pour vérifier une fonctionnalité et afficher un toast si pas accès
 */
export const useCheckFeature = () => {
  const { can, planLimits } = usePlanRestrictions();
  const navigate = useNavigate();

  const checkFeature = (feature: keyof PlanLimits['features'], actionName: string = 'cette action') => {
    if (!can(feature)) {
      const requiredPlan = planLimits?.name === 'Gratuit' ? 'Premium' : 'Pro';
      
      toast.error(`Fonctionnalité réservée au plan ${requiredPlan}`, {
        description: `${actionName} nécessite un plan ${requiredPlan}. Cliquez pour upgrader.`,
        action: {
          label: 'Upgrader',
          onClick: () => navigate('/dashboard/my-modules'),
        },
      });
      
      return false;
    }
    
    return true;
  };

  return { checkFeature };
};
