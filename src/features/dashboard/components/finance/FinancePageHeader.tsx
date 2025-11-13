/**
 * Header de page pour les pages Finances
 * Composant réutilisable avec titre, description et actions
 */

import { ReactNode } from 'react';

interface FinancePageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export const FinancePageHeader = ({ 
  title, 
  description, 
  icon,
  actions 
}: FinancePageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-gradient-to-br from-[#2A9D8F] to-[#1D8A7E] rounded-xl">
              {icon}
            </div>
          )}
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
