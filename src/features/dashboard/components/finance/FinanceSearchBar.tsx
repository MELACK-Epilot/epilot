/**
 * Barre de recherche pour les pages Finances
 * Composant réutilisable avec icône et placeholder
 */

import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FinanceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FinanceSearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Rechercher..." 
}: FinanceSearchBarProps) => {
  return (
    <Card className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>
    </Card>
  );
};
