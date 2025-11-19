/**
 * Header de la page Plans - Style Catégories
 * Affiche titre et description simple
 * @module PlansHeader
 */

import { Package } from 'lucide-react';

export const PlansHeader = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-8 w-8 text-[#1D3557]" />
          Plans & Tarification
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez les plans d'abonnement et suivez les performances
        </p>
      </div>
    </div>
  );
};
