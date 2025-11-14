/**
 * Module Admission des Élèves
 * Espace de travail pour gérer les admissions des élèves
 * Données automatiquement filtrées par école
 * @module AdmissionElevesModule
 */

import { useState } from 'react';
import { UserPlus, Search, Filter, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ModuleContext } from '@/features/user-space/utils/module-navigation';

interface AdmissionElevesModuleProps {
  context: ModuleContext;
}

/**
 * Composant principal du module Admission des Élèves
 */
export function AdmissionElevesModule({ context }: AdmissionElevesModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un élève..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtres */}
              <Button variant="outline" size="default">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="default">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button size="default" className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Admission
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Admissions', value: '0', color: '#3B82F6', icon: <UserPlus className="w-5 h-5" /> },
          { label: 'En Attente', value: '0', color: '#F59E0B', icon: <UserPlus className="w-5 h-5" /> },
          { label: 'Validées', value: '0', color: '#10B981', icon: <UserPlus className="w-5 h-5" /> },
          { label: 'Refusées', value: '0', color: '#EF4444', icon: <UserPlus className="w-5 h-5" /> },
        ].map((stat, index) => (
          <Card
            key={index}
            className="border-0 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <div style={{ color: stat.color }}>{stat.icon}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des admissions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <h3 className="text-lg font-semibold">Demandes d'Admission</h3>
          <p className="text-sm text-gray-600">
            École: <Badge variant="outline">{context.schoolId}</Badge>
          </p>
        </CardHeader>
        <CardContent>
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucune demande d'admission
            </h3>
            <p className="text-gray-500 mb-6">
              Les demandes d'admission pour cette école apparaîtront ici.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Créer une demande
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations de contexte (debug) */}
      <Card className="border-0 shadow-md bg-blue-50">
        <CardHeader>
          <h3 className="text-sm font-semibold text-blue-900">
            ℹ️ Informations de Contexte (Debug)
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-900">Module:</span>
              <p className="text-blue-700">{context.moduleName}</p>
            </div>
            <div>
              <span className="font-medium text-blue-900">Slug:</span>
              <p className="text-blue-700">{context.moduleSlug}</p>
            </div>
            <div>
              <span className="font-medium text-blue-900">École:</span>
              <p className="text-blue-700">{context.schoolId}</p>
            </div>
            <div>
              <span className="font-medium text-blue-900">Groupe:</span>
              <p className="text-blue-700">{context.schoolGroupId}</p>
            </div>
            <div>
              <span className="font-medium text-blue-900">Rôle:</span>
              <p className="text-blue-700 capitalize">{context.userRole}</p>
            </div>
            <div>
              <span className="font-medium text-blue-900">Catégorie:</span>
              <p className="text-blue-700">{context.categoryName}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              ✅ <strong>Contexte reconnu automatiquement</strong> - Les données affichées sont filtrées pour cette école uniquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
