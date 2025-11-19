/**
 * Panneau affichant les abonnements actifs pour un plan - DESIGN MODERNE
 * Style identique à la page Groupes Scolaires avec glassmorphism
 * @module PlanSubscriptionsPanel
 */

import { Users, TrendingUp, DollarSign, AlertCircle, Package, Building2, Search, Download, FileText, Printer, Filter, ArrowUpDown, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanSubscriptions, usePlanSubscriptionStats, type PlanSubscription } from '../../hooks/usePlanSubscriptions';
import { useToggleAutoRenew } from '../../hooks/useToggleAutoRenew';
import { useAuth } from '@/features/auth/store/auth.store';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';
import { useState, useMemo } from 'react';
import { GroupDetailsDialog } from './GroupDetailsDialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface PlanSubscriptionsPanelProps {
  planId: string;
  planName: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

type SortField = 'name' | 'date' | 'schools' | 'users';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'trial' | 'cancelled' | 'expired';

export const PlanSubscriptionsPanel = ({ planId, planName }: PlanSubscriptionsPanelProps) => {
  const { data: subscriptions, isLoading } = usePlanSubscriptions(planId);
  const { data: stats } = usePlanSubscriptionStats(planId);
  const toggleAutoRenew = useToggleAutoRenew();
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<PlanSubscription | null>(null);
  
  // États pour recherche, filtres, tri
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  
  // Vérifier si l'utilisateur est un admin de groupe
  const isAdminGroupe = user?.role === ('admin_groupe' as const);
  
  // Filtrage et tri
  const processedSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    
    // 1. Recherche
    let filtered = subscriptions.filter(sub =>
      sub.school_group_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // 2. Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }
    
    // 3. Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.school_group_name.localeCompare(b.school_group_name);
          break;
        case 'date':
          comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
        case 'schools':
          comparison = (a.schools_count || 0) - (b.schools_count || 0);
          break;
        case 'users':
          comparison = (a.users_count || 0) - (b.users_count || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [subscriptions, searchQuery, statusFilter, sortField, sortOrder]);
  
  // Pagination
  const paginatedSubscriptions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return processedSubscriptions.slice(start, start + itemsPerPage);
  }, [processedSubscriptions, page]);
  
  const totalPages = Math.ceil(processedSubscriptions.length / itemsPerPage);
  
  // Fonctions d'export
  const exportToExcel = () => {
    try {
      const dataToExport = selectedIds.size > 0
        ? subscriptions?.filter(s => selectedIds.has(s.id))
        : processedSubscriptions;
      
      const csvData = dataToExport?.map(sub => ({
        'Groupe': sub.school_group_name,
        'Plan': sub.plan_name,
        'Statut': sub.status,
        'Début': formatDate(sub.start_date),
        'Fin': formatDate(sub.end_date),
        'Écoles': sub.schools_count || 0,
        'Utilisateurs': sub.users_count || 0,
        'Auto-renew': sub.auto_renew ? 'Oui' : 'Non'
      })) || [];
      
      const ws = XLSX.utils.json_to_sheet(csvData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Abonnements');
      XLSX.writeFile(wb, `abonnements_${planName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`${csvData.length} abonnement(s) exporté(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const selectAll = () => {
    setSelectedIds(new Set(processedSubscriptions.map(s => s.id)));
  };
  
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Plan - Style Catégories */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{planName}</h2>
              <p className="text-sm text-gray-500">
                {processedSubscriptions.length} / {subscriptions?.length || 0} groupe(s)
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barre d'actions - Recherche, Filtres, Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 no-print">
        {/* Ligne 1: Recherche + Filtres */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un groupe..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="trial">Essai</SelectItem>
              <SelectItem value="cancelled">Annulés</SelectItem>
              <SelectItem value="expired">Expirés</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="schools">Écoles</SelectItem>
              <SelectItem value="users">Utilisateurs</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
        
        {/* Ligne 2: Sélection + Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {processedSubscriptions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectedIds.size === processedSubscriptions.length ? deselectAll : selectAll}
              >
                {selectedIds.size === processedSubscriptions.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {selectedIds.size > 0 ? `${selectedIds.size} sélectionné(s)` : 'Tout sélectionner'}
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Désélectionner
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Style Catégories avec Glassmorphism */}
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

      {/* Grid Cards - Style Catégories */}
      {paginatedSubscriptions && paginatedSubscriptions.length > 0 ? (
        <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.05}>
          {paginatedSubscriptions.map((sub) => (
            <AnimatedItem key={sub.id}>
              <Card 
                className={`group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-[#2A9D8F]/30 bg-white cursor-pointer ${
                  selectedIds.has(sub.id) ? 'ring-2 ring-[#2A9D8F]' : ''
                }`}
              >
                <CardContent className="p-6">
                  {/* Checkbox de sélection */}
                  <div className="absolute top-2 right-2 z-20 no-print">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(sub.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {selectedIds.has(sub.id) ? (
                        <CheckSquare className="h-5 w-5 text-[#2A9D8F]" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <div onClick={() => setSelectedGroup(sub)}>
                  {/* Header avec logo et statut */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Logo du groupe */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 overflow-hidden"
                      style={{ 
                        backgroundColor: sub.status === 'active' ? '#2A9D8F20' : '#6B728020'
                      }}
                    >
                      {sub.school_group_logo ? (
                        <img 
                          src={sub.school_group_logo} 
                          alt={sub.school_group_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback vers icône si l'image ne charge pas
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="${sub.status === 'active' ? '#2A9D8F' : '#6B7280'}" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;
                            }
                          }}
                        />
                      ) : (
                        <Building2 
                          className="w-7 h-7"
                          style={{ color: sub.status === 'active' ? '#2A9D8F' : '#6B7280' }}
                        />
                      )}
                    </div>
                    
                    <Badge
                      className={
                        sub.status === 'active'
                          ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]'
                          : sub.status === 'trial'
                          ? 'bg-[#E9C46A]/10 text-[#E9C46A]'
                          : sub.status === 'cancelled'
                          ? 'bg-[#E63946]/10 text-[#E63946]'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {sub.status === 'active' ? 'Actif' :
                       sub.status === 'trial' ? 'Essai' :
                       sub.status === 'cancelled' ? 'Annulé' :
                       'Expiré'}
                    </Badge>
                  </div>

                  {/* Nom du groupe */}
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                    {sub.school_group_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Depuis le {formatDate(sub.start_date)}
                  </p>

                  {/* Description stats */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {sub.schools_count || 0} école{(sub.schools_count || 0) > 1 ? 's' : ''} • {sub.users_count || 0} fonctionnaire{(sub.users_count || 0) > 1 ? 's' : ''}
                  </p>

                  {/* Footer avec toggle auto-renew - UNIQUEMENT pour admin de groupe */}
                  {isAdminGroupe ? (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={sub.auto_renew}
                          onCheckedChange={(checked) => {
                            toggleAutoRenew.mutate({
                              subscriptionId: sub.id,
                              autoRenew: checked,
                            });
                          }}
                          disabled={sub.status !== 'active' || toggleAutoRenew.isPending}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-700">
                            Auto-renouvellement
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {sub.auto_renew ? 'Activé' : 'Désactivé'}
                          </span>
                        </div>
                      </div>
                      {sub.auto_renew && (
                        <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </div>
                  ) : (
                    // Pour le super admin: affichage en lecture seule
                    sub.auto_renew && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700">
                              Auto-renouvellement
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Activé par l'admin de groupe
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      </div>
                    )
                  )}
                  </div>
                </CardContent>
              </Card>
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Aucun résultat pour ces critères'
              : 'Aucun abonnement actif pour ce plan'
            }
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {searchQuery || statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : `Les groupes scolaires qui souscrivent à "${planName}" apparaîtront ici`
            }
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
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
