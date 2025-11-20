/**
 * Composant Table pour la page Groupes Scolaires
 */

import { type ColumnDef } from '@tanstack/react-table';
import { Building2, Users, GraduationCap, MoreVertical, Eye, Edit, Trash2, AlertCircle, CheckCircle, XCircle, Ban, Package, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '../DataTable';
import type { SchoolGroup } from '../../types/dashboard.types';

interface StatusBadgeProps {
  status: SchoolGroup['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
  };

  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {labels[status]}
    </span>
  );
};

interface PlanBadgeProps {
  plan: SchoolGroup['plan'];
}

const PlanBadge = ({ plan }: PlanBadgeProps) => {
  const variants = {
    gratuit: 'bg-gray-100 text-gray-800',
    premium: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800',
    institutionnel: 'bg-yellow-100 text-yellow-800',
  };

  const labels = {
    gratuit: 'Gratuit',
    premium: 'Premium',
    pro: 'Pro',
    institutionnel: 'Institutionnel',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[plan]}`}>
      {labels[plan]}
    </span>
  );
};

interface SchoolGroupsTableProps {
  data: SchoolGroup[];
  isLoading: boolean;
  onView: (group: SchoolGroup) => void;
  onEdit: (group: SchoolGroup) => void;
  onDelete: (group: SchoolGroup) => void;
  onActivate?: (group: SchoolGroup) => void;
  onDeactivate?: (group: SchoolGroup) => void;
  onSuspend?: (group: SchoolGroup) => void;
  onViewModules?: (group: SchoolGroup) => void;
  selectedRows: string[];
  onSelectionChange: (ids: string[]) => void;
  sortField: keyof SchoolGroup;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof SchoolGroup) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const SchoolGroupsTable = ({
  data,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onSuspend,
  onViewModules,
  selectedRows,
  onSelectionChange,
  sortField,
  sortDirection,
  onSort,
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
}: SchoolGroupsTableProps) => {
  // Handler pour sélectionner/désélectionner toutes les lignes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(g => g.id));
    } else {
      onSelectionChange([]);
    }
  };

  // Handler pour sélectionner/désélectionner une ligne
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedRows, id]);
    } else {
      onSelectionChange(selectedRows.filter(rowId => rowId !== id));
    }
  };

  // Composant pour header avec tri
  const SortableHeader = ({ field, label }: { field: keyof SchoolGroup; label: string }) => (
    <Button
      variant="ghost"
      onClick={() => onSort(field)}
      className="-ml-4 h-8 data-[state=open]:bg-accent"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
  const columns: ColumnDef<SchoolGroup>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={selectedRows.length === data.length && data.length > 0}
          onCheckedChange={handleSelectAll}
          aria-label="Sélectionner tout"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original.id)}
          onCheckedChange={(checked) => handleSelectRow(row.original.id, checked as boolean)}
          aria-label={`Sélectionner ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: () => <SortableHeader field="name" label="Nom du groupe" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          <p className="text-sm text-gray-500">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: 'region',
      header: 'Région',
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-gray-900">{row.original.region}</p>
          <p className="text-xs text-gray-500">{row.original.city}</p>
        </div>
      ),
    },
    {
      accessorKey: 'adminName',
      header: 'Administrateur',
      cell: ({ row }) => {
        const isAssigned = row.original.adminId && row.original.adminName;
        
        return (
          <div>
            <div className="flex items-center gap-2">
              {!isAssigned && <AlertCircle className="w-4 h-4 text-red-600" />}
              <p className={`text-sm font-medium ${isAssigned ? 'text-gray-900' : 'text-red-600'}`}>
                {row.original.adminName || 'Non assigné'}
              </p>
            </div>
            {isAssigned ? (
              <p className="text-xs text-gray-500">{row.original.adminEmail}</p>
            ) : (
              <p className="text-xs text-red-500 italic">En attente d'assignation</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'stats',
      header: 'Statistiques',
      cell: ({ row }) => (
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-gray-500" />
            <span>{row.original.schoolCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-gray-500" />
            <span>{row.original.studentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-500" />
            <span>{row.original.staffCount}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            {onViewModules && (
              <DropdownMenuItem onClick={() => onViewModules(row.original)}>
                <Package className="w-4 h-4 mr-2" />
                Modules & Catégories
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {row.original.status !== 'active' && onActivate && (
              <DropdownMenuItem 
                className="text-green-600"
                onClick={() => onActivate(row.original)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activer
              </DropdownMenuItem>
            )}
            {row.original.status === 'active' && onDeactivate && (
              <DropdownMenuItem 
                className="text-orange-600"
                onClick={() => onDeactivate(row.original)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Désactiver
              </DropdownMenuItem>
            )}
            {row.original.status !== 'suspended' && onSuspend && (
              <DropdownMenuItem 
                className="text-yellow-600"
                onClick={() => onSuspend(row.original)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspendre
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer définitivement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={data} isLoading={isLoading} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, totalItems)} sur {totalItems} groupe(s)
            {selectedRows.length > 0 && ` • ${selectedRows.length} sélectionné(s)`}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Précédent
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                // Afficher seulement quelques pages autour de la page actuelle
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
