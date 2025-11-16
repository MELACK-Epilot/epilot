/**
 * Page État des Besoins
 * Gestion des demandes de ressources
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ResourceRequestModal } from '../components/modals/ResourceRequestModal';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { StatsCard } from '../components/StatsCard';

export const ResourceRequestsPage = () => {
  const { data: user } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const requests = [
    {
      id: '1',
      title: 'État des besoins - Janvier 2025',
      status: 'pending',
      itemsCount: 12,
      totalAmount: 2500000,
      createdAt: '2025-01-10',
    },
    {
      id: '2',
      title: 'État des besoins - Décembre 2024',
      status: 'approved',
      itemsCount: 8,
      totalAmount: 1800000,
      createdAt: '2024-12-15',
    },
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            État des Besoins
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos demandes de ressources et équipements
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total demandes"
          value={12}
          subtitle="Toutes les demandes"
          icon={FileText}
          color="from-purple-500 to-purple-600"
          delay={0}
        />

        <StatsCard
          title="En attente"
          value={3}
          subtitle="À traiter"
          icon={Clock}
          color="from-yellow-500 to-yellow-600"
          delay={0.1}
        />

        <StatsCard
          title="Approuvées"
          value={8}
          subtitle="Validées"
          icon={CheckCircle}
          color="from-green-500 to-green-600"
          delay={0.2}
        />

        <StatsCard
          title="Rejetées"
          value={1}
          subtitle="Refusées"
          icon={XCircle}
          color="from-red-500 to-red-600"
          delay={0.3}
        />
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher une demande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {requests.map((request, index) => {
          const statusConfig = getStatusBadge(request.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.title}
                      </h3>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>{request.itemsCount} articles</span>
                      <span>•</span>
                      <span>{request.totalAmount.toLocaleString('fr-FR')} FCFA</span>
                      <span>•</span>
                      <span>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <ResourceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolName={user?.schoolGroupId || ''}
        schoolId={user?.schoolId || ''}
      />
    </div>
  );
};
