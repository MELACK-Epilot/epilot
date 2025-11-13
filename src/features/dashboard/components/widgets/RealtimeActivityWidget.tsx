/**
 * Widget flux d'activité temps réel - VERSION CONNECTÉE
 * @module RealtimeActivityWidget
 */

import { useState } from 'react';
import { Activity, LogIn, Building2, CreditCard, UserPlus, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeActivity } from '../../hooks/useRealtimeActivity';
import type { RealtimeActivity } from '../../types/widget.types';

const RealtimeActivityWidget = () => {
  const { data: activities = [], isLoading, refetch } = useRealtimeActivity();
  const [filter, setFilter] = useState<'all' | 'login' | 'school_added' | 'subscription_updated' | 'user_created'>('all');
  
  // Export CSV
  const handleExport = () => {
    if (!activities || activities.length === 0) return;
    
    const csv = [
      ['Date', 'Heure', 'Type', 'Utilisateur', 'Action'].join(','),
      ...activities.map(a => {
        const date = new Date(a.timestamp);
        return [
          date.toLocaleDateString('fr-FR'),
          date.toLocaleTimeString('fr-FR'),
          a.type,
          `"${a.user}"`,
          `"${a.action}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activites-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtrer les activités
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  // Compter par type
  const activityCounts = {
    login: activities.filter(a => a.type === 'login').length,
    school_added: activities.filter(a => a.type === 'school_added').length,
    subscription_updated: activities.filter(a => a.type === 'subscription_updated').length,
    user_created: activities.filter(a => a.type === 'user_created').length,
  };

  // Icônes par type
  const getIcon = (type: RealtimeActivity['type']) => {
    switch (type) {
      case 'login': return LogIn;
      case 'school_added': return Building2;
      case 'subscription_updated': return CreditCard;
      case 'user_created': return UserPlus;
      default: return Activity;
    }
  };

  // Couleurs par type
  const getColor = (type: RealtimeActivity['type']) => {
    switch (type) {
      case 'login': return 'text-blue-600 bg-blue-50';
      case 'school_added': return 'text-[#2A9D8F] bg-[#2A9D8F]/10';
      case 'subscription_updated': return 'text-[#E9C46A] bg-[#E9C46A]/10';
      case 'user_created': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Format temps relatif
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `Il y a ${seconds}s`;
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded border border-gray-200 p-4 hover:border-[#1D3557]/30 hover:shadow-md transition-all duration-300">
      {/* Gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D3557]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1D3557] flex items-center gap-2">
          <div className="p-1.5 bg-[#1D3557]/10 rounded group-hover:scale-110 transition-all duration-300">
            <Activity className="h-3.5 w-3.5 text-[#1D3557]" />
          </div>
          Flux d'Activité
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleExport}
            disabled={!activities || activities.length === 0}
            title="Exporter en CSV"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#2A9D8F]/10 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F] animate-pulse" />
            <span className="text-xs font-medium text-[#2A9D8F]">Live</span>
          </div>
        </div>
      </div>
      
      {/* Filtres par type */}
      <div className="relative flex items-center gap-2 mb-3 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            filter === 'all' ? 'bg-[#1D3557] text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Toutes ({activities.length})
        </button>
        <button
          onClick={() => setFilter('login')}
          className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            filter === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Connexions ({activityCounts.login})
        </button>
        <button
          onClick={() => setFilter('school_added')}
          className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            filter === 'school_added' ? 'bg-[#2A9D8F] text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span className="hidden sm:inline">Groupes Scolaires</span>
          <span className="sm:hidden">Groupes</span>
          {' '}({activityCounts.school_added})
        </button>
        <button
          onClick={() => setFilter('subscription_updated')}
          className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            filter === 'subscription_updated' ? 'bg-[#E9C46A] text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Abonnements ({activityCounts.subscription_updated})
        </button>
        <button
          onClick={() => setFilter('user_created')}
          className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            filter === 'user_created' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Utilisateurs ({activityCounts.user_created})
        </button>
      </div>

      {/* Liste des activités */}
      <div className="relative space-y-2 max-h-64 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Aucune activité récente</p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const Icon = getIcon(activity.type);
            const colorClass = getColor(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 hover:translate-x-1 transition-all duration-200"
              >
                <div className={`p-1.5 rounded ${colorClass} flex-shrink-0`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RealtimeActivityWidget;
