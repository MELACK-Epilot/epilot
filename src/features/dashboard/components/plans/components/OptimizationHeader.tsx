/**
 * Header du moteur d'optimisation
 */

import { Lightbulb } from 'lucide-react';

interface OptimizationHeaderProps {
  count: number;
}

export const OptimizationHeader = ({ count }: OptimizationHeaderProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Lightbulb className="h-6 w-6 text-[#E9C46A]" />
        Optimisation - Recommandations Intelligentes
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        {count} recommandation{count > 1 ? 's' : ''} basée{count > 1 ? 's' : ''} sur l'analyse de vos données réelles
      </p>
    </div>
  );
};
