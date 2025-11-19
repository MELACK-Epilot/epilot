/**
 * Moteur d'optimisation des plans avec recommandations IA
 * @module PlanOptimizationEngine
 */

import { Lightbulb, TrendingUp, Users, Target, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlanAnalytics } from '../../hooks/usePlanAnalytics';

interface Recommendation {
  id: string;
  type: 'pricing' | 'features' | 'marketing' | 'retention';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
}

export const PlanOptimizationEngine = () => {
  const { data: analytics } = usePlanAnalytics();

  // Recommandations (à remplacer par vraie IA plus tard)
  const recommendations: Recommendation[] = [
    {
      id: '1',
      type: 'pricing',
      priority: 'high',
      title: 'Optimiser le prix du Plan Premium',
      description: 'Le plan Premium est sous-évalué. 78% des utilisateurs Premium seraient prêts à payer 15% de plus selon l\'analyse de valeur perçue.',
      impact: '+1.2M FCFA MRR (+18%)',
      action: 'Augmenter de 50,000 à 57,500 FCFA',
    },
    {
      id: '2',
      type: 'features',
      priority: 'high',
      title: 'Ajouter module "Bulletins Automatisés" au Plan Pro',
      description: '45% des groupes Pro ont demandé ce module dans les enquêtes. Cela justifierait une augmentation de prix.',
      impact: '+800K FCFA MRR (+12%)',
      action: 'Créer module et l\'assigner au Plan Pro',
    },
    {
      id: '3',
      type: 'retention',
      priority: 'medium',
      title: 'Réduire le churn du Plan Gratuit',
      description: '35% des utilisateurs gratuits abandonnent après 2 mois. Proposer upgrade avec réduction ciblée.',
      impact: '+15 conversions/mois',
      action: 'Campagne email automatisée J+45',
    },
    {
      id: '4',
      type: 'marketing',
      priority: 'medium',
      title: 'Créer Plan "Établissement Unique"',
      description: '23% des prospects veulent un plan pour 1 seule école (entre Gratuit et Premium).',
      impact: '+25 nouveaux clients/mois',
      action: 'Créer plan à 35,000 FCFA/mois',
    },
    {
      id: '5',
      type: 'pricing',
      priority: 'low',
      title: 'Offre annuelle avec réduction',
      description: 'Seulement 12% des clients paient annuellement. Proposer -20% pour paiement annuel améliore le cash-flow.',
      impact: 'Améliore trésorerie',
      action: 'Ajouter option paiement annuel',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'medium':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing':
        return TrendingUp;
      case 'features':
        return Zap;
      case 'marketing':
        return Lightbulb;
      case 'retention':
        return CheckCircle2;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Titre Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-[#E9C46A]" />
          Optimisation - Recommandations IA
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {recommendations.length} recommandations basées sur l'analyse de vos données
        </p>
      </div>

      {/* Impact Potentiel - Style Catégories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Impact MRR Potentiel</p>
            <p className="text-3xl font-bold text-white">+2.0M</p>
            <p className="text-xs text-white/70 mt-1">FCFA si appliqué</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Nouveaux Clients</p>
            <p className="text-3xl font-bold text-white">+40/mois</p>
            <p className="text-xs text-white/70 mt-1">Optimisations marketing</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Réduction Churn</p>
            <p className="text-3xl font-bold text-white">-1.2%</p>
            <p className="text-xs text-white/70 mt-1">Amélioration rétention</p>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const priorityColor = getPriorityColor(rec.priority);
          const TypeIcon = getTypeIcon(rec.type);

          return (
            <Card key={rec.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                {/* Numéro */}
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 flex-shrink-0">
                  {index + 1}
                </div>

                {/* Contenu */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{rec.title}</h3>
                    </div>
                    <Badge variant="outline" className={`${priorityColor.bg} ${priorityColor.text} border ${priorityColor.border}`}>
                      {rec.priority === 'high' ? '🔴 Haute' :
                       rec.priority === 'medium' ? '🟠 Moyenne' :
                       '🔵 Basse'}
                    </Badge>
                  </div>

                  <p className="text-slate-600 mb-4">{rec.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs text-slate-500">Impact Estimé</div>
                        <div className="font-semibold text-green-600">{rec.impact}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Action Recommandée</div>
                        <div className="font-medium text-slate-900">{rec.action}</div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
