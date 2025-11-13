/**
 * Page Journal d'Activité - Traçabilité complète pour Direction
 * Système d'audit moderne avec React 19
 */

import { memo, Suspense, useEffect, startTransition, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  MapPin,
} from 'lucide-react';
import { useActivityLogs, type ActivityLog } from '../hooks/useActivityLogs';

// Configuration des couleurs par sévérité
const SEVERITY_CONFIG = {
  critical: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: AlertTriangle, 
    label: 'Critique',
    dotColor: 'bg-red-500'
  },
  high: { 
    color: 'bg-orange-100 text-orange-800 border-orange-200', 
    icon: Shield, 
    label: 'Élevée',
    dotColor: 'bg-orange-500'
  },
  medium: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Eye, 
    label: 'Moyenne',
    dotColor: 'bg-yellow-500'
  },
  low: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: Clock, 
    label: 'Faible',
    dotColor: 'bg-green-500'
  },
} as const;

// Configuration des actions
const ACTION_LABELS = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  view: 'Consultation',
  export: 'Export',
  login: 'Connexion',
  logout: 'Déconnexion',
  password_change: 'Changement mot de passe',
  permission_change: 'Modification permissions',
  grade_entry: 'Saisie note',
  grade_modification: 'Modification note',
  payment_received: 'Paiement reçu',
  document_upload: 'Upload document',
  report_generated: 'Rapport généré',
  backup_created: 'Sauvegarde créée',
} as const;

// Composant de chargement
const ActivityLogsLoading = memo(() => (
  <div className="space-y-4">
    {[...Array(8)].map((_, i) => (
      <Card key={i} className="p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
      </Card>
    ))}
  </div>
));

// Composant de ligne de log
const ActivityLogItem = memo(({ log }: { log: ActivityLog }) => {
  const severity = SEVERITY_CONFIG[log.severity];
  const SeverityIcon = severity.icon;

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 border-l-4" 
          style={{ borderLeftColor: severity.dotColor.replace('bg-', '').replace('-500', '') === 'red' ? '#ef4444' : 
                                     severity.dotColor.replace('bg-', '').replace('-500', '') === 'orange' ? '#f97316' :
                                     severity.dotColor.replace('bg-', '').replace('-500', '') === 'yellow' ? '#eab308' : '#22c55e' }}>
      <div className="flex items-start gap-4">
        {/* Avatar et indicateur de sévérité */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${severity.dotColor} rounded-full border-2 border-white flex items-center justify-center`}>
            <SeverityIcon className="h-2.5 w-2.5 text-white" />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {log.userName}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {log.userRole}
                </Badge>
                <Badge className={severity.color}>
                  {ACTION_LABELS[log.action] || log.action}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{log.target}</span>
              </p>
              
              <p className="text-sm text-gray-500 mb-3">
                {log.details}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {log.timestamp.toLocaleString('fr-FR')}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {log.ipAddress || 'N/A'}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {log.module}
                </Badge>
              </div>
            </div>

            {/* Sévérité */}
            <Badge className={severity.color}>
              {severity.label}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
});

// Composant principal
export const ActivityLogsPage = memo(() => {
  const {
    logs,
    isLoading,
    error,
    filters,
    stats,
    loadLogs,
    updateFilters,
    resetFilters,
    exportLogs,
  } = useActivityLogs();

  const [searchTerm, setSearchTerm] = useState('');

  // Chargement initial
  useEffect(() => {
    startTransition(() => {
      loadLogs();
    });
  }, [loadLogs]);

  // Filtrage par recherche
  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    startTransition(() => {
      loadLogs();
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journal d'Activité</h1>
            <p className="text-gray-600">Traçabilité complète des actions utilisateurs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportLogs('csv')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.todayCount}</div>
          <div className="text-sm text-gray-600">Aujourd'hui</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.bySeverity.critical}</div>
          <div className="text-sm text-gray-600">Critiques</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.bySeverity.high}</div>
          <div className="text-sm text-gray-600">Élevées</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.bySeverity.medium}</div>
          <div className="text-sm text-gray-600">Moyennes</div>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par utilisateur, cible ou détails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtres rapides */}
          <div className="flex items-center gap-2">
            <Button
              variant={filters.severity === 'critical' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ 
                severity: filters.severity === 'critical' ? null : 'critical' 
              })}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Critiques
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des logs */}
      <Suspense fallback={<ActivityLogsLoading />}>
        {isLoading ? (
          <ActivityLogsLoading />
        ) : (
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <ActivityLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </Suspense>

      {/* État vide */}
      {!isLoading && filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Aucune activité trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(f => f !== null)
              ? "Aucune activité ne correspond aux critères de recherche"
              : "Aucune activité enregistrée pour le moment"
            }
          </p>
          {(searchTerm || Object.values(filters).some(f => f !== null)) && (
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              resetFilters();
            }}>
              Effacer les filtres
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

ActivityLogsPage.displayName = 'ActivityLogsPage';
