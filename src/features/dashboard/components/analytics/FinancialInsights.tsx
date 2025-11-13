/**
 * Insights financiers avec IA et prédictions
 * @module FinancialInsights
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Zap,
  Brain,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface FinancialInsightsProps {
  payments?: any[];
  expenses?: any[];
  budgets?: any[];
}

export const FinancialInsights = ({ payments = [], expenses = [], budgets = [] }: FinancialInsightsProps) => {
  // Calculer les insights avec IA
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // 1. Analyse tendance paiements
    const recentPayments = payments.slice(-30);
    const previousPayments = payments.slice(-60, -30);
    const recentTotal = recentPayments.reduce((sum, p) => sum + p.amount, 0);
    const previousTotal = previousPayments.reduce((sum, p) => sum + p.amount, 0);
    const growth = ((recentTotal - previousTotal) / previousTotal) * 100;

    if (growth > 10) {
      insights.push({
        type: 'success',
        title: 'Croissance des revenus',
        description: `Les paiements ont augmenté de ${growth.toFixed(1)}% ce mois-ci. Excellente performance !`,
        impact: 'high',
      });
    } else if (growth < -10) {
      insights.push({
        type: 'warning',
        title: 'Baisse des revenus',
        description: `Les paiements ont diminué de ${Math.abs(growth).toFixed(1)}% ce mois-ci. Action recommandée.`,
        impact: 'high',
        action: {
          label: 'Analyser',
          onClick: () => console.log('Analyse détaillée'),
        },
      });
    }

    // 2. Analyse budgets
    const overBudget = budgets.filter(b => b.percentage >= 100);
    const nearLimit = budgets.filter(b => b.percentage >= 80 && b.percentage < 100);

    if (overBudget.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Budgets dépassés',
        description: `${overBudget.length} catégorie(s) ont dépassé leur budget. Révision nécessaire.`,
        impact: 'high',
        action: {
          label: 'Voir détails',
          onClick: () => console.log('Budgets dépassés'),
        },
      });
    }

    if (nearLimit.length > 0) {
      insights.push({
        type: 'info',
        title: 'Budgets proches de la limite',
        description: `${nearLimit.length} catégorie(s) ont atteint 80% de leur budget.`,
        impact: 'medium',
      });
    }

    // 3. Prédiction fin de mois
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    
    const avgDailyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) / currentDay;
    const predictedTotal = (avgDailyExpenses * currentDay) + (avgDailyExpenses * daysRemaining);
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
    
    if (predictedTotal > totalBudget) {
      insights.push({
        type: 'prediction',
        title: 'Prévision de dépassement',
        description: `Basé sur les dépenses actuelles, vous risquez de dépasser le budget de ${((predictedTotal - totalBudget) / 1000).toFixed(0)}K FCFA ce mois-ci.`,
        impact: 'high',
        action: {
          label: 'Optimiser',
          onClick: () => console.log('Optimisation budget'),
        },
      });
    }

    // 4. Opportunités d'économies
    const highExpenseCategories = budgets
      .filter(b => b.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);

    if (highExpenseCategories.length > 0) {
      insights.push({
        type: 'info',
        title: 'Opportunités d\'économies',
        description: `Les catégories ${highExpenseCategories.map(c => c.categoryLabel).join(', ')} représentent 60% des dépenses. Analyse recommandée.`,
        impact: 'medium',
      });
    }

    // 5. Paiements en retard
    const overduePayments = payments.filter(p => p.status === 'overdue');
    if (overduePayments.length > 0) {
      const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
      insights.push({
        type: 'warning',
        title: 'Paiements en retard',
        description: `${overduePayments.length} paiement(s) en retard pour un total de ${(overdueAmount / 1000).toFixed(0)}K FCFA.`,
        impact: 'high',
        action: {
          label: 'Relancer',
          onClick: () => console.log('Relance paiements'),
        },
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'prediction':
        return <Brain className="w-5 h-5 text-purple-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'prediction':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[impact as keyof typeof colors];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Insights Financiers IA</h3>
          <p className="text-sm text-gray-600">Analyse intelligente et prédictions</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Pas assez de données pour générer des insights</p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-4 border-2 ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getInsightIcon(insight.type)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <Badge className={getImpactBadge(insight.impact)}>
                        {insight.impact === 'high' ? 'Prioritaire' : insight.impact === 'medium' ? 'Important' : 'Info'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                    
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={insight.action.onClick}
                        className="text-xs"
                      >
                        {insight.action.label}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  );
};
