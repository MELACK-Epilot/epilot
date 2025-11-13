/**
 * Page Plans & Tarification - VERSION ULTIMATE
 * Design moderne avec modules/catégories optimisés
 * @module PlansUltimate
 */

import { useState } from 'react';
import { Plus, DollarSign, Package, TrendingUp, Edit, Trash2, Building2, CheckCircle2, Crown, Zap, BarChart3, Download, Users, HardDrive, Headphones, Layers, ChevronDown, ChevronUp, Search, Filter, Star, Sparkles, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAllPlansWithContent, type PlanWithContent } from '../hooks/usePlanWithContent';
import { usePlanStats, useDeletePlan } from '../hooks/usePlans';
import { usePlanRevenue } from '../hooks/usePlanRevenue';
import { PlanFormDialog } from '../components/plans/PlanFormDialog';
import { ModernPlanComparison } from '../components/plans/ModernPlanComparison';
import { PlanAnalyticsDashboard } from '../components/plans/PlanAnalyticsDashboard';
import { PlanOptimizationEngine } from '../components/plans/PlanOptimizationEngine';
import { useToast } from '@/hooks/use-toast';
import { exportPlans } from '@/utils/exportUtils';
import { useAuth } from '@/features/auth/store/auth.store';

export const PlansUltimate = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'optimization' | 'comparison'>('overview');
  
  const { data: plans, isLoading } = useAllPlansWithContent(searchQuery);
  const { data: stats } = usePlanStats();
  const { data: revenue } = usePlanRevenue();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();

  const handleCreate = () => {
    setSelectedPlan(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (plan: PlanWithContent) => {
    setSelectedPlan(plan);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDelete = async (plan: PlanWithContent) => {
    if (confirm(`Êtes-vous sûr de vouloir archiver le plan "${plan.name}" ?`)) {
      try {
        await deletePlan.mutateAsync(plan.id);
        toast({
          title: 'Plan archivé',
          description: `Le plan "${plan.name}" a été archivé avec succès.`,
        });
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: error.message || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header Hero Moderne */}
      <div className="relative overflow-hidden">
        {/* Background avec motifs */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(120,200,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 font-medium">Plans & Tarification</span>
            </motion.div>

            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
              Des solutions sur mesure
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Découvrez nos plans flexibles conçus pour accompagner votre croissance, 
              de la petite école au grand réseau institutionnel
            </p>

            {/* Stats Hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { 
                  label: 'Plans Actifs', 
                  value: stats?.active || 0, 
                  icon: CheckCircle2, 
                  gradient: 'from-green-400 to-emerald-500',
                  bg: 'from-green-500/10 to-emerald-500/10'
                },
                { 
                  label: 'Abonnements', 
                  value: stats?.subscriptions || 0, 
                  icon: TrendingUp, 
                  gradient: 'from-blue-400 to-cyan-500',
                  bg: 'from-blue-500/10 to-cyan-500/10'
                },
                { 
                  label: 'Revenus MRR', 
                  value: revenue?.mrr ? `${(revenue.mrr / 1000).toFixed(0)}K` : '0', 
                  icon: DollarSign, 
                  gradient: 'from-amber-400 to-orange-500',
                  bg: 'from-amber-500/10 to-orange-500/10'
                },
                { 
                  label: 'Plans Total', 
                  value: stats?.total || 0, 
                  icon: Package, 
                  gradient: 'from-purple-400 to-pink-500',
                  bg: 'from-purple-500/10 to-pink-500/10'
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`relative bg-gradient-to-br ${stat.bg} backdrop-blur-sm rounded-2xl p-6 border border-white/10 group hover:border-white/20 transition-all`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Barre d'actions flottante */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Recherche avancée */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Rechercher un plan, module ou catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => exportPlans(plans || [])}
                disabled={!plans || plans.length === 0}
                className="border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              {isSuperAdmin && (
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation par onglets */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: Package, description: 'Cartes des plans' },
            { key: 'analytics', label: 'Analytics IA', icon: BarChart3, description: 'Métriques avancées' },
            { key: 'optimization', label: 'Optimisation', icon: Zap, description: 'Recommandations IA' },
            { key: 'comparison', label: 'Comparaison', icon: TrendingUp, description: 'Tableau comparatif' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-sm">{tab.label}</div>
                <div className={`text-xs ${activeTab === tab.key ? 'text-blue-100' : 'text-slate-400'}`}>
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {plans?.map((plan, index) => (
              <UltimatePlanCard
                key={plan.id}
                plan={plan}
                index={index}
                isExpanded={expandedPlanId === plan.id}
                onToggleExpand={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isSuperAdmin={isSuperAdmin}
              />
            ))}
          </div>
        )}

        {/* État vide */}
        {!isLoading && plans?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-3">
              {searchQuery ? 'Aucun résultat trouvé' : 'Aucun plan disponible'}
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? `Aucun plan ne correspond à "${searchQuery}". Essayez avec d'autres mots-clés.`
                : isSuperAdmin
                ? 'Commencez par créer votre premier plan d\'abonnement'
                : 'Aucun plan disponible pour le moment'
              }
            </p>
            {isSuperAdmin && !searchQuery && (
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un plan
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialog */}
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        mode={dialogMode}
      />
    </div>
  );
};

// Composant UltimatePlanCard
interface UltimatePlanCardProps {
  plan: PlanWithContent;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (plan: PlanWithContent) => void;
  onDelete: (plan: PlanWithContent) => void;
  isSuperAdmin: boolean;
}

const UltimatePlanCard = ({
  plan,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isSuperAdmin,
}: UltimatePlanCardProps) => {
  const getPlanTheme = (slug: string) => {
    const themes = {
      gratuit: {
        gradient: 'from-slate-600 via-slate-700 to-slate-800',
        accent: 'slate',
        icon: Package,
        bgPattern: 'from-slate-500/5 to-slate-600/5'
      },
      premium: {
        gradient: 'from-teal-500 via-teal-600 to-teal-700',
        accent: 'teal',
        icon: Zap,
        bgPattern: 'from-teal-500/5 to-teal-600/5'
      },
      pro: {
        gradient: 'from-indigo-600 via-indigo-700 to-indigo-800',
        accent: 'indigo',
        icon: Crown,
        bgPattern: 'from-indigo-500/5 to-indigo-600/5'
      },
      institutionnel: {
        gradient: 'from-amber-500 via-amber-600 to-amber-700',
        accent: 'amber',
        icon: Building2,
        bgPattern: 'from-amber-500/5 to-amber-600/5'
      },
    };
    return themes[slug as keyof typeof themes] || themes.gratuit;
  };

  const theme = getPlanTheme(plan.slug);
  const IconComponent = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl">
        {/* Badge Populaire */}
        {plan.isPopular && (
          <div className="absolute top-4 right-4 z-20">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg rounded-full px-3 py-1">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Populaire
            </Badge>
          </div>
        )}

        {/* Header avec gradient et motifs */}
        <div className={`relative bg-gradient-to-br ${theme.gradient} p-8 text-white overflow-hidden`}>
          {/* Motifs de fond */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.bgPattern} rounded-full -translate-y-16 translate-x-16`} />
          <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br ${theme.bgPattern} rounded-full translate-y-12 -translate-x-12`} />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <IconComponent className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-white/90 transition-colors">{plan.name}</h3>
            <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{plan.description}</p>
          </div>
        </div>

        {/* Prix avec design moderne */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-baseline gap-2 mb-3">
            {plan.price === 0 ? (
              <span className={`text-4xl font-bold bg-gradient-to-r from-${theme.accent}-600 to-${theme.accent}-700 bg-clip-text text-transparent`}>
                Gratuit
              </span>
            ) : (
              <>
                <span className="text-4xl font-bold text-slate-900">
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-slate-500 text-sm font-medium">{plan.currency}</span>
                <span className="text-slate-400 text-sm">
                  /{plan.billingPeriod === 'yearly' ? 'an' : 'mois'}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {plan.discount && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 rounded-full">
                🎉 -{plan.discount}%
              </Badge>
            )}
            {plan.trialDays && (
              <Badge variant="outline" className={`text-${theme.accent}-600 border-${theme.accent}-200 bg-${theme.accent}-50 rounded-full`}>
                ⚡ {plan.trialDays}j gratuit
              </Badge>
            )}
          </div>
        </div>

        {/* Caractéristiques principales */}
        <div className="p-6 space-y-4">
          {[
            { icon: Building2, label: 'Écoles', value: plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools, color: 'text-blue-600' },
            { icon: Users, label: 'Élèves', value: plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString(), color: 'text-green-600' },
            { icon: HardDrive, label: 'Stockage', value: `${plan.maxStorage} GB`, color: 'text-purple-600' },
            { icon: Headphones, label: 'Support', value: plan.supportLevel === '24/7' ? '24/7' : plan.supportLevel === 'priority' ? 'Prioritaire' : 'Email', color: 'text-orange-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm group-hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <div className="flex items-center gap-3 text-slate-600">
                <div className={`w-8 h-8 ${item.color.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg flex items-center justify-center`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}

          {/* Options premium */}
          <div className="flex items-center gap-2 pt-2">
            {plan.customBranding && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 rounded-full">
                <Shield className="w-3 h-3 mr-1" />
                Branding
              </Badge>
            )}
            {plan.apiAccess && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 rounded-full">
                <Globe className="w-3 h-3 mr-1" />
                API
              </Badge>
            )}
          </div>
        </div>

        {/* Section Modules & Catégories */}
        <div className="px-6 pb-6">
          <button
            onClick={onToggleExpand}
            className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${theme.bgPattern} hover:from-${theme.accent}-50 hover:to-${theme.accent}-100 transition-all duration-200 border border-${theme.accent}-100`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-${theme.accent}-100 rounded-lg flex items-center justify-center`}>
                <Layers className={`w-4 h-4 text-${theme.accent}-600`} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">
                  {plan.categories?.length || 0} catégories · {plan.modules?.length || 0} modules
                </div>
                <div className="text-xs text-slate-500">
                  Cliquez pour voir le détail
                </div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-6">
                  {/* Catégories */}
                  {plan.categories && plan.categories.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 bg-${theme.accent}-100 rounded-lg flex items-center justify-center`}>
                          <Layers className={`w-3 h-3 text-${theme.accent}-600`} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Catégories Métiers</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {plan.categories.map((cat: any) => (
                          <div
                            key={cat.id}
                            className={`flex items-center gap-3 p-3 rounded-lg bg-${theme.accent}-50 border border-${theme.accent}-100`}
                          >
                            <div className={`w-8 h-8 bg-${theme.accent}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Package className={`w-4 h-4 text-${theme.accent}-600`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 text-sm">{cat.name}</div>
                              {cat.description && (
                                <div className="text-xs text-slate-500 line-clamp-1">{cat.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modules */}
                  {plan.modules && plan.modules.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 bg-${theme.accent}-100 rounded-lg flex items-center justify-center`}>
                          <Package className={`w-3 h-3 text-${theme.accent}-600`} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Modules Inclus</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {plan.modules.map((mod: any) => (
                          <div
                            key={mod.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                          >
                            <div className={`w-8 h-8 bg-gradient-to-br ${theme.bgPattern} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Package className={`w-4 h-4 text-${theme.accent}-600`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 text-sm">{mod.name}</span>
                                {mod.is_premium && (
                                  <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 rounded-full">
                                    Premium
                                  </Badge>
                                )}
                                {mod.is_core && (
                                  <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-blue-400 to-blue-500 text-white border-0 rounded-full">
                                    Core
                                  </Badge>
                                )}
                              </div>
                              {mod.description && (
                                <div className="text-xs text-slate-500 line-clamp-1 mt-1">{mod.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message si pas de contenu */}
                  {(!plan.categories || plan.categories.length === 0) && (!plan.modules || plan.modules.length === 0) && (
                    <div className="text-center py-6">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <div className="text-sm text-slate-500">Aucun module ou catégorie assigné</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions - Super Admin uniquement */}
        {isSuperAdmin && (
          <div className={`p-4 bg-gradient-to-r ${theme.bgPattern} border-t border-slate-100 flex gap-2`}>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-slate-200 hover:bg-white rounded-xl"
              onClick={() => onEdit(plan)}
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
              onClick={() => onDelete(plan)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PlansUltimate;
