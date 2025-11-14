/**
 * Provider React pour le contexte des modules
 * Utilise les meilleures pratiques avec Context + Zustand
 * @module ModuleWorkspaceProvider
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useModuleWorkspaceStore } from '../stores/module-workspace.store';
import type { ModuleContext } from '@/features/user-space/utils/module-navigation';

/**
 * Interface pour le contexte du Provider
 */
interface ModuleWorkspaceContextValue {
  context: ModuleContext | null;
  isLoading: boolean;
  error: string | null;
  moduleData: any | null;
}

/**
 * Contexte React pour les modules
 */
const ModuleWorkspaceContext = createContext<ModuleWorkspaceContextValue | null>(null);

/**
 * Props du Provider
 */
interface ModuleWorkspaceProviderProps {
  children: ReactNode;
}

/**
 * Provider pour gérer le contexte des modules
 * Synchronise automatiquement avec le store Zustand
 */
export function ModuleWorkspaceProvider({ children }: ModuleWorkspaceProviderProps) {
  const location = useLocation();
  const setContext = useModuleWorkspaceStore((state) => state.setContext);
  const currentContext = useModuleWorkspaceStore((state) => state.currentContext);
  const isLoading = useModuleWorkspaceStore((state) => state.isLoading);
  const error = useModuleWorkspaceStore((state) => state.error);
  const moduleData = useModuleWorkspaceStore((state) => state.moduleData);

  // Synchroniser le contexte depuis la navigation
  useEffect(() => {
    const navigationContext = location.state as ModuleContext | null;
    
    if (navigationContext && navigationContext.moduleId) {
      console.log('🔄 [Provider] Synchronisation contexte depuis navigation');
      setContext(navigationContext);
    }
  }, [location.state, setContext]);

  const value: ModuleWorkspaceContextValue = {
    context: currentContext,
    isLoading,
    error,
    moduleData,
  };

  return (
    <ModuleWorkspaceContext.Provider value={value}>
      {children}
    </ModuleWorkspaceContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte du module
 * @throws Error si utilisé hors du Provider
 */
export function useModuleWorkspace() {
  const context = useContext(ModuleWorkspaceContext);
  
  if (!context) {
    throw new Error('useModuleWorkspace doit être utilisé dans un ModuleWorkspaceProvider');
  }
  
  return context;
}

/**
 * Hook pour accéder au store Zustand directement
 * Utile pour les actions
 */
export function useModuleWorkspaceActions() {
  return {
    loadModuleData: useModuleWorkspaceStore((state) => state.loadModuleData),
    updateModuleData: useModuleWorkspaceStore((state) => state.updateModuleData),
    clearContext: useModuleWorkspaceStore((state) => state.clearContext),
    reset: useModuleWorkspaceStore((state) => state.reset),
  };
}
