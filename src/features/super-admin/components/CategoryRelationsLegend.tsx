/**
 * Légende des relations entre catégories
 * Guide visuel pour comprendre les connexions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_GROUPS, RELATION_TYPES, getAllConnections } from '@/config/categories-relations';
import { getCategoryTheme } from '@/config/categories-colors';

export const CategoryRelationsLegend: React.FC = () => {
  const connections = getAllConnections();
  const totalConnections = connections.length;
  const complementConnections = connections.filter(c => c.type === 'complement').length;
  const dependencyConnections = connections.filter(c => c.type === 'dependency').length;

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <span className="text-2xl">🔗</span>
            Réseau de Relations - E-Pilot Congo
          </CardTitle>
          <CardDescription>
            Visualisation intelligente des connexions entre catégories métier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(CATEGORY_GROUPS).length}</div>
              <div className="text-sm text-gray-600">Groupes Métier</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{complementConnections}</div>
              <div className="text-sm text-gray-600">Complémentaires</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{dependencyConnections}</div>
              <div className="text-sm text-gray-600">Dépendances</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-gray-600">{totalConnections}</div>
              <div className="text-sm text-gray-600">Total Liens</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guide des relations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            Guide des Relations
          </CardTitle>
          <CardDescription>
            Comprendre les indicateurs visuels et les connexions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(RELATION_TYPES).map(([type, config]) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h4 className={`font-semibold text-${config.color}-700`}>
                      {config.label}
                    </h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
                
                {/* Exemple visuel */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">Exemple:</div>
                  {type === 'complement' && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Scolarité</span>
                      <span className="text-green-500">🤝</span>
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Pédagogie</span>
                    </div>
                  )}
                  {type === 'dependency' && (
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 bg-blue-400 rounded"></div>
                      <span className="text-sm">Nécessite Sécurité</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Groupes métier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            Groupes Métier
          </CardTitle>
          <CardDescription>
            Organisation logique des catégories par domaine d'activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(CATEGORY_GROUPS).map(([groupId, group]) => (
              <div key={groupId} className={`p-4 rounded-lg border-2 border-${group.color}-200 bg-${group.color}-50`}>
                <h4 className={`font-semibold text-${group.color}-800 mb-2`}>
                  {group.name}
                </h4>
                <p className={`text-sm text-${group.color}-600 mb-3`}>
                  {group.description}
                </p>
                <div className="space-y-2">
                  {group.categories.map(categoryName => {
                    const theme = getCategoryTheme(categoryName);
                    const Icon = theme.icon;
                    return (
                      <div key={categoryName} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <div className={`w-6 h-6 rounded bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {categoryName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priorités et scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            Système de Priorités
          </CardTitle>
          <CardDescription>
            Comprendre les niveaux d'importance et scores de connectivité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700 flex items-center gap-2">
                🔥 Priorité Haute
              </h4>
              <div className="space-y-2 text-sm">
                <p>• Catégories critiques pour le fonctionnement</p>
                <p>• Score de connectivité élevé</p>
                <p>• Nombreuses dépendances</p>
              </div>
              <Badge variant="destructive" className="text-xs">
                Scolarité, Pédagogie, Finances
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                ⭐ Priorité Moyenne
              </h4>
              <div className="space-y-2 text-sm">
                <p>• Catégories importantes pour l'efficacité</p>
                <p>• Score de connectivité modéré</p>
                <p>• Quelques compléments</p>
              </div>
              <Badge variant="default" className="text-xs">
                RH, Vie Scolaire, Services
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                📋 Priorité Basse
              </h4>
              <div className="space-y-2 text-sm">
                <p>• Catégories de support</p>
                <p>• Score de connectivité faible</p>
                <p>• Peu de dépendances</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Documents, Communication
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
