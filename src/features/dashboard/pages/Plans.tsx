/**
 * Page Plans & Tarification - Version Complète
 * Gestion CRUD des plans d'abonnement avec affichage en cartes
 * @module Plans
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Package, TrendingUp, Edit, Trash2, Building2, CheckCircle2, Crown, Zap, BarChart3, Download, Layers, ChevronDown, ChevronUp, RotateCcw, Archive, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FinanceBreadcrumb, FinancePageHeader, FinanceModernStatsGrid, FinanceSearchBar, ModernStatCardData } from '../components/finance';
import { usePlans, usePlanStats, useDeletePlan, useRestorePlan, usePermanentDeletePlan } from '../hooks/usePlans';
import { useAllPlansWithContent } from '../hooks/usePlanWithContent';
import { usePlanRevenue } from '../hooks/usePlanRevenue';
import { usePlanDistributionData } from '../hooks/usePlanDistributionData';
import type { Plan } from '../types/dashboard.types';
import { PlanFormDialog } from '../components/plans/PlanFormDialog';
import { PlanComparisonTable } from '../components/plans/PlanComparisonTable';
import { RestorePlanDialog } from '../components/plans/RestorePlanDialog';
import { DeletePlanDialog } from '../components/plans/DeletePlanDialog';
import { ArchivePlanDialog } from '../components/plans/ArchivePlanDialog';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { exportPlans } from '@/utils/exportUtils';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export const Plans = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [showArchived, setShowArchived] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [planToRestore, setPlanToRestore] = useState<any | null>(null);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [planToArchive, setPlanToArchive] = useState<any | null>(null);
  const [archiveSubscriptions, setArchiveSubscriptions] = useState<any[]>([]);
  const { data: plans, isLoading } = usePlans({ query: searchQuery, status: showArchived ? 'archived' : 'active' });
  const { data: plansWithContent } = useAllPlansWithContent(searchQuery, showArchived);
  const { data: stats } = usePlanStats();
  const { data: revenue } = usePlanRevenue();
  const { data: distributionData } = usePlanDistributionData();
  const deletePlan = useDeletePlan();
  const restorePlan = useRestorePlan();
  const permanentDeletePlan = usePermanentDeletePlan();
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

  const handleDelete = async (plan: any) => {
    try {
      // Vérifier si des groupes sont abonnés à ce plan
      const { data: subscriptions, error: subError } = await supabase
        .from('school_group_subscriptions')
        .select('id, school_groups(name)', { count: 'exact' })
        .eq('plan_id', plan.id)
        .eq('status', 'active');

      if (subError) throw subError;

      // Préparer les données pour le popup
      setPlanToArchive(plan);
      setArchiveSubscriptions(subscriptions || []);
      setArchiveDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const confirmArchive = async () => {
    if (!planToArchive) return;

    try {
      await deletePlan.mutateAsync(planToArchive.id);
      toast({
        title: '✅ Plan archivé',
        description: `Le plan "${planToArchive.name}" a été archivé avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = (plan: any) => {
    setPlanToRestore(plan);
    setRestoreDialogOpen(true);
  };

  const handlePermanentDelete = (plan: any) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!planToRestore) return;

    try {
      await restorePlan.mutateAsync(planToRestore.id);
      
      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });
      
      // Fermer le dialog immédiatement
      setRestoreDialogOpen(false);
      setPlanToRestore(null);
      
      // Si on est sur "Plans Archivés", retourner sur "Plans Actifs"
      if (showArchived) {
        setShowArchived(false);
      }
      
      toast({
        title: '✅ Plan restauré',
        description: `Le plan "${planToRestore.name}" a été restauré avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const confirmPermanentDelete = async () => {
    if (!planToDelete) return;

    try {
      await permanentDeletePlan.mutateAsync(planToDelete.id);
      
      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });
      
      // Fermer le dialog immédiatement
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      
      toast({
        title: '✅ Plan supprimé définitivement',
        description: `Le plan "${planToDelete.name}" a été supprimé de manière irréversible.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour obtenir l'icône du plan
  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'gratuit':
        return <Package className="w-6 h-6" />;
      case 'premium':
        return <Zap className="w-6 h-6" />;
      case 'pro':
        return <Crown className="w-6 h-6" />;
      case 'institutionnel':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  // Fonction pour obtenir la couleur du plan
  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'gratuit':
        return 'from-gray-500 to-gray-600';
      case 'premium':
        return 'from-[#2A9D8F] to-[#1D8A7E]';
      case 'pro':
        return 'from-[#1D3557] to-[#0F1F35]';
      case 'institutionnel':
        return 'from-[#E9C46A] to-[#D4AF37]';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Préparer les stats avec le nouveau design moderne
  const statsData: ModernStatCardData[] = [
    {
      title: "Total Plans",
      value: stats?.total || 0,
      subtitle: "plans disponibles",
      icon: Package,
      color: 'blue',
    },
    {
      title: "Actifs",
      value: stats?.active || 0,
      subtitle: "en circulation",
      icon: CheckCircle2,
      color: 'green',
    },
    {
      title: "Abonnements",
      value: stats?.subscriptions || 0,
      subtitle: "groupes abonnés",
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: "Revenus MRR",
      value: revenue?.mrr ? `${(revenue.mrr / 1000).toFixed(0)}K` : "0",
      subtitle: "FCFA mensuel",
      icon: DollarSign,
      color: 'gold',
      trend: revenue?.mrr && revenue.mrr > 0 ? 'up' : undefined,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <FinanceBreadcrumb currentPage="Plans & Tarifs" />

      {/* Header */}
      <FinancePageHeader
        title="Plans & Tarification"
        description="Gérez les plans d'abonnement de la plateforme"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="w-4 h-4 mr-2" />
              {showArchived ? 'Plans Actifs' : 'Plans Archivés'}
              {!showArchived && plans && plans.filter(p => !p.isActive).length > 0 && (
                <Badge className="ml-2 bg-orange-500">
                  {plans.filter(p => !p.isActive).length}
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportPlans(plans || [])}
              disabled={!plans || plans.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}>
              {viewMode === 'cards' ? 'Vue Table' : 'Vue Cartes'}
            </Button>
            {isSuperAdmin && (
              <Button onClick={handleCreate} className="bg-[#2A9D8F] hover:bg-[#1D8A7E]">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Plan
              </Button>
            )}
          </>
        }
      />

      {/* Statistiques - Design Moderne */}
      <FinanceModernStatsGrid stats={statsData} columns={4} />

      {/* Barre de recherche */}
      <FinanceSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher un plan par nom ou slug..."
      />

      {/* Graphique Répartition Plans */}
      {plans && plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#2A9D8F]" />
              Répartition des Abonnements par Plan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    if (props.value === 0) return '';
                    return `${props.name}: ${props.value} (${props.percentage}%)`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(distributionData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} abonnement(s)`, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Tableau comparatif */}
      {plansWithContent && plansWithContent.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <PlanComparisonTable plans={plansWithContent} />
        </motion.div>
      )}

      {/* Affichage en cartes */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded" />
              </Card>
            ))
          ) : (
            plansWithContent?.map((plan, index) => {
              const isExpanded = expandedPlanId === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className={`relative overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full ${!plan.isActive ? 'opacity-60' : ''}`}>
                    {/* Badge populaire ou archivé */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      {!plan.isActive && (
                        <Badge className="bg-gray-500 text-white border-0 shadow-lg">
                          <Archive className="w-3 h-3 mr-1" />
                          Archivé
                        </Badge>
                      )}
                      {plan.isPopular && plan.isActive && (
                        <Badge className="bg-[#E9C46A] text-white border-0 shadow-lg">
                          <Crown className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      )}
                    </div>

                    {/* Header avec gradient - Hauteur fixe */}
                    <div className={`bg-gradient-to-br ${getPlanColor(plan.slug)} p-6 text-white ${!plan.isActive ? 'grayscale' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                          {getPlanIcon(plan.slug)}
                        </div>
                        <Badge variant="default" className={`${plan.isActive ? 'bg-white/20' : 'bg-red-500/80'} text-white border-0 backdrop-blur-sm`}>
                          {plan.isActive ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Actif</>
                          ) : (
                            <><Archive className="w-3 h-3 mr-1" /> Inactif</>
                          )}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-white/80 text-sm line-clamp-2 min-h-[40px]">{plan.description}</p>
                    </div>

                    {/* Prix - Hauteur fixe */}
                    <div className="p-6 border-b min-h-[120px] flex flex-col justify-center">
                      <div className="flex items-baseline gap-2">
                        {plan.price === 0 ? (
                          <span className="text-4xl font-bold text-gray-900">Gratuit</span>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-gray-900">
                              {plan.price.toLocaleString()}
                            </span>
                            <span className="text-gray-500">{plan.currency}</span>
                            <span className="text-sm text-gray-500">/mois</span>
                          </>
                        )}
                      </div>
                      
                      {/* Badges réduction et essai gratuit */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {plan.discount && plan.discount > 0 ? (
                          <Badge className="bg-gradient-to-r from-[#E63946] to-[#D62828] text-white border-0 shadow-md">
                            <Gift className="w-3 h-3 mr-1" />
                            -{plan.discount}% de réduction
                          </Badge>
                        ) : null}
                        
                        {plan.trialDays && plan.trialDays > 0 ? (
                          <Badge className="bg-gradient-to-r from-[#2A9D8F] to-[#1D8A7E] text-white border-0 shadow-md">
                            <Zap className="w-3 h-3 mr-1" />
                            {plan.trialDays} jours d'essai
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Caractéristiques - Hauteur fixe */}
                    <div className="p-6 space-y-3 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Écoles</span>
                        <span className="font-semibold text-gray-900">
                          {plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Élèves</span>
                        <span className="font-semibold text-gray-900">
                          {plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Personnel</span>
                        <span className="font-semibold text-gray-900">
                          {plan.maxStaff === -1 ? 'Illimité' : plan.maxStaff}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Stockage</span>
                        <span className="font-semibold text-gray-900">{plan.maxStorage} GB</span>
                      </div>
                    </div>

                    {/* Section Catégories & Modules */}
                    <div className="border-t bg-gray-50">
                      <button
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#2A9D8F]" />
                          <span className="font-semibold text-gray-900 text-sm">
                            Contenu du plan
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {plan.categories?.length || 0} catégories · {plan.modules?.length || 0} modules
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {/* Contenu expandable */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 space-y-4 max-h-[300px] overflow-y-auto"
                        >
                          {/* Catégories */}
                          {plan.categories && plan.categories.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                📂 Catégories Métiers
                              </h4>
                              <div className="space-y-1">
                                {plan.categories.map((category) => (
                                  <div
                                    key={category.id}
                                    className="flex items-center gap-2 text-sm p-2 bg-white rounded-lg border border-gray-200"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: category.color || '#2A9D8F' }}
                                    />
                                    <span className="text-gray-700">{category.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Modules */}
                          {plan.modules && plan.modules.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                📦 Modules Inclus
                              </h4>
                              <div className="space-y-1">
                                {plan.modules.slice(0, 5).map((module) => (
                                  <div
                                    key={module.id}
                                    className="flex items-center gap-2 text-sm p-2 bg-white rounded-lg border border-gray-200"
                                  >
                                    <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="flex-1 text-gray-700">{module.name}</span>
                                    {module.is_premium && (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                                        Premium
                                      </Badge>
                                    )}
                                    {module.is_core && (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
                                        Core
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                                {plan.modules.length > 5 && (
                                  <div className="text-center py-1">
                                    <span className="text-xs text-gray-500">
                                      +{plan.modules.length - 5} autres modules
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* État vide */}
                          {(!plan.categories || plan.categories.length === 0) && 
                           (!plan.modules || plan.modules.length === 0) && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              Aucun contenu assigné à ce plan
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Actions - UNIQUEMENT pour Super Admin */}
                    {isSuperAdmin && (
                      <div className="p-4 bg-gray-50 border-t flex gap-2 mt-auto">
                        {plan.isActive ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => handleEdit(plan as any)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                              onClick={() => handleDelete(plan as any)}
                              title="Archiver le plan"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handlePermanentDelete(plan)}
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-[#2A9D8F] hover:text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
                              onClick={() => handleRestore(plan)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restaurer
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handlePermanentDelete(plan)}
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Message si aucun plan */}
      {!isLoading && plans?.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun plan trouvé</h3>
          <p className="text-gray-500 mb-4">
            {isSuperAdmin 
              ? 'Commencez par créer votre premier plan d\'abonnement' 
              : 'Aucun plan disponible pour le moment'}
          </p>
          {isSuperAdmin && (
            <Button onClick={handleCreate} className="bg-[#2A9D8F] hover:bg-[#1D8A7E]">
              <Plus className="w-4 h-4 mr-2" />
              Créer un plan
            </Button>
          )}
        </Card>
      )}

      {/* Dialog de création/modification */}
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        mode={dialogMode}
      />

      {/* Dialog de restauration */}
      {planToRestore && (
        <RestorePlanDialog
          isOpen={restoreDialogOpen}
          onClose={() => {
            setRestoreDialogOpen(false);
            setPlanToRestore(null);
          }}
          onConfirm={confirmRestore}
          planName={planToRestore.name}
          planPrice={planToRestore.price}
          planCurrency={planToRestore.currency}
        />
      )}

      {/* Dialog de suppression définitive */}
      {planToDelete && (
        <DeletePlanDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
          }}
          onConfirm={confirmPermanentDelete}
          planName={planToDelete.name}
          planPrice={planToDelete.price}
          planCurrency={planToDelete.currency}
          hasActiveSubscriptions={false}
          activeSubscriptionsCount={0}
        />
      )}

      {/* Dialog d'archivage */}
      {planToArchive && (
        <ArchivePlanDialog
          isOpen={archiveDialogOpen}
          onClose={() => {
            setArchiveDialogOpen(false);
            setPlanToArchive(null);
            setArchiveSubscriptions([]);
          }}
          onConfirm={confirmArchive}
          planName={planToArchive.name}
          planPrice={planToArchive.price}
          planCurrency={planToArchive.currency}
          hasActiveSubscriptions={archiveSubscriptions.length > 0}
          activeSubscriptionsCount={archiveSubscriptions.length}
          subscriptionNames={archiveSubscriptions.map((s: any) => s.school_groups?.name).filter(Boolean)}
        />
      )}
    </div>
  );
};

export default Plans;
