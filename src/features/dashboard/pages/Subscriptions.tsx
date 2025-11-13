/**
 * Page Abonnements - Suivi global des abonnements
 * Gestion complète avec statistiques, filtres et actions
 * @module Subscriptions
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Clock, Calendar, Users, Download, Eye, Ban, BarChart3, Package, RefreshCw, FileSpreadsheet, FileText, ChevronDown, Mail } from 'lucide-react';
import { exportSubscriptions } from '../utils/exportSubscriptions';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FinanceBreadcrumb, FinancePageHeader, FinanceModernStatsGrid, FinanceSearchBar, FinanceFilters, ModernStatCardData, FilterConfig } from '../components/finance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscriptions, useUpdateSubscription } from '../hooks/useSubscriptions';
import { useSubscriptionHubKPIs } from '../hooks/useSubscriptionHubKPIs';
import { useDeleteSubscription } from '../hooks/useDeleteSubscription';
import { SubscriptionDetailsModal } from '../components/subscriptions/SubscriptionDetailsModal';
import { SubscriptionHubDashboard } from '../components/subscriptions/SubscriptionHubDashboard';
import { UpgradeRequestsWidget } from '../components/subscriptions/UpgradeRequestsWidget';
import { AdvancedSubscriptionFilters, AdvancedFilters } from '../components/subscriptions/AdvancedSubscriptionFilters';
import { SortableTableHeader } from '../components/subscriptions/SortableTableHeader';
import { SubscriptionActionsDropdown } from '../components/subscriptions/SubscriptionActionsDropdown';
import { ModifyPlanModal } from '../components/subscriptions/ModifyPlanModal';
import { AddNoteModal } from '../components/subscriptions/AddNoteModal';
import { SubscriptionHistoryModal } from '../components/subscriptions/SubscriptionHistoryModal';
import { CreateSubscriptionModal } from '../components/subscriptions/CreateSubscriptionModal.v2';
import { UpdatePaymentStatusModal } from '../components/subscriptions/UpdatePaymentStatusModal';
import { DeleteSubscriptionDialog } from '../components/subscriptions/DeleteSubscriptionDialog';
import { Pagination } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useCallback } from 'react';

export const Subscriptions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired' | 'cancelled'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [isModifyPlanOpen, setIsModifyPlanOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // États de sélection multiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { data: subscriptions, isLoading } = useSubscriptions({
    query: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    planSlug: planFilter !== 'all' ? planFilter : undefined,
  });
  
  const { data: hubKPIs, isLoading: hubKPIsLoading } = useSubscriptionHubKPIs();
  const { mutate: updateSubscription } = useUpdateSubscription();
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { toast } = useToast();

  // Appliquer les filtres avancés
  const filteredSubscriptions = subscriptions?.filter(sub => {
    // Filtre par date
    if (advancedFilters.dateFrom) {
      const startDate = new Date(sub.startDate);
      const filterDate = new Date(advancedFilters.dateFrom);
      if (startDate < filterDate) return false;
    }
    if (advancedFilters.dateTo) {
      const endDate = new Date(sub.endDate);
      const filterDate = new Date(advancedFilters.dateTo);
      if (endDate > filterDate) return false;
    }
    
    // Filtre par montant
    if (advancedFilters.amountMin !== undefined && sub.amount < advancedFilters.amountMin) {
      return false;
    }
    if (advancedFilters.amountMax !== undefined && sub.amount > advancedFilters.amountMax) {
      return false;
    }
    
    // Filtre par nombre d'écoles
    if (advancedFilters.schoolsMin !== undefined && (sub.schoolsCount || 0) < advancedFilters.schoolsMin) {
      return false;
    }
    if (advancedFilters.schoolsMax !== undefined && (sub.schoolsCount || 0) > advancedFilters.schoolsMax) {
      return false;
    }
    
    return true;
  });

  // Fonction de tri optimisée avec useCallback
  const handleSort = useCallback((field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Appliquer le tri aux données filtrées avec useMemo
  const sortedSubscriptions = useMemo(() => {
    if (!filteredSubscriptions) return [];
    
    return [...filteredSubscriptions].sort((a, b) => {
    let aValue: any = a[sortConfig.field as keyof typeof a];
    let bValue: any = b[sortConfig.field as keyof typeof b];

    // Gestion spéciale pour certains champs
    switch (sortConfig.field) {
      case 'schoolGroupName':
        aValue = a.schoolGroupName?.toLowerCase() || '';
        bValue = b.schoolGroupName?.toLowerCase() || '';
        break;
      case 'schoolsCount':
        aValue = a.schoolsCount || 0;
        bValue = b.schoolsCount || 0;
        break;
      case 'planName':
        aValue = a.planName?.toLowerCase() || '';
        bValue = b.planName?.toLowerCase() || '';
        break;
      case 'startDate':
      case 'endDate':
      case 'createdAt':
      case 'updatedAt':
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
        break;
      case 'amount':
        aValue = Number(aValue);
        bValue = Number(bValue);
        break;
      default:
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
    });
  }, [filteredSubscriptions, sortConfig]);

  // Pagination des données triées
  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedSubscriptions.slice(startIndex, endIndex);
  }, [sortedSubscriptions, currentPage, pageSize]);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil((sortedSubscriptions?.length || 0) / pageSize);

  // Réinitialiser à la page 1 lors du changement de filtres
  useCallback(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, planFilter, advancedFilters]);

  // Calcul des statistiques avec useMemo (sur TOUTES les subscriptions, pas filtrées)
  const stats = useMemo(() => ({
    total: subscriptions?.length || 0,
    active: subscriptions?.filter(s => s.status === 'active').length || 0,
    expired: subscriptions?.filter(s => s.status === 'expired').length || 0,
    pending: subscriptions?.filter(s => s.status === 'pending').length || 0,
    cancelled: subscriptions?.filter(s => s.status === 'cancelled').length || 0,
    suspended: subscriptions?.filter(s => s.status === 'suspended').length || 0,
    paymentPending: subscriptions?.filter(s => s.paymentStatus === 'pending').length || 0,
    overdue: subscriptions?.filter(s => s.paymentStatus === 'overdue').length || 0,
    revenue: subscriptions?.reduce((acc, s) => acc + (s.status === 'active' && s.paymentStatus === 'paid' ? s.amount : 0), 0) || 0,
  }), [subscriptions]);

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const configs = {
      active: { color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20', icon: CheckCircle2, label: 'Actif' },
      expired: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle, label: 'Expiré' },
      cancelled: { color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20', icon: Ban, label: 'Annulé' },
      pending: { color: 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20', icon: Clock, label: 'En attente' },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Fonction pour obtenir le badge de paiement
  const getPaymentBadge = (paymentStatus: string) => {
    const configs = {
      paid: { color: 'bg-[#2A9D8F]/10 text-[#2A9D8F]', label: 'Payé' },
      pending: { color: 'bg-[#E9C46A]/10 text-[#E9C46A]', label: 'En attente' },
      overdue: { color: 'bg-[#E63946]/10 text-[#E63946]', label: 'En retard' },
      failed: { color: 'bg-gray-100 text-gray-600', label: 'Échoué' },
    };
    const config = configs[paymentStatus as keyof typeof configs] || configs.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Préparer les stats avec le nouveau design moderne
  const statsData: ModernStatCardData[] = [
    { title: "Total", value: stats.total, subtitle: "abonnements", icon: Package, color: 'blue' },
    { title: "Actifs", value: stats.active, subtitle: "en cours", icon: CheckCircle2, color: 'green', trend: stats.active > 0 ? { value: Math.round((stats.active / stats.total) * 100), label: 'du total' } : undefined },
    { title: "En Attente", value: stats.pending, subtitle: "à valider", icon: Clock, color: 'gold' },
    { title: "Expirés", value: stats.expired, subtitle: "terminés", icon: XCircle, color: 'gray' },
    { title: "En Retard", value: stats.overdue, subtitle: "paiement dû", icon: AlertCircle, color: 'red' },
  ];

  // Fonctions d'action
  const handleViewDetails = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsDetailsOpen(true);
  };

  const handleSuspend = (id: string) => {
    updateSubscription(
      { id, status: 'pending' },
      {
        onSuccess: () => {
          toast({
            title: 'Abonnement suspendu',
            description: 'L\'abonnement a été suspendu avec succès.',
          });
          setIsDetailsOpen(false);
        },
        onError: () => {
          toast({
            title: 'Erreur',
            description: 'Impossible de suspendre l\'abonnement.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleCancel = (id: string) => {
    updateSubscription(
      { id, status: 'cancelled' },
      {
        onSuccess: () => {
          toast({
            title: 'Abonnement annulé',
            description: 'L\'abonnement a été annulé avec succès.',
          });
          setIsDetailsOpen(false);
        },
        onError: () => {
          toast({
            title: 'Erreur',
            description: 'Impossible d\'annuler l\'abonnement.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRenew = (id: string) => {
    updateSubscription(
      { id, status: 'active' },
      {
        onSuccess: () => {
          toast({
            title: 'Abonnement renouvelé',
            description: 'L\'abonnement a été renouvelé avec succès.',
          });
          setIsDetailsOpen(false);
        },
        onError: () => {
          toast({
            title: 'Erreur',
            description: 'Impossible de renouveler l\'abonnement.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Fonctions pour les actions avancées
  const handleModifyPlan = (id: string) => {
    const subscription = subscriptions?.find(sub => sub.id === id);
    setSelectedSubscription(subscription);
    setIsModifyPlanOpen(true);
  };

  const handleSendReminder = (id: string) => {
    toast({
      title: 'Relance envoyée',
      description: 'Une relance de paiement a été envoyée au groupe.',
    });
  };

  const handleAddNote = (id: string) => {
    const subscription = subscriptions?.find(sub => sub.id === id);
    setSelectedSubscription(subscription);
    setIsAddNoteOpen(true);
  };

  const handleViewHistory = (id: string) => {
    const subscription = subscriptions?.find(sub => sub.id === id);
    setSelectedSubscription(subscription);
    setIsHistoryOpen(true);
  };

  const handleUpdatePaymentStatus = (id: string) => {
    const subscription = subscriptions?.find(sub => sub.id === id);
    setSelectedSubscription(subscription);
    setIsUpdatePaymentOpen(true);
  };

  const handleDelete = (id: string) => {
    const subscription = subscriptions?.find(sub => sub.id === id);
    setSelectedSubscription(subscription);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = (reason: string) => {
    if (selectedSubscription) {
      deleteSubscription(selectedSubscription.id);
      console.log('Raison de suppression:', reason);
    }
  };

  // Fonctions de confirmation
  const handleModifyPlanConfirm = (subscriptionId: string, newPlanId: string, reason: string) => {
    // Ici on devrait appeler une API pour modifier le plan
    console.log('Modifier plan:', { subscriptionId, newPlanId, reason });
    toast({
      title: 'Plan modifié',
      description: 'Le plan de l\'abonnement sera modifié.',
    });
  };

  const handleAddNoteConfirm = (subscriptionId: string, note: string, type: string) => {
    // Ici on devrait appeler une API pour ajouter la note
    console.log('Ajouter note:', { subscriptionId, note, type });
    toast({
      title: 'Note ajoutée',
      description: 'La note a été ajoutée à l\'abonnement.',
    });
  };

  // Fonctions de sélection multiple
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === paginatedSubscriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSubscriptions.map(sub => sub.id));
    }
  }, [selectedIds.length, paginatedSubscriptions]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  const isAllSelected = paginatedSubscriptions.length > 0 && 
    selectedIds.length === paginatedSubscriptions.length;

  const isIndeterminate = selectedIds.length > 0 && 
    selectedIds.length < paginatedSubscriptions.length;

  // Actions groupées
  const handleBulkSendReminders = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    toast({
      title: 'Relances envoyées',
      description: `${selectedIds.length} relance(s) de paiement envoyée(s)`,
    });
    setSelectedIds([]);
  }, [selectedIds, toast]);

  const handleBulkExport = useCallback((format: 'csv' | 'excel' | 'pdf') => {
    if (selectedIds.length === 0) return;
    
    const selectedSubscriptions = sortedSubscriptions.filter(sub => 
      selectedIds.includes(sub.id)
    );
    
    try {
      exportSubscriptions(selectedSubscriptions, format);
      toast({
        title: 'Export réussi',
        description: `${selectedIds.length} abonnement(s) exporté(s)`,
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  }, [selectedIds, sortedSubscriptions, toast]);

  const handleBulkSuspend = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    toast({
      title: 'Abonnements suspendus',
      description: `${selectedIds.length} abonnement(s) suspendu(s)`,
    });
    setSelectedIds([]);
  }, [selectedIds, toast]);

  // Fonctions d'export
  const handleExport = useCallback((format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (!sortedSubscriptions || sortedSubscriptions.length === 0) {
        toast({
          title: 'Erreur',
          description: 'Aucune donnée à exporter',
          variant: 'destructive',
        });
        return;
      }

      exportSubscriptions(sortedSubscriptions, format);
      
      const formatLabels = {
        csv: 'CSV',
        excel: 'Excel',
        pdf: 'PDF',
      };

      toast({
        title: 'Export réussi',
        description: `${sortedSubscriptions.length} abonnement(s) exporté(s) en ${formatLabels[format]}`,
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  }, [sortedSubscriptions, toast]);

  // Préparer les filtres
  const filters: FilterConfig[] = [
    {
      label: "Statut",
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as any),
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'active', label: 'Actifs' },
        { value: 'pending', label: 'En attente' },
        { value: 'expired', label: 'Expirés' },
        { value: 'cancelled', label: 'Annulés' },
      ],
    },
    {
      label: "Plan",
      value: planFilter,
      onChange: setPlanFilter,
      options: [
        { value: 'all', label: 'Tous les plans' },
        { value: 'gratuit', label: 'Gratuit' },
        { value: 'premium', label: 'Premium' },
        { value: 'pro', label: 'Pro' },
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <FinanceBreadcrumb currentPage="Abonnements" />

      {/* Dashboard Hub Abonnements avec bouton Export */}
      <SubscriptionHubDashboard 
        kpis={hubKPIs} 
        isLoading={hubKPIsLoading}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                disabled={!sortedSubscriptions || sortedSubscriptions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Accès Rapides - Actions et Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border-0 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#2A9D8F]" />
            Accès Rapides
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total */}
            <button
              onClick={() => setStatusFilter('all')}
              className="group relative p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-white/80 mt-1">Total</p>
                <p className="text-[10px] text-white/60">abonnements</p>
              </div>
            </button>

            {/* Actifs */}
            <button
              onClick={() => setStatusFilter('active')}
              className="group relative p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <p className="text-3xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-white/80 mt-1">Actifs</p>
                <p className="text-[10px] text-white/60">en cours</p>
              </div>
            </button>

            {/* Paiement En Attente */}
            <button
              onClick={() => {
                setStatusFilter('all');
                setAdvancedFilters({ ...advancedFilters, paymentStatus: 'pending' });
              }}
              className="group relative p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <p className="text-3xl font-bold text-white">{stats.paymentPending}</p>
                <p className="text-xs text-white/80 mt-1">En Attente</p>
                <p className="text-[10px] text-white/60">paiement dû</p>
              </div>
            </button>

            {/* Expirés */}
            <button
              onClick={() => setStatusFilter('expired')}
              className="group relative p-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <p className="text-3xl font-bold text-white">{stats.expired}</p>
                <p className="text-xs text-white/80 mt-1">Expirés</p>
                <p className="text-[10px] text-white/60">terminés</p>
              </div>
            </button>

            {/* En Retard */}
            <button
              onClick={() => {
                setStatusFilter('all');
                setAdvancedFilters({ ...advancedFilters, paymentStatus: 'overdue' });
              }}
              className="group relative p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <p className="text-3xl font-bold text-white">{stats.overdue}</p>
                <p className="text-xs text-white/80 mt-1">En Retard</p>
                <p className="text-[10px] text-white/60">paiement dû</p>
              </div>
            </button>

            {/* Nouveau Abonnement */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="group relative p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <Package className="w-8 h-8 text-white mx-auto mb-1" />
                <p className="text-xs text-white/80">Nouveau</p>
                <p className="text-[10px] text-white/60">abonnement</p>
              </div>
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Widget Demandes d'Upgrade */}
      <UpgradeRequestsWidget />

      {/* Graphique Évolution par Statut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2A9D8F]" />
            Répartition des Abonnements par Statut
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Actifs', value: stats.active, fill: '#2A9D8F' },
              { name: 'En attente', value: stats.pending, fill: '#E9C46A' },
              { name: 'Expirés', value: stats.expired, fill: '#6B7280' },
              { name: 'Annulés', value: stats.cancelled || 0, fill: '#E63946' },
              { name: 'Suspendus', value: stats.suspended || 0, fill: '#F97316' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Recherche et Filtres */}
      <div className="space-y-4">
        <FinanceSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un groupe..."
        />
        <FinanceFilters filters={filters} />
        
        {/* Filtres Avancés */}
        <AdvancedSubscriptionFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onReset={() => setAdvancedFilters({})}
        />
      </div>

      {/* Tableau des abonnements */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#2A9D8F] focus:ring-[#2A9D8F]"
                  />
                </th>
                <SortableTableHeader
                  field="schoolGroupName"
                  sortField={sortConfig.field}
                  sortDirection={sortConfig.direction}
                  onSort={handleSort}
                >
                  Groupe Scolaire
                </SortableTableHeader>
                <SortableTableHeader
                  field="schoolsCount"
                  sortField={sortConfig.field}
                  sortDirection={sortConfig.direction}
                  onSort={handleSort}
                >
                  Écoles
                </SortableTableHeader>
                <SortableTableHeader
                  field="planName"
                  sortField={sortConfig.field}
                  sortDirection={sortConfig.direction}
                  onSort={handleSort}
                >
                  Plan
                </SortableTableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                <SortableTableHeader
                  field="amount"
                  sortField={sortConfig.field}
                  sortDirection={sortConfig.direction}
                  onSort={handleSort}
                >
                  Montant
                </SortableTableHeader>
                <SortableTableHeader
                  field="endDate"
                  sortField={sortConfig.field}
                  sortDirection={sortConfig.direction}
                  onSort={handleSort}
                >
                  Dates
                </SortableTableHeader>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-12 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginatedSubscriptions && paginatedSubscriptions.length > 0 ? (
                paginatedSubscriptions.map((subscription, index) => (
                  <motion.tr
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(subscription.id)}
                        onChange={() => handleSelectOne(subscription.id)}
                        className="rounded border-gray-300 text-[#2A9D8F] focus:ring-[#2A9D8F]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{subscription.schoolGroupName}</div>
                        <div className="text-xs text-gray-500">{subscription.schoolGroupCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {subscription.schoolsCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{subscription.planName}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentBadge(subscription.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {subscription.amount.toLocaleString()} {subscription.currency}
                      </div>
                      <div className="text-xs text-gray-500">
                        {subscription.billingPeriod === 'monthly' ? '/mois' : '/an'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(subscription.startDate), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(subscription.endDate), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <SubscriptionActionsDropdown
                        subscription={subscription}
                        onModifyPlan={handleModifyPlan}
                        onSendReminder={handleSendReminder}
                        onAddNote={handleAddNote}
                        onViewHistory={handleViewHistory}
                        onUpdatePaymentStatus={handleUpdatePaymentStatus}
                        onDelete={handleDelete}
                      />
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Aucun abonnement trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && sortedSubscriptions && sortedSubscriptions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedSubscriptions.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1); // Retour à la page 1 lors du changement de taille
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </Card>

      {/* Modal de détails */}
      <SubscriptionDetailsModal
        subscription={selectedSubscription}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onSuspend={handleSuspend}
        onCancel={handleCancel}
        onRenew={handleRenew}
      />

      {/* Modal de modification de plan */}
      <ModifyPlanModal
        subscription={selectedSubscription}
        isOpen={isModifyPlanOpen}
        onClose={() => setIsModifyPlanOpen(false)}
        onConfirm={handleModifyPlanConfirm}
        availablePlans={[
          { id: 'gratuit', name: 'Gratuit', price: 0 },
          { id: 'premium', name: 'Premium', price: 50000 },
          { id: 'pro', name: 'Pro', price: 100000 },
          { id: 'institutionnel', name: 'Institutionnel', price: 200000 },
        ]}
      />

      {/* Modal d'ajout de note */}
      <AddNoteModal
        subscription={selectedSubscription}
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onConfirm={handleAddNoteConfirm}
      />

      {/* Modal d'historique */}
      <SubscriptionHistoryModal
        subscription={selectedSubscription}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Barre d'actions flottante pour sélection multiple */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="shadow-2xl border-2 border-[#2A9D8F]">
            <div className="flex items-center gap-4 px-6 py-4">
              {/* Compteur */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2A9D8F] text-white flex items-center justify-center font-bold">
                  {selectedIds.length}
                </div>
                <span className="font-semibold text-gray-900">
                  {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="h-8 w-px bg-gray-300" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Envoyer relances */}
                <Button
                  size="sm"
                  onClick={handleBulkSendReminders}
                  className="bg-[#2A9D8F] hover:bg-[#1D8A7E]"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer relances
                </Button>

                {/* Export sélection */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('excel')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Suspendre */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkSuspend}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspendre
                </Button>

                {/* Annuler sélection */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-gray-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modals */}
      <CreateSubscriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <ModifyPlanModal
        isOpen={isModifyPlanOpen}
        onClose={() => setIsModifyPlanOpen(false)}
        subscription={selectedSubscription}
        onConfirm={handleModifyPlanConfirm}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        subscription={selectedSubscription}
        onConfirm={handleAddNoteConfirm}
      />

      <SubscriptionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        subscription={selectedSubscription}
      />

      {/* Modal de modification statut paiement */}
      <UpdatePaymentStatusModal
        subscription={selectedSubscription}
        isOpen={isUpdatePaymentOpen}
        onClose={() => setIsUpdatePaymentOpen(false)}
      />

      {/* Dialog de suppression */}
      <DeleteSubscriptionDialog
        subscription={selectedSubscription}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Subscriptions;
