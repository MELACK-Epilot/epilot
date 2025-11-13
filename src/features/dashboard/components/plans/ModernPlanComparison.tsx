/**
 * Composant de comparaison moderne des plans
 * Design premium avec animations et détails complets
 * @module ModernPlanComparison
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, HardDrive, Headphones, Palette, Zap, CheckCircle2, X, Crown, Package, Star, Shield, Globe, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface ModernPlanComparisonProps {
  plans: PlanWithContent[];
}

interface ComparisonFeature {
  key: string;
  label: string;
  icon: React.ElementType;
  category: 'limits' | 'features' | 'support' | 'content';
  renderValue: (plan: PlanWithContent) => React.ReactNode;
}

const comparisonFeatures: ComparisonFeature[] = [
  // Limites
  {
    key: 'maxSchools',
    label: 'Nombre d\'écoles',
    icon: Building2,
    category: 'limits',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900">
          {plan.maxSchools === -1 ? '∞' : plan.maxSchools}
        </div>
        <div className="text-xs text-slate-500">
          {plan.maxSchools === -1 ? 'Illimité' : 'écoles max'}
        </div>
      </div>
    ),
  },
  {
    key: 'maxStudents',
    label: 'Nombre d\'élèves',
    icon: Users,
    category: 'limits',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900">
          {plan.maxStudents === -1 ? '∞' : plan.maxStudents.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">
          {plan.maxStudents === -1 ? 'Illimité' : 'élèves max'}
        </div>
      </div>
    ),
  },
  {
    key: 'maxStaff',
    label: 'Personnel',
    icon: Users,
    category: 'limits',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900">
          {plan.maxStaff === -1 ? '∞' : plan.maxStaff}
        </div>
        <div className="text-xs text-slate-500">
          {plan.maxStaff === -1 ? 'Illimité' : 'membres max'}
        </div>
      </div>
    ),
  },
  {
    key: 'maxStorage',
    label: 'Stockage',
    icon: HardDrive,
    category: 'limits',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900">{plan.maxStorage}</div>
        <div className="text-xs text-slate-500">GB</div>
      </div>
    ),
  },
  // Support
  {
    key: 'supportLevel',
    label: 'Niveau de support',
    icon: Headphones,
    category: 'support',
    renderValue: (plan) => {
      const levels = {
        email: { label: 'Email', color: 'bg-gray-100 text-gray-700', icon: '📧' },
        priority: { label: 'Prioritaire', color: 'bg-blue-100 text-blue-700', icon: '⚡' },
        '24/7': { label: '24/7', color: 'bg-green-100 text-green-700', icon: '🚀' },
      };
      const level = levels[plan.supportLevel as keyof typeof levels] || levels.email;
      return (
        <div className="text-center">
          <Badge className={`${level.color} border-0 text-sm px-3 py-1`}>
            {level.icon} {level.label}
          </Badge>
        </div>
      );
    },
  },
  // Fonctionnalités
  {
    key: 'customBranding',
    label: 'Branding personnalisé',
    icon: Palette,
    category: 'features',
    renderValue: (plan) => (
      <div className="flex justify-center">
        {plan.customBranding ? (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'apiAccess',
    label: 'Accès API',
    icon: Zap,
    category: 'features',
    renderValue: (plan) => (
      <div className="flex justify-center">
        {plan.apiAccess ? (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'trialDays',
    label: 'Essai gratuit',
    icon: Star,
    category: 'features',
    renderValue: (plan) => (
      <div className="text-center">
        {plan.trialDays ? (
          <>
            <div className="text-2xl font-bold text-green-600">{plan.trialDays}</div>
            <div className="text-xs text-slate-500">jours</div>
          </>
        ) : (
          <div className="text-slate-400">-</div>
        )}
      </div>
    ),
  },
  // Contenu
  {
    key: 'categories',
    label: 'Catégories',
    icon: Layers,
    category: 'content',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-2xl font-bold text-teal-600">{plan.categories?.length || 0}</div>
        <div className="text-xs text-slate-500">catégories</div>
      </div>
    ),
  },
  {
    key: 'modules',
    label: 'Modules',
    icon: Package,
    category: 'content',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-2xl font-bold text-indigo-600">{plan.modules?.length || 0}</div>
        <div className="text-xs text-slate-500">modules</div>
      </div>
    ),
  },
];

const categoryLabels = {
  limits: 'Limites & Quotas',
  support: 'Support',
  features: 'Fonctionnalités',
  content: 'Contenu Inclus',
};

export const ModernPlanComparison = ({ plans }: ModernPlanComparisonProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['limits', 'content']);
  const [showModulesDetail, setShowModulesDetail] = useState<string | null>(null);

  if (!plans || plans.length === 0) {
    return null;
  }

  // Trier les plans par prix
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getPlanTheme = (slug: string) => {
    const themes = {
      gratuit: { gradient: 'from-slate-600 to-slate-700', accent: 'slate-600', bg: 'slate-50' },
      premium: { gradient: 'from-teal-500 to-teal-600', accent: 'teal-600', bg: 'teal-50' },
      pro: { gradient: 'from-indigo-600 to-indigo-700', accent: 'indigo-600', bg: 'indigo-50' },
      institutionnel: { gradient: 'from-amber-500 to-amber-600', accent: 'amber-600', bg: 'amber-50' },
    };
    return themes[slug as keyof typeof themes] || themes.gratuit;
  };

  // Grouper les fonctionnalités par catégorie
  const featuresByCategory = comparisonFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, ComparisonFeature[]>);

  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-white rounded-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-8 border-b border-slate-200">
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-slate-900 mb-2">
            Comparaison Détaillée des Plans
          </h3>
          <p className="text-slate-600">
            Découvrez les différences entre nos {sortedPlans.length} plans d'abonnement
          </p>
        </div>

        {/* En-têtes des plans */}
        <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `200px repeat(${sortedPlans.length}, 1fr)` }}>
          <div></div> {/* Espace pour les labels */}
          {sortedPlans.map((plan) => {
            const theme = getPlanTheme(plan.slug);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Card className={`p-6 bg-gradient-to-br ${theme.gradient} text-white border-0 shadow-lg`}>
                  {plan.isPopular && (
                    <Badge className="mb-3 bg-white/20 text-white border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  )}
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-3">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-bold">Gratuit</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
                        <span className="text-sm opacity-80 ml-1">{plan.currency}</span>
                        <div className="text-sm opacity-80">
                          /{plan.billingPeriod === 'yearly' ? 'an' : 'mois'}
                        </div>
                      </div>
                    )}
                  </div>
                  {plan.discount && (
                    <Badge className="bg-red-500 text-white border-0 text-xs">
                      -{plan.discount}% OFF
                    </Badge>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tableau de comparaison */}
      <div className="overflow-x-auto">
        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} className="border-b border-slate-100 last:border-b-0">
            {/* En-tête de catégorie */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                  <features[0].icon className="w-4 h-4 text-slate-600" />
                </div>
                <span className="font-semibold text-slate-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
                <Badge variant="outline" className="text-xs">
                  {features.length} critères
                </Badge>
              </div>
              <motion.div
                animate={{ rotate: expandedCategories.includes(category) ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </motion.div>
            </button>

            {/* Contenu de la catégorie */}
            <AnimatePresence>
              {expandedCategories.includes(category) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {features.map((feature, index) => (
                    <div
                      key={feature.key}
                      className={`grid gap-4 p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors`}
                      style={{ gridTemplateColumns: `200px repeat(${sortedPlans.length}, 1fr)` }}
                    >
                      {/* Label de la fonctionnalité */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-700">{feature.label}</span>
                      </div>

                      {/* Valeurs pour chaque plan */}
                      {sortedPlans.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-center py-2">
                          {feature.renderValue(plan)}
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Section détaillée des modules */}
      <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50">
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          Détail des Modules par Plan
        </h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sortedPlans.length}, 1fr)` }}>
          {sortedPlans.map((plan) => {
            const theme = getPlanTheme(plan.slug);
            return (
              <Card key={plan.id} className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-slate-900">{plan.name}</h5>
                  <Badge className={`bg-${theme.bg} text-${theme.accent} border-0`}>
                    {plan.modules?.length || 0} modules
                  </Badge>
                </div>
                
                {plan.modules && plan.modules.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {plan.modules.slice(0, 5).map((module: any) => (
                      <div key={module.id} className="flex items-center gap-2 text-sm p-2 bg-white rounded-lg border border-slate-200">
                        <Package className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="flex-1 text-slate-700">{module.name}</span>
                        {module.is_premium && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                            Premium
                          </Badge>
                        )}
                      </div>
                    ))}
                    {plan.modules.length > 5 && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowModulesDetail(showModulesDetail === plan.id ? null : plan.id)}
                          className="text-xs"
                        >
                          {showModulesDetail === plan.id ? 'Voir moins' : `+${plan.modules.length - 5} autres`}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    Aucun module assigné
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer avec légende */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Inclus</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-gray-400" />
            <span>Non inclus</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Plan populaire</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ModernPlanComparison;
