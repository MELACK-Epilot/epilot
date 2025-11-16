/**
 * Page Journal d'Activité - VERSION RÉELLE CONNECTÉE À SUPABASE
 * Pour Proviseur/Directeur - Traçabilité complète des actions
 */

import { memo, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  Key,
  DollarSign,
  Upload,
  BarChart3,
} from 'lucide-react';
import { useActivityLogs, type ActivityLogFilters } from '@/features/dashboard/hooks/useActivityLogs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration des couleurs par action
const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  create: { icon: Plus, color: 'bg-green-100 text-green-800 border-green-200', label: 'Création' },
  update: { icon: Edit, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Modification' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-800 border-red-200', label: 'Suppression' },
  view: { icon: Eye, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Consultation' },
  export: { icon: Download, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Export' },
  login: { icon: LogIn, color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Connexion' },
  logout: { icon: LogOut, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Déconnexion' },
  password_change: { icon: Key, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Mot de passe' },
  payment: { icon: DollarSign, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Paiement' },
  upload: { icon: Upload, color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Upload' },
  report: { icon: BarChart3, color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Rapport' },
};

// Composant de chargement
const ActivityLogsLoading = memo(() => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="p-6">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
        </div>
      </Card>
    ))}
  </div>
));

// Composant de ligne de log
const ActivityLogItem = memo(({ log }: { log: any }) => {
  const actionConfig = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
  const ActionIcon = actionConfig.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#2A9D8F] hover:border-l-[#238b7e]">
      <div className="flex items-start gap-4">
        {/* Avatar et icône d'action */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center ring-2 ring-gray-100">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2A9D8F] rounded-full border-2 border-white flex items-center justify-center shadow-md">
            <ActionIcon className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-900 text-lg">
                  {log.userName}
                </h3>
                <Badge variant="outline" className="text-xs font-medium">
                  {log.userRole}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge className={actionConfig.color}>
                  {actionConfig.label}
                </Badge>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm font-medium text-gray-700">{log.entity}</span>
              </div>
            </div>
          </div>

          {/* Détails */}
          {log.details && (
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {log.details}
            </p>
          )}

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{format(new Date(log.timestamp), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
            </div>
            {log.ipAddress && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{log.ipAddress}</span>
              </div>
            )}
            {log.entityId && (
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">ID: {log.entityId.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

ActivityLogItem.displayName = 'ActivityLogItem';

// Composant principal
export const ActivityLogsPageReal = memo(() => {
  const { data: user } = useCurrentUser();
  const [filters, setFilters] = useState<ActivityLogFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs, isLoading, error, refetch } = useActivityLogs(filters);

  // Statistiques calculées
  const stats = {
    total: logs?.length || 0,
    today: logs?.filter(log => {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length || 0,
    thisWeek: logs?.filter(log => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(log.timestamp) > weekAgo;
    }).length || 0,
    byAction: logs?.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  // Filtrage local par recherche
  const filteredLogs = logs?.filter(log =>
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Rôle', 'Action', 'Entité', 'Détails', 'IP'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr }),
      log.userName,
      log.userRole,
      log.action,
      log.entity,
      log.details || '',
      log.ipAddress || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-activite-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-xl mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-6">Impossible de charger les logs d'activité</p>
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Journal d'Activité</h1>
                <p className="text-gray-600 mt-1">Traçabilité complète des actions de votre école</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportCSV}
                disabled={!filteredLogs.length}
                className="gap-2 hover:bg-[#2A9D8F] hover:text-white hover:border-[#2A9D8F] transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2 hover:bg-[#2A9D8F] hover:text-white hover:border-[#2A9D8F] transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Actions</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Aujourd'hui</p>
                <p className="text-3xl font-bold text-green-900">{stats.today}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Cette Semaine</p>
                <p className="text-3xl font-bold text-purple-900">{stats.thisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold text-orange-900">
                  {new Set(logs?.map(l => l.userId)).size || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par utilisateur, action ou détails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par action */}
            <Select
              value={filters.action || 'all'}
              onValueChange={(value) => setFilters({ ...filters, action: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="create">Création</SelectItem>
                <SelectItem value="update">Modification</SelectItem>
                <SelectItem value="delete">Suppression</SelectItem>
                <SelectItem value="view">Consultation</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre par entité */}
            <Select
              value={filters.entity || 'all'}
              onValueChange={(value) => setFilters({ ...filters, entity: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les entités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entités</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="student">Élève</SelectItem>
                <SelectItem value="class">Classe</SelectItem>
                <SelectItem value="grade">Note</SelectItem>
                <SelectItem value="payment">Paiement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bouton réinitialiser */}
          {(searchQuery || filters.action || filters.entity) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({});
                }}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </Card>

        {/* Liste des logs */}
        {isLoading ? (
          <ActivityLogsLoading />
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <ActivityLogItem key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Activity className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-xl mb-2">Aucune activité trouvée</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filters.action || filters.entity
                  ? "Aucune activité ne correspond aux critères de recherche"
                  : "Aucune activité enregistrée pour le moment"
                }
              </p>
              {(searchQuery || filters.action || filters.entity) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({});
                  }}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Effacer les filtres
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
});

ActivityLogsPageReal.displayName = 'ActivityLogsPageReal';
