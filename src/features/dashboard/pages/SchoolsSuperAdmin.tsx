/**
 * Page Écoles - Version SUPER ADMIN
 * Permet de gérer TOUTES les écoles de TOUS les groupes
 * Vue d'ensemble complète avec filtres par groupe
 */

import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  School,
  Plus,
  Search,
  Filter,
  List,
  Download,
  Upload,
  AlertCircle,
  LayoutGrid,
  FileDown,
  GraduationCap,
  Users,
  Building2
} from 'lucide-react';
import {
  useSchools,
  useSchoolStats,
  useDeleteSchool,
  type SchoolWithDetails
} from '../hooks/useSchools-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/features/auth/store/auth.store';
import { useSchoolGroups } from '../hooks/useSchoolGroups';
import {
  SchoolsStats,
  SchoolsCharts,
  SchoolsGridView,
  SchoolsTableView,
  SchoolDetailsDialog,
  SchoolLevelStats
} from '../components/schools';
import { SchoolFormDialog } from '../components/schools/SchoolFormDialog';
import { ImportCSVDialog } from '../components/schools/ImportCSVDialog';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function SchoolsSuperAdmin() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // Par défaut : vue tableau pour Super Admin
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Vérifier que l'utilisateur est bien un super_admin
  if (!user || user.role !== 'super_admin') {
    console.log('🚫 Accès refusé - Rôle:', user?.role);
    return <Navigate to="/dashboard" replace />;
  }

  // Récupérer tous les groupes pour le filtre
  const { data: schoolGroups } = useSchoolGroups();

  // Hooks - PAS de filtrage par school_group_id (accès total)
  const { data: schools, isLoading } = useSchools({
    search,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    school_group_id: groupFilter !== 'all' ? groupFilter : undefined
  });

  const { data: stats } = useSchoolStats(groupFilter !== 'all' ? groupFilter : undefined);
  const deleteSchool = useDeleteSchool();

  // Filtrage par niveau côté client
  const filteredSchools = useMemo(() => {
    if (!schools) return [];

    return schools.filter(school => {
      // Filtre par niveau
      if (levelFilter !== 'all') {
        const levelMap: Record<string, boolean | undefined> = {
          preschool: school.has_preschool,
          primary: school.has_primary,
          middle: school.has_middle,
          high: school.has_high,
        };
        if (!levelMap[levelFilter]) {
          return false;
        }
      }

      return true;
    });
  }, [schools, levelFilter]);

  // Stats globales (tous les groupes confondus)
  const globalStats = useMemo(() => {
    if (!schools) return null;

    return {
      totalSchools: schools.length,
      activeSchools: schools.filter(s => s.status === 'active').length,
      inactiveSchools: schools.filter(s => s.status === 'inactive').length,
      suspendedSchools: schools.filter(s => s.status === 'suspended').length,
      totalStudents: schools.reduce((sum, s) => sum + (s.nombre_eleves_actuels || s.student_count || 0), 0),
      totalTeachers: schools.reduce((sum, s) => sum + (s.nombre_enseignants || 0), 0),
      totalStaff: schools.reduce((sum, s) => sum + (s.staff_count || 0), 0),
      averageStudentsPerSchool: schools.length > 0 ? Math.round(schools.reduce((sum, s) => sum + (s.nombre_eleves_actuels || s.student_count || 0), 0) / schools.length) : 0,
      schoolsThisYear: schools.filter(s => {
        const createdAt = new Date(s.created_at);
        return createdAt.getFullYear() === new Date().getFullYear();
      }).length,
      privateSchools: schools.filter(s => s.type_etablissement === 'prive').length,
      publicSchools: schools.filter(s => s.type_etablissement === 'public').length,
      schoolsWithPreschool: schools.filter(s => s.has_preschool).length,
      schoolsWithPrimary: schools.filter(s => s.has_primary).length,
      schoolsWithMiddle: schools.filter(s => s.has_middle).length,
      schoolsWithHigh: schools.filter(s => s.has_high).length,
      multiLevelSchools: schools.filter(s => {
        const count = [s.has_preschool, s.has_primary, s.has_middle, s.has_high]
          .filter(Boolean).length;
        return count >= 2;
      }).length,
      completeLevelSchools: schools.filter(s =>
        s.has_preschool && s.has_primary && s.has_middle && s.has_high
      ).length,
    };
  }, [schools]);

  // Handlers
  const handleCreate = () => {
    setSelectedSchool(null);
    setIsFormOpen(true);
  };

  const handleView = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setIsDetailsOpen(true);
  };

  const handleEdit = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setIsFormOpen(true);
  };

  const handleDelete = async (school: SchoolWithDetails) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'école "${school.name}" ?`)) {
      try {
        await deleteSchool.mutateAsync(school.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteById = async (id: string) => {
    try {
      await deleteSchool.mutateAsync(id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleExportCSV = () => {
    if (!schools || schools.length === 0) {
      toast.error('Aucune école à exporter');
      return;
    }
    exportToCSV(schools, 'ecoles-super-admin');
    toast.success(`${schools.length} école(s) exportée(s) en CSV`);
  };

  const handleExportPDF = async () => {
    if (!schools || schools.length === 0) {
      toast.error('Aucune école à exporter');
      return;
    }
    try {
      await exportToPDF(schools, 'ecoles-super-admin');
      toast.success(`${schools.length} école(s) exportée(s) en PDF`);
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const handleImport = () => {
    setIsImportOpen(true);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Super Admin */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-700 rounded-xl">
              <School className="w-7 h-7 text-white" />
            </div>
            Gestion Globale des Écoles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de toutes les écoles • {schools?.length || 0} école(s) au total
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {schoolGroups?.length || 0} groupes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {globalStats?.totalStudents || 0} élèves
            </Badge>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une École
        </Button>
      </motion.div>

      {/* Alert Info Super Admin */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Mode Super Administrateur</AlertTitle>
        <AlertDescription className="text-blue-800">
          Vous pouvez voir et gérer toutes les écoles de tous les groupes scolaires.
          Utilisez les filtres pour affiner votre recherche.
        </AlertDescription>
      </Alert>

      {/* Stats Cards Globales */}
      <SchoolsStats stats={globalStats} isLoading={isLoading} />

      {/* Stats par Niveau */}
      <SchoolLevelStats stats={globalStats} />

      {/* Barre de Recherche et Filtres Avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-red-600" />
              Recherche et Filtres Avancés
            </span>
            <div className="flex gap-2">
              {/* Toggle Vue */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <FileDown className="w-3 h-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une école..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre Groupe */}
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger>
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {schoolGroups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre Statut */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Niveau */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <GraduationCap className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="preschool">🎓 Maternelle</SelectItem>
                <SelectItem value="primary">📚 Primaire</SelectItem>
                <SelectItem value="middle">🏫 Collège</SelectItem>
                <SelectItem value="high">🎓 Lycée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vue Cartes ou Tableau */}
      {viewMode === 'grid' ? (
        <SchoolsGridView
          schools={filteredSchools}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <SchoolsTableView
          schools={filteredSchools}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteById}
          showGroupColumn={true} // Afficher la colonne groupe
        />
      )}

      {/* Graphiques */}
      {schools && schools.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
            Analyses Globales
          </h2>
          <SchoolsCharts schools={schools} />
        </div>
      )}

      {/* Dialog Détails */}
      <SchoolDetailsDialog
        school={selectedSchool}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      {/* Dialog Formulaire Création/Modification */}
      <SchoolFormDialog
        isOpen={isFormOpen}
        school={selectedSchool}
        schoolGroupId={groupFilter !== 'all' ? groupFilter : undefined}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSchool(null);
        }}
      />

      {/* Dialog Import CSV */}
      <ImportCSVDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        schoolGroupId={groupFilter !== 'all' ? groupFilter : undefined}
      />
    </div>
  );
}
