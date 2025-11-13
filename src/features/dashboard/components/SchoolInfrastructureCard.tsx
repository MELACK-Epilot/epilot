/**
 * Card Infrastructure École - Informations sur les installations
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Users, 
  BookOpen, 
  Wifi, 
  Zap, 
  Droplets,
  Car,
  Utensils,
  Heart,
  Shield,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface InfrastructureItem {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'service' | 'sport' | 'other';
  capacity?: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'maintenance';
  equipment?: string[];
  lastMaintenance?: string;
}

interface SchoolInfrastructureCardProps {
  schoolId: string;
  schoolName: string;
}

export const SchoolInfrastructureCard = ({ schoolId, schoolName }: SchoolInfrastructureCardProps) => {
  // Données de démonstration réalistes
  const infrastructureData: InfrastructureItem[] = [
    {
      id: '1',
      name: 'Salle de classe 6ème A',
      type: 'classroom',
      capacity: 35,
      status: 'excellent',
      equipment: ['Tableau interactif', 'Projecteur', 'Climatisation'],
      lastMaintenance: '2024-10-15',
    },
    {
      id: '2',
      name: 'Laboratoire de Sciences',
      type: 'lab',
      capacity: 20,
      status: 'good',
      equipment: ['Microscopes', 'Matériel chimie', 'Hotte aspirante'],
      lastMaintenance: '2024-09-20',
    },
    {
      id: '3',
      name: 'Salle informatique',
      type: 'lab',
      capacity: 25,
      status: 'fair',
      equipment: ['20 ordinateurs', 'Réseau WiFi', 'Imprimante'],
      lastMaintenance: '2024-08-10',
    },
    {
      id: '4',
      name: 'Bureau Direction',
      type: 'office',
      capacity: 5,
      status: 'excellent',
      equipment: ['Mobilier bureau', 'Climatisation', 'Coffre-fort'],
      lastMaintenance: '2024-11-01',
    },
    {
      id: '5',
      name: 'Cantine scolaire',
      type: 'service',
      capacity: 150,
      status: 'good',
      equipment: ['Cuisine équipée', 'Tables', 'Réfrigérateurs'],
      lastMaintenance: '2024-10-05',
    },
    {
      id: '6',
      name: 'Infirmerie',
      type: 'service',
      capacity: 3,
      status: 'excellent',
      equipment: ['Lit médical', 'Armoire pharmacie', 'Matériel premiers secours'],
      lastMaintenance: '2024-10-20',
    },
    {
      id: '7',
      name: 'Terrain de sport',
      type: 'sport',
      capacity: 50,
      status: 'maintenance',
      equipment: ['Buts football', 'Paniers basket', 'Piste course'],
      lastMaintenance: '2024-07-15',
    },
    {
      id: '8',
      name: 'Bibliothèque',
      type: 'other',
      capacity: 40,
      status: 'good',
      equipment: ['1200 livres', 'Tables lecture', 'Étagères'],
      lastMaintenance: '2024-09-30',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'classroom': return BookOpen;
      case 'lab': return Zap;
      case 'office': return Building2;
      case 'service': return Utensils;
      case 'sport': return Users;
      default: return Building2;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'classroom': return 'Salle de classe';
      case 'lab': return 'Laboratoire';
      case 'office': return 'Bureau';
      case 'service': return 'Service';
      case 'sport': return 'Sport';
      default: return 'Autre';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'fair': return AlertTriangle;
      case 'poor': return XCircle;
      case 'maintenance': return Wrench;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'fair': return 'Correct';
      case 'poor': return 'Mauvais';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  // Statistiques
  const stats = {
    total: infrastructureData.length,
    classrooms: infrastructureData.filter(i => i.type === 'classroom').length,
    labs: infrastructureData.filter(i => i.type === 'lab').length,
    services: infrastructureData.filter(i => i.type === 'service').length,
    totalCapacity: infrastructureData.reduce((sum, i) => sum + (i.capacity || 0), 0),
    excellent: infrastructureData.filter(i => i.status === 'excellent').length,
    good: infrastructureData.filter(i => i.status === 'good').length,
    needsMaintenance: infrastructureData.filter(i => ['fair', 'poor', 'maintenance'].includes(i.status)).length,
  };

  const overallHealthScore = Math.round(
    ((stats.excellent * 100 + stats.good * 80 + (stats.total - stats.excellent - stats.good - stats.needsMaintenance) * 60) / stats.total)
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Infrastructure</h3>
              <p className="text-sm text-gray-500">{schoolName}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </Button>
        </div>

        {/* Score global */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">État général</span>
            <span className="text-2xl font-bold text-indigo-600">{overallHealthScore}%</span>
          </div>
          <Progress value={overallHealthScore} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Critique</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-700">Espaces</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.classrooms}</div>
            <div className="text-xs text-green-700">Salles</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.labs}</div>
            <div className="text-xs text-purple-700">Labos</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.totalCapacity}</div>
            <div className="text-xs text-orange-700">Capacité</div>
          </div>
        </div>

        {/* Services essentiels */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Services essentiels</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700">Électricité</span>
              <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700">Eau</span>
              <CheckCircle className="w-3 h-3 text-blue-600 ml-auto" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
              <Wifi className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700">Internet</span>
              <CheckCircle className="w-3 h-3 text-purple-600 ml-auto" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-700">Sécurité</span>
              <AlertTriangle className="w-3 h-3 text-orange-600 ml-auto" />
            </div>
          </div>
        </div>

        {/* Liste des espaces (aperçu) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Espaces ({stats.needsMaintenance} nécessitent attention)</h4>
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {infrastructureData.slice(0, 5).map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              const StatusIcon = getStatusIcon(item.status);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <TypeIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-xs bg-gray-100 text-gray-700">
                          {getTypeLabel(item.type)}
                        </Badge>
                        {item.capacity && (
                          <span className="text-xs text-gray-500">
                            {item.capacity} places
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">{getStatusLabel(item.status)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Wrench className="w-4 h-4 mr-2" />
            Planifier maintenance
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Car className="w-4 h-4 mr-2" />
            Demander intervention
          </Button>
        </div>
      </div>
    </Card>
  );
};
