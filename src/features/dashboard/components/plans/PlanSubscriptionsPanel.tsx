/**
 * Panneau affichant les abonnements actifs pour un plan - VERSION REFACTORISÉE
 * Utilise les VRAIES données de la base de données Supabase
 * @module PlanSubscriptionsPanel
 */

import { Users, TrendingUp, DollarSign, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanSubscriptions, usePlanSubscriptionStats, type PlanSubscription } from '../../hooks/usePlanSubscriptions';
import { useToggleAutoRenew } from '../../hooks/useToggleAutoRenew';
import { useAuth } from '@/features/auth/store/auth.store';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';
import { useState, useCallback } from 'react';
import { GroupDetailsDialog } from './GroupDetailsDialog.SCROLL';
import { useSubscriptionFilters } from './hooks/useSubscriptionFilters';
import { useSubscriptionSelection } from './hooks/useSubscriptionSelection';
import { SubscriptionFiltersBar } from './components/SubscriptionFiltersBar';
import { SubscriptionCard } from './components/SubscriptionCard';
import { exportToExcel, handlePrint } from './utils/export.utils';
import { toast } from 'sonner';

interface PlanSubscriptionsPanelProps {
  planId: string;
  planName: string;
}

/**
 * Composant principal - Orchestration uniquement
 * Toutes les données proviennent de Supabase via usePlanSubscriptions
 */
export const PlanSubscriptionsPanel = ({ planId, planName }: PlanSubscriptionsPanelProps) => {
  // ========================================
  // DONNÉES RÉELLES DE LA BASE DE DONNÉES
  // ========================================
  const { 
    data: subscriptions, 
    isLoading, 
    error: subscriptionsError 
  } = usePlanSubscriptions(planId);
  
  const { 
    data: stats, 
    error: statsError 
  } = usePlanSubscriptionStats(planId);
  
  // Logger l'erreur stats en développement (non bloquant)
  if (statsError && process.env.NODE_ENV === 'development') {
    console.warn('Erreur stats (non bloquant):', statsError);
  }
  
  const toggleAutoRenew = useToggleAutoRenew();
  const { user } = useAuth();
  
  // ========================================
  // HOOKS PERSONNALISÉS
  // ========================================
  const filters = useSubscriptionFilters({ subscriptions });
  const selection = useSubscriptionSelection();
  const [selectedGroup, setSelectedGroup] = useState<PlanSubscription | null>(null);
  
  // ========================================
  // PERMISSIONS
  // ========================================
  const isAdminGroupe = user?.role === 'admin_groupe';
  
  // ========================================
  // HANDLERS
  // ========================================
  const handleExport = useCallback(() => {
    const dataToExport = selection.selectedIds.size > 0
      ? (subscriptions || []).filter(s => selection.selectedIds.has(s.id))
      : filters.processedSubscriptions;
    
    exportToExcel(dataToExport, planName);
  }, [selection.selectedIds, subscriptions, filters.processedSubscriptions, planName]);
  
  const handleToggleAutoRenew = useCallback((subscriptionId: string, autoRenew: boolean) => {
    toggleAutoRenew.mutate({ subscriptionId, autoRenew });
  }, [toggleAutoRenew]);
  
  const handlePrintSafe = useCallback(() => {
    try {
      handlePrint();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur impression:', error);
      }
      toast.error('Erreur lors de l\'impression');
    }
  }, []);
  
  // ========================================
  // ERROR STATE
  // ========================================
  if (subscriptionsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-600 font-medium">Erreur de chargement des abonnements</p>
        <p className="text-sm text-gray-500 mt-1">
          {subscriptionsError.message || 'Une erreur est survenue'}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Réessayer
        </Button>
      </div>
    );
  }
  
  // ========================================
  // LOADING STATE
  // ========================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{planName}</h2>
              <p className="text-sm text-gray-500">
                {filters.processedSubscriptions.length} / {subscriptions?.length || 0} groupe(s)
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barre de filtres et actions */}
      <SubscriptionFiltersBar
        searchQuery={filters.searchQuery}
        statusFilter={filters.statusFilter}
        sortField={filters.sortField}
        sortOrder={filters.sortOrder}
        onSearchChange={filters.handleSearchChange}
        onStatusFilterChange={filters.handleStatusFilterChange}
        onSortFieldChange={filters.handleSortFieldChange}
        onToggleSortOrder={filters.toggleSortOrder}
        selectedCount={selection.selectedIds.size}
        totalCount={filters.processedSubscriptions.length}
        isAllSelected={selection.isAllSelected(filters.processedSubscriptions)}
        onSelectAll={() => selection.selectAll(filters.processedSubscriptions)}
        onDeselectAll={selection.deselectAll}
        onExport={handleExport}
        onPrint={handlePrintSafe}
      />

      {/* Stats Cards */}
      <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Abonnements actifs</p>
              <p className="text-3xl font-bold text-white">{stats?.active || 0}</p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-white/90 text-xs font-semibold bg-white/10 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  MRR
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Revenu mensuel</p>
              <p className="text-3xl font-bold text-white">{((stats?.mrr || 0) / 1000).toFixed(0)}K FCFA</p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">En essai</p>
              <p className="text-3xl font-bold text-white">{stats?.trial || 0}</p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#E63946] to-[#c52030] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Annulés</p>
              <p className="text-3xl font-bold text-white">{stats?.cancelled || 0}</p>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedContainer>

      {/* Grid Cards */}
      {filters.paginatedSubscriptions?.length > 0 ? (
        <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.05}>
          {filters.paginatedSubscriptions.map((sub) => (
            <AnimatedItem key={sub.id}>
              <SubscriptionCard
                subscription={sub}
                isSelected={selection.isSelected(sub.id)}
                isAdminGroupe={isAdminGroupe}
                onToggleSelection={selection.toggleSelection}
                onToggleAutoRenew={handleToggleAutoRenew}
                onClick={() => setSelectedGroup(sub)}
                isTogglingAutoRenew={toggleAutoRenew.isPending}
              />
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500">
            {filters.searchQuery || filters.statusFilter !== 'all'
              ? 'Aucun résultat pour ces critères'
              : 'Aucun abonnement actif pour ce plan'
            }
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filters.searchQuery || filters.statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : `Les groupes scolaires qui souscrivent à "${planName}" apparaîtront ici`
            }
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {filters.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={filters.goToPreviousPage}
            disabled={filters.page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {filters.page} sur {filters.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={filters.goToNextPage}
            disabled={filters.page === filters.totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialogue des détails du groupe */}
      <GroupDetailsDialog
        group={selectedGroup}
        open={!!selectedGroup}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
      />
    </div>
  );
};
