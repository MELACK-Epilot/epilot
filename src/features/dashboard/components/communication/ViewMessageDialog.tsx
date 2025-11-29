/**
 * Modal de visualisation de message
 * Design moderne avec couleurs E-Pilot
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Reply, 
  Forward, 
  Trash2,
  Paperclip,
  Download,
  Users,
  Calendar,
  User
} from 'lucide-react';
import type { Message } from '../../types/communication.types';

interface ViewMessageDialogProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export const ViewMessageDialog = ({ 
  message, 
  isOpen, 
  onClose,
  onReply,
  onForward,
  onDelete
}: ViewMessageDialogProps) => {
  if (!message) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D3557] to-[#457B9D] flex items-center justify-center">
              {message.senderAvatar ? (
                <img 
                  src={message.senderAvatar} 
                  alt={message.senderName}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate">{message.subject || 'Sans objet'}</span>
                {!message.isRead && (
                  <Badge className="bg-[#2A9D8F] text-white">Nouveau</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* En-tête du message */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
            <div className="space-y-3">
              {/* Expéditeur */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">De</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{message.senderName}</p>
                      {message.senderRole && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          {message.senderRole}
                        </Badge>
                      )}
                    </div>
                    {message.senderSchoolGroupName && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span>📍</span>
                        <span className="font-medium">{message.senderSchoolGroupName}</span>
                        {message.senderSchoolGroupCity && (
                          <span className="text-gray-400">• {message.senderSchoolGroupCity}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Destinataires */}
              {message.recipients && message.recipients.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">À</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {message.recipients.map((recipient, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {recipient.name}
                          {recipient.isRead && (
                            <span className="ml-1 text-[#2A9D8F]">✓</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm text-gray-700">{formatDate(message.sentAt)}</p>
                </div>
              </div>

              {/* Type de message */}
              {message.type && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {message.type === 'direct' && 'Message direct'}
                    {message.type === 'group' && 'Message de groupe'}
                    {message.type === 'broadcast' && 'Diffusion'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Contenu du message */}
          <div className="prose max-w-none">
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>

          {/* Pièces jointes */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Pièces jointes ({message.attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {message.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statut de lecture */}
          {message.recipients && message.recipients.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Statut de lecture</h3>
              <div className="space-y-1">
                {message.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{recipient.name}</span>
                    {recipient.isRead ? (
                      <span className="text-[#2A9D8F] flex items-center gap-1">
                        <span className="text-xs">✓</span>
                        Lu {recipient.readAt && `le ${formatDate(recipient.readAt)}`}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">Non lu</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {onReply && (
              <Button
                variant="outline"
                onClick={() => {
                  onReply(message);
                  onClose();
                }}
                className="flex-1 sm:flex-none"
              >
                <Reply className="w-4 h-4 mr-2" />
                Répondre
              </Button>
            )}
            {onForward && (
              <Button
                variant="outline"
                onClick={() => {
                  onForward(message);
                  onClose();
                }}
                className="flex-1 sm:flex-none"
              >
                <Forward className="w-4 h-4 mr-2" />
                Transférer
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => {
                  onDelete(message);
                  onClose();
                }}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
