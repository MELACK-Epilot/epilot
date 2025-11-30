/**
 * AlertsWidget - Widget des alertes urgentes
 * Affiche les alertes critiques et avertissements
 * 
 * @module ChefEtablissement/Components
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SchoolAlert, AlertSeverity } from '../../../types/chef-etablissement.types';

interface AlertsWidgetProps {
  readonly alerts: SchoolAlert[];
  readonly onDismiss: (alertId: string) => void;
  readonly onViewAll?: () => void;
  readonly maxAlerts?: number;
}

/**
 * Configuration des styles par sévérité
 */
const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: typeof AlertTriangle;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  badgeClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
    textColor: 'text-red-900',
    iconColor: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-amber-500',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
};

/**
 * Composant alerte individuelle
 */
const AlertItem = memo<{
  alert: SchoolAlert;
  onDismiss: (id: string) => void;
  index: number;
}>(({ alert, onDismiss, index }) => {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={`
        relative p-4 rounded-lg border-l-4 
        ${config.bgColor} ${config.borderColor}
        hover:shadow-md transition-shadow
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${config.textColor}`}>
              {alert.title}
            </h4>
            {alert.count && (
              <Badge className={`text-xs ${config.badgeClass}`}>
                {alert.count}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {alert.message}
          </p>

          {/* Action */}
          {alert.actionLabel && alert.href && (
            <a
              href={alert.href}
              className={`
                inline-flex items-center gap-1 mt-2 text-sm font-medium
                ${config.iconColor} hover:underline
              `}
            >
              {alert.actionLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(alert.id)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Fermer l'alerte"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
});

AlertItem.displayName = 'AlertItem';

/**
 * Widget des alertes
 */
export const AlertsWidget = memo<AlertsWidgetProps>(({
  alerts,
  onDismiss,
  onViewAll,
  maxAlerts = 3,
}) => {
  const displayedAlerts = alerts.slice(0, maxAlerts);
  const hasMoreAlerts = alerts.length > maxAlerts;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  // État vide
  if (alerts.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-green-600">
            <div className="p-2 bg-green-100 rounded-full">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold">Aucune alerte</h4>
              <p className="text-sm text-gray-500">Tout va bien ! 🎉</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertes
            {criticalCount > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs">
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedAlerts.map((alert, index) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={onDismiss}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Voir plus */}
        {hasMoreAlerts && onViewAll && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-[#2A9D8F] hover:text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
            onClick={onViewAll}
          >
            Voir toutes les alertes ({alerts.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

AlertsWidget.displayName = 'AlertsWidget';

export default AlertsWidget;
