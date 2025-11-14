/**
 * Carte de catégorie intelligente avec relations visuelles
 * Affichage des connexions sans impact performance
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Edit, MoreHorizontal } from 'lucide-react';
import { getCategoryTheme } from '@/config/categories-colors';
import { getCategoryRelations, getCategoryConnectivityScore } from '@/config/categories-relations';

interface SmartCategoryCardProps {
  category: {
    id: string;
    name: string;
    description: string;
    modules_count: number;
    assigned_users_count: number;
    active_groups_count: number;
  };
  onEdit?: (category: any) => void;
  onView?: (category: any) => void;
}

export const SmartCategoryCard: React.FC<SmartCategoryCardProps> = ({
  category,
  onEdit,
  onView
}) => {
  const theme = getCategoryTheme(category.name);
  const relations = getCategoryRelations(category.name);
  const connectivityScore = getCategoryConnectivityScore(category.name);
  const Icon = theme.icon;

  return (
    <TooltipProvider>
      <Card className={`relative overflow-visible border-2 ${theme.borderColor} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}>
        
        {/* Indicateurs de connexion en haut à droite */}
        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
          {relations.complements.slice(0, 3).map((comp, idx) => {
            const compTheme = getCategoryTheme(comp);
            return (
              <Tooltip key={comp}>
                <TooltipTrigger>
                  <div
                    className={`w-5 h-5 rounded-full bg-gradient-to-br ${compTheme.gradient} border-2 border-white shadow-lg transform transition-transform hover:scale-110`}
                    style={{ zIndex: 10 - idx }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">🤝 Complémentaire: {comp}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {relations.complements.length > 3 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-xs text-white font-bold">+{relations.complements.length - 3}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs space-y-1">
                  {relations.complements.slice(3).map(comp => (
                    <p key={comp}>🤝 {comp}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Barre latérale de dépendances */}
        {relations.dependencies.length > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-lg" />
        )}

        {/* Badge de priorité */}
        <div className="absolute -top-2 -left-2 z-10">
          <Badge 
            variant={relations.priority === 'high' ? 'destructive' : relations.priority === 'medium' ? 'default' : 'secondary'}
            className="text-xs px-2 py-1 shadow-lg"
          >
            {relations.priority === 'high' ? '🔥' : relations.priority === 'medium' ? '⭐' : '📋'}
          </Badge>
        </div>

        <CardHeader className={`${theme.bgColor} border-b-2 ${theme.borderColor} relative`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className={`text-lg line-clamp-2 min-h-[3.5rem] ${theme.textColor} flex items-center gap-3`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold">{category.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${theme.badgeColor} text-xs`}>
                      Score: {connectivityScore}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {relations.complements.length + relations.dependencies.length} liens
                    </Badge>
                  </div>
                </div>
              </CardTitle>
            </div>
          </div>
          
          <CardDescription className="line-clamp-3 min-h-[4.5rem] leading-relaxed text-gray-600 mt-3">
            {category.description || relations.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between pt-4">
          {/* Statistiques principales */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-lg font-bold text-gray-800">{category.modules_count}</div>
                <div className="text-xs text-gray-600">Modules</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-lg font-bold text-gray-800">{category.assigned_users_count}</div>
                <div className="text-xs text-gray-600">Utilisateurs</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-lg font-bold text-gray-800">{category.active_groups_count}</div>
                <div className="text-xs text-gray-600">Groupes</div>
              </div>
            </div>

            {/* Relations rapides */}
            <div className="space-y-2">
              {relations.complements.slice(0, 2).map(comp => (
                <div key={comp} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2">
                  <span className="text-green-500">🤝</span>
                  <span className="truncate font-medium">{comp}</span>
                </div>
              ))}
              
              {relations.dependencies.slice(0, 1).map(dep => (
                <div key={dep} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-2">
                  <span className="text-blue-500">⬆️</span>
                  <span className="truncate">
                    <span className="font-medium">Nécessite:</span> {dep}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`${theme.borderColor} ${theme.textColor} hover:${theme.bgColor}`}
                    onClick={() => onView?.(category)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir les détails</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`${theme.borderColor} ${theme.textColor} hover:${theme.bgColor}`}
                    onClick={() => onEdit?.(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modifier la catégorie</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1 max-w-xs">
                  <p className="font-semibold">Relations détaillées:</p>
                  <p><strong>Priorité:</strong> {relations.priority}</p>
                  <p><strong>Compléments:</strong> {relations.complements.length}</p>
                  <p><strong>Dépendances:</strong> {relations.dependencies.length}</p>
                  <p className="text-gray-600 mt-2">{relations.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>

        {/* Effet de survol pour les connexions */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-5 rounded-lg`} />
        </div>
      </Card>
    </TooltipProvider>
  );
};
