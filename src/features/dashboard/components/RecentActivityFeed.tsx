/**
 * Fil d'activité récente pour Admin Groupe
 * Widget dynamique et flexible avec filtres et données réelles
 * @module RecentActivityFeed
 */

import { useState, useMemo } from 'react';
import { 
  School, 
  Users, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  XCircle,
  Info,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useRecentActivity, 
  ActivityType, 
  ActivityStatus,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  PERIOD_OPTIONS 
} from '../hooks/useRecentActivity';

/** Props du composant */
interface RecentActivityFeedProps {
  /** Hauteur maximale du widget */
  maxHeight?: string;
  /** Afficher les filtres */
  showFilters?: boolean;
  /** Limite initiale d'activités */
  initialLimit?: number;
}

export const RecentActivityFeed = ({ 
  maxHeight = '400px',
  showFilters = true,
  initialLimit = 15 
}: RecentActivityFeedProps) => {
  // États des filtres
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState(168); // 7 jours par défaut

  // Hook avec les options dynamiques
  const { 
    data: activities = [], 
    isLoading, 
    refetch,
    isFetching 
  } = useRecentActivity({
    limit: initialLimit,
    hours: selectedPeriod,
    filterType,
    filterStatus,
  });

  // Statistiques des activités
  const stats = useMemo(() => {
    const byType: Record<ActivityType, number> = {
      school: 0,
      user: 0,
      payment: 0,
      alert: 0,
      report: 0,
    };
    const byStatus: Record<ActivityStatus, number> = {
      success: 0,
      warning: 0,
      info: 0,
      error: 0,
    };

    activities.forEach((a) => {
      byType[a.type]++;
      byStatus[a.status]++;
    });

    return { byType, byStatus, total: activities.length };
  }, [activities]);

  // Label de la période sélectionnée
  const periodLabel = PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || 'Période';

  // Mapper le type vers une icône
  const getIcon = (type: ActivityType) => {
    const icons: Record<ActivityType, typeof School> = {
      school: School,
      user: Users,
      payment: DollarSign,
      alert: AlertCircle,
      report: FileText,
    };
    return icons[type] || FileText;
  };

  // Mapper le statut vers une icône
  const getStatusIcon = (status: ActivityStatus) => {
    const icons: Record<ActivityStatus, typeof CheckCircle> = {
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
      error: XCircle,
    };
    return icons[status];
  };

  // Couleurs par statut
  const getStatusColor = (status: ActivityStatus) => {
    const colors: Record<ActivityStatus, string> = {
      success: 'text-[#2A9D8F] bg-[#2A9D8F]/10',
      warning: 'text-[#E9C46A] bg-[#E9C46A]/10',
      info: 'text-[#1D3557] bg-[#1D3557]/10',
      error: 'text-[#E63946] bg-[#E63946]/10',
    };
    return colors[status] || 'text-gray-500 bg-gray-100';
  };

  // Couleurs par type
  const getTypeColor = (type: ActivityType) => {
    const colors: Record<ActivityType, string> = {
      school: 'bg-blue-500',
      user: 'bg-purple-500',
      payment: 'bg-green-500',
      alert: 'bg-orange-500',
      report: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setSelectedPeriod(168);
  };

  const hasActiveFilters = filterType !== 'all' || filterStatus !== 'all' || selectedPeriod !== 168;

  return (
    <Card className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#1D3557]" />
          <h3 className="text-lg font-bold text-gray-900">Activité Récente</h3>
          {isFetching && !isLoading && (
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Badge compteur */}
          <Badge variant="secondary" className="text-xs font-medium">
            {stats.total} activité{stats.total > 1 ? 's' : ''}
          </Badge>
          
          {/* Bouton refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          {/* Filtre Période */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Clock className="w-3 h-3" />
                {periodLabel}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Période</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PERIOD_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSelectedPeriod(option.value)}
                  className={selectedPeriod === option.value ? 'bg-gray-100' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtre Type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-8 text-xs gap-1 ${filterType !== 'all' ? 'border-[#1D3557] text-[#1D3557]' : ''}`}
              >
                <Filter className="w-3 h-3" />
                {filterType === 'all' ? 'Type' : ACTIVITY_TYPE_LABELS[filterType]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Type d'activité</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                Tous les types
              </DropdownMenuItem>
              {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => {
                const Icon = getIcon(type);
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={filterType === type ? 'bg-gray-100' : ''}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {ACTIVITY_TYPE_LABELS[type]}
                    {stats.byType[type] > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {stats.byType[type]}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtre Statut */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-8 text-xs gap-1 ${filterStatus !== 'all' ? 'border-[#1D3557] text-[#1D3557]' : ''}`}
              >
                {filterStatus === 'all' ? 'Statut' : ACTIVITY_STATUS_LABELS[filterStatus]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                Tous les statuts
              </DropdownMenuItem>
              {(Object.keys(ACTIVITY_STATUS_LABELS) as ActivityStatus[]).map((status) => {
                const StatusIcon = getStatusIcon(status);
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={filterStatus === status ? 'bg-gray-100' : ''}
                  >
                    <StatusIcon className={`w-4 h-4 mr-2 ${getStatusColor(status).split(' ')[0]}`} />
                    {ACTIVITY_STATUS_LABELS[status]}
                    {stats.byStatus[status] > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {stats.byStatus[status]}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset filtres */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500 hover:text-gray-700"
              onClick={resetFilters}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      )}

      {/* Contenu */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 p-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 flex-1 flex flex-col items-center justify-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold">Aucune activité récente</p>
          <p className="text-xs mt-1 text-gray-400">
            {hasActiveFilters 
              ? 'Essayez de modifier les filtres' 
              : 'Les actions apparaîtront ici'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={resetFilters}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <div 
          className="space-y-2 flex-1 overflow-auto pr-1" 
          style={{ maxHeight }}
        >
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => {
              const Icon = getIcon(activity.type);
              const StatusIcon = getStatusIcon(activity.status);
              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100"
                >
                  {/* Type indicator */}
                  <div className="relative">
                    <div className={`p-2 rounded-lg ${getStatusColor(activity.status)} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {/* Type dot */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${getTypeColor(activity.type)} border-2 border-white`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {activity.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(activity.status)}`}
                      >
                        {ACTIVITY_STATUS_LABELS[activity.status]}
                      </Badge>
                    </div>
                  </div>

                  {/* Status icon */}
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${getStatusColor(activity.status).split(' ')[0]}`} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer avec mini-stats */}
      {!isLoading && activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Mini stats bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {stats.byStatus.success > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                  <span className="text-xs text-gray-600">{stats.byStatus.success}</span>
                </div>
              )}
              {stats.byStatus.warning > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#E9C46A]" />
                  <span className="text-xs text-gray-600">{stats.byStatus.warning}</span>
                </div>
              )}
              {stats.byStatus.error > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#E63946]" />
                  <span className="text-xs text-gray-600">{stats.byStatus.error}</span>
                </div>
              )}
              {stats.byStatus.info > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#1D3557]" />
                  <span className="text-xs text-gray-600">{stats.byStatus.info}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">{periodLabel}</span>
          </div>
          
          {/* Voir plus button */}
          <button className="w-full py-2 text-sm font-medium text-[#2A9D8F] hover:text-[#238276] hover:bg-[#2A9D8F]/5 rounded-lg transition-colors">
            Voir toute l'activité
          </button>
        </div>
      )}
    </Card>
  );
};
