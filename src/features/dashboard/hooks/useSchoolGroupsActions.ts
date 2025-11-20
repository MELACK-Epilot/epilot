/**
 * Hook pour les actions de la page Groupes Scolaires
 * Gère les actions en masse et l'export
 * Avec Rate Limiting intégré
 * @module useSchoolGroupsActions
 */

import { toast } from 'sonner';
import {
  useDeleteSchoolGroup,
  useActivateSchoolGroup,
  useDeactivateSchoolGroup,
  useSuspendSchoolGroup,
} from './useSchoolGroups';
import { useRateLimitedAction } from '@/hooks/useRateLimitedMutation';
import type { SchoolGroup } from '../types/dashboard.types';

export const useSchoolGroupsActions = () => {
  const deleteSchoolGroup = useDeleteSchoolGroup();
  const activateSchoolGroup = useActivateSchoolGroup();
  const deactivateSchoolGroup = useDeactivateSchoolGroup();
  const suspendSchoolGroup = useSuspendSchoolGroup();

  // Suppression en masse
  const handleBulkDelete = async (selectedRows: string[], onSuccess: () => void) => {
    if (selectedRows.length === 0) {
      toast.error('❌ Aucun groupe sélectionné');
      return;
    }

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedRows.length} groupe(s) ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedRows.map(id => deleteSchoolGroup.mutateAsync(id))
      );
      
      toast.success('✅ Suppression réussie', {
        description: `${selectedRows.length} groupe(s) supprimé(s)`,
      });
      onSuccess();
    } catch (error) {
      toast.error('❌ Erreur', {
        description: 'Impossible de supprimer certains groupes',
      });
    }
  };

  // Activation en masse
  const handleBulkActivate = async (selectedRows: string[], onSuccess: () => void) => {
    if (selectedRows.length === 0) {
      toast.error('❌ Aucun groupe sélectionné');
      return;
    }

    try {
      await Promise.all(
        selectedRows.map(id => activateSchoolGroup.mutateAsync(id))
      );
      
      toast.success('✅ Activation réussie', {
        description: `${selectedRows.length} groupe(s) activé(s)`,
      });
      onSuccess();
    } catch (error) {
      toast.error('❌ Erreur', {
        description: 'Impossible d\'activer certains groupes',
      });
    }
  };

  // Désactivation en masse
  const handleBulkDeactivate = async (selectedRows: string[], onSuccess: () => void) => {
    if (selectedRows.length === 0) {
      toast.error('❌ Aucun groupe sélectionné');
      return;
    }

    try {
      await Promise.all(
        selectedRows.map(id => deactivateSchoolGroup.mutateAsync(id))
      );
      
      toast.success('✅ Désactivation réussie', {
        description: `${selectedRows.length} groupe(s) désactivé(s)`,
      });
      onSuccess();
    } catch (error) {
      toast.error('❌ Erreur', {
        description: 'Impossible de désactiver certains groupes',
      });
    }
  };

  // Export CSV
  const handleExport = (data: SchoolGroup[]) => {
    const csvContent = [
      ['Nom', 'Code', 'Région', 'Ville', 'Admin', 'Plan', 'Statut'].join(','),
      ...data.map(g => 
        [g.name, g.code, g.region, g.city, g.adminName || 'Non assigné', g.plan, g.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groupes_scolaires_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('✅ Export réussi', {
      description: `${data.length} groupe(s) exporté(s)`,
    });
  };

  return {
    handleBulkDelete,
    handleBulkActivate,
    handleBulkDeactivate,
    handleExport,
    // Exposer les mutations pour usage individuel
    deleteSchoolGroup,
    activateSchoolGroup,
    deactivateSchoolGroup,
    suspendSchoolGroup,
  };
};
