/**
 * KPIs améliorés pour l'assignation de modules
 * Affiche statistiques détaillées avec répartition par catégorie
 */

import { CheckCircle2, Package, Target, FolderTree, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalModules: number;
  assignedModules: number;
}

interface ModuleAssignmentKPIsProps {
  totalModules: number;
  assignedModules: number;
  categoriesStats: CategoryStat[];
}

export const ModuleAssignmentKPIs = ({ 
  totalModules, 
  assignedModules, 
  categoriesStats 
}: ModuleAssignmentKPIsProps) => {
  const availableModules = totalModules - assignedModules;
  const assignmentPercentage = totalModules > 0 ? (assignedModules / totalModules) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* KPIs Principaux - Layout horizontal compact */}
      <div className="grid grid-cols-3 gap-2">
        {/* Assignés */}
        <Card className="p-2 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-700">{assignedModules}</p>
              <p className="text-xs text-green-600 font-medium">Assignés</p>
            </div>
          </div>
        </Card>

        {/* Disponibles */}
        <Card className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-700">{availableModules}</p>
              <p className="text-xs text-blue-600 font-medium">Disponibles</p>
            </div>
          </div>
        </Card>

        {/* Total */}
        <Card className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-purple-700">{totalModules}</p>
              <p className="text-xs text-purple-600 font-medium">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barre de progression globale - Compact */}
      <Card className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#2A9D8F]" />
            <h3 className="font-semibold text-xs text-gray-900">Progression</h3>
          </div>
          <Badge className="bg-[#2A9D8F] text-white font-bold text-xs px-1.5 py-0">
            {assignmentPercentage.toFixed(0)}%
          </Badge>
        </div>
        <Progress 
          value={assignmentPercentage} 
          className="h-2 bg-gray-200"
        />
        <p className="text-xs text-gray-600 mt-1">
          {assignedModules} sur {totalModules} modules
        </p>
      </Card>

      {/* Répartition par catégorie - Ultra compact */}
      {categoriesStats.length > 0 && (
        <Card className="p-2 border border-gray-200">
          <div className="flex items-center gap-1.5 mb-2">
            <FolderTree className="h-3.5 w-3.5 text-[#2A9D8F]" />
            <h3 className="font-semibold text-xs text-gray-900">Catégories</h3>
            <Badge variant="outline" className="ml-auto text-xs px-1.5 py-0">
              {categoriesStats.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categoriesStats.map((category) => {
              const categoryPercentage = category.totalModules > 0 
                ? (category.assignedModules / category.totalModules) * 100 
                : 0;
              
              return (
                <div key={category.id} className="group bg-white rounded-lg p-2 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {category.name}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-medium text-gray-600">
                            {category.assignedModules}/{category.totalModules}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs font-bold px-1.5 py-0"
                            style={{ 
                              borderColor: category.color,
                              color: category.color 
                            }}
                          >
                            {categoryPercentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={categoryPercentage} 
                          className="h-1.5"
                          style={{ 
                            backgroundColor: `${category.color}15`,
                          }}
                        />
                        <div 
                          className="absolute top-0 left-0 h-1.5 rounded-full transition-all"
                          style={{ 
                            width: `${categoryPercentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
