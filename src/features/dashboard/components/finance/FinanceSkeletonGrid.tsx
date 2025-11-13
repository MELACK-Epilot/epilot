/**
 * Skeleton loader pour les pages Finances
 * Composant réutilisable pour états de chargement
 */

import { Card } from '@/components/ui/card';

interface FinanceSkeletonGridProps {
  count?: number;
  height?: string;
  columns?: 2 | 3 | 4;
}

export const FinanceSkeletonGrid = ({ 
  count = 4, 
  height = 'h-48',
  columns = 4 
}: FinanceSkeletonGridProps) => {
  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols[columns]} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className={`${height} bg-gray-200 rounded`} />
        </Card>
      ))}
    </div>
  );
};
