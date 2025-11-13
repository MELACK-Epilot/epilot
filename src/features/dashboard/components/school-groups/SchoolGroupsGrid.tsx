/**
 * Composant Grid Cards pour la page Groupes Scolaires
 * Affichage en cards avec design moderne
 */

import { Building2, MapPin, MoreVertical, Eye, Edit, Trash2, Shield, CheckCircle, XCircle, Ban } from 'lucide-react';
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
import type { SchoolGroup } from '../../types/dashboard.types';

interface SchoolGroupsGridProps {
  data: SchoolGroup[];
  isLoading: boolean;
  onView: (group: SchoolGroup) => void;
  onEdit: (group: SchoolGroup) => void;
  onDelete: (group: SchoolGroup) => void;
  onActivate?: (group: SchoolGroup) => void;
  onDeactivate?: (group: SchoolGroup) => void;
  onSuspend?: (group: SchoolGroup) => void;
}

export const SchoolGroupsGrid = ({ data, isLoading, onView, onEdit, onDelete, onActivate, onDeactivate, onSuspend }: SchoolGroupsGridProps) => {
  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actif', className: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-600 border-gray-200' },
      suspended: { label: 'Suspendu', className: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20' },
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
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Aucun groupe scolaire trouvé</p>
      </div>
    );
  }

  return (
    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.05}>
      {data.map((group) => (
        <AnimatedItem key={group.id}>
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
            {/* Background gradient subtil */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{ 
                background: group.status === 'active' 
                  ? 'linear-gradient(135deg, #2A9D8F 0%, #1D3557 100%)'
                  : 'linear-gradient(135deg, #6B7280 0%, #374151 100%)'
              }}
            />
            
            <CardContent className="p-6 relative z-10">
              {/* Header avec logo et actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {group.logo ? (
                    <img 
                      src={group.logo} 
                      alt={group.name}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {group.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onView(group)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(group)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {group.status !== 'active' && onActivate && (
                      <DropdownMenuItem 
                        className="text-green-600"
                        onClick={() => onActivate(group)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activer
                      </DropdownMenuItem>
                    )}
                    {group.status === 'active' && onDeactivate && (
                      <DropdownMenuItem 
                        className="text-orange-600"
                        onClick={() => onDeactivate(group)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Désactiver
                      </DropdownMenuItem>
                    )}
                    {group.status !== 'suspended' && onSuspend && (
                      <DropdownMenuItem 
                        className="text-yellow-600"
                        onClick={() => onSuspend(group)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspendre
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(group)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Nom et code */}
              <div className="mb-3">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {group.code}
                </p>
              </div>

              {/* Localisation */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="line-clamp-1">{group.city}, {group.region}</span>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Écoles</p>
                  <p className="text-lg font-bold text-[#1D3557]">{group.schoolCount || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Élèves</p>
                  <p className="text-lg font-bold text-[#2A9D8F]">{group.studentCount || 0}</p>
                </div>
              </div>

              {/* Admin */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-md">
                <Shield className="h-4 w-4 text-[#1D3557]" />
                <span className="text-sm text-gray-700 line-clamp-1">
                  {group.adminName}
                </span>
              </div>

              {/* Badges statut et plan */}
              <div className="flex items-center justify-between gap-2">
                {getStatusBadge(group.status)}
                {getPlanBadge(group.plan)}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      ))}
    </AnimatedContainer>
  );
};
