/**
 * Composant de comparaison moderne des plans
 * Design premium avec animations et détails complets
 * @module ModernPlanComparison
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, HardDrive, Headphones, Palette, Zap, CheckCircle2, X, Crown, Package, Star, Shield, Globe, Layers, ChevronDown, ChevronUp, Smartphone, Monitor } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComparisonFilters } from './components/ComparisonFilters';
import { ComparisonExport } from './components/ComparisonExport';
import { TwoPlansComparison } from './components/TwoPlansComparison';
import { filterPlans, calculateValueScore } from '../../utils/comparison-utils';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';
import type { PlanFilters } from '../../utils/comparison-utils';
import './components/ModulesSection.css';

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
  const [viewMode, setViewMode] = useState<'all' | 'two'>('all');
  const [selectedPlans, setSelectedPlans] = useState<[string, string] | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [filters, setFilters] = useState<PlanFilters>({
    priceRange: 'all',
    features: [],
    minSchools: 0,
    searchQuery: '',
  });

  if (!plans || plans.length === 0) {
    return null;
  }

  // Filtrer et trier les plans
  const filteredPlans = useMemo(() => filterPlans(plans, filters), [plans, filters]);
  const sortedPlans = useMemo(() => [...filteredPlans].sort((a, b) => a.price - b.price), [filteredPlans]);

  // Mode comparaison 2 plans
  const twoPlansToCompare = useMemo(() => {
    if (!selectedPlans) return null;
    const plan1 = sortedPlans.find(p => p.id === selectedPlans[0]);
    const plan2 = sortedPlans.find(p => p.id === selectedPlans[1]);
    return plan1 && plan2 ? { plan1, plan2 } : null;
  }, [selectedPlans, sortedPlans]);

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
    <div className="space-y-6">
      {/* Filtres */}
      <ComparisonFilters
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={sortedPlans.length}
        totalCount={plans.length}
      />

      {/* Mode comparaison */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Tous les plans
            </Button>
            <Button
              variant={viewMode === 'two' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('two')}
              disabled={sortedPlans.length < 2}
            >
              Comparer 2 plans
            </Button>
          </div>
          <ComparisonExport plans={sortedPlans} />
        </div>

        {/* Sélection 2 plans */}
        {viewMode === 'two' && (
          <div className="flex gap-4 mt-4">
            <select
              className="flex-1 border border-slate-300 rounded-md px-3 py-2"
              value={selectedPlans?.[0] || ''}
              onChange={(e) => setSelectedPlans([e.target.value, selectedPlans?.[1] || sortedPlans[1]?.id])}
            >
              <option value="">Sélectionner plan 1</option>
              {sortedPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="flex-1 border border-slate-300 rounded-md px-3 py-2"
              value={selectedPlans?.[1] || ''}
              onChange={(e) => setSelectedPlans([selectedPlans?.[0] || sortedPlans[0]?.id, e.target.value])}
            >
              <option value="">Sélectionner plan 2</option>
              {sortedPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </Card>

      {/* Comparaison 2 plans */}
      {viewMode === 'two' && twoPlansToCompare && (
        <TwoPlansComparison plan1={twoPlansToCompare.plan1} plan2={twoPlansToCompare.plan2} />
      )}

      {/* Tableau complet */}
      {viewMode === 'all' && (
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
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${sortedPlans.length}, 1fr)` }}>
          {sortedPlans.map((plan) => {
            const theme = getPlanTheme(plan.slug);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: sortedPlans.indexOf(plan) * 0.1 }}
                className="flex"
              >
                <Card className={`flex-1 flex flex-col p-6 bg-gradient-to-br ${theme.gradient} text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}>
                  {/* Header avec badges */}
                  <div className="flex flex-col items-center mb-4 min-h-[60px]">
                    {plan.isPopular && (
                      <Badge className="mb-2 bg-white/20 text-white border-0 backdrop-blur-sm">
                        <Crown className="w-3 h-3 mr-1" />
                        Populaire
                      </Badge>
                    )}
                    <h4 className="text-xl font-bold text-center">{plan.name}</h4>
                  </div>

                  {/* Score de valeur */}
                  <div className="flex justify-center mb-4">
                    <Badge className="bg-green-500 text-white border-0 shadow-md">
                      <Star className="w-3 h-3 mr-1" />
                      Score: {calculateValueScore(plan).toFixed(1)}/10
                    </Badge>
                  </div>

                  {/* Prix */}
                  <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-[100px]">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold">Gratuit</div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                          <span className="text-lg opacity-80 ml-2">{plan.currency}</span>
                        </div>
                        <div className="text-sm opacity-80 mt-1">
                          /{plan.billingPeriod === 'yearly' ? 'an' : 'mois'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discount badge */}
                  <div className="flex justify-center min-h-[28px]">
                    {plan.discount && (
                      <Badge className="bg-red-500 text-white border-0 text-xs shadow-md">
                        -{plan.discount}% OFF
                      </Badge>
                    )}
                  </div>
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
              className="w-full p-6 bg-gradient-to-r from-white via-slate-50 to-slate-100 hover:from-slate-50 hover:via-slate-100 hover:to-slate-200 transition-all duration-300 flex items-center justify-between group border-b-4 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                {/* Icon avec animation */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-[#1D3557] to-[#2d4a6f] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {(() => {
                      const IconComponent = features[0].icon;
                      return <IconComponent className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                </div>
                
                {/* Texte et badge */}
                <div className="flex flex-col items-start gap-1">
                  <span className="font-bold text-xl text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-sm">
                      {features.length} critère{features.length > 1 ? 's' : ''}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {expandedCategories.includes(category) ? 'Cliquez pour réduire' : 'Cliquez pour développer'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Chevron avec animation */}
              <motion.div
                animate={{ 
                  rotate: expandedCategories.includes(category) ? 180 : 0,
                  scale: expandedCategories.includes(category) ? 1.1 : 1
                }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 transition-colors"
              >
                <ChevronDown className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" />
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
                      className={`grid gap-6 p-6 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500`}
                      style={{ gridTemplateColumns: `250px repeat(${sortedPlans.length}, 1fr)` }}
                    >
                      {/* Label de la fonctionnalité */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                          <feature.icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="font-semibold text-slate-800">{feature.label}</span>
                      </div>

                      {/* Valeurs pour chaque plan */}
                      {sortedPlans.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-center py-3">
                          <div className="w-full flex items-center justify-center">
                            {feature.renderValue(plan)}
                          </div>
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
      <div className="p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-t border-slate-200">
        {/* Header avec statistiques */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">
              Détail des Modules par Plan
            </h4>
          </div>
          <p className="text-slate-600 text-sm">
            Explorez les modules inclus dans chaque plan d'abonnement
          </p>
        </div>

        {/* Grid des modules - 2 par ligne avec retour à la ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedPlans.map((plan, index) => {
            const theme = getPlanTheme(plan.slug);
            const isExpanded = showModulesDetail === plan.id;
            const displayedModules = isExpanded ? plan.modules : plan.modules?.slice(0, 5);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  {/* Header avec gradient */}
                  <div className={`p-5 bg-gradient-to-br ${theme.gradient} text-white relative overflow-hidden`}>
                    {/* Effet de fond */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-lg font-bold">{plan.name}</h5>
                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                          {plan.modules?.length || 0}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80">
                        {plan.modules?.length || 0} module{(plan.modules?.length || 0) > 1 ? 's' : ''} inclus
                      </p>
                    </div>
                  </div>

                  {/* Liste des modules */}
                  <div className="p-5">
                    {plan.modules && plan.modules.length > 0 ? (
                      <>
                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                          <AnimatePresence>
                            {displayedModules?.map((module: any, moduleIndex: number) => (
                              <motion.div
                                key={module.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2, delay: moduleIndex * 0.05 }}
                                className="group/item flex items-center gap-3 p-3 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                                  <Package className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="flex-1 text-sm font-medium text-slate-700 group-hover/item:text-slate-900">
                                  {module.name}
                                </span>
                                {module.is_premium && (
                                  <Badge className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 shadow-sm">
                                    <Crown className="w-2.5 h-2.5 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Bouton voir plus/moins */}
                        {plan.modules.length > 5 && (
                          <div className="mt-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowModulesDetail(isExpanded ? null : plan.id)}
                              className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-2" />
                                  Voir moins
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                  Voir {plan.modules.length - 5} modules supplémentaires
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Aucun module assigné</p>
                        <p className="text-slate-400 text-xs mt-1">Ce plan ne contient pas encore de modules</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
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
      )}
    </div>
  );
};

export default ModernPlanComparison;
