/**
 * Modal de visualisation des détails d'une demande
 * Avec actions (Approuver, Rejeter, Compléter, Supprimer)
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Trash2, User, Building, Calendar, DollarSign, Edit, Printer } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import type { ResourceRequest } from '../store/useResourceRequestsStore';
import { printRequestWithLogos } from '../utils/printUtils';

interface ViewRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ResourceRequest | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: () => void;
  canApprove: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const statusConfig = {
  pending: { label: '⏳ En attente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '✅ Approuvée', color: 'bg-green-100 text-green-700' },
  rejected: { label: '❌ Rejetée', color: 'bg-red-100 text-red-700' },
  completed: { label: '🎉 Complétée', color: 'bg-blue-100 text-blue-700' },
};

const priorityConfig = {
  low: { label: '🟢 Basse', color: 'bg-gray-100 text-gray-700' },
  normal: { label: '🔵 Normale', color: 'bg-blue-100 text-blue-700' },
  high: { label: '🟠 Haute', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '🔴 Urgente', color: 'bg-red-100 text-red-700' },
};

export const ViewRequestModal = ({
  open,
  onOpenChange,
  request,
  onApprove,
  onReject,
  onComplete,
  onDelete,
  onEdit,
  canApprove,
  canEdit,
  canDelete,
}: ViewRequestModalProps) => {
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'complete' | 'delete' | null>(null);

  if (!request) return null;

  const handleAction = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction) {
        case 'approve':
          await onApprove(request.id);
          break;
        case 'reject':
          await onReject(request.id);
          break;
        case 'complete':
          await onComplete(request.id);
          break;
        case 'delete':
          await onDelete(request.id);
          onOpenChange(false);
          break;
      }
      setConfirmAction(null);
    } catch (error) {
      console.error('Erreur action:', error);
    }
  };

  const totalAmount = request.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || request.total_estimated_amount || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl mb-2">{request.title}</DialogTitle>
                <div className="flex gap-2">
                  <Badge className={statusConfig[request.status].color}>
                    {statusConfig[request.status].label}
                  </Badge>
                  <Badge className={priorityConfig[request.priority].color}>
                    {priorityConfig[request.priority].label}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Demandeur:</span>
                <span className="font-medium">
                  {request.requester?.first_name} {request.requester?.last_name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">École:</span>
                <span className="font-medium">{request.school?.name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Créée le:</span>
                <span className="font-medium">
                  {new Date(request.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Montant total:</span>
                <span className="font-bold text-purple-600">
                  {totalAmount.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* Description */}
            {request.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg">
                  {request.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Liste des ressources */}
            <div>
              <h3 className="font-semibold mb-4">Ressources demandées ({request.items?.length || 0})</h3>
              <div className="space-y-2">
                {request.items?.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.resource_name}</p>
                        <p className="text-xs text-gray-500">{item.resource_category}</p>
                      </div>
                      <p className="font-bold text-purple-600">
                        {item.total_price.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Quantité: {item.quantity} {item.unit}</span>
                      <span>Prix unitaire: {item.unit_price.toLocaleString()} FCFA</span>
                    </div>
                    {item.justification && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Justification: {item.justification}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {request.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700 text-sm bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {request.notes}
                  </p>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {canEdit && request.status === 'pending' && onEdit && (
                  <Button
                    onClick={onEdit}
                    variant="outline"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}

                {canApprove && request.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => setConfirmAction('approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      onClick={() => setConfirmAction('reject')}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}

                {canApprove && request.status === 'approved' && (
                  <Button
                    onClick={() => setConfirmAction('complete')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme complétée
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => printRequestWithLogos(request)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
                
                {canDelete && (
                  <Button
                    onClick={() => setConfirmAction('delete')}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs de confirmation */}
      <ConfirmDialog
        open={confirmAction === 'approve'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleAction}
        title="Approuver cette demande ?"
        description="La demande sera marquée comme approuvée et pourra être traitée."
        confirmText="Approuver"
        variant="info"
        icon="info"
      />

      <ConfirmDialog
        open={confirmAction === 'reject'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleAction}
        title="Rejeter cette demande ?"
        description="La demande sera marquée comme rejetée. Cette action peut être annulée."
        confirmText="Rejeter"
        variant="warning"
        icon="warning"
      />

      <ConfirmDialog
        open={confirmAction === 'complete'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleAction}
        title="Marquer comme complétée ?"
        description="La demande sera marquée comme complétée. Les ressources ont été livrées."
        confirmText="Compléter"
        variant="info"
        icon="info"
      />

      <ConfirmDialog
        open={confirmAction === 'delete'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleAction}
        title="Supprimer cette demande ?"
        description="Cette action est irréversible. La demande et tous ses items seront supprimés définitivement."
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
      />
    </>
  );
};
