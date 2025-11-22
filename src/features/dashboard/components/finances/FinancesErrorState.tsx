/**
 * ⚠️ État d'Erreur Finances
 * Affichage des erreurs avec retry
 * @module FinancesErrorState
 */

import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EPILOT_COLORS } from '@/styles/palette';

interface FinancesErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const FinancesErrorState = ({ 
  message = 'Impossible de charger les données', 
  onRetry 
}: FinancesErrorStateProps) => (
  <Card className="p-6 border-2" style={{ borderColor: EPILOT_COLORS.primary.red }}>
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: EPILOT_COLORS.primary.red }} />
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Erreur de chargement</h3>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3" 
          onClick={onRetry}
          aria-label="Réessayer le chargement"
        >
          Réessayer
        </Button>
      </div>
    </div>
  </Card>
);
