/**
 * SubscriptionActionsDropdown - Menu d'actions avancées pour les abonnements
 * Modifier plan, Envoyer relance, Ajouter note, Voir historique
 * @module SubscriptionActionsDropdown
 */

import { useState } from 'react';
import { 
  MoreHorizontal, 
  Edit3, 
  Mail, 
  MessageSquare, 
  History, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface SubscriptionActionsDropdownProps {
  subscription: any;
  onModifyPlan?: (id: string) => void;
  onSendReminder?: (id: string) => void;
  onAddNote?: (id: string) => void;
  onViewHistory?: (id: string) => void;
  onUpdatePaymentStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SubscriptionActionsDropdown = ({
  subscription,
  onModifyPlan,
  onSendReminder,
  onAddNote,
  onViewHistory,
  onUpdatePaymentStatus,
  onDelete,
}: SubscriptionActionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Vérifier si le paiement est en retard
  const isPaymentOverdue = subscription.paymentStatus === 'overdue';
  
  // Vérifier si l'abonnement est actif
  const isActive = subscription.status === 'active';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span>Actions</span>
          {isPaymentOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Urgent
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Modifier le Plan */}
        {isActive && (
          <DropdownMenuItem
            onClick={() => {
              onModifyPlan?.(subscription.id);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-[#2A9D8F]" />
            <span>Modifier le plan</span>
          </DropdownMenuItem>
        )}

        {/* Modifier Statut Paiement */}
        <DropdownMenuItem
          onClick={() => {
            onUpdatePaymentStatus?.(subscription.id);
            setIsOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CreditCard className="w-4 h-4 text-[#457B9D]" />
          <span>Modifier statut paiement</span>
        </DropdownMenuItem>

        {/* Envoyer une Relance */}
        {isPaymentOverdue && (
          <DropdownMenuItem
            onClick={() => {
              onSendReminder?.(subscription.id);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#E9C46A]" />
            <span>Envoyer relance</span>
            <Badge variant="secondary" className="ml-auto text-xs bg-[#E63946]/10 text-[#E63946]">
              Urgent
            </Badge>
          </DropdownMenuItem>
        )}

        {/* Ajouter une Note */}
        <DropdownMenuItem
          onClick={() => {
            onAddNote?.(subscription.id);
            setIsOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-[#457B9D]" />
          <span>Ajouter une note</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Voir l'Historique */}
        <DropdownMenuItem
          onClick={() => {
            onViewHistory?.(subscription.id);
            setIsOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <History className="w-4 h-4 text-[#6B7280]" />
          <span>Voir l'historique</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Supprimer l'Abonnement */}
        <DropdownMenuItem
          onClick={() => {
            onDelete?.(subscription.id);
            setIsOpen(false);
          }}
          className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Supprimer</span>
        </DropdownMenuItem>

        {/* Statut Visuel */}
        <div className="px-2 py-1 mt-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Statut:</span>
            <div className="flex items-center gap-1">
              {subscription.status === 'active' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
              {subscription.status === 'expired' && <XCircle className="w-3 h-3 text-red-500" />}
              {subscription.status === 'pending' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              <span className="capitalize">{subscription.status}</span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
