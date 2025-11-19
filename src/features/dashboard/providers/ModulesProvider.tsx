/**
 * Provider pour la gestion des modules
 * Fournit le contexte et les hooks pour les opérations sur les modules
 * @module ModulesProvider
 */

import { createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useModulesStore } from '../store/modules.store';
import {
  useAssignModule,
  useRevokeModule,
  useAssignCategory,
  useBulkAssignModules,
} from '../hooks/useModuleAssignment';

interface ModulesContextValue {
  // Actions d'assignation
  assignModule: (params: AssignModuleParams) => Promise<void>;
  assignModules: (params: BulkAssignModulesParams) => Promise<any>;
  assignCategory: (params: AssignCategoryParams) => Promise<any>;
  revokeModule: (params: RevokeModuleParams) => Promise<void>;
  
  // État
  isAssigning: boolean;
  progress: number;
  
  // Utilitaires
  clearSelection: () => void;
  invalidateQueries: (userId: string) => void;
}

interface AssignModuleParams {
  userId: string;
  moduleId: string;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

interface BulkAssignModulesParams {
  userId: string;
  moduleIds: string[];
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

interface AssignCategoryParams {
  userId: string;
  categoryId: string;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

interface RevokeModuleParams {
  userId: string;
  moduleId: string;
}

const ModulesContext = createContext<ModulesContextValue | undefined>(undefined);

export const ModulesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { clearSelection, setIsAssigning, setAssignmentProgress, isAssigning, assignmentProgress } = useModulesStore();
  
  // Mutations
  const assignModuleMutation = useAssignModule();
  const revokeModuleMutation = useRevokeModule();
  const assignCategoryMutation = useAssignCategory();
  const bulkAssignMutation = useBulkAssignModules();

  // Invalider les queries
  const invalidateQueries = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', userId] });
    queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
  };

  // Assigner un module
  const assignModule = async (params: AssignModuleParams) => {
    try {
      setIsAssigning(true);
      
      await assignModuleMutation.mutateAsync({
        userId: params.userId,
        moduleId: params.moduleId,
        permissions: params.permissions,
      });
      
      toast.success('Module assigné avec succès');
      invalidateQueries(params.userId);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de l\'assignation';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAssigning(false);
    }
  };

  // Assigner plusieurs modules
  const assignModules = async (params: BulkAssignModulesParams) => {
    try {
      setIsAssigning(true);
      setAssignmentProgress(0);
      
      const result = await bulkAssignMutation.mutateAsync({
        userId: params.userId,
        moduleIds: params.moduleIds,
        permissions: params.permissions,
      });
      
      if (result.failed > 0) {
        toast.warning(`${result.assigned} assigné(s), ${result.failed} échec(s)`);
      } else {
        toast.success(`${result.assigned} module(s) assigné(s) avec succès`);
      }
      
      invalidateQueries(params.userId);
      clearSelection();
      
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de l\'assignation';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAssigning(false);
      setAssignmentProgress(0);
    }
  };

  // Assigner une catégorie
  const assignCategory = async (params: AssignCategoryParams) => {
    try {
      setIsAssigning(true);
      
      const result = await assignCategoryMutation.mutateAsync({
        userId: params.userId,
        categoryId: params.categoryId,
        permissions: params.permissions,
      });
      
      if (result.skipped > 0) {
        toast.success(`${result.assigned} module(s) assigné(s), ${result.skipped} déjà assigné(s)`);
      } else {
        toast.success(`Catégorie assignée: ${result.assigned} module(s)`);
      }
      
      invalidateQueries(params.userId);
      
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de l\'assignation de la catégorie';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAssigning(false);
    }
  };

  // Révoquer un module
  const revokeModule = async (params: RevokeModuleParams) => {
    try {
      setIsAssigning(true);
      
      await revokeModuleMutation.mutateAsync({
        userId: params.userId,
        moduleId: params.moduleId,
      });
      
      toast.success('Module révoqué avec succès');
      invalidateQueries(params.userId);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de la révocation';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAssigning(false);
    }
  };

  const value: ModulesContextValue = {
    assignModule,
    assignModules,
    assignCategory,
    revokeModule,
    isAssigning,
    progress: assignmentProgress,
    clearSelection,
    invalidateQueries,
  };

  return (
    <ModulesContext.Provider value={value}>
      {children}
    </ModulesContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useModules = () => {
  const context = useContext(ModulesContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
};
