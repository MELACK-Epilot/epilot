/**
 * Section Tickets/Plaintes
 * Gestion des tickets de support et plaintes
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter,
  Plus,
  Search,
  MessageSquare,
  Paperclip,
  User,
  TrendingUp,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import type { Ticket, TicketStats, TicketStatus, TicketPriority } from '../../types/communication.types';

interface TicketsSectionProps {
  tickets: Ticket[];
  stats: TicketStats;
  isLoading: boolean;
  onCreateTicket: () => void;
  onViewTicket: (ticket: Ticket) => void;
}

export const TicketsSection = ({ 
  tickets, 
  stats, 
  isLoading,
  onCreateTicket,
  onViewTicket 
}: TicketsSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

  // Stats cards avec couleurs E-Pilot
  const statsCards = [
    { 
      label: 'Total Tickets', 
      value: stats.total, 
      icon: AlertCircle, 
      gradient: 'from-[#1D3557] to-[#457B9D]'
    },
    { 
      label: 'Ouverts', 
      value: stats.open, 
      icon: Clock, 
      gradient: 'from-[#E9C46A] to-[#d4a84f]'
    },
    { 
      label: 'En cours', 
      value: stats.inProgress, 
      icon: TrendingUp, 
      gradient: 'from-[#2A9D8F] to-[#1d7a6f]'
    },
    { 
      label: 'Résolus', 
      value: stats.resolved, 
      icon: CheckCircle2, 
      gradient: 'from-[#E63946] to-[#c72030]'
    },
  ];

  const getPriorityConfig = (priority: TicketPriority) => {
    const configs = {
      low: { label: 'Faible', color: 'bg-gray-100 text-gray-700', icon: Clock },
      medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      high: { label: 'Haute', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return configs[priority];
  };

  const getStatusConfig = (status: TicketStatus) => {
    const configs = {
      open: { label: 'Ouvert', color: 'bg-orange-100 text-orange-700', icon: Clock },
      in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-700', icon: TrendingUp },
      resolved: { label: 'Résolu', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-700', icon: XCircle },
    };
    return configs[status];
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technique: 'Technique',
      pedagogique: 'Pédagogique',
      financier: 'Financier',
      administratif: 'Administratif',
      autre: 'Autre',
    };
    return labels[category] || category;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Design moderne E-Pilot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label} 
              className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-90`} />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              {/* Cercle décoratif */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
            </Card>
          );
        })}
      </div>

      {/* Filters & Actions */}
      <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
                className="h-11"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === 'open' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('open')}
                size="sm"
                className="h-11"
              >
                Ouverts
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('in_progress')}
                size="sm"
                className="h-11"
              >
                En cours
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-11"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              <Button
                onClick={onCreateTicket}
                className="bg-gradient-to-r from-[#2A9D8F] to-[#1D3557]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Ticket
              </Button>
            </div>
          </div>
        </Card>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Aucun ticket trouvé</p>
              <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
            </div>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const priorityConfig = getPriorityConfig(ticket.priority);
            const statusConfig = getStatusConfig(ticket.status);
            const PriorityIcon = priorityConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
                <Card 
                  key={ticket.id}
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewTicket(ticket)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {ticket.createdBy.avatar ? (
                        <img 
                          src={ticket.createdBy.avatar} 
                          alt={ticket.createdBy.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1D3557] flex items-center justify-center text-white font-semibold text-sm">
                          {ticket.createdBy.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {ticket.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={priorityConfig.color}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {priorityConfig.label}
                          </Badge>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{ticket.createdBy.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(ticket.category)}
                          </Badge>
                        </div>
                        {ticket.comments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{ticket.comments.length} commentaires</span>
                          </div>
                        )}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{ticket.attachments.length} fichiers</span>
                          </div>
                        )}
                        <span className="ml-auto">
                          {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
