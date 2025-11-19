/**
 * Carte d'affichage d'un abonnement
 */

import { TrendingUp, Building2, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { type PlanSubscription } from '../../../hooks/usePlanSubscriptions';
import { formatDate } from '../utils/subscriptions.utils';

interface SubscriptionCardProps {
  subscription: PlanSubscription;
  isSelected: boolean;
  isAdminGroupe: boolean;
  onToggleSelection: (id: string) => void;
  onToggleAutoRenew: (subscriptionId: string, autoRenew: boolean) => void;
  onClick: () => void;
  isTogglingAutoRenew: boolean;
}

export const SubscriptionCard = ({
  subscription: sub,
  isSelected,
  isAdminGroupe,
  onToggleSelection,
  onToggleAutoRenew,
  onClick,
  isTogglingAutoRenew
}: SubscriptionCardProps) => {
  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-[#2A9D8F]/30 bg-white cursor-pointer ${
        isSelected ? 'ring-2 ring-[#2A9D8F]' : ''
      }`}
    >
      <CardContent className="p-6">
        {/* Checkbox de sélection */}
        <div className="absolute top-2 right-2 z-20 no-print">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(sub.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-[#2A9D8F]" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        
        <div onClick={onClick}>
          {/* Header avec logo et statut */}
          <div className="flex items-center justify-between mb-4">
            {/* Logo du groupe */}
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 overflow-hidden"
              style={{ 
                backgroundColor: sub.status === 'active' ? '#2A9D8F20' : '#6B728020'
              }}
            >
              {sub.school_group_logo ? (
                <img 
                  src={sub.school_group_logo} 
                  alt={sub.school_group_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="${sub.status === 'active' ? '#2A9D8F' : '#6B7280'}" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;
                    }
                  }}
                />
              ) : (
                <Building2 
                  className="w-7 h-7"
                  style={{ color: sub.status === 'active' ? '#2A9D8F' : '#6B7280' }}
                />
              )}
            </div>
            
            <Badge
              className={
                sub.status === 'active'
                  ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]'
                  : sub.status === 'trial'
                  ? 'bg-[#E9C46A]/10 text-[#E9C46A]'
                  : sub.status === 'cancelled'
                  ? 'bg-[#E63946]/10 text-[#E63946]'
                  : 'bg-gray-100 text-gray-600'
              }
            >
              {sub.status === 'active' ? 'Actif' :
               sub.status === 'trial' ? 'Essai' :
               sub.status === 'cancelled' ? 'Annulé' :
               'Expiré'}
            </Badge>
          </div>

          {/* Nom du groupe */}
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
            {sub.school_group_name}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Depuis le {formatDate(sub.start_date)}
          </p>

          {/* Description stats */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {sub.schools_count || 0} école{(sub.schools_count || 0) > 1 ? 's' : ''} • {sub.users_count || 0} fonctionnaire{(sub.users_count || 0) > 1 ? 's' : ''}
          </p>

          {/* Footer avec toggle auto-renew */}
          {isAdminGroupe ? (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Switch
                  checked={sub.auto_renew}
                  onCheckedChange={(checked) => {
                    onToggleAutoRenew(sub.id, checked);
                  }}
                  disabled={sub.status !== 'active' || isTogglingAutoRenew}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">
                    Auto-renouvellement
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {sub.auto_renew ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
              </div>
              {sub.auto_renew && (
                <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              )}
            </div>
          ) : (
            sub.auto_renew && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-700">
                      Auto-renouvellement
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Activé par l'admin de groupe
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
