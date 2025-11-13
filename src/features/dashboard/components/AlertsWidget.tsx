/**
 * Widget Alertes pour Admin Groupe
 * Affiche les alertes importantes nécessitant une action
 * @module AlertsWidget
 */

import { AlertTriangle, Clock, Users, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGroupAlerts } from '../hooks/useGroupAlerts';

export const AlertsWidget = () => {
  const { data: alerts = [], isLoading } = useGroupAlerts();

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

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Alertes</h3>
          <Badge className="bg-[#2A9D8F] text-white">0</Badge>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-8 h-8 text-[#2A9D8F]" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Tout va bien !</p>
          <p className="text-xs text-gray-600">Aucune alerte pour le moment</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Alertes</h3>
        <Badge className="bg-[#E63946] text-white">{alerts.length}</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
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
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const Icon = getIcon(alert.icon);
            const style = getAlertStyle(alert.type);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${style.bg} ${style.border} hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${style.iconBg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${style.iconColor}`} />
                  </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 mb-0.5">
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {alert.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs ${style.iconColor} hover:${style.bg}`}
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
      )}
    </Card>
  );
};
