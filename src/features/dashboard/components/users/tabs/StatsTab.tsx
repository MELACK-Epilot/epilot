/**
 * Onglet Statistiques - KPIs et Analytics
 * Affiche toutes les statistiques sans distraction
 * Style moderne comme le Dashboard principal
 */

import { motion } from 'framer-motion';
import { ModuleAssignmentKPIs } from '../../modules/ModuleAssignmentKPIs';
import { Info, TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatsTabProps {
  moduleStats: any;
  loadingStats: boolean;
  assignedCount: number;
  availableCount: number;
}

export const StatsTab = ({ 
  moduleStats, 
  loadingStats, 
  assignedCount, 
  availableCount 
}: StatsTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Titre avec style Dashboard */}
      <Card className="p-4 bg-gradient-to-r from-[#2A9D8F] to-[#1D3557] border-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Statistiques des modules
              </h3>
              <p className="text-sm text-white/80">
                Vue d'ensemble de l'assignation
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Award className="h-3 w-3 mr-1" />
            Analytics
          </Badge>
        </div>
      </Card>

      {/* KPIs */}
      {moduleStats && !loadingStats ? (
        <ModuleAssignmentKPIs
          totalModules={moduleStats.totalModules}
          assignedModules={moduleStats.assignedModules}
          categoriesStats={moduleStats.categoriesStats}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-blue-900 font-medium text-sm mb-1">
              {assignedCount} module(s) assigné(s) • {availableCount} disponible(s)
            </p>
            <p className="text-blue-700 text-sm leading-tight">
              💡 Consultez les statistiques détaillées de vos modules
            </p>
          </div>
        </div>
      )}

      {/* Recommandations */}
      {moduleStats && moduleStats.assignedModules === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <span>💡</span> Recommandations
          </h4>
          <ul className="space-y-1 text-sm text-amber-800">
            <li>• Commencez par assigner des catégories entières</li>
            <li>• Ou sélectionnez des modules individuels</li>
            <li>• Définissez les permissions appropriées</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};
