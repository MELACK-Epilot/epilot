/**
 * Composant Dropdown des notifications/alertes
 * Affiche les alertes système avec actions
 * @module NotificationsDropdown
 */

import { BellDot, AlertCircle, CheckCircle2, Info, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUnreadAlerts, useUnreadAlertsCount, useMarkAlertAsRead, useMarkAllAlertsAsRead } from '../hooks/useSystemAlerts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const NotificationsDropdown = () => {
  const { data: alerts = [] } = useUnreadAlerts();
  const { data: count = 0 } = useUnreadAlertsCount();
  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();

  // Fonction pour obtenir l'icône selon la sévérité
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-[#E63946]" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-[#E9C46A]" />;
      case 'medium':
        return <Info className="w-5 h-5 text-[#1D3557]" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-[#2A9D8F]" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  // Fonction pour obtenir la couleur du badge
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20';
      case 'high':
        return 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20';
      case 'medium':
        return 'bg-[#1D3557]/10 text-[#1D3557] border-[#1D3557]/20';
      case 'low':
        return 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead.mutateAsync(alertId);
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 transition-colors"
          title="Notifications"
          aria-label={`${count} notification${count > 1 ? 's' : ''} non lue${count > 1 ? 's' : ''}`}
        >
          <BellDot className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#E63946] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-base font-semibold">Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-[#2A9D8F] hover:text-[#1D8A7E]"
            >
              <Check className="w-3 h-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 text-center">
                Aucune notification
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Vous êtes à jour ! 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {alert.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge className={`${getSeverityColor(alert.severity)} border text-xs`}>
                          {alert.type}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {format(new Date(alert.created_at), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      </div>
                      {alert.action_url && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs text-[#2A9D8F] hover:text-[#1D8A7E] p-0 h-auto mt-2"
                        >
                          Voir les détails →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="outline" className="w-full text-sm" size="sm">
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
