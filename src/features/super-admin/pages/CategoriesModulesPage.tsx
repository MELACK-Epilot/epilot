/**
 * Page de gestion des Catégories et Modules - Super Admin
 * Interface avec cards de taille uniforme
 */

import React from 'react';
import { CategoriesModulesManager } from '../components/CategoriesModulesManager';

export const CategoriesModulesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <CategoriesModulesManager />
      </div>
    </div>
  );
};

export default CategoriesModulesPage;
