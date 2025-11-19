/**
 * Dialogue affichant les détails complets d'un groupe scolaire
 * Inclut les informations d'abonnement, écoles, utilisateurs, etc.
 * @module GroupDetailsDialog
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, School, Calendar, DollarSign, TrendingUp, X } from 'lucide-react';
import { type PlanSubscription } from '../../hooks/usePlanSubscriptions';

interface GroupDetailsDialogProps {
  group: PlanSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20';
    case 'trial':
      return 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20';
    case 'cancelled':
      return 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'trial':
      return 'Essai';
    case 'cancelled':
      return 'Annulé';
    case 'expired':
      return 'Expiré';
    default:
      return status;
  }
};

export const GroupDetailsDialog = ({ group, open, onOpenChange }: GroupDetailsDialogProps) => {
  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Logo du groupe */}
              <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2A9D8F]/20 to-[#1D3557]/20">
                {group.school_group_logo ? (
                  <img
                    src={group.school_group_logo}
                    alt={group.school_group_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-[#2A9D8F]" />
                )}
              </div>

              {/* Nom et statut */}
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {group.school_group_name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(group.status)}>
                    {getStatusLabel(group.status)}
                  </Badge>
                  {group.auto_renew && (
                    <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Auto-renew
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Contenu */}
        <div className="space-y-6 mt-6">
          {/* Informations d'abonnement */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#2A9D8F]" />
              Abonnement
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Plan</p>
                <p className="font-semibold text-gray-900">{group.plan_name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Statut</p>
                <p className="font-semibold text-gray-900">{getStatusLabel(group.status)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Date de début</p>
                <p className="font-semibold text-gray-900">{formatDate(group.start_date)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Date de fin</p>
                <p className="font-semibold text-gray-900">{formatDate(group.end_date)}</p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#2A9D8F]" />
              Statistiques
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <School className="h-5 w-5" />
                  </div>
                  <p className="text-white/80 text-sm">Écoles</p>
                </div>
                <p className="text-3xl font-bold">{group.schools_count || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-white/80 text-sm">Fonctionnaires</p>
                </div>
                <p className="text-3xl font-bold">{group.users_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2A9D8F]" />
              Informations
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">ID du groupe</span>
                <span className="font-mono text-xs text-gray-900">{group.school_group_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">ID de l'abonnement</span>
                <span className="font-mono text-xs text-gray-900">{group.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Créé le</span>
                <span className="text-sm text-gray-900">{formatDate(group.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Auto-renouvellement</span>
                <Badge variant="outline" className={group.auto_renew ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                  {group.auto_renew ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
