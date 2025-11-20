/**
 * Widget des alertes système critiques - DONNÉES RÉELLES
 * @module SystemAlertsWidget
 */

import { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, Search, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSystemAlerts, useMarkAlertAsRead, useResolveAlert } from '../../hooks/useSystemAlerts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SystemAlertsWidget = () => {
  const navigate = useNavigate();
  const { data: alertsData = [], isLoading, refetch } = useSystemAlerts({ isRead: false });
  const markAsRead = useMarkAlertAsRead();
  const resolveAlert = useResolveAlert();
  
  const [filter, setFilter] = useState<'all' | 'critical' | 'error' | 'warning'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  const ALERTS_LIMIT = 5;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead.mutateAsync(id);
      toast.success('Alerte marquée comme lue');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const handleMarkAsHandled = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await resolveAlert.mutateAsync(id);
      toast.success('Alerte résolue');
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  const handleAlertClick = (alert: any) => {
    if (alert.action_url) {
      navigate(alert.action_url);
    }
  };

  // Filtrer les alertes
  const filteredAlerts = (alertsData as any[])
    .filter(a => filter === 'all' || a.severity === filter)
    .filter(a => 
      searchTerm === '' || 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  // Pagination: limiter à 5 alertes par défaut
  const activeAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, ALERTS_LIMIT);
  const hasMore = filteredAlerts.length > ALERTS_LIMIT;
  const criticalCount = (alertsData as any[]).filter(a => a.severity === 'critical').length;
  const errorCount = (alertsData as any[]).filter(a => a.severity === 'error').length;
  const warningCount = (alertsData as any[]).filter(a => a.severity === 'warning').length;
  
  const handleRefresh = () => {
    refetch();
    toast.info('Actualisation des alertes...');
  };

  return (
    <div className="group relative bg-white rounded border border-gray-200 p-4 hover:border-[#E63946]/30 hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E63946]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1D3557] flex items-center gap-2">
          <div className="p-1.5 bg-[#E63946]/10 rounded group-hover:scale-110 group-hover:bg-[#E63946]/20 transition-all duration-300">
            <AlertTriangle className="h-3.5 w-3.5 text-[#E63946] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          Alertes Système
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {activeAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-[#E63946] text-white text-xs font-medium rounded-full animate-pulse">
              {activeAlerts.length}
            </span>
          )}
        </div>
      </div>
      
      {/* Barre de recherche et filtres */}
      {alertsData.length > 0 && (
        <div className="relative mb-3 space-y-2">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946]"
            />
          </div>
          
          {/* Filtres par sévérité */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filter === 'all' ? 'bg-[#1D3557] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes ({alertsData.length})
            </button>
            {criticalCount > 0 && (
              <button
                onClick={() => setFilter('critical')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  filter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Critiques ({criticalCount})
              </button>
            )}
            {errorCount > 0 && (
              <button
                onClick={() => setFilter('error')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  filter === 'error' ? 'bg-[#E63946] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Erreurs ({errorCount})
              </button>
            )}
            {warningCount > 0 && (
              <button
                onClick={() => setFilter('warning')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  filter === 'warning' ? 'bg-[#E9C46A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Avertissements ({warningCount})
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="relative text-center py-6">
          <RefreshCw className="h-6 w-6 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Chargement...</p>
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="relative text-center py-6">
          <div className="inline-flex p-2 bg-[#2A9D8F]/10 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300">
            <CheckCircle2 className="h-6 w-6 text-[#2A9D8F] group-hover:rotate-12 transition-transform duration-500" />
          </div>
          <p className="text-xs text-gray-500">Aucune alerte</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-3 rounded border-l-2 transition-all hover:shadow-md ${
                alert.action_url ? 'cursor-pointer' : ''
              } ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border-red-600'
                  : alert.severity === 'error'
                  ? 'bg-red-50 border-red-500'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-xs font-medium text-gray-900">{alert.title}</h4>
                    
                    {alert.category && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {alert.category}
                      </span>
                    )}
                    
                    {alert.severity === 'critical' && (
                      <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase">
                        Critique
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                  
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {alert.entity_name && (
                      <p className="text-[10px] text-gray-500">
                        {alert.entity_type}: {alert.entity_name}
                      </p>
                    )}
                    
                    {alert.created_at && (
                      <p className="text-[10px] text-gray-400">
                        {formatDistanceToNow(new Date(alert.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </p>
                    )}
                  </div>
                  
                  {alert.action_required && alert.action_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-6 text-[10px] px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(alert.action_url);
                      }}
                    >
                      {alert.action_label || 'Voir détails'}
                      <ExternalLink className="h-2.5 w-2.5 ml-1" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-1 flex-shrink-0">
                  {!alert.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(alert.id, e)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Marquer comme lu"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => handleMarkAsHandled(alert.id, e)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Résoudre et supprimer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Bouton "Voir plus" / "Voir moins" */}
          {hasMore && !showAll && (
            <div className="mt-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#E63946] hover:text-[#E63946] hover:bg-[#E63946]/10"
                onClick={() => setShowAll(true)}
              >
                Voir {filteredAlerts.length - ALERTS_LIMIT} alerte(s) de plus
              </Button>
            </div>
          )}
          
          {showAll && filteredAlerts.length > ALERTS_LIMIT && (
            <div className="mt-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-gray-600 hover:bg-gray-100"
                onClick={() => setShowAll(false)}
              >
                Voir moins
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemAlertsWidget;
