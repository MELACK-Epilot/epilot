import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/react-query';
import { validateEnv, logEnvInfo } from '@/lib/validateEnv';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PermissionsProvider } from '@/providers/PermissionsProvider';

// Import direct pour éviter les délais de lazy loading
import LoginPage from './features/auth/pages/LoginPage';
import { LogoutHandler } from './features/auth/components/LogoutHandler';
import DashboardLayout from './features/dashboard/components/DashboardLayout';
import DashboardOverview from './features/dashboard/pages/DashboardOverview';
import SchoolGroups from './features/dashboard/pages/SchoolGroups';
import Schools from './features/dashboard/pages/Schools';
import FinancesGroupe from './features/dashboard/pages/FinancesGroupe';
import Users from './features/dashboard/pages/Users';
import Categories from './features/dashboard/pages/Categories';
import Plans from './features/dashboard/pages/Plans';
import Modules from './features/dashboard/pages/Modules';
import Subscriptions from './features/dashboard/pages/Subscriptions';
import FinancesDashboard from './features/dashboard/pages/FinancesDashboard';
import Payments from './features/dashboard/pages/Payments';
import Expenses from './features/dashboard/pages/Expenses';
import Communication from './features/dashboard/pages/Communication';
import Reports from './features/dashboard/pages/Reports';
import ActivityLogs from './features/dashboard/pages/ActivityLogs';
import Trash from './features/dashboard/pages/Trash';
import Profile from './features/dashboard/pages/Profile';
import MyGroupModules from './features/dashboard/pages/MyGroupModules';
import AssignModules from './features/dashboard/pages/AssignModules';
import PlanChangeRequests from './features/dashboard/pages/PlanChangeRequests';
import FinancesEcole from './features/dashboard/pages/FinancesEcole';
import FinancesNiveau from './features/dashboard/pages/FinancesNiveau';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { USER_ROLES, ADMIN_ROLES } from './config/roles';

// Module Inscriptions
import { InscriptionsModule } from './features/modules/inscriptions';

// ⭐ Système de Modules Dynamiques
import { ModuleWorkspaceProvider } from './features/modules/contexts/ModuleWorkspaceProvider';
import { ModuleWorkspace } from './features/modules/pages/ModuleWorkspace';

// ⭐ Synchronisation Temps Réel
import { ModulesSync } from './components/ModulesSync';

// ⭐ Sandbox Manager
import SandboxManager from './features/dashboard/pages/SandboxManager';

// Espace Utilisateur École
import { UserSpaceLayout, UserDashboard, MyProfile, MySchedule, MyModules, MyCategories, UserDebug } from './features/user-space';
import { FinancesPage } from './features/user-space/pages/FinancesPage';
import { ClassesPage } from './features/user-space/pages/ClassesPage';
import { StaffPage } from './features/user-space/pages/StaffPage';
import { StudentsPage } from './features/user-space/pages/StudentsPage';
import { SchoolGroupPage } from './features/user-space/pages/SchoolGroupPage';
import { DirectorDashboardOptimized } from './features/user-space/pages/DirectorDashboardOptimized';
import { PersonnelManagement } from './features/user-space/pages/PersonnelManagement';
import { StudentsManagement } from './features/user-space/pages/StudentsManagement';
import { ProtectedModuleRoute } from './components/ProtectedModuleRoute';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2A9D8F] mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Chargement...</p>
    </div>
  </div>
);

function App() {
  // Valider les variables d'environnement au démarrage
  useEffect(() => {
    try {
      validateEnv();
      logEnvInfo();
    } catch (error) {
      console.error('❌ Erreur de validation des variables d\'environnement:', error);
      // L'erreur sera affichée dans la console, l'app continuera en mode dégradé
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PermissionsProvider>
          {/* ⭐ Synchronisation Temps Réel des Modules */}
          <ModulesSync />
          
          <BrowserRouter>
          <RoleBasedRedirect>
          <Routes>
          {/* Route de connexion */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Route de déconnexion */}
          <Route path="/logout" element={<LogoutHandler />} />
          
          {/* Routes du dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardOverview />} />
            
            {/* Super Admin uniquement - Gère les abonnements et catégories */}
            <Route path="plans" element={
              <ProtectedRoute roles={['super_admin']}>
                <Plans />
              </ProtectedRoute>
            } />
            
            <Route path="plan-change-requests" element={
              <ProtectedRoute roles={['super_admin']}>
                <PlanChangeRequests />
              </ProtectedRoute>
            } />
            
            <Route path="categories" element={
              <ProtectedRoute roles={['super_admin']}>
                <Categories />
              </ProtectedRoute>
            } />
            
            {/* ⭐ Environnement Sandbox - Super Admin uniquement */}
            <Route path="sandbox" element={
              <ProtectedRoute roles={['super_admin']}>
                <SandboxManager />
              </ProtectedRoute>
            } />
            
            {/* Admin Groupe - Gère les écoles et utilisateurs */}
            <Route path="school-groups" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe']}>
                <SchoolGroups />
              </ProtectedRoute>
            } />
            
            <Route path="schools" element={
              <ProtectedRoute roles={['admin_groupe']}>
                <Schools />
              </ProtectedRoute>
            } />
            
            <Route path="finances-groupe" element={
              <ProtectedRoute roles={['admin_groupe']}>
                <FinancesGroupe />
              </ProtectedRoute>
            } />
            
            <Route path="finances/ecole/:schoolId" element={
              <ProtectedRoute roles={['admin_groupe']}>
                <FinancesEcole />
              </ProtectedRoute>
            } />
            
            <Route path="finances/niveau/:schoolId/:level" element={
              <ProtectedRoute roles={['admin_groupe']}>
                <FinancesNiveau />
              </ProtectedRoute>
            } />
            
            <Route path="my-modules" element={
              <ProtectedRoute roles={['admin_groupe']}>
                <MyGroupModules />
              </ProtectedRoute>
            } />
            
            <Route path="users" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe']}>
                <Users />
              </ProtectedRoute>
            } />
            
            <Route path="assign-modules" element={
              <ProtectedRoute roles={['admin_groupe']}>
                <AssignModules />
              </ProtectedRoute>
            } />
            
            <Route path="modules" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe']}>
                <Modules />
              </ProtectedRoute>
            } />
            <Route path="modules/inscriptions/*" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe', 'secretaire', 'directeur']}>
                <InscriptionsModule />
              </ProtectedRoute>
            } />
            <Route path="subscriptions" element={
              <ProtectedRoute roles={['super_admin']}>
                <Subscriptions />
              </ProtectedRoute>
            } />
            
            {/* Routes Finances - Architecture modulaire */}
            <Route path="finances" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe', 'comptable']}>
                <FinancesDashboard />
              </ProtectedRoute>
            } />
            <Route path="payments" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe', 'comptable']}>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="expenses" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe', 'comptable']}>
                <Expenses />
              </ProtectedRoute>
            } />
            
            <Route path="communication" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 'secretaire', 'enseignant', 'cpe']}>
                <Communication />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe', 'proviseur', 'directeur', 'directeur_etudes']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="activity-logs" element={
              <ProtectedRoute roles={['super_admin']}>
                <ActivityLogs />
              </ProtectedRoute>
            } />
            <Route path="trash" element={
              <ProtectedRoute roles={['super_admin', 'admin_groupe']}>
                <Trash />
              </ProtectedRoute>
            } />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Routes Espace Utilisateur École - Tous les rôles utilisateur + admin_groupe */}
          <Route path="/user" element={
            <ProtectedRoute roles={[...USER_ROLES, 'admin_groupe']}>
              <UserSpaceLayout />
            </ProtectedRoute>
          }>
            <Route index element={<UserDashboard />} />
            <Route path="debug" element={<UserDebug />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="school-group" element={<SchoolGroupPage />} />
            <Route path="schedule" element={<MySchedule />} />
            <Route path="modules" element={<MyModules />} />
            <Route path="categories" element={<MyCategories />} />
            
            {/* Dashboard Directeur/Proviseur - Vue d'ensemble école */}
            <Route path="dashboard-director" element={
              <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes']}>
                <DirectorDashboardOptimized />
              </ProtectedRoute>
            } />
            
            {/* Gestion Personnel - Proviseur/Directeur */}
            <Route path="personnel-management" element={
              <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes']}>
                <PersonnelManagement />
              </ProtectedRoute>
            } />
            
            {/* Gestion Élèves - Proviseur/Directeur */}
            <Route path="students-management" element={
              <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes', 'cpe', 'secretaire']}>
                <StudentsManagement />
              </ProtectedRoute>
            } />
            
            {/* ⭐ Routes Dynamiques pour les Modules */}
            <Route path="modules/:moduleSlug" element={
              <ModuleWorkspaceProvider>
                <ModuleWorkspace />
              </ModuleWorkspaceProvider>
            } />
            
            {/* ⭐ Routes Spécifiques pour le Module Inscriptions */}
            <Route path="modules/gestion-inscriptions/*" element={<InscriptionsModule />} />
            
            {/* Routes protégées par modules */}
            <Route path="finances" element={
              <ProtectedModuleRoute moduleSlug="finances">
                <FinancesPage />
              </ProtectedModuleRoute>
            } />
            <Route path="classes" element={
              <ProtectedModuleRoute moduleSlug="classes">
                <ClassesPage />
              </ProtectedModuleRoute>
            } />
            <Route path="staff" element={
              <ProtectedModuleRoute moduleSlug="personnel">
                <StaffPage />
              </ProtectedModuleRoute>
            } />
            <Route path="students" element={
              <ProtectedModuleRoute moduleSlug="eleves">
                <StudentsPage />
              </ProtectedModuleRoute>
            } />
            
            <Route path="messages" element={<div className="p-6">Messagerie - En développement</div>} />
            <Route path="notifications" element={<div className="p-6">Notifications - En développement</div>} />
            <Route path="settings" element={<div className="p-6">Paramètres - En développement</div>} />
          </Route>
          
          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        
          {/* Toast notifications */}
          <Toaster />
          </RoleBasedRedirect>
          </BrowserRouter>
        </PermissionsProvider>
        
        {/* React Query DevTools (dev only) */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
