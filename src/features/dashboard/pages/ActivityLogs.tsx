/**
 * Page Journal d'Activité - Suivi des actions utilisateurs
 * @module ActivityLogs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Search,
  Filter,
  Download,
  User,
  Edit,
  Trash2,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

export const ActivityLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  // Données mockées
  const stats = [
    { label: 'Actions aujourd\'hui', value: '234', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Utilisateurs actifs', value: '45', icon: User, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Modifications', value: '89', icon: Edit, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Suppressions', value: '12', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const activities = [
    {
      id: 1,
      user: 'Jean Dupont',
      action: 'Création',
      entity: 'Groupe Scolaire',
      entityName: 'Groupe Excellence',
      timestamp: '2025-10-29T10:30:00',
      status: 'success',
      ip: '192.168.1.100',
    },
    {
      id: 2,
      user: 'Marie Martin',
      action: 'Modification',
      entity: 'Utilisateur',
      entityName: 'Pierre Dubois',
      timestamp: '2025-10-29T10:25:00',
      status: 'success',
      ip: '192.168.1.101',
    },
    {
      id: 3,
      user: 'Admin Système',
      action: 'Suppression',
      entity: 'Abonnement',
      entityName: 'Plan Premium #123',
      timestamp: '2025-10-29T10:20:00',
      status: 'warning',
      ip: '192.168.1.1',
    },
    {
      id: 4,
      user: 'Sophie Laurent',
      action: 'Consultation',
      entity: 'Rapport',
      entityName: 'Rapport Financier Oct 2025',
      timestamp: '2025-10-29T10:15:00',
      status: 'info',
      ip: '192.168.1.102',
    },
    {
      id: 5,
      user: 'Système',
      action: 'Erreur',
      entity: 'Paiement',
      entityName: 'Transaction #456',
      timestamp: '2025-10-29T10:10:00',
      status: 'error',
      ip: 'System',
    },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Création':
        return <Plus className="h-4 w-4" />;
      case 'Modification':
        return <Edit className="h-4 w-4" />;
      case 'Suppression':
        return <Trash2 className="h-4 w-4" />;
      case 'Consultation':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: { label: 'Succès', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      warning: { label: 'Attention', variant: 'secondary' as const, icon: AlertCircle, color: 'text-orange-600' },
      error: { label: 'Erreur', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      info: { label: 'Info', variant: 'outline' as const, icon: Info, color: 'text-blue-600' },
    };
    const config = variants[status as keyof typeof variants] || variants.info;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const colors = {
      'Création': 'bg-green-100 text-green-800',
      'Modification': 'bg-blue-100 text-blue-800',
      'Suppression': 'bg-red-100 text-red-800',
      'Consultation': 'bg-purple-100 text-purple-800',
      'Erreur': 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={`${colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
        {getActionIcon(action)}
        {action}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-[#1D3557]" />
            Journal d'Activité
          </h1>
          <p className="text-gray-500 mt-1">Suivez toutes les actions effectuées sur la plateforme</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtres et Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités récentes</CardTitle>
              <CardDescription>Historique des actions en temps réel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une activité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="creation">Créations</SelectItem>
                <SelectItem value="modification">Modifications</SelectItem>
                <SelectItem value="suppression">Suppressions</SelectItem>
                <SelectItem value="consultation">Consultations</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Plus de filtres
            </Button>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Ligne verticale */}
                {index < activities.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}
                
                <div className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white shadow-lg">
                      {getActionIcon(activity.action)}
                    </div>
                  </div>

                  {/* Content */}
                  <Card className="flex-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getActionBadge(activity.action)}
                            {getStatusBadge(activity.status)}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {activity.user} • {activity.entity}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{activity.entityName}</span>
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(activity.timestamp)}
                              </span>
                              <span>IP: {activity.ip}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;
