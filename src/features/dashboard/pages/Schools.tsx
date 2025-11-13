/**
 * Page Écoles PREMIUM - Version Complète et Époustouflante
 * Design moderne avec stats, graphiques, vue cartes et détails complets
 * Basé sur la structure complète de la table schools (40+ colonnes)
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
  GraduationCap
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

export default function Schools() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid'); // Par défaut : vue cartes
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Vérifier que l'utilisateur est bien un admin_groupe
  if (!user || user.role !== 'admin_groupe') {
    console.log('🚫 Accès refusé - Rôle:', user?.role);
    return <Navigate to="/dashboard" replace />;
  }

  // Vérifier que l'utilisateur a un school_group_id
  if (!user.schoolGroupId) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de configuration</AlertTitle>
          <AlertDescription>
            Votre compte n'est pas associé à un groupe scolaire.
            Veuillez contacter l'administrateur système.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Hooks - Filtrer automatiquement par school_group_id
  const { data: schools, isLoading } = useSchools({ 
    search, 
    status: statusFilter !== 'all' ? statusFilter : undefined,
    school_group_id: user.schoolGroupId
  });
  const { data: stats } = useSchoolStats(user.schoolGroupId);
  const deleteSchool = useDeleteSchool();
  // const updateStatus = useUpdateSchoolStatus(); // Non utilisé pour le moment

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
    exportToCSV(schools, 'ecoles');
    toast.success(`${schools.length} école(s) exportée(s) en CSV`);
  };

  const handleExportPDF = async () => {
    if (!schools || schools.length === 0) {
      toast.error('Aucune école à exporter');
      return;
    }
    try {
      await exportToPDF(schools, 'ecoles');
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
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-xl">
              <School className="w-7 h-7 text-white" />
            </div>
            Gestion des Écoles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.schoolGroupName} • {schools?.length || 0} école(s)
          </p>
        </div>

        <Button 
          onClick={handleCreate}
          className="bg-gradient-to-r from-[#2A9D8F] to-[#1D8A7E] hover:from-[#1D8A7E] hover:to-[#2A9D8F]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle École
        </Button>
      </motion.div>

      {/* Stats Cards Premium */}
      <SchoolsStats stats={stats} isLoading={isLoading} />

      {/* Stats par Niveau */}
      <SchoolLevelStats stats={stats} />

      {/* Barre de Recherche et Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#2A9D8F]" />
              Recherche et Filtres
            </span>
            <div className="flex gap-2">
              {/* Toggle Vue */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-[#2A9D8F] hover:bg-[#1D8A7E]' : ''}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-[#2A9D8F] hover:bg-[#1D8A7E]' : ''}
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
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une école..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre Statut */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
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
        />
      )}

      {/* Graphiques */}
      {schools && schools.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-[#2A9D8F] to-[#1D3557] rounded-full"></div>
            Analyses et Statistiques
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
        schoolGroupId={user.schoolGroupId}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSchool(null);
        }}
      />

      {/* Dialog Import CSV */}
      <ImportCSVDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        schoolGroupId={user.schoolGroupId}
      />
    </div>
  );
}
