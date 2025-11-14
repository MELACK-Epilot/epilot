/**
 * Composant Card pour afficher un module individuel
 * @module ModuleCard
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, Star } from 'lucide-react';
import type { ModuleEnrichi } from '../types/proviseur-modules.types';

interface ModuleCardProps {
  module: ModuleEnrichi;
  onClick?: () => void;
}

export function ModuleCard({ module, onClick }: ModuleCardProps) {
  return (
    <Card
      className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${module.color}10 0%, ${module.color}05 100%)`,
      }}
    >
      {/* Cercle décoratif */}
      <div
        className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ backgroundColor: module.color }}
      />

      <CardContent className="p-6 relative z-10">
        {/* Header avec icône et badges */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `${module.color}20` }}
          >
            <div className="w-8 h-8" style={{ color: module.color }}>
              {module.icon}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {module.isNew && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                Nouveau
              </Badge>
            )}
            {module.isPopular && (
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Populaire
              </Badge>
            )}
          </div>
        </div>

        {/* Nom du module */}
        <h3
          className="text-lg font-bold mb-2 group-hover:text-opacity-80 transition-colors line-clamp-2"
          style={{ color: module.color }}
        >
          {module.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
          {module.description}
        </p>

        {/* Catégorie */}
        <div className="mb-4">
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: module.color, color: module.color }}
          >
            {module.category_name}
          </Badge>
        </div>

        {/* Footer avec stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3.5 h-3.5" />
            <span>{module.access_count} accès</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(module.assigned_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Indicateur hover */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
          style={{ backgroundColor: module.color }}
        />
      </CardContent>
    </Card>
  );
}
