/**
 * Page Plans & Tarification - VERSION MODERNE REFONTE COMPLÈTE
 * Design moderne avec affichage modules/catégories par plan
 * @module PlansModern
 */

import { useState } from 'react';
import { Plus, DollarSign, Package, TrendingUp, Edit, Trash2, Building2, CheckCircle2, Crown, Zap, BarChart3, Download, Users, HardDrive, Headphones, Layers, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlans, usePlanStats, useDeletePlan } from '../hooks/usePlans';
import { usePlanRevenue } from '../hooks/usePlanRevenue';
import { usePlanModules, usePlanCategories } from '../hooks/usePlanModules';
import type { Plan } from '../types/dashboard.types';
import { PlanFormDialog } from '../components/plans/PlanFormDialog';
import { useToast } from '@/hooks/use-toast';
import { exportPlans } from '@/utils/exportUtils';
import { useAuth } from '@/features/auth/store/auth.store';

export const PlansModern = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  
  const { data: plans, isLoading } = usePlans({ query: searchQuery });
  const { data: stats } = usePlanStats();
  const { data: revenue } = usePlanRevenue();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();

  const handleCreate = () => {
    setSelectedPlan(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDelete = async (plan: Plan) => {
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

  const getPlanGradient = (slug: string) => {
    const gradients: Record<string, string> = {
      gratuit: 'from-slate-600 via-slate-700 to-slate-800',
      premium: 'from-teal-500 via-teal-600 to-teal-700',
      pro: 'from-indigo-600 via-indigo-700 to-indigo-800',
      institutionnel: 'from-amber-500 via-amber-600 to-amber-700',
    };
    return gradients[slug] || gradients.gratuit;
  };

  const getPlanIcon = (slug: string) => {
    const icons: Record<string, React.ReactNode> = {
      gratuit: <Package className="w-8 h-8" />,
      premium: <Zap className="w-8 h-8" />,
      pro: <Crown className="w-8 h-8" />,
      institutionnel: <Building2 className="w-8 h-8" />,
    };
    return icons[slug] || icons.gratuit;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-teal-500/10 text-teal-400 border-teal-500/20 px-4 py-1">
              Plans & Tarification
            </Badge>
            <h1 className="text-5xl font-bold text-white mb-4">
              Choisissez le plan parfait pour votre établissement
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Des solutions flexibles adaptées à tous les besoins, de la petite école au grand réseau institutionnel
            </p>

            {/* Stats rapides */}
            <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { label: 'Plans Actifs', value: stats?.active || 0, icon: CheckCircle2, color: 'text-green-400' },
                { label: 'Abonnements', value: stats?.subscriptions || 0, icon: TrendingUp, color: 'text-blue-400' },
                { label: 'MRR', value: revenue?.mrr ? `${(revenue.mrr / 1000).toFixed(0)}K` : '0', icon: DollarSign, color: 'text-amber-400' },
                { label: 'Plans Total', value: stats?.total || 0, icon: Package, color: 'text-purple-400' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                >
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Recherche */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Rechercher un plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => exportPlans(plans || [])}
                disabled={!plans || plans.length === 0}
                className="border-slate-200 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              {isSuperAdmin && (
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-64 bg-slate-200 rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans?.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                isExpanded={expandedPlanId === plan.id}
                onToggleExpand={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isSuperAdmin={isSuperAdmin}
                getPlanGradient={getPlanGradient}
                getPlanIcon={getPlanIcon}
              />
            ))}
          </div>
        )}

        {!isLoading && plans?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">Aucun plan trouvé</h3>
            <p className="text-slate-500 mb-6">
              {isSuperAdmin
                ? 'Commencez par créer votre premier plan d\'abonnement'
                : 'Aucun plan disponible pour le moment'}
            </p>
            {isSuperAdmin && (
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
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

// Composant PlanCard séparé
interface PlanCardProps {
  plan: Plan;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  isSuperAdmin: boolean;
  getPlanGradient: (slug: string) => string;
  getPlanIcon: (slug: string) => React.ReactNode;
}

const PlanCard = ({
  plan,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isSuperAdmin,
  getPlanGradient,
  getPlanIcon,
}: PlanCardProps) => {
  const { data: modules } = usePlanModules(plan.id);
  const { data: categories } = usePlanCategories(plan.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
        {/* Badge Populaire */}
        {plan.isPopular && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg">
              <Crown className="w-3 h-3 mr-1" />
              Populaire
            </Badge>
          </div>
        )}

        {/* Header avec gradient */}
        <div className={`relative bg-gradient-to-br ${getPlanGradient(plan.slug)} p-8 text-white`}>
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {getPlanIcon(plan.slug)}
            </div>
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-white/80 text-sm line-clamp-2">{plan.description}</p>
          </div>
        </div>

        {/* Prix */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-baseline gap-2 mb-2">
            {plan.price === 0 ? (
              <span className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                Gratuit
              </span>
            ) : (
              <>
                <span className="text-4xl font-bold text-slate-900">
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-slate-500 text-sm">{plan.currency}</span>
                <span className="text-slate-400 text-sm">/mois</span>
              </>
            )}
          </div>
          {plan.discount && (
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
              🎉 -{plan.discount}% de réduction
            </Badge>
          )}
        </div>

        {/* Limites principales */}
        <div className="p-6 space-y-3">
          {[
            { icon: Building2, label: 'Écoles', value: plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools },
            { icon: Users, label: 'Élèves', value: plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString() },
            { icon: HardDrive, label: 'Stockage', value: `${plan.maxStorage} GB` },
            { icon: Headphones, label: 'Support', value: plan.supportLevel === '24/7' ? '24/7' : plan.supportLevel === 'priority' ? 'Prioritaire' : 'Email' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Modules & Catégories */}
        <div className="px-6 pb-6">
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span className="font-medium text-slate-900">
                {categories?.length || 0} catégories · {modules?.length || 0} modules
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4">
                  {/* Catégories */}
                  {categories && categories.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Catégories</div>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat: any) => (
                          <Badge
                            key={cat.id}
                            variant="outline"
                            className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                          >
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modules */}
                  {modules && modules.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Modules</div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {modules.map((mod: any) => (
                          <div
                            key={mod.id}
                            className="flex items-center gap-2 text-xs p-2 rounded bg-slate-50"
                          >
                            <Package className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-700 flex-1">{mod.name}</span>
                            {mod.is_premium && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                                Premium
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions - Super Admin uniquement */}
        {isSuperAdmin && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-slate-200 hover:bg-white"
              onClick={() => onEdit(plan)}
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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

export default PlansModern;
