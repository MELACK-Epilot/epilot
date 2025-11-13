/**
 * SubscriptionDetailsModal - Modal de détails d'un abonnement
 * Affiche toutes les informations détaillées
 * @module SubscriptionDetailsModal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  Package, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  FileText,
  Ban,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionDetailsModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
  onSuspend?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRenew?: (id: string) => void;
}

export const SubscriptionDetailsModal = ({
  subscription,
  isOpen,
  onClose,
  onSuspend,
  onCancel,
  onRenew,
}: SubscriptionDetailsModalProps) => {
  if (!subscription) return null;

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20', icon: CheckCircle2, label: 'Actif' },
      expired: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle, label: 'Expiré' },
      cancelled: { color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20', icon: Ban, label: 'Annulé' },
      pending: { color: 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20', icon: Clock, label: 'En attente' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = getStatusConfig(subscription.status);
  const StatusIcon = statusConfig.icon;

  // Calculer les jours restants
  const daysRemaining = Math.ceil(
    (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Package className="w-6 h-6 text-[#2A9D8F]" />
            Détails de l'Abonnement
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur l'abonnement #{subscription.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Statut et Badge */}
          <Card className="p-4 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${statusConfig.color.split(' ')[0]}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <Badge className={`${statusConfig.color} border mt-1`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              {subscription.status === 'active' && daysRemaining > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Expire dans</p>
                  <p className={`text-2xl font-bold ${
                    daysRemaining < 7 ? 'text-[#E63946]' : 
                    daysRemaining < 30 ? 'text-[#E9C46A]' : 
                    'text-[#2A9D8F]'
                  }`}>
                    {daysRemaining} jours
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Informations Groupe */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2A9D8F]" />
              Groupe Scolaire
            </h3>
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="text-base font-medium text-gray-900">{subscription.schoolGroupName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="text-base font-medium text-gray-900">{subscription.schoolGroupCode || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Informations Plan */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#2A9D8F]" />
              Plan Souscrit
            </h3>
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom du Plan</p>
                  <p className="text-base font-medium text-gray-900">{subscription.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Période de Facturation</p>
                  <p className="text-base font-medium text-gray-900">
                    {subscription.billingPeriod === 'monthly' ? 'Mensuel' : 
                     subscription.billingPeriod === 'yearly' ? 'Annuel' : 
                     subscription.billingPeriod === 'quarterly' ? 'Trimestriel' : 
                     'Semestriel'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Informations Financières */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#2A9D8F]" />
              Informations Financières
            </h3>
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription.amount.toLocaleString()} {subscription.currency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {subscription.billingPeriod === 'monthly' ? 'par mois' : 'par an'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Méthode de Paiement</p>
                  <p className="text-base font-medium text-gray-900">
                    {subscription.paymentMethod || 'Non spécifié'}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dernier Paiement</p>
                  <p className="text-base font-medium text-gray-900">
                    {subscription.lastPaymentDate 
                      ? format(new Date(subscription.lastPaymentDate), 'dd MMM yyyy', { locale: fr })
                      : 'Aucun'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prochain Paiement</p>
                  <p className="text-base font-medium text-gray-900">
                    {subscription.nextPaymentDate 
                      ? format(new Date(subscription.nextPaymentDate), 'dd MMM yyyy', { locale: fr })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2A9D8F]" />
              Période d'Abonnement
            </h3>
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Date de Début
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {format(new Date(subscription.startDate), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Date de Fin
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {format(new Date(subscription.endDate), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-gray-500">Renouvellement Automatique</p>
                <Badge className={subscription.autoRenew ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 'bg-gray-100 text-gray-600'}>
                  {subscription.autoRenew ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {subscription.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onSuspend?.(subscription.id)}
                  className="text-[#E9C46A] border-[#E9C46A] hover:bg-[#E9C46A]/10"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Suspendre
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onCancel?.(subscription.id)}
                  className="text-[#E63946] border-[#E63946] hover:bg-[#E63946]/10"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}
            {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
              <Button
                onClick={() => onRenew?.(subscription.id)}
                className="bg-[#2A9D8F] hover:bg-[#1D8A7E] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Renouveler
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
