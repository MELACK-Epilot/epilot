/**
 * StudentsWidget - Widget des effectifs élèves
 * Affiche la répartition des élèves par niveau
 * 
 * @module ChefEtablissement/Components
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StudentsWidgetData } from '../../../types/chef-etablissement.types';

interface StudentsWidgetProps {
  readonly data: StudentsWidgetData;
  readonly onViewDetails?: () => void;
}

/**
 * Barre de progression pour un niveau
 */
const LevelBar = memo<{
  name: string;
  count: number;
  total: number;
  color: string;
  index: number;
}>(({ name, count, total, color, index }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{name}</span>
        <span className="text-gray-500">{count} élèves</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
});

LevelBar.displayName = 'LevelBar';

/**
 * Widget des effectifs
 */
export const StudentsWidget = memo<StudentsWidgetProps>(({
  data,
  onViewDetails,
}) => {
  // Calcul des statistiques
  const stats = useMemo(() => {
    const malePercentage = data.total > 0 
      ? ((data.byGender.male / data.total) * 100).toFixed(0) 
      : '0';
    const femalePercentage = data.total > 0 
      ? ((data.byGender.female / data.total) * 100).toFixed(0) 
      : '0';

    return { malePercentage, femalePercentage };
  }, [data]);

  return (
    <Card className="border-0 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
            Effectifs
          </CardTitle>
          <Badge 
            variant="secondary" 
            className="bg-blue-100 text-blue-700"
          >
            {data.total} élèves
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Répartition par niveau */}
        <div className="space-y-3">
          {data.byLevel.map((level, index) => (
            <LevelBar
              key={level.levelId}
              name={level.levelName}
              count={level.count}
              total={data.total}
              color={level.color}
              index={index}
            />
          ))}
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          {/* Répartition par genre */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Répartition</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-blue-600 font-medium">
                ♂ {stats.malePercentage}%
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-pink-600 font-medium">
                ♀ {stats.femalePercentage}%
              </span>
            </div>
          </div>

          {/* Nouveaux ce mois */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">Ce mois</span>
            </div>
            <p className="text-sm font-medium text-green-600">
              +{data.newThisMonth} nouveaux
            </p>
          </div>
        </div>

        {/* Bouton voir plus */}
        {onViewDetails && (
          <Button
            variant="ghost"
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={onViewDetails}
          >
            Voir les détails
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

StudentsWidget.displayName = 'StudentsWidget';

export default StudentsWidget;
