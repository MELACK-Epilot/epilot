/**
 * Grille de statistiques moderne pour les pages Finances
 * Design plat avec couleurs vives
 */

import { FinanceModernStatCard, ModernStatCardData } from './FinanceModernStatCard';

interface FinanceModernStatsGridProps {
  stats: ModernStatCardData[];
  columns?: 2 | 3 | 4 | 5;
}

export const FinanceModernStatsGrid = ({ stats, columns = 4 }: FinanceModernStatsGridProps) => {
  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols[columns]} gap-6`}>
      {stats.map((stat, index) => (
        <FinanceModernStatCard
          key={index}
          {...stat}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
};
