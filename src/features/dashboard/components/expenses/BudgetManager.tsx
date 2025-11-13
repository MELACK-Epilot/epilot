/**
 * Gestionnaire de budgets par catégorie avec alertes
 * @module BudgetManager
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Edit, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface Budget {
  category: string;
  categoryLabel: string;
  color: string;
  budget: number;
  spent: number;
  percentage: number;
}

interface BudgetManagerProps {
  budgets: Budget[];
  onEdit?: (category: string) => void;
  onRequestIncrease?: (category: string) => void;
}

export const BudgetManager = ({ budgets, onEdit, onRequestIncrease }: BudgetManagerProps) => {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      {budgets.map((budget, index) => (
        <motion.div
          key={budget.category}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: budget.color }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{budget.categoryLabel}</h4>
                  <p className="text-sm text-gray-600">
                    {budget.spent.toLocaleString()} / {budget.budget.toLocaleString()} FCFA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(budget.percentage)} bg-transparent border-0`}>
                  {budget.percentage.toFixed(0)}%
                </Badge>
                {budget.percentage >= 80 && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-3">
              <Progress
                value={Math.min(budget.percentage, 100)}
                className="h-2"
                indicatorClassName={getProgressColor(budget.percentage)}
              />
            </div>

            {/* Informations et actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Restant : {Math.max(0, budget.budget - budget.spent).toLocaleString()} FCFA
              </div>

              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(budget.category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onRequestIncrease && budget.percentage >= 80 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestIncrease(budget.category)}
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Augmenter
                  </Button>
                )}
              </div>
            </div>

            {/* Alerte si dépassement */}
            {budget.percentage >= 100 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ Budget dépassé de {(budget.percentage - 100).toFixed(0)}%
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      ))}

      {/* Résumé global */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 mb-1">Budget Total</p>
            <p className="text-2xl font-bold text-blue-900">
              {budgets.reduce((sum, b) => sum + b.budget, 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700 mb-1">Dépensé</p>
            <p className="text-2xl font-bold text-blue-900">
              {budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()} FCFA
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700 mb-1">Utilisation</p>
            <p className="text-2xl font-bold text-blue-900">
              {((budgets.reduce((sum, b) => sum + b.spent, 0) / budgets.reduce((sum, b) => sum + b.budget, 0)) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
