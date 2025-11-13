/**
 * Filtres dynamiques pour les pages Finances
 * Composant réutilisable avec Select multiples
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

interface FinanceFiltersProps {
  filters: FilterConfig[];
}

export const FinanceFilters = ({ filters }: FinanceFiltersProps) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {filters.map((filter, index) => (
        <Select key={index} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={filter.placeholder || filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
};
