/**
 * Comparaison Plans Optimisée - Design "Cockpit IA Futuriste"
 * @module ModernPlanComparisonOptimized
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, HardDrive, Headphones, Palette, Zap, CheckCircle2, X, 
  Crown, Package, Layers, ChevronDown, Target, Download, Edit, Info, Brain, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';
import { AnimatedItem } from '../AnimatedCard';
import { exportPlans } from '@/utils/exportUtils';

interface ModernPlanComparisonOptimizedProps {
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
    label: 'Écoles',
    icon: Building2,
    category: 'limits',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-xl font-bold text-slate-900">
          {plan.maxSchools === -1 ? '∞' : plan.maxSchools}
        </div>
        <div className="text-[10px] text-slate-500 uppercase font-semibold">écoles</div>
      </div>
    ),
  },
  {
    key: 'maxStudents',
    label: 'Élèves',
    icon: Users,
    category: 'limits',
    renderValue: (plan) => (
      <div className="text-center">
        <div className="text-xl font-bold text-slate-900">
          {plan.maxStudents === -1 ? '∞' : plan.maxStudents.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-500 uppercase font-semibold">élèves</div>
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
        <div className="text-xl font-bold text-slate-900">{plan.maxStorage}</div>
        <div className="text-[10px] text-slate-500 uppercase font-semibold">GB</div>
      </div>
    ),
  },
  // Support
  {
    key: 'supportLevel',
    label: 'Support',
    icon: Headphones,
    category: 'support',
    renderValue: (plan) => {
      const levels = {
        email: { label: 'Email', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        priority: { label: 'Prioritaire', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        '24/7': { label: '24/7 Dédié', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      };
      const level = levels[plan.supportLevel as keyof typeof levels] || levels.email;
      return (
        <Badge className={`${level.color} border shadow-sm`}>
          {level.label}
        </Badge>
      );
    },
  },
  // Fonctionnalités
  {
    key: 'customBranding',
    label: 'Branding',
    icon: Palette,
    category: 'features',
    renderValue: (plan) => (
      <div className="flex justify-center">
        {plan.customBranding ? (
          <div className="p-1 bg-green-100 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        ) : (
          <div className="p-1 bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'apiAccess',
    label: 'API',
    icon: Zap,
    category: 'features',
    renderValue: (plan) => (
      <div className="flex justify-center">
        {plan.apiAccess ? (
          <div className="p-1 bg-green-100 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        ) : (
          <div className="p-1 bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </div>
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
        <div className="text-xl font-bold text-slate-700">{plan.categories?.length || 0}</div>
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
        <div className="text-xl font-bold text-indigo-600">{plan.modules?.length || 0}</div>
      </div>
    ),
  },
];

const categoryLabels = {
  limits: 'Limites & Quotas',
  support: 'Support Client',
  features: 'Fonctionnalités',
  content: 'Contenu Inclus',
};

export const ModernPlanComparisonOptimized = ({ plans }: ModernPlanComparisonOptimizedProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['limits', 'features']);

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Aucun plan disponible pour la comparaison</p>
      </div>
    );
  }

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.price - b.price), [plans]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const getPlanTheme = (slug: string) => {
    const themes = {
      gratuit: { gradient: 'from-slate-700 to-slate-800', bg: 'slate-50', badge: 'bg-slate-600' },
      premium: { gradient: 'from-teal-500 to-teal-600', bg: 'teal-50', badge: 'bg-teal-600' },
      pro: { gradient: 'from-indigo-600 to-indigo-700', bg: 'indigo-50', badge: 'bg-indigo-600' },
      institutionnel: { gradient: 'from-amber-500 to-amber-600', bg: 'amber-50', badge: 'bg-amber-600' },
    };
    return themes[slug as keyof typeof themes] || themes.gratuit;
  };

  const featuresByCategory = comparisonFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, ComparisonFeature[]>);

  return (
    <div className="space-y-8">
      {/* Header Futuriste */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-xl border border-slate-700">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                <Target className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                Comparaison Détaillée
              </span>
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Analysez les différences techniques et fonctionnelles
            </p>
          </div>
          
          <Button 
            onClick={() => exportPlans(sortedPlans)}
            variant="outline" 
            className="border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter le comparatif
          </Button>
        </div>
      </div>

      {/* Tableau de Comparaison */}
      <Card className="overflow-hidden border-0 shadow-2xl bg-white rounded-2xl">
        {/* En-têtes des plans - ALIGNEMENT CORRIGÉ */}
        <div className="bg-slate-50/50 p-0 border-b border-slate-200">
          <div className="flex">
            {/* Colonne vide pour alignement avec les labels */}
            <div className="flex-shrink-0 w-[220px] p-6 bg-white border-r border-slate-100 flex items-end pb-8">
              <div className="text-sm font-medium text-slate-500">
                {sortedPlans.length} plans disponibles
              </div>
            </div>

            {/* Grid des cartes */}
            <div className="flex-1 grid gap-0" style={{ gridTemplateColumns: `repeat(${sortedPlans.length}, 1fr)` }}>
              {sortedPlans.map((plan, index) => {
                const theme = getPlanTheme(plan.slug);
                return (
                  <div key={plan.id} className="p-4 border-r border-slate-100 last:border-r-0">
                    <AnimatedItem delay={index * 0.1}>
                      <Card className={`h-full flex flex-col justify-between p-5 bg-gradient-to-br ${theme.gradient} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                        <div className="text-center space-y-4">
                          {/* Badge Populaire (hauteur fixe pour alignement) */}
                          <div className="h-6 flex justify-center">
                            {plan.isPopular ? (
                              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-3">
                                <Crown className="w-3 h-3 mr-1" />
                                Populaire
                              </Badge>
                            ) : null}
                          </div>

                          {/* Nom du plan */}
                          <h4 className="text-xl font-bold tracking-tight">{plan.name}</h4>
                          
                          {/* Prix */}
                          <div className="py-2">
                            {plan.price === 0 ? (
                              <div className="text-3xl font-bold">Gratuit</div>
                            ) : (
                              <div>
                                <div className="flex items-baseline justify-center">
                                  <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
                                  <span className="text-sm opacity-80 ml-1">F</span>
                                </div>
                                <div className="text-xs opacity-80">
                                  /{plan.billingPeriod === 'yearly' ? 'an' : 'mois'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bouton Action */}
                        <div className="mt-6">
                          <Button 
                            variant="secondary" 
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                            size="sm"
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </Card>
                    </AnimatedItem>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tableau de comparaison par catégorie */}
        <div className="divide-y divide-slate-100">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div key={category}>
              {/* En-tête de catégorie */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center group bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex-shrink-0 w-[220px] p-5 border-r border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      expandedCategories.includes(category) 
                        ? 'bg-indigo-100 text-indigo-600' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                    }`}>
                      {(() => {
                        const IconComponent = features[0].icon;
                        return <IconComponent className="w-4 h-4" />;
                      })()}
                    </div>
                    <span className="font-bold text-sm text-slate-900">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                    expandedCategories.includes(category) ? 'rotate-180' : ''
                  }`} />
                </div>
                <div className="flex-1 p-5 text-xs font-medium text-slate-400 text-left">
                  {features.length} critères de comparaison
                </div>
              </button>

              {/* Contenu de la catégorie */}
              <AnimatePresence>
                {expandedCategories.includes(category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden bg-slate-50/30"
                  >
                    {features.map((feature, index) => (
                      <div
                        key={feature.key}
                        className="flex hover:bg-white transition-colors border-b border-slate-100 last:border-0"
                      >
                        {/* Label */}
                        <div className="flex-shrink-0 w-[220px] p-4 border-r border-slate-100 flex items-center bg-white">
                          <div className="flex items-center gap-2">
                            <Info className="w-3 h-3 text-slate-300" />
                            <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                          </div>
                        </div>

                        {/* Valeurs */}
                        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${sortedPlans.length}, 1fr)` }}>
                          {sortedPlans.map((plan) => (
                            <div key={plan.id} className="p-4 flex items-center justify-center border-r border-slate-100 last:border-r-0">
                              {feature.renderValue(plan)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Footer Légende */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center gap-8 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Inclus</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-slate-300" />
            <span>Non inclus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center font-bold text-slate-900">∞</span>
            <span>Illimité</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ModernPlanComparisonOptimized;
