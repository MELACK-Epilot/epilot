/**
 * SubscriptionHistoryModal - Modal d'historique d'un abonnement
 * Timeline des modifications, paiements, notes
 * @module SubscriptionHistoryModal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSubscriptionHistory } from '../../hooks/useSubscriptionHistory';
import {
  History,
  ArrowUp,
  ArrowDown,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  MessageSquare,
  Ban,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionHistoryModalProps {
  subscription: any;
  history?: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionHistoryModal = ({
  subscription,
  history = [],
  isOpen,
  onClose,
}: SubscriptionHistoryModalProps) => {
  // Récupérer l'historique réel depuis la base de données
  const { data: realHistory, isLoading } = useSubscriptionHistory(subscription?.id);

  if (!subscription) return null;

  const getHistoryIcon = (action: string) => {
    const icons = {
      created: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
      renewed: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
      upgraded: { icon: ArrowUp, color: 'text-purple-600', bg: 'bg-purple-100' },
      downgraded: { icon: ArrowDown, color: 'text-orange-600', bg: 'bg-orange-100' },
      cancelled: { icon: Ban, color: 'text-red-600', bg: 'bg-red-100' },
      suspended: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      reactivated: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
      payment: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
      note: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
      modified: { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-100' },
    };
    return icons[action as keyof typeof icons] || { icon: History, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getHistoryLabel = (action: string, oldPlan?: string, newPlan?: string, amount?: number) => {
    const labels = {
      created: 'Abonnement créé',
      renewed: 'Abonnement renouvelé',
      upgraded: `Mis à niveau: ${oldPlan} → ${newPlan}`,
      downgraded: `Rétrogradé: ${oldPlan} → ${newPlan}`,
      cancelled: 'Abonnement annulé',
      suspended: 'Abonnement suspendu',
      reactivated: 'Abonnement réactivé',
      payment: `Paiement de ${amount?.toLocaleString()} FCFA`,
      note: 'Note ajoutée',
      modified: 'Abonnement modifié',
    };
    return labels[action as keyof typeof labels] || `Action: ${action}`;
  };

  // Utiliser l'historique réel de la base de données
  const historyItems = realHistory || [];
  
  // Ajouter un événement de création si l'historique est vide
  const displayHistory = historyItems.length > 0 ? historyItems : [
    {
      id: 'initial',
      action: 'created',
      performedBy: null,
      reason: 'Création initiale de l\'abonnement',
      createdAt: subscription.createdAt || new Date().toISOString(),
      previousValue: null,
      newValue: null,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#6B7280]" />
            Historique de l'Abonnement
          </DialogTitle>
          <DialogDescription>
            Historique complet des modifications pour {subscription.schoolGroupName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F] mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement de l'historique...</p>
              </div>
            ) : displayHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun historique disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayHistory.map((item: any, index: number) => {
                  const { icon: Icon, color, bg } = getHistoryIcon(item.action);
                  return (
                    <div key={item.id || index} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        {index < displayHistory.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <Card className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {getHistoryLabel(
                                  item.action, 
                                  item.previousValue?.subscription_plans?.name,
                                  item.newValue?.subscription_plans?.name,
                                  item.newValue?.amount
                                )}
                              </p>
                              {item.reason && (
                                <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {format(new Date(item.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                par {item.performedBy || 'Système'}
                              </p>
                            </div>
                          </div>

                          {/* Badges for specific actions */}
                          <div className="flex items-center gap-2 mt-2">
                            {item.action === 'upgraded' && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                Upgrade
                              </Badge>
                            )}
                            {item.action === 'downgraded' && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <ArrowDown className="w-3 h-3 mr-1" />
                                Downgrade
                              </Badge>
                            )}
                            {item.action === 'payment' && (
                              <Badge className="bg-green-100 text-green-800">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Paiement
                              </Badge>
                            )}
                            {item.action === 'cancelled' && (
                              <Badge className="bg-red-100 text-red-800">
                                <Ban className="w-3 h-3 mr-1" />
                                Annulé
                              </Badge>
                            )}
                            {item.action === 'note' && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Note
                              </Badge>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
