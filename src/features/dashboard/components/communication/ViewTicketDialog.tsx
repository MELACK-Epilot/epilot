/**
 * Modal de visualisation de ticket
 * Design moderne avec couleurs E-Pilot
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  Send,
  Download
} from 'lucide-react';
import type { Ticket, TicketPriority, TicketStatus } from '../../types/communication.types';

interface ViewTicketDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onAddComment?: (ticketId: string, comment: string) => void;
  onUpdateStatus?: (ticketId: string, status: TicketStatus) => void;
}

export const ViewTicketDialog = ({ 
  ticket, 
  isOpen, 
  onClose,
  onAddComment,
  onUpdateStatus
}: ViewTicketDialogProps) => {
  const [newComment, setNewComment] = useState('');

  if (!ticket) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const priorityConfig = getPriorityConfig(ticket.priority);
  const statusConfig = getStatusConfig(ticket.status);
  const PriorityIcon = priorityConfig.icon;
  const StatusIcon = statusConfig.icon;

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(ticket.id, newComment);
      setNewComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate">{ticket.title}</span>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm font-normal text-gray-500 mt-1">
                Ticket #{ticket.id.substring(0, 8)}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Créé par */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                {ticket.createdBy.avatar ? (
                  <img 
                    src={ticket.createdBy.avatar} 
                    alt={ticket.createdBy.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1D3557] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {ticket.createdBy.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Créé par</p>
                  <p className="text-sm font-semibold text-gray-900">{ticket.createdBy.name}</p>
                  <p className="text-xs text-gray-600">{ticket.createdBy.role}</p>
                  {ticket.createdBy.schoolGroup && (
                    <p className="text-xs text-gray-500 mt-1">{ticket.createdBy.schoolGroup}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations du ticket */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <PriorityIcon className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Priorité</p>
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.label}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Catégorie</p>
                  <p className="text-sm font-medium text-gray-900">{getCategoryLabel(ticket.category)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Créé le</p>
                  <p className="text-sm text-gray-700">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigné à */}
          {ticket.assignedTo && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Assigné à</p>
                  <p className="text-sm font-semibold text-gray-900">{ticket.assignedTo.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Description</h3>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Pièces jointes */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Pièces jointes ({ticket.attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ticket.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{attachment}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commentaires */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Commentaires ({ticket.comments.length})
            </h3>
            
            {ticket.comments.length > 0 ? (
              <div className="space-y-3">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{comment.userName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Aucun commentaire pour le moment</p>
            )}

            {/* Ajouter un commentaire */}
            {onAddComment && ticket.status !== 'closed' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6f] hover:from-[#1D3557] hover:to-[#0d1f3d] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions de changement de statut */}
          {onUpdateStatus && ticket.status !== 'closed' && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Changer le statut</p>
              <div className="flex flex-wrap gap-2">
                {ticket.status !== 'in_progress' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(ticket.id, 'in_progress')}
                    className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Marquer en cours
                  </Button>
                )}
                {ticket.status !== 'resolved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(ticket.id, 'resolved')}
                    className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Marquer résolu
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(ticket.id, 'closed')}
                  className="hover:bg-gray-100 hover:text-gray-700"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
