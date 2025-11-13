/**
 * Moteur d'optimisation IA pour les plans
 * Recommandations automatiques basées sur les données
 * @module PlanOptimizationEngine
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Target, TrendingUp, DollarSign, Users, Zap, 
  ArrowRight, CheckCircle2, AlertTriangle, Lightbulb,
  BarChart3, PieChart, Settings, Sparkles, Crown,
  RefreshCw, Play, Pause, Eye, EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanAnalytics } from '../../hooks/usePlanAnalytics';

interface OptimizationRecommendation {
  id: string;
  type: 'pricing' | 'features' | 'positioning' | 'bundling' | 'targeting';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue: string | number;
  recommendedValue: string | number;
  expectedImpact: {
    revenue: number; // % increase
    subscriptions: number; // % increase
    churn: number; // % decrease
  };
  confidence: number; // 0-100%
  timeToImplement: string;
  effort: 'low' | 'medium' | 'high';
  planAffected: string;
  actionItems: string[];
  risks: string[];
  successMetrics: string[];
}

export const PlanOptimizationEngine = () => {
  const { data: analytics, isLoading } = usePlanAnalytics();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Générer les recommandations basées sur les analytics
  const generateRecommendations = (): OptimizationRecommendation[] => {
    if (!analytics) return [];

    const recommendations: OptimizationRecommendation[] = [];

    analytics.planMetrics.forEach(plan => {
      // Recommandation de pricing si sous-évalué
      if (plan.marketPosition === 'underpriced') {
        recommendations.push({
          id: `pricing-${plan.planId}`,
          type: 'pricing',
          priority: 'high',
          title: `Optimiser le prix du plan ${plan.planName}`,
          description: 'Le plan est actuellement sous-évalué par rapport au marché. Une augmentation progressive pourrait améliorer significativement les revenus.',
          currentValue: `${plan.monthlyRevenue / plan.activeSubscriptions} FCFA/mois`,
          recommendedValue: `${plan.recommendedPrice} FCFA/mois`,
          expectedImpact: {
            revenue: 25,
            subscriptions: -5,
            churn: 2,
          },
          confidence: 85,
          timeToImplement: '2-4 semaines',
          effort: 'low',
          planAffected: plan.planName,
          actionItems: [
            'Analyser la sensibilité prix des clients actuels',
            'Tester l\'augmentation sur nouveaux clients d\'abord',
            'Communiquer la valeur ajoutée justifiant le prix',
            'Monitorer le taux de conversion pendant 30 jours',
          ],
          risks: [
            'Perte de clients sensibles au prix',
            'Réduction temporaire des nouvelles souscriptions',
            'Réactions négatives sur les réseaux sociaux',
          ],
          successMetrics: [
            'Augmentation MRR de 20%+',
            'Churn rate stable (<15%)',
            'Taux de conversion >80% du niveau actuel',
          ],
        });
      }

      // Recommandation anti-churn si taux élevé
      if (plan.churnRate > 15) {
        recommendations.push({
          id: `churn-${plan.planId}`,
          type: 'features',
          priority: 'critical',
          title: `Réduire le churn du plan ${plan.planName}`,
          description: `Avec un taux de churn de ${plan.churnRate}%, ce plan nécessite des améliorations urgentes pour retenir les clients.`,
          currentValue: `${plan.churnRate}%`,
          recommendedValue: '<10%',
          expectedImpact: {
            revenue: 15,
            subscriptions: 20,
            churn: -40,
          },
          confidence: 90,
          timeToImplement: '6-8 semaines',
          effort: 'high',
          planAffected: plan.planName,
          actionItems: [
            'Enquête de satisfaction auprès des clients qui partent',
            'Améliorer l\'onboarding et la formation',
            'Ajouter des fonctionnalités demandées',
            'Programme de rétention avec support dédié',
          ],
          risks: [
            'Coûts de développement élevés',
            'Temps de mise en œuvre long',
            'Pas de garantie d\'efficacité immédiate',
          ],
          successMetrics: [
            'Churn rate <10% en 3 mois',
            'NPS score >50',
            'Taux de renouvellement >90%',
          ],
        });
      }

      // Recommandation de repositionnement si pas d'abonnements
      if (plan.activeSubscriptions === 0) {
        recommendations.push({
          id: `positioning-${plan.planId}`,
          type: 'positioning',
          priority: 'medium',
          title: `Repositionner le plan ${plan.planName}`,
          description: 'Ce plan n\'attire aucun client. Il faut revoir sa proposition de valeur et son positionnement marché.',
          currentValue: '0 abonnements',
          recommendedValue: 'Repositionnement complet',
          expectedImpact: {
            revenue: 50,
            subscriptions: 100,
            churn: 0,
          },
          confidence: 70,
          timeToImplement: '4-6 semaines',
          effort: 'medium',
          planAffected: plan.planName,
          actionItems: [
            'Étude de marché approfondie',
            'Redéfinir la proposition de valeur',
            'Ajuster le mix fonctionnalités/prix',
            'Campagne marketing ciblée',
          ],
          risks: [
            'Investissement marketing important',
            'Cannibalisation d\'autres plans',
            'Confusion des prospects',
          ],
          successMetrics: [
            'Au moins 5 nouveaux abonnements/mois',
            'Taux de conversion >2%',
            'Feedback positif des prospects',
          ],
        });
      }

      // Recommandation de bundling si forte croissance
      if (plan.growthRate30d > 20) {
        recommendations.push({
          id: `bundling-${plan.planId}`,
          type: 'bundling',
          priority: 'medium',
          title: `Capitaliser sur le succès du plan ${plan.planName}`,
          description: `Avec une croissance de ${plan.growthRate30d}%, ce plan a un fort momentum. Créer des offres complémentaires.`,
          currentValue: `${plan.growthRate30d}% croissance`,
          recommendedValue: 'Offres premium/add-ons',
          expectedImpact: {
            revenue: 30,
            subscriptions: 10,
            churn: -5,
          },
          confidence: 75,
          timeToImplement: '3-5 semaines',
          effort: 'medium',
          planAffected: plan.planName,
          actionItems: [
            'Identifier les besoins non couverts',
            'Créer des modules complémentaires',
            'Offres d\'upselling ciblées',
            'Programme de parrainage',
          ],
          risks: [
            'Complexification de l\'offre',
            'Cannibalisation interne',
            'Augmentation des coûts de support',
          ],
          successMetrics: [
            'ARPU +25%',
            'Taux d\'upselling >15%',
            'Satisfaction client maintenue',
          ],
        });
      }
    });

    // Recommandation globale de diversification
    const activePlans = analytics.planMetrics.filter(p => p.activeSubscriptions > 0).length;
    if (activePlans < 2) {
      recommendations.push({
        id: 'diversification-global',
        type: 'targeting',
        priority: 'high',
        title: 'Diversifier le portefeuille de plans',
        description: 'La concentration sur un seul plan représente un risque. Développer d\'autres segments de marché.',
        currentValue: `${activePlans} plan actif`,
        recommendedValue: '3+ plans actifs',
        expectedImpact: {
          revenue: 40,
          subscriptions: 60,
          churn: -10,
        },
        confidence: 80,
        timeToImplement: '8-12 semaines',
        effort: 'high',
        planAffected: 'Tous les plans',
        actionItems: [
          'Segmentation détaillée du marché',
          'Développer des personas spécifiques',
          'Créer des plans ciblés par segment',
          'Stratégie marketing différenciée',
        ],
        risks: [
          'Dispersion des ressources',
          'Complexité opérationnelle',
          'Temps de développement long',
        ],
        successMetrics: [
          'Au moins 3 plans avec >5 abonnements',
          'Réduction du risque de concentration',
          'Croissance globale du MRR',
        ],
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const recommendations = generateRecommendations();

  const runOptimization = async () => {
    setIsRunning(true);
    // Simulation du processus d'analyse IA
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRunning(false);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Moteur d'Optimisation IA
            </h2>
            <p className="text-slate-600">
              Recommandations automatiques pour maximiser vos revenus et réduire le churn
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 px-4 py-2">
              🤖 {recommendations.length} recommandations
            </Badge>
            <Button
              onClick={runOptimization}
              disabled={isRunning}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Lancer l'analyse
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Métriques d'optimisation */}
        {recommendations.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Impact Revenus</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                +{Math.round(recommendations.reduce((sum, r) => sum + r.expectedImpact.revenue, 0) / recommendations.length)}%
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Impact Abonnements</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                +{Math.round(recommendations.reduce((sum, r) => sum + r.expectedImpact.subscriptions, 0) / recommendations.length)}%
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Réduction Churn</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.expectedImpact.churn, 0) / recommendations.length)}%
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">Confiance Moyenne</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Liste des recommandations */}
      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            index={index}
            isSelected={selectedRecommendation === recommendation.id}
            onSelect={() => setSelectedRecommendation(
              selectedRecommendation === recommendation.id ? null : recommendation.id
            )}
            showDetails={showDetails}
          />
        ))}
      </div>

      {recommendations.length === 0 && (
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Aucune recommandation disponible
          </h3>
          <p className="text-slate-500 mb-4">
            Vos plans semblent déjà optimisés ! Lancez une nouvelle analyse pour vérifier.
          </p>
          <Button onClick={runOptimization} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Relancer l'analyse
          </Button>
        </Card>
      )}
    </div>
  );
};

// Composant RecommendationCard
const RecommendationCard = ({ 
  recommendation, 
  index, 
  isSelected, 
  onSelect, 
  showDetails 
}: {
  recommendation: OptimizationRecommendation;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  showDetails: boolean;
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-amber-500 bg-amber-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      default: return 'border-slate-500 bg-slate-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'medium': return <Target className="w-4 h-4 text-blue-600" />;
      default: return <Lightbulb className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <DollarSign className="w-4 h-4" />;
      case 'features': return <Settings className="w-4 h-4" />;
      case 'positioning': return <Target className="w-4 h-4" />;
      case 'bundling': return <Crown className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className={`border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isSelected ? getPriorityColor(recommendation.priority) : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={onSelect}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2">
                {getPriorityIcon(recommendation.priority)}
                {getTypeIcon(recommendation.type)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{recommendation.title}</h3>
                <p className="text-sm text-slate-600">{recommendation.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor(recommendation.priority).split(' ')[1]} border-0 text-xs`}>
                {recommendation.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {recommendation.confidence}% confiance
              </Badge>
            </div>
          </div>

          {/* Métriques d'impact */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">+{recommendation.expectedImpact.revenue}%</div>
              <div className="text-xs text-green-700">Revenus</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">+{recommendation.expectedImpact.subscriptions}%</div>
              <div className="text-xs text-blue-700">Abonnements</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{recommendation.expectedImpact.churn}%</div>
              <div className="text-xs text-purple-700">Churn</div>
            </div>
          </div>

          {/* Détails expandables */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  {/* Changement proposé */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Actuel</div>
                      <div className="text-lg font-semibold text-slate-900">{recommendation.currentValue}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Recommandé</div>
                      <div className="text-lg font-semibold text-blue-600">{recommendation.recommendedValue}</div>
                    </div>
                  </div>

                  {/* Actions à effectuer */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Actions à effectuer :</h4>
                    <ul className="space-y-1">
                      {recommendation.actionItems.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Métriques de succès */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Métriques de succès :</h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.successMetrics.map((metric, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Informations pratiques */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Temps d'implémentation</div>
                      <div className="text-sm text-slate-600">{recommendation.timeToImplement}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Effort requis</div>
                      <Badge className={`text-xs ${
                        recommendation.effort === 'high' ? 'bg-red-100 text-red-700' :
                        recommendation.effort === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      } border-0`}>
                        {recommendation.effort}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default PlanOptimizationEngine;
