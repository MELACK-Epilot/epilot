/**
 * Grille de statistiques pour les pages Finances
 * Composant réutilisable avec GlassmorphismStatCard
 */

import { GlassmorphismStatCard } from '../GlassmorphismStatCard';
import { LucideIcon } from 'lucide-react';

export interface StatCardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  trend?: {
    value: number;
    label: string;
  };
}

interface FinanceStatsGridProps {
  stats: StatCardData[];
  columns?: 2 | 3 | 4 | 5;
}

export const FinanceStatsGrid = ({ stats, columns = 4 }: FinanceStatsGridProps) => {
  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols[columns]} gap-6`}>
      {stats.map((stat, index) => (
        <GlassmorphismStatCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          gradient={stat.gradient}
          trend={stat.trend}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
};
