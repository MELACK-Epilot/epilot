/**
 * Tableau des inscriptions - VERSION AMÉLIORÉE
 * Design moderne avec tri, pagination, sélection multiple
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  ArrowUpDown, 
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABELS } from '../../types/inscription.types';
import type { Inscription } from '../../types/inscriptions.types';

interface InscriptionsTableProps {
  inscriptions: Inscription[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

type SortField = 'inscriptionNumber' | 'studentLastName' | 'requestedLevel' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

// Avatar Component
const StudentAvatar = ({ firstName, lastName }: { firstName: string; lastName: string }) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
  ];
  const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;

  return (
    <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold text-sm`}>
      {initials}
    </div>
  );
};

// Status Badge avec icônes
const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_LABELS[status] || { label: status, color: 'default' };
  
  const variants = {
    en_attente: {
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: Clock,
    },
    validee: {
      className: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle2,
    },
    refusee: {
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    },
    brouillon: {
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: FileText,
    },
  };

  const variant = variants[status as keyof typeof variants] || variants.brouillon;
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={`${variant.className} gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

// Type Badge
const TypeBadge = ({ type }: { type?: string }) => {
  const types = {
    nouvelle: { label: 'Nouvelle', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    reinscription: { label: 'Réinscription', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    transfert: { label: 'Transfert', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  const config = types[type as keyof typeof types] || types.nouvelle;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

// Formatters
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  } catch {
    return date;
  }
};

const formatDateRelative = (date: string) => {
  try {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return format(d, 'dd MMM yyyy', { locale: fr });
  } catch {
    return date;
  }
};

export const InscriptionsTable = ({
  inscriptions,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: InscriptionsTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tri
  const sortedInscriptions = useMemo(() => {
    return [...inscriptions].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inscriptions, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedInscriptions.length / itemsPerPage);
  const paginatedInscriptions = sortedInscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedInscriptions.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = paginatedInscriptions.length > 0 && 
    paginatedInscriptions.every(i => selectedIds.has(i.id));

  // Loading State
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liste des inscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (inscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liste des inscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune inscription trouvée
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Il n'y a pas encore d'inscriptions correspondant à vos critères de recherche.
            </p>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Créer une inscription
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Liste des inscriptions</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {inscriptions.length} inscription{inscriptions.length > 1 ? 's' : ''} au total
              {selectedIds.size > 0 && ` • ${selectedIds.size} sélectionnée${selectedIds.size > 1 ? 's' : ''}`}
            </p>
          </div>
          
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <Button variant="outline" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider ({selectedIds.size})
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('inscriptionNumber')}
                >
                  <div className="flex items-center gap-2">
                    N° Inscription
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('studentLastName')}
                >
                  <div className="flex items-center gap-2">
                    Élève
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('requestedLevel')}
                >
                  <div className="flex items-center gap-2">
                    Niveau
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frais Total</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Statut
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {paginatedInscriptions.map((inscription, index) => {
                  const totalFrais = 
                    (inscription.fraisInscription || 0) +
                    (inscription.fraisScolarite || 0) +
                    (inscription.fraisCantine || 0) +
                    (inscription.fraisTransport || 0);

                  return (
                    <motion.tr
                      key={inscription.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(inscription.id)}
                          onCheckedChange={(checked) => handleSelectOne(inscription.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium text-blue-600">
                        {inscription.inscriptionNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StudentAvatar 
                            firstName={inscription.studentFirstName} 
                            lastName={inscription.studentLastName}
                          />
                          <div>
                            <div className="font-medium">
                              {inscription.studentFirstName} {inscription.studentLastName}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {inscription.studentGender === 'M' ? 'Masculin' : 'Féminin'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-sm">
                            {inscription.requestedLevel || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={inscription.typeInscription} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-sm">
                            {formatCurrency(totalFrais)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div>{formatDate(inscription.createdAt)}</div>
                            <div className="text-xs text-gray-400">
                              {formatDateRelative(inscription.createdAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inscription.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(inscription.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(inscription.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onView(inscription.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(inscription.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(inscription.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
