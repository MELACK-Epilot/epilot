/**
 * 💾 Skeleton Chargement Graphique
 * Placeholder ultra-léger pendant chargement
 * @module ChartSkeleton
 */

import { Card } from '@/components/ui/card';

export const ChartSkeleton = () => (
  <Card className="p-6 h-96 flex items-center justify-center">
    <div className="animate-pulse text-gray-400">Chargement...</div>
  </Card>
);
