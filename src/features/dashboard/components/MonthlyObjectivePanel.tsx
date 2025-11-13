/**
 * Panel d'objectifs mensuels avec progression et recommandations
 * Affiche l'objectif, la progression, et des actions suggérées
 */

import { Target, Calendar, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useMonthlyObjective, usePaymentReminders } from '../hooks/useSchoolPayments';

interface MonthlyObjectivePanelProps {
  schoolId: string;
  onActionClick?: (action: string) => void;
}

export const MonthlyObjectivePanel = ({ schoolId, onActionClick }: MonthlyObjectivePanelProps) => {
  const { data: objective, isLoading } = useMonthlyObjective(schoolId);
  const { data: reminders } = usePaymentReminders(schoolId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!objective) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  const isOnTrack = objective.objectiveProgressPct >= 70;
  const isAchieved = objective.objectiveProgressPct >= 100;
  const gap = objective.monthlyObjective - objective.currentMonthRevenue;

  // Recommandations basées sur la situation
  const getRecommendations = () => {
    const recs = [];

    if (reminders && reminders.highPriorityCount > 0) {
      recs.push({
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        title: 'Relancer les retards prioritaires',
        description: `${reminders.highPriorityCount} paiements en retard (>30j) pour ${formatCurrency(reminders.totalOverdueAmount)}`,
        action: 'view-overdue',
        actionLabel: 'Voir les retards',
      });
    }

    if (!isAchieved && objective.daysRemaining > 0) {
      recs.push({
        icon: TrendingUp,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        title: 'Objectif quotidien',
        description: `Il faut générer ${formatCurrency(objective.requiredDailyRevenue)}/jour pendant ${objective.daysRemaining} jours`,
        action: 'view-strategy',
        actionLabel: 'Voir stratégie',
      });
    }

    if (reminders && reminders.studentsWithOverdue > 5) {
      recs.push({
        icon: Zap,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        title: 'Campagne de relance',
        description: `${reminders.studentsWithOverdue} familles ont des paiements en retard`,
        action: 'send-reminders',
        actionLabel: 'Lancer campagne',
      });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Objectif Mensuel
            </h3>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{objective.daysRemaining} jours restants</span>
          </div>
        </div>

        {/* Progression principale */}
        <div className={`p-6 rounded-xl border-2 ${
          isAchieved 
            ? 'bg-green-50 border-green-200' 
            : isOnTrack 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="space-y-4">
            {/* Montants */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Revenus actuels</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(objective.currentMonthRevenue)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Objectif</div>
                <div className="text-2xl font-bold text-gray-700">
                  {formatCurrency(objective.monthlyObjective)}
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progression</span>
                <span className={`font-bold ${
                  isAchieved 
                    ? 'text-green-600' 
                    : isOnTrack 
                    ? 'text-blue-600' 
                    : 'text-orange-600'
                }`}>
                  {objective.objectiveProgressPct.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(objective.objectiveProgressPct, 100)} 
                className="h-3"
              />
            </div>

            {/* Message de statut */}
            <div className="flex items-center gap-2">
              {isAchieved ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    🎉 Objectif atteint ! Félicitations !
                  </span>
                </>
              ) : isOnTrack ? (
                <>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    📈 En bonne voie ! Manque {formatCurrency(gap)}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">
                    ⚠️ Attention ! Manque {formatCurrency(gap)} ({objective.daysRemaining}j restants)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Objectif quotidien</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(objective.requiredDailyRevenue)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Pour atteindre l'objectif
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Jours restants</div>
            <div className="text-lg font-bold text-gray-900">
              {objective.daysRemaining}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Jusqu'à la fin du mois
            </div>
          </div>
        </div>

        {/* Recommandations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Actions Recommandées
            </h4>
            
            <div className="space-y-2">
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${rec.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${rec.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 mb-1">
                          {rec.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {rec.description}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onActionClick?.(rec.action)}
                        >
                          {rec.actionLabel}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message de motivation */}
        {!isAchieved && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <span className="font-medium">Conseil : </span>
                {isOnTrack ? (
                  'Vous êtes sur la bonne voie ! Maintenez le rythme et vous atteindrez votre objectif.'
                ) : (
                  `Concentrez-vous sur le recouvrement des ${reminders?.highPriorityCount || 0} paiements en retard pour rattraper le retard.`
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
