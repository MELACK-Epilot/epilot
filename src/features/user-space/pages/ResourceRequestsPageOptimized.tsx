/**
 * Page État des Besoins - Version Optimisée
 * Avec Zustand + Optimistic Updates + Temps Réel
 */

import { useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useResourceRequestsOptimized } from '@/features/resource-requests/hooks/useResourceRequestsOptimized';
import { CreateRequestModal } from '@/features/resource-requests/components/CreateRequestModal';
import { EditRequestModal } from '@/features/resource-requests/components/EditRequestModal';
import { ViewRequestModal } from '@/features/resource-requests/components/ViewRequestModal';
import { RequestCard } from '@/features/resource-requests/components/RequestCard';
import { RequestsTableView } from '@/features/resource-requests/components/RequestsTableView';
import { printRequest, downloadRequestsCSV } from '@/features/resource-requests/utils/exportUtils';
import { StatsCard } from '../components/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ShoppingCart, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, LayoutGrid, Table, Download, Printer } from 'lucide-react';
import type { ResourceRequest } from '@/features/resource-requests/store/useResourceRequestsStore';

const useSchools = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['schools', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) return [];
      
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('school_group_id', schoolGroupId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolGroupId,
  });
};

export const ResourceRequestsPageOptimized = () => {
  const { data: user } = useCurrentUser();
  const { data: schools = [] } = useSchools(user?.schoolGroupId);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [requestToEdit, setRequestToEdit] = useState<ResourceRequest | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const {
    requests,
    isLoading,
    loadRequests,
    createRequest,
    updateRequestData,
    handleApprove,
    handleReject,
    handleComplete,
    handleDelete,
  } = useResourceRequestsOptimized(user?.schoolGroupId || '', user?.id || '');

  // Filtrer les demandes
  const filteredRequests = requests.filter(req => {
    if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && req.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  // Permissions
  const canCreate = ['admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 'comptable'].includes(user?.role || '');
  const canApprove = user?.role === 'admin_groupe'; // Seul l'admin de groupe peut approuver
  
  // Fonction pour vérifier si on peut supprimer une demande
  const canDeleteRequest = (request: ResourceRequest) => {
    // Admin peut tout supprimer
    if (user?.role === 'admin_groupe') return true;
    // Directeur peut supprimer ses propres demandes en attente
    if (request.status === 'pending' && request.requested_by === user?.id) return true;
    return false;
  };

  // Calculs KPIs
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const totalAmount = requests.reduce((sum, r) => sum + (r.total_estimated_amount || 0), 0);
  const approvedAmount = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.total_estimated_amount || 0), 0);

  if (!user) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            État des Besoins
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin_groupe' 
              ? 'Gérez les demandes de ressources de vos écoles'
              : 'Soumettez vos besoins en ressources à l\'administration du groupe'}
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {user.role === 'admin_groupe' ? 'Nouvelle demande' : 'Soumettre un besoin'}
          </Button>
        )}
      </div>

      {/* KPIs - Grille 2x3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ligne 1 */}
        <StatsCard
          title="Total demandes"
          value={requests.length}
          subtitle="Toutes les demandes"
          icon={ShoppingCart}
          color="from-purple-500 to-purple-600"
          delay={0}
        />

        <StatsCard
          title="En attente"
          value={pendingCount}
          subtitle="À traiter"
          icon={Clock}
          color="from-yellow-500 to-yellow-600"
          delay={0.1}
        />

        <StatsCard
          title="Approuvées"
          value={approvedCount}
          subtitle="Validées"
          icon={CheckCircle}
          color="from-green-500 to-green-600"
          delay={0.2}
        />

        {/* Ligne 2 */}
        <StatsCard
          title="Rejetées"
          value={rejectedCount}
          subtitle="Non validées"
          icon={XCircle}
          color="from-red-500 to-red-600"
          delay={0.3}
        />

        <StatsCard
          title="Montant total"
          value={`${(totalAmount / 1000000).toFixed(1)}M`}
          subtitle={`${totalAmount.toLocaleString()} FCFA`}
          icon={DollarSign}
          color="from-blue-500 to-blue-600"
          delay={0.4}
        />

        <StatsCard
          title="Montant approuvé"
          value={`${(approvedAmount / 1000000).toFixed(1)}M`}
          subtitle={`${approvedAmount.toLocaleString()} FCFA`}
          icon={TrendingUp}
          color="from-indigo-500 to-indigo-600"
          delay={0.5}
        />
      </div>

      {/* Barre d'outils: Toggle vue + Export */}
      <div className="flex items-center justify-between gap-4">
        {/* Toggle Grille/Tableau */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grille
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <Table className="h-4 w-4 mr-2" />
            Tableau
          </Button>
        </div>

        {/* Boutons d'export */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadRequestsCSV(filteredRequests)}
            disabled={filteredRequests.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher une demande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">⏳ En attente</SelectItem>
                <SelectItem value="approved">✅ Approuvées</SelectItem>
                <SelectItem value="rejected">❌ Rejetées</SelectItem>
                <SelectItem value="completed">🎉 Complétées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priorité</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="low">🟢 Basse</SelectItem>
                <SelectItem value="normal">🔵 Normale</SelectItem>
                <SelectItem value="high">🟠 Haute</SelectItem>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredRequests.length}</span> demande(s) trouvée(s)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="text-purple-600 hover:text-purple-700"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {/* Liste des demandes - Vue conditionnelle */}
      {isLoading ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune demande trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche.'
              : 'Créez votre première demande de ressources !'}
          </p>
          {canCreate && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              onView={setSelectedRequest}
              delay={index * 0.05}
            />
          ))}
        </div>
      ) : (
        <RequestsTableView
          requests={filteredRequests}
          onView={setSelectedRequest}
          onEdit={setRequestToEdit}
          canEdit={(req) => 
            req.status === 'pending' && 
            (user.role === 'admin_groupe' || req.requested_by === user.id)
          }
        />
      )}

      {/* Modals */}
      <CreateRequestModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={createRequest}
        schools={schools}
      />

      <ViewRequestModal
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onEdit={() => {
          setRequestToEdit(selectedRequest);
          setSelectedRequest(null);
        }}
        canApprove={canApprove}
        canEdit={
          !!selectedRequest &&
          selectedRequest.status === 'pending' &&
          (user.role === 'admin_groupe' || selectedRequest.requested_by === user.id)
        }
        canDelete={selectedRequest ? canDeleteRequest(selectedRequest) : false}
      />

      <EditRequestModal
        open={!!requestToEdit}
        onOpenChange={(open) => !open && setRequestToEdit(null)}
        request={requestToEdit}
        onSubmit={updateRequestData}
        schools={schools}
      />
    </div>
  );
};
