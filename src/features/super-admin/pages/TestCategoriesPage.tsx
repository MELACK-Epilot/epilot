/**
 * Page de test pour les catégories intelligentes
 * Validation de l'implémentation complète
 */

import React, { useState, useEffect } from 'react';
import { CategoriesModulesManager } from '../components/CategoriesModulesManager';

export const TestCategoriesPage: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simuler le chargement des données
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-700">Chargement des catégories intelligentes...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Test - Catégories Intelligentes E-Pilot Congo
          </h1>
          <p className="text-gray-600">
            Validation du système de relations intelligentes avec performance parfaite
          </p>
        </div>

        <CategoriesModulesManager />
      </div>
    </div>
  );
};

export default TestCategoriesPage;
