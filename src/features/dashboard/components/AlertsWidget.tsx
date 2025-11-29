/**
 * Widget Alertes pour Admin Groupe
 * Affiche les alertes importantes nécessitant une action
 * Avec suppression et historique
 * @module AlertsWidget
 */

import { useState } from 'react';
import { AlertTriangle, Clock, Users, DollarSign, AlertCircle, X, History, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGroupAlerts } from '../hooks/useGroupAlerts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Hook local pour supprimer une alerte (évite problème HMR)
const useLocalDismissAlert = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await (supabase as any)
        .from('system_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
      return alertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-alerts', user?.schoolGroupId] });
      queryClient.invalidateQueries({ queryKey: ['alert-history', user?.schoolGroupId] });
    },
  });
};

// Hook local pour l'historique (évite problème HMR)
const useLocalAlertHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['alert-history', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) return [];
      const { data, error } = await (supabase as any)
        .from('system_alerts')
        .select('id, title, message, severity, resolved_at, created_at')
        .eq('school_group_id', user.schoolGroupId)
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 5 * 60 * 1000,
  });
};

export const AlertsWidget = () => {
  const { data: alerts = [], isLoading } = useGroupAlerts();
  const { data: history = [] } = useLocalAlertHistory();
  const dismissAlert = useLocalDismissAlert();
  const [showHistory, setShowHistory] = useState(false);

  const handleDismiss = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dismissAlert.mutateAsync(alertId);
      toast.success('Alerte supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Mapper l'icône string vers le composant
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'DollarSign': return DollarSign;
      case 'Users': return Users;
      case 'Clock': return Clock;
      case 'AlertCircle': return AlertCircle;
      default: return AlertTriangle;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-[#E63946]/5',
          border: 'border-[#E63946]/20',
          iconBg: 'bg-[#E63946]/10',
          iconColor: 'text-[#E63946]',
          badge: 'bg-[#E63946] text-white',
        };
      case 'warning':
        return {
          bg: 'bg-[#E9C46A]/5',
          border: 'border-[#E9C46A]/20',
          iconBg: 'bg-[#E9C46A]/10',
          iconColor: 'text-[#E9C46A]',
          badge: 'bg-[#E9C46A] text-white',
        };
      case 'info':
        return {
          bg: 'bg-[#1D3557]/5',
          border: 'border-[#1D3557]/20',
          iconBg: 'bg-[#1D3557]/10',
          iconColor: 'text-[#1D3557]',
          badge: 'bg-[#1D3557] text-white',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          badge: 'bg-gray-600 text-white',
        };
    }
  };

  return (
    <>
      <Card className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Alertes</h3>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="h-7 text-xs text-gray-500 hover:text-[#1D3557] gap-1"
              >
                <History className="w-3.5 h-3.5" />
                Historique
              </Button>
            )}
            <Badge className={alerts.length > 0 ? "bg-[#E63946] text-white" : "bg-[#2A9D8F] text-white"}>
              {alerts.length}
            </Badge>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3 flex-1">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-[#2A9D8F]" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Tout va bien !</p>
            <p className="text-xs text-gray-600">Aucune alerte pour le moment</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-2 px-2 max-h-[320px]">
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {alerts.map((alert, index) => {
                  const Icon = getIcon(alert.icon);
                  const style = getAlertStyle(alert.type);

                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${style.bg} ${style.border} hover:shadow-md transition-all group relative`}
                    >
                      {/* Bouton Supprimer */}
                      <button
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200/50 transition-all"
                        title="Supprimer l'alerte"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                      </button>

                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${style.iconBg} flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${style.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-bold text-gray-900 mb-0.5 line-clamp-2">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {alert.description}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 text-xs ${style.iconColor} hover:${style.bg} p-0`}
                            onClick={() => window.location.href = alert.href}
                          >
                            {alert.action} →
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </Card>

      {/* Modal Historique */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#1D3557]" />
              Historique des Alertes
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun historique disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((alert: any) => {
                  const Icon = getIcon(alert.icon || 'AlertCircle');
                  return (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                          <Icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 line-clamp-1">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Résolu le {new Date(alert.resolved_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
