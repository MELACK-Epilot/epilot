/**
 * Composant Table pour la page Modules
 * Affichage en tableau avec toutes les colonnes
 */

import { Package, MoreVertical, Eye, Edit, Trash2, Tag } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface ModulesTableProps {
  data: Module[];
  isLoading: boolean;
  onView: (module: Module) => void;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
}

export const ModulesTable = ({ data, isLoading, onView, onEdit, onDelete }: ModulesTableProps) => {
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
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Aucun module trouvé</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[300px]">Module</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Plan Requis</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((module) => (
            <TableRow key={module.id} className="hover:bg-gray-50">
              {/* Module */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${module.categoryColor}20` }}
                  >
                    <Package 
                      className="w-5 h-5" 
                      style={{ color: module.categoryColor }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{module.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{module.slug}</p>
                  </div>
                </div>
              </TableCell>

              {/* Catégorie */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: module.categoryColor }}
                  >
                    {module.categoryName}
                  </span>
                </div>
              </TableCell>

              {/* Version */}
              <TableCell>
                <span className="text-sm font-mono text-gray-600">v{module.version}</span>
              </TableCell>

              {/* Plan Requis */}
              <TableCell>
                {getPlanBadge(module.requiredPlan)}
              </TableCell>

              {/* Statut */}
              <TableCell>
                {getStatusBadge(module.status)}
              </TableCell>

              {/* Type */}
              <TableCell>
                <div className="flex items-center gap-1">
                  {module.isPremium && (
                    <Badge className="bg-purple-100 text-purple-600 text-xs">
                      Premium
                    </Badge>
                  )}
                  {module.isCore && (
                    <Badge className="bg-blue-100 text-blue-600 text-xs">
                      Core
                    </Badge>
                  )}
                  {!module.isPremium && !module.isCore && (
                    <span className="text-xs text-gray-400">Standard</span>
                  )}
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onView(module)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(module)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(module)}
                      className="text-[#E63946]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
