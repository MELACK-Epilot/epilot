/**
 * Page Permissions & Modules - VERSION DÉDIÉE
 * Gestion complète des permissions et assignations de modules
 * @module PermissionsModulesPage
 */

import { useState, useMemo } from 'react';
import { Shield, Grid3x3, UserCog, History, RefreshCw, Download, FileText, FileSpreadsheet, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MatrixPermissionsView } from '../components/permissions/MatrixPermissionsView';
import { ProfilesPermissionsView } from '../components/permissions/ProfilesPermissionsView';
import { HistoryPermissionsView } from '../components/permissions/HistoryPermissionsView';

export default function PermissionsModulesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profiles');
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
    const usersWithModules = assignmentStats?.usersWithModules || 0;
    const usersWithoutModules = totalUsers - usersWithModules;
    const coverageRate = totalUsers > 0 ? Math.round((usersWithModules / totalUsers) * 100) : 0;

    return {
      totalUsers,
      usersWithModules,
      usersWithoutModules,
      coverageRate
    };
  }, [users, assignmentStats]);

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
        const data = await fetchExportData(user.schoolGroupId);
        exportToExcel(data, 'Groupe Scolaire');
      } else if (format === 'pdf') {
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
              Gestion des Rôles & Sécurité
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Définissez les modèles d'accès et auditez la sécurité de votre établissement
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
            
            {/* Menu Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Export...' : 'Exporter Audit'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-medium">Rapport PDF</div>
                    <div className="text-xs text-gray-500">Format officiel</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Audit Excel</div>
                    <div className="text-xs text-gray-500">Pour analyse</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AnimatedSection>

      {/* KPIs de Sécurité */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Taux de Couverture (Sécurité) */}
          <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${stats.coverageRate === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {stats.coverageRate === 100 ? 'Optimal' : 'Attention'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Conformité des Accès</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.coverageRate}%</h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.usersWithoutModules} utilisateurs nécessitent une configuration
              </p>
            </div>
          </Card>

          {/* Profils Actifs */}
          <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <UserCog className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Profils Standards</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">Actifs</h3>
              <p className="text-xs text-gray-500 mt-1">
                Assignation automatique par rôle activée
              </p>
            </div>
          </Card>

          {/* Audit */}
          <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">État du Système</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">Sécurisé</h3>
              <p className="text-xs text-gray-500 mt-1">
                Dernière vérification à l'instant
              </p>
            </div>
          </Card>
        </div>
      </AnimatedSection>

      {/* Onglets */}
      <AnimatedSection delay={0.2}>
        <Card className="p-6 border-gray-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100/50 p-1">
              <TabsTrigger value="profiles" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserCog className="h-4 w-4" />
                Profils & Modèles
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Grid3x3 className="h-4 w-4" />
                Matrice de Sécurité
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <History className="h-4 w-4" />
                Journal d'Audit
              </TabsTrigger>
            </TabsList>

            {/* Onglet 1: Profils (Ex-Onglet 3) */}
            <TabsContent value="profiles" className="mt-0 focus-visible:outline-none">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Modèles d'Accès</h3>
                <p className="text-sm text-gray-500">
                  Configurez ici les permissions par défaut. Chaque nouvel utilisateur recevra automatiquement les modules de son profil.
                </p>
              </div>
              <ProfilesPermissionsView onRefresh={refetch} />
            </TabsContent>

            {/* Onglet 2: Vue Matricielle (Ex-Onglet 2) */}
            <TabsContent value="matrix" className="mt-0 focus-visible:outline-none">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Audit Global des Permissions</h3>
                <p className="text-sm text-gray-500">
                  Vue d'ensemble de qui a accès à quoi. Utilisez cette vue pour détecter les anomalies.
                </p>
              </div>
              <MatrixPermissionsView onRefresh={refetch} />
            </TabsContent>

            {/* Onglet 3: Historique (Ex-Onglet 4) */}
            <TabsContent value="history" className="mt-0 focus-visible:outline-none">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Journal des Modifications</h3>
                <p className="text-sm text-gray-500">
                  Historique complet des changements de permissions pour l'audit de sécurité.
                </p>
              </div>
              <HistoryPermissionsView onRefresh={refetch} />
            </TabsContent>
          </Tabs>
        </Card>
      </AnimatedSection>
    </div>
  );
}
