/**
 * État vide quand aucun niveau scolaire n'est actif
 */

import { memo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EmptyStateProps {
  onRefresh: () => void;
  onClearCache: () => void;
}

export const EmptyState = memo(({ onRefresh, onClearCache }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full p-12 text-center border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-gray-50">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Aucun Niveau Scolaire Actif
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Votre école n'a aucun niveau scolaire activé. Si vous venez de les activer, le cache doit être vidé.
          </p>
        </div>

        <div className="space-y-4">
          <Alert className="text-left border-blue-200 bg-blue-50">
            <AlertTitle className="text-blue-900 font-semibold">
              💡 Que faire ?
            </AlertTitle>
            <AlertDescription className="text-blue-800">
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>Vérifiez que votre école a des niveaux actifs (Maternelle, Primaire, etc.)</li>
                <li>Si vous venez de les activer, cliquez sur "Vider le Cache"</li>
                <li>Sinon, contactez l'administrateur de votre groupe scolaire</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 justify-center pt-4">
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              className="gap-2 px-6 py-6 text-base"
              size="lg"
            >
              <RefreshCw className="h-5 w-5" />
              Rafraîchir
            </Button>
            
            <Button 
              onClick={onClearCache} 
              className="gap-2 px-6 py-6 text-base bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
              size="lg"
            >
              <RefreshCw className="h-5 w-5" />
              Vider le Cache et Recharger
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            💡 Le bouton orange va vider le cache et vous reconnecter automatiquement
          </p>
        </div>
      </Card>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
