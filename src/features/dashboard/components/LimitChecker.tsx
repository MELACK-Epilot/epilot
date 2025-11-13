/**
 * Composant pour vérifier les limites avant une action
 * Affiche un message si limite atteinte et suggère upgrade
 * @module LimitChecker
 */

import { ReactNode } from 'react';
import { usePlanRestrictions } from '../hooks/usePlanRestrictions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LimitCheckerProps {
  limitType: 'schools' | 'users' | 'storage' | 'modules';
  children: ReactNode;
  onLimitReached?: () => void;
}

/**
 * Composant pour vérifier une limite avant d'afficher un bouton/action
 * 
 * @example
 * <LimitChecker limitType="schools">
 *   <Button onClick={handleCreateSchool}>Créer une école</Button>
 * </LimitChecker>
 */
export const LimitChecker = ({
  limitType,
  children,
  onLimitReached,
}: LimitCheckerProps) => {
  const {
    isLimitReached,
    getRemaining,
    getErrorMessage,
    planLimits,
    recommendedPlan,
  } = usePlanRestrictions();
  const navigate = useNavigate();

  const limitReached = isLimitReached(limitType);
  const remaining = getRemaining(limitType);

  // Si limite atteinte, afficher message au lieu du bouton
  if (limitReached) {
    const errorMessage = getErrorMessage(limitType);
    
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">Limite atteinte</AlertTitle>
        <AlertDescription className="text-orange-700">
          <p className="mb-3">{errorMessage}</p>
          {recommendedPlan && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  navigate('/dashboard/my-modules');
                  onLimitReached?.();
                }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrader vers {recommendedPlan}
              </Button>
              <span className="text-xs text-orange-600">
                Recommandé pour votre utilisation
              </span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Si proche de la limite (< 20%), afficher warning
  if (remaining !== null && remaining <= Math.ceil((planLimits?.maxSchools || 1) * 0.2)) {
    return (
      <div className="space-y-2">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 text-sm">
            Attention : Plus que {remaining} {limitType === 'schools' ? 'école(s)' : limitType === 'users' ? 'utilisateur(s)' : limitType === 'storage' ? 'GB' : 'module(s)'} disponible(s)
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Sinon, afficher normalement
  return <>{children}</>;
};

/**
 * Hook pour vérifier une limite avant une action
 */
export const useCheckLimit = () => {
  const {
    isLimitReached,
    getErrorMessage,
    recommendedPlan,
  } = usePlanRestrictions();
  const navigate = useNavigate();

  const checkLimit = (limitType: 'schools' | 'users' | 'storage' | 'modules'): boolean => {
    if (isLimitReached(limitType)) {
      const errorMessage = getErrorMessage(limitType);
      
      toast.error('Limite atteinte', {
        description: errorMessage,
        action: recommendedPlan ? {
          label: `Upgrader vers ${recommendedPlan}`,
          onClick: () => navigate('/dashboard/my-modules'),
        } : undefined,
      });
      
      return false;
    }
    
    return true;
  };

  return { checkLimit };
};
