/**
 * Breadcrumb de navigation pour les pages Finances
 * Composant réutilisable avec bouton retour
 */

import { Home, ChevronRight } from 'lucide-react';

interface FinanceBreadcrumbProps {
  currentPage: string;
}

export const FinanceBreadcrumb = ({ currentPage }: FinanceBreadcrumbProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span>Finances</span>
      </button>
      <ChevronRight className="h-4 w-4" />
      <span className="font-medium text-gray-900">{currentPage}</span>
    </div>
  );
};
