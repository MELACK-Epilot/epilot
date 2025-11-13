/**
 * Vue Tableau des Écoles - Complète avec Actions
 * Table avec tri, sélection multiple, actions groupées
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { SchoolLevelBadgesCompact } from './SchoolLevelBadges';
import type { SchoolWithDetails } from '../../hooks/useSchools-simple';

interface SchoolsTableViewProps {
  schools: SchoolWithDetails[];
  onView: (school: SchoolWithDetails) => void;
  onEdit: (school: SchoolWithDetails) => void;
  onDelete: (id: string) => void;
  showGroupColumn?: boolean;
}

export function SchoolsTableView({
  schools,
  onView,
  onEdit,
  onDelete,
  showGroupColumn = false,
}: SchoolsTableViewProps) {
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof SchoolWithDetails>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Gestion de la sélection
  const toggleSelectAll = () => {
    if (selectedSchools.length === schools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(schools.map((s) => s.id));
    }
  };

  const toggleSelectSchool = (id: string) => {
    setSelectedSchools((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Tri
  const handleSort = (column: keyof SchoolWithDetails) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedSchools = [...schools].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Actions groupées
  const handleBulkDelete = () => {
    selectedSchools.forEach((id) => onDelete(id));
    setSelectedSchools([]);
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspendue', className: 'bg-red-100 text-red-800' },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.inactive;
    
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  // Icône de statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Actions groupées */}
        {selectedSchools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-blue-900">
              {selectedSchools.length} école(s) sélectionnée(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSchools([])}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tableau */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedSchools.length === schools.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    École
                    {sortColumn === 'name' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                {showGroupColumn && (
                  <TableHead>Groupe Scolaire</TableHead>
                )}
                <TableHead>Code</TableHead>
                <TableHead>Niveaux</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('student_count')}
                >
                  <div className="flex items-center gap-2">
                    Élèves
                    {sortColumn === 'student_count' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('staff_count')}
                >
                  <div className="flex items-center gap-2">
                    Personnel
                    {sortColumn === 'staff_count' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Statut
                    {sortColumn === 'status' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showGroupColumn ? 11 : 10} className="text-center py-8 text-gray-500">
                    Aucune école trouvée
                  </TableCell>
                </TableRow>
              ) : (
                sortedSchools.map((school, index) => (
                  <motion.tr
                    key={school.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedSchools.includes(school.id)}
                        onCheckedChange={() => toggleSelectSchool(school.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {school.logo_url ? (
                          <img
                            src={school.logo_url}
                            alt={school.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: (school as any).couleur_principale || '#1D3557',
                            }}
                          >
                            {school.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{school.name}</div>
                          {!showGroupColumn && school.school_group_name && (
                            <div className="text-xs text-gray-500">
                              {school.school_group_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {showGroupColumn && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {school.school_group_name || 'Non assigné'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {school.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <SchoolLevelBadgesCompact
                        has_preschool={school.has_preschool}
                        has_primary={school.has_primary}
                        has_middle={school.has_middle}
                        has_high={school.has_high}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {(school as any).city && (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {(school as any).city}
                          </div>
                        )}
                        {(school as any).departement && (
                          <div className="text-xs text-gray-500">
                            {(school as any).departement}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {school.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {school.phone}
                          </div>
                        )}
                        {school.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {school.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        {school.student_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Users className="w-4 h-4 text-green-600" />
                        {school.staff_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(school.status)}
                        {getStatusBadge(school.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onView(school)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(school)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setSchoolToDelete(school.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={!!schoolToDelete} onOpenChange={() => setSchoolToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette école ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (schoolToDelete) {
                    onDelete(schoolToDelete);
                    setSchoolToDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
