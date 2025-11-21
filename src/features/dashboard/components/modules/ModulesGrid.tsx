/**
 * Composant Grid Cards pour la page Modules
 */

import { Package, MoreVertical, Eye, Edit, Trash2, Shield, Zap, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  requiredPlan: string;
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  isPremium: boolean;
  isCore: boolean;
}

interface ModulesGridProps {
  data: Module[];
  isLoading: boolean;
  onView: (module: Module) => void;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
}

export const ModulesGrid = ({ data, isLoading, onView, onEdit, onDelete }: ModulesGridProps) => {
  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actif', className: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-600 border-gray-200' },
      beta: { label: 'Beta', className: 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20' },
      deprecated: { label: 'Déprécié', className: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  // Badge de plan
  const getPlanBadge = (plan: string) => {
    const planConfig = {
      gratuit: { label: 'Gratuit', className: 'bg-gray-100 text-gray-600' },
      premium: { label: 'Premium', className: 'bg-[#E9C46A]/10 text-[#E9C46A]' },
      pro: { label: 'Pro', className: 'bg-[#1D3557]/10 text-[#1D3557]' },
      institutionnel: { label: 'Institutionnel', className: 'bg-purple-100 text-purple-600' },
    };
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.gratuit;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-72 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Aucun module trouvé</p>
      </div>
    );
  }

  return (
    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.05}>
      {data.map((module) => (
        <AnimatedItem key={module.id}>
          <Card 
            className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer h-80 flex flex-col"
            onClick={() => onView(module)}
          >
            {/* Background gradient basé sur la catégorie */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{ 
                background: `linear-gradient(135deg, ${module.categoryColor || '#1D3557'} 0%, ${module.categoryColor || '#2A9D8F'} 100%)`
              }}
            />
            
            <CardContent className="p-6 relative z-10 flex flex-col h-full">
              {/* Header avec icône et actions */}
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${module.categoryColor || '#1D3557'}20`
                  }}
                >
                  <Package 
                    className="w-6 h-6" 
                    style={{ color: module.categoryColor || '#1D3557' }}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(module); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(module); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(module); }}
                      className="text-[#E63946]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Nom et version */}
              <div className="mb-3">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">
                  {module.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  v{module.version}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[40px]">
                {module.description}
              </p>

              {/* Catégorie */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
                <Tag className="h-4 w-4 text-gray-400" />
                <span 
                  className="text-sm font-medium line-clamp-1"
                  style={{ color: module.categoryColor || '#1D3557' }}
                >
                  {module.categoryName}
                </span>
              </div>

              {/* Badges Premium et Core */}
              {(module.isPremium || module.isCore) && (
                <div className="flex items-center gap-2 mb-4">
                  {module.isPremium && (
                    <Badge className="bg-purple-100 text-purple-600 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {module.isCore && (
                    <Badge className="bg-blue-100 text-blue-600 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Core
                    </Badge>
                  )}
                </div>
              )}

              {/* Spacer pour pousser les badges vers le bas */}
              <div className="flex-grow"></div>
              
              {/* Badges statut et plan */}
              <div className="flex items-center justify-between gap-2 mt-auto">
                {getStatusBadge(module.status)}
                {getPlanBadge(module.requiredPlan)}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      ))}
    </AnimatedContainer>
  );
};
