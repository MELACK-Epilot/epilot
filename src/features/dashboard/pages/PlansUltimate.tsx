/**
 * Page Plans & Tarification - VERSION REFACTORISÉE
 * Design moderne avec composants modulaires
 * @module PlansUltimate
 */

import { Package, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/store/auth.store';
import { useAllPlansWithContent } from '../hooks/usePlanWithContent';
import { usePlanStats } from '../hooks/usePlans';
import { useAllActiveSubscriptions } from '../hooks/usePlanSubscriptions';
import { usePlansPage } from '../hooks/usePlansPage';
import { exportPlans } from '@/utils/exportUtils';

// Composants modulaires
import { PlansHeader } from '../components/plans/PlansHeader';
import { PlansActionBar } from '../components/plans/PlansActionBar';
import { PlansTabNavigation } from '../components/plans/PlansTabNavigation';
import { PlanCard } from '../components/plans/PlanCard';
import { PlanFormDialog } from '../components/plans/PlanFormDialog';
import { PlanSubscriptionsPanel } from '../components/plans/PlanSubscriptionsPanel';
import { PlanAnalyticsDashboardOptimized } from '../components/plans/PlanAnalyticsDashboardOptimized';
import { PlanOptimizationEngineOptimized } from '../components/plans/PlanOptimizationEngineOptimized';
import { ModernPlanComparisonOptimized } from '../components/plans/ModernPlanComparisonOptimized';

export const PlansUltimate = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Hook personnalisé pour la logique de la page
  const {
    searchQuery,
    selectedPlan,
    dialogOpen,
    dialogMode,
    expandedPlanId,
    activeTab,
    setSearchQuery,
    setDialogOpen,
    setActiveTab,
    handleCreate,
    handleEdit,
    handleDelete,
    toggleExpanded,
  } = usePlansPage();
  
  // Données
  const { data: plans, isLoading } = useAllPlansWithContent(searchQuery);
  const { data: stats } = usePlanStats();
  const { data: allSubscriptions } = useAllActiveSubscriptions();
  
  // Calculer revenue à partir des abonnements réels
  const revenue = {
    mrr: allSubscriptions?.reduce((sum, sub) => sum + (sub.price || 0), 0) || 0,
    arr: (allSubscriptions?.reduce((sum, sub) => sum + (sub.price || 0), 0) || 0) * 12,
    totalSubscriptions: allSubscriptions?.length || 0,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Simple - Style Catégories */}
      <PlansHeader />
      
      {/* Stats Cards - Style Catégories avec Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Plans Actifs</p>
            <p className="text-3xl font-bold text-white">{stats?.active || 0}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Abonnements</p>
            <p className="text-3xl font-bold text-white">{stats?.subscriptions || 0}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <motion.div className="text-white text-2xl font-bold">₣</motion.div>
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Revenus MRR</p>
            <p className="text-3xl font-bold text-white">{revenue?.mrr ? `${(revenue.mrr / 1000).toFixed(0)}K` : '0'}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#457B9D] to-[#2c5a7a] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Plans Total</p>
            <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Barre d'actions */}
      <PlansActionBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={() => exportPlans(plans || [])}
        onCreate={handleCreate}
        isSuperAdmin={isSuperAdmin}
        hasPlans={!!plans && plans.length > 0}
      />
      
      {/* Navigation par onglets */}
      <PlansTabNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />
      
      {/* Contenu des onglets */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {plans.map((plan, index) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    isExpanded={expandedPlanId === plan.id}
                    onToggleExpand={() => toggleExpanded(plan.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSuperAdmin={isSuperAdmin}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                searchQuery={searchQuery}
                isSuperAdmin={isSuperAdmin}
                onClearSearch={() => setSearchQuery('')}
                onCreate={handleCreate}
              />
            )}
          </>
        )}
        
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {plans && plans.length > 0 ? (
              plans.map((plan) => (
                <PlanSubscriptionsPanel 
                  key={plan.id}
                  planId={plan.id} 
                  planName={plan.name} 
                />
              ))
            ) : (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Aucun plan disponible
                </h3>
                <p className="text-slate-500">
                  Créez un plan pour voir les abonnements
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && <PlanAnalyticsDashboardOptimized />}
        {activeTab === 'optimization' && <PlanOptimizationEngineOptimized />}
        {activeTab === 'comparison' && <ModernPlanComparisonOptimized plans={plans || []} />}
      </div>
      
      {/* Dialog de création/édition */}
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        mode={dialogMode}
      />
    </div>
  );
};

// Composant EmptyState
interface EmptyStateProps {
  searchQuery: string;
  isSuperAdmin: boolean;
  onClearSearch: () => void;
  onCreate: () => void;
}

const EmptyState = ({ searchQuery, isSuperAdmin, onClearSearch, onCreate }: EmptyStateProps) => {
  return (
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
      {searchQuery ? (
        <button
          onClick={onClearSearch}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
        >
          Effacer la recherche
        </button>
      ) : isSuperAdmin && (
        <button
          onClick={onCreate}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg"
        >
          Créer un plan
        </button>
      )}
    </motion.div>
  );
};

export default PlansUltimate;
