/**
 * Alertes pour les paiements (en retard, en attente, échoués)
 * @module PaymentAlerts
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentAlert {
  type: 'overdue' | 'pending' | 'failed';
  count: number;
  amount: number;
}

interface PaymentAlertsProps {
  alerts: PaymentAlert[];
  onViewDetails?: (type: string) => void;
}

export const PaymentAlerts = ({ alerts, onViewDetails }: PaymentAlertsProps) => {
  if (!alerts || alerts.length === 0) return null;

  const getAlertConfig = (type: string) => {
    const configs = {
      overdue: {
        icon: AlertTriangle,
        title: 'Paiements en retard',
        color: 'border-red-200 bg-red-50',
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-700',
      },
      pending: {
        icon: Clock,
        title: 'Paiements en attente',
        color: 'border-yellow-200 bg-yellow-50',
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-100 text-yellow-700',
      },
      failed: {
        icon: XCircle,
        title: 'Paiements échoués',
        color: 'border-orange-200 bg-orange-50',
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-100 text-orange-700',
      },
    };
    return configs[type as keyof typeof configs];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {alerts.map((alert, index) => {
        const config = getAlertConfig(alert.type);
        const Icon = config.icon;

        return (
          <motion.div
            key={alert.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Alert className={config.color}>
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
              <AlertTitle className="flex items-center justify-between">
                <span>{config.title}</span>
                <Badge className={config.badgeColor}>{alert.count}</Badge>
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {alert.amount.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-600">Montant total</p>
                  </div>
                  {onViewDetails && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(alert.type)}
                      className="h-8"
                    >
                      Voir détails
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      })}
    </div>
  );
};
