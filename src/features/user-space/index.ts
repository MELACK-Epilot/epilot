/**
 * Export central pour l'espace utilisateur
 */

// Components
export { UserSpaceLayout } from './components/UserSpaceLayout';
export { UserSidebar } from './components/UserSidebar';
export { UserHeader } from './components/UserHeader';
export { UserHeaderModern } from './components/UserHeaderModern';

// Pages
export { UserDashboard } from './pages/UserDashboard';
export { UserDashboardRouter } from './pages/UserDashboardRouter';
export { MyProfile } from './pages/MyProfile';
export { MySchedule } from './pages/MySchedule';
export { MyModules } from './pages/MyModules';
export { MyCategories } from './pages/MyCategories';
export { UserDebug } from './pages/UserDebug';
export { FinancesPage } from './pages/FinancesPage';
export { ClassesPage } from './pages/ClassesPage';
export { StaffPage } from './pages/StaffPage';
export { StudentsPage } from './pages/StudentsPage';

// Chef d'Établissement
export { ChefDashboard, ChefLayout } from './pages/chef-etablissement';

// Hooks
export { useCurrentUser } from './hooks/useCurrentUser';
export { useUserModules, useModuleDetails, useFilteredModules } from './hooks/useUserModules';
export { useUserCategories, useCategoryModules } from './hooks/useUserCategories';
export { useUserStats, useUserSchools, useGroupUsers } from './hooks/useUserStats';
export { 
  useSchoolStats, 
  useSchoolInfo, 
  useSchoolStaff, 
  useSchoolStudents, 
  useSchoolClasses 
} from './hooks/useSchoolStats';
export { 
  useHasModule, 
  useHasModules, 
  useAssignedModuleSlugs,
  MODULE_FEATURES,
  type ModuleSlug
} from './hooks/useHasModule';
