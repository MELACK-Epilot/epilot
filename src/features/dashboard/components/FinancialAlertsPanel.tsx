/**
 * Panneau d'alertes financières
 * Affiche les alertes critiques, warnings et infos
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinancialAlerts, useMarkAlertAsRead, useResolveAlert } from '../hooks/useFinancialAlerts';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface FinancialAlertsPanelProps {
  schoolId?: string;
  showResolved?: boolean;
}

export const FinancialAlertsPanel = ({ schoolId, showResolved = false }: FinancialAlertsPanelProps) => {
  const { data: alerts, isLoading } = useFinancialAlerts({ resolved: showResolved, schoolId });
  const markAsRead = useMarkAlertAsRead();
  const resolveAlert = useResolveAlert();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getAlertTextColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-900';
      case 'warning':
        return 'text-orange-900';
      default:
        return 'text-blue-900';
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync({ alertId, notes: resolutionNotes });
      setResolvingId(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Erreur résolution alerte:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Aucune alerte active</h3>
            <p className="text-sm text-green-700">Tout va bien ! 🎉</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Alertes Financières ({alerts.length})
        </h3>
        <div className="flex gap-2">
          <Badge variant="destructive" className="gap-1">
            {alerts.filter(a => a.alertType === 'critical').length} Critiques
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {alerts.filter(a => a.alertType === 'warning').length} Warnings
          </Badge>
        </div>
      </div>

      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`p-4 ${getAlertColor(alert.alertType)}`}>
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.alertType)}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`font-semibold ${getAlertTextColor(alert.alertType)}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mt-1 ${getAlertTextColor(alert.alertType)}`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!alert.isResolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResolvingId(alert.id)}
                        className="shrink-0"
                      >
                        Résoudre
                      </Button>
                    )}
                  </div>

                  {/* Formulaire de résolution */}
                  {resolvingId === alert.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-3"
                    >
                      <Textarea
                        placeholder="Notes de résolution (optionnel)..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows={3}
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolveAlert.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {resolveAlert.isPending ? 'Résolution...' : 'Confirmer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResolvingId(null);
                            setResolutionNotes('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
