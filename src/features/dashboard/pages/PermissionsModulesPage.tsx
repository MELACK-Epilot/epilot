/**
 * Page Permissions & Modules - VERSION DÉDIÉE
 * Gestion complète des permissions et assignations de modules
 * @module PermissionsModulesPage
 */

import { useState, useMemo } from 'react';
import { Shield, Users, Grid3x3, UserCog, History, RefreshCw, Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/store/auth.store';
import { useUsers } from '../hooks/useUsers';
import { useSchoolGroupModules } from '../hooks/useSchoolGroupModules';
import { useAssignmentStats } from '../hooks/useAssignmentStats';
import { useExportPermissions, useFetchExportData } from '../hooks/useModuleManagement';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { toast } from 'sonner';

// Composants d'onglets
import { UsersPermissionsView } from '../components/permissions/UsersPermissionsView';
import { MatrixPermissionsView } from '../components/permissions/MatrixPermissionsView';
import { ProfilesPermissionsView } from '../components/permissions/ProfilesPermissionsView';
import { HistoryPermissionsView } from '../components/permissions/HistoryPermissionsView';

export default function PermissionsModulesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data
  const { data: usersData, isLoading: usersLoading, refetch } = useUsers({
    schoolGroupId: user?.schoolGroupId,
  });

  const { data: modulesData } = useSchoolGroupModules(user?.schoolGroupId);
  const { data: assignmentStats } = useAssignmentStats(user?.schoolGroupId);

  const users = usersData?.users || [];
  const modules = modulesData?.availableModules || [];

  // Stats globales
  const stats = useMemo(() => {
    const totalUsers = users.filter(u => u.role !== 'super_admin').length;
    const totalModules = modules?.length || 0;
    const activeUsers = users.filter(u => u.status === 'active' && u.role !== 'super_admin').length;
    const usersWithModules = assignmentStats?.usersWithModules || 0;
    const usersWithoutModules = totalUsers - usersWithModules;

    return {
      totalUsers,
      totalModules,
      activeUsers,
      usersWithModules,
      usersWithoutModules,
    };
  }, [users, modules, assignmentStats]);

  const exportPermissions = useExportPermissions();
  const fetchExportData = useFetchExportData();

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!user?.schoolGroupId) {
      toast.error('Impossible d\'exporter', {
        description: 'Groupe scolaire non identifié'
      });
      return;
    }

    setIsExporting(true);
    const formatLabels = {
      csv: 'CSV',
      excel: 'Excel',
      pdf: 'PDF'
    };

    try {
      toast.loading(`Export ${formatLabels[format]} en cours...`, { id: 'export' });
      
      if (format === 'csv') {
        await exportPermissions(user.schoolGroupId);
      } else if (format === 'excel') {
        // Récupérer les données formatées
        const data = await fetchExportData(user.schoolGroupId);
        exportToExcel(data, 'Groupe Scolaire');
      } else if (format === 'pdf') {
        // Récupérer les données formatées
        const data = await fetchExportData(user.schoolGroupId);
        exportToPDF(data, 'Groupe Scolaire');
      }
      
      toast.success(`Export ${formatLabels[format]} réussi!`, { 
        id: 'export',
        description: `Le fichier ${formatLabels[format]} a été téléchargé`
      });
    } catch (error: any) {
      toast.error('Erreur lors de l\'export', {
        id: 'export',
        description: error.message
      });
    } finally {
      setIsExporting(false);
    }
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Données actualisées!', {
        description: 'Les informations ont été rechargées'
      });
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              Permissions & Modules
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Gérez les accès et permissions de votre équipe en toute simplicité
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
            
            {/* Menu Export avec PDF, Excel, CSV */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Export...' : 'Exporter'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-medium">Export PDF</div>
                    <div className="text-xs text-gray-500">Document imprimable</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Export Excel</div>
                    <div className="text-xs text-gray-500">Tableau éditable</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Export CSV</div>
                    <div className="text-xs text-gray-500">Données brutes</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AnimatedSection>

      {/* KPIs */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Utilisateurs */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 group-hover:text-blue-700">Utilisateurs</p>
                <p className="text-3xl font-bold text-blue-900 mt-1 group-hover:text-blue-800">{stats.totalUsers}</p>
                <p className="text-xs text-blue-600 mt-1 group-hover:text-blue-700">
                  {stats.activeUsers} actifs
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Total Modules */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 group-hover:text-green-700">Modules</p>
                <p className="text-3xl font-bold text-green-900 mt-1 group-hover:text-green-800">{stats.totalModules}</p>
                <p className="text-xs text-green-600 mt-1 group-hover:text-green-700">
                  Disponibles
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors shadow-md">
                <Grid3x3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Avec Modules */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 group-hover:text-purple-700">Avec Modules</p>
                <p className="text-3xl font-bold text-purple-900 mt-1 group-hover:text-purple-800">{stats.usersWithModules}</p>
                <p className="text-xs text-purple-600 mt-1 group-hover:text-purple-700">
                  {stats.totalUsers > 0 ? Math.round((stats.usersWithModules / stats.totalUsers) * 100) : 0}% des users
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors shadow-md">
                <UserCog className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Sans Modules */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 group-hover:text-orange-700">Sans Modules</p>
                <p className="text-3xl font-bold text-orange-900 mt-1 group-hover:text-orange-800">{stats.usersWithoutModules}</p>
                <p className="text-xs text-orange-600 mt-1 group-hover:text-orange-700">
                  À configurer
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center group-hover:bg-orange-600 transition-colors shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Taux de Couverture */}
          <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600 group-hover:text-cyan-700">Couverture</p>
                <p className="text-3xl font-bold text-cyan-900 mt-1 group-hover:text-cyan-800">
                  {stats.totalUsers > 0 ? Math.round((stats.usersWithModules / stats.totalUsers) * 100) : 0}%
                </p>
                <p className="text-xs text-cyan-600 mt-1 group-hover:text-cyan-700">
                  Taux global
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center group-hover:bg-cyan-600 transition-colors shadow-md">
                <History className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>
      </AnimatedSection>

      {/* Onglets */}
      <AnimatedSection delay={0.2}>
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Vue Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2">
                <Grid3x3 className="h-4 w-4" />
                Vue Matricielle
              </TabsTrigger>
              <TabsTrigger value="profiles" className="gap-2">
                <UserCog className="h-4 w-4" />
                Profils
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
            </TabsList>

            {/* Onglet 1: Vue Utilisateurs */}
            <TabsContent value="users" className="mt-0">
              <UsersPermissionsView
                users={users}
                modules={modules}
                isLoading={usersLoading}
                onRefresh={refetch}
              />
            </TabsContent>

            {/* Onglet 2: Vue Matricielle */}
            <TabsContent value="matrix" className="mt-0">
              <MatrixPermissionsView onRefresh={refetch} />
            </TabsContent>

            {/* Onglet 3: Profils */}
            <TabsContent value="profiles" className="mt-0">
              <ProfilesPermissionsView onRefresh={refetch} />
            </TabsContent>

            {/* Onglet 4: Historique */}
            <TabsContent value="history" className="mt-0">
              <HistoryPermissionsView onRefresh={refetch} />
            </TabsContent>
          </Tabs>
        </Card>
      </AnimatedSection>
    </div>
  );
}
