/**
 * Widget Alertes Super Admin - UNIQUEMENT alertes plateforme
 * Alertes pertinentes pour le Super Admin E-Pilot
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, TrendingDown, CreditCard, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSuperAdminAlerts, type SuperAdminAlert } from '../../hooks/useSuperAdminAlerts';

const SuperAdminAlertsWidget = () => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Récupérer les alertes Super Admin depuis le hook
  const { data: alerts = [], isLoading, refetch } = useSuperAdminAlerts();

  // Filtrer les alertes masquées
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const ALERTS_LIMIT = 5;
  const displayedAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, ALERTS_LIMIT);
  const hasMore = visibleAlerts.length > ALERTS_LIMIT;

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  const handleRefresh = () => {
    refetch();
    toast.info('Actualisation des alertes...');
  };

  const handleDismissAlert = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => new Set(prev).add(alertId));
    toast.success('Alerte masquée');
  };

  const getAlertIcon = (type: SuperAdminAlert['type']) => {
    switch (type) {
      case 'subscription_expiring':
        return <CreditCard className="h-4 w-4" />;
      case 'payment_failed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low_adoption':
        return <TrendingDown className="h-4 w-4" />;
      case 'inactive_group':
        return <Users className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          Alertes Plateforme
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium mb-1">Critiques</p>
            <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium mb-1">Avertissements</p>
            <p className="text-2xl font-bold text-yellow-700">{warningCount}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-700">{alerts.length}</p>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Chargement des alertes...</p>
        </div>
      ) : displayedAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex p-3 bg-green-50 rounded-full mb-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">Aucune alerte</p>
          <p className="text-xs text-gray-500 mt-1">Tout fonctionne normalement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border-red-600'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
              onClick={() => alert.action_url && navigate(alert.action_url)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                    {alert.severity === 'critical' && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {alert.entity_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {alert.entity_name}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(alert.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                  
                  {alert.action_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(alert.action_url!);
                      }}
                    >
                      Voir les détails
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Bouton Masquer */}
                <button
                  onClick={(e) => handleDismissAlert(alert.id, e)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                  title="Masquer cette alerte"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {/* Bouton Voir plus/moins */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-sm"
              >
                {showAll 
                  ? 'Voir moins' 
                  : `Voir ${alerts.length - ALERTS_LIMIT} alerte${alerts.length - ALERTS_LIMIT > 1 ? 's' : ''} de plus`
                }
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminAlertsWidget;
