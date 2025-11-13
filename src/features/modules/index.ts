/**
 * Barrel export pour le module modules
 */

// Types
export * from './types/module.types';

// Hooks
export * from './hooks/useUserModules';
export * from './hooks/useAssignModule';
export * from './hooks/useAvailableModules';

// Components
export { ModuleCard } from './components/ModuleCard';
export { CategoryCard } from './components/CategoryCard';
export { ProtectedModule, useRequireModuleAccess } from './components/ProtectedModule';
export { ModuleAssignDialog } from './components/ModuleAssignDialog';
export { ModuleList } from './components/ModuleList';
