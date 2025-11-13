/**
 * Page Corbeille - Gestion des éléments supprimés
 * @module Trash
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trash2, 
  Search,
  RotateCcw,
  AlertTriangle,
  Building2,
  User,
  FileText,
  Clock
} from 'lucide-react';

export const Trash = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Données mockées
  const stats = [
    { label: 'Éléments supprimés', value: '24', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Groupes scolaires', value: '8', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Utilisateurs', value: '12', icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Documents', value: '4', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const trashedItems = [
    {
      id: 1,
      type: 'Groupe Scolaire',
      name: 'Groupe Horizon',
      deletedBy: 'Admin Système',
      deletedAt: '2025-10-25T14:30:00',
      expiresAt: '2025-11-24T14:30:00',
      size: '2.4 MB',
    },
    {
      id: 2,
      type: 'Utilisateur',
      name: 'Jean Dupont',
      deletedBy: 'Marie Martin',
      deletedAt: '2025-10-24T10:15:00',
      expiresAt: '2025-11-23T10:15:00',
      size: '156 KB',
    },
    {
      id: 3,
      type: 'Document',
      name: 'Rapport_Financier_Sept_2025.pdf',
      deletedBy: 'Sophie Laurent',
      deletedAt: '2025-10-23T16:45:00',
      expiresAt: '2025-11-22T16:45:00',
      size: '3.2 MB',
    },
    {
      id: 4,
      type: 'Groupe Scolaire',
      name: 'Groupe Excellence',
      deletedBy: 'Admin Système',
      deletedAt: '2025-10-22T09:00:00',
      expiresAt: '2025-11-21T09:00:00',
      size: '1.8 MB',
    },
    {
      id: 5,
      type: 'Utilisateur',
      name: 'Pierre Martin',
      deletedBy: 'Admin Système',
      deletedAt: '2025-10-20T11:20:00',
      expiresAt: '2025-11-19T11:20:00',
      size: '98 KB',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Groupe Scolaire':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'Utilisateur':
        return <User className="h-5 w-5 text-purple-600" />;
      case 'Document':
        return <FileText className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'Groupe Scolaire': 'bg-blue-100 text-blue-800',
      'Utilisateur': 'bg-purple-100 text-purple-800',
      'Document': 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const getDaysUntilExpiration = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === trashedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(trashedItems.map(item => item.id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-[#1D3557]" />
            Corbeille
          </h1>
          <p className="text-gray-500 mt-1">Gérez les éléments supprimés (conservation 30 jours)</p>
        </div>
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-green-600 hover:text-green-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurer ({selectedItems.length})
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </Button>
          </div>
        )}
      </div>

      {/* Alert */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Suppression automatique</h3>
            <p className="text-sm text-orange-800 mt-1">
              Les éléments dans la corbeille sont automatiquement supprimés définitivement après 30 jours.
              Restaurez-les avant expiration pour éviter la perte de données.
            </p>
          </div>
        </div>
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

      {/* Liste des éléments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Éléments supprimés</CardTitle>
              <CardDescription>Restaurez ou supprimez définitivement les éléments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Recherche */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un élément..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedItems.length === trashedItems.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-gray-600">Tout sélectionner</span>
            </div>
          </div>

          {/* Liste */}
          <div className="space-y-3">
            {trashedItems.map((item) => {
              const daysLeft = getDaysUntilExpiration(item.expiresAt);
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isSelected ? 'border-[#2A9D8F] bg-[#2A9D8F]/5' : ''
                  }`}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                  />
                  
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(item.type)}
                      {daysLeft <= 7 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Expire dans {daysLeft}j
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>Supprimé par {item.deletedBy}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.deletedAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span>•</span>
                      <span>{item.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Trash;
