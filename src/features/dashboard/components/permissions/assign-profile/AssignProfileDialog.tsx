/**
 * Dialogue d'assignation de profil aux utilisateurs
 * Composant orchestrateur - logique déléguée aux hooks
 * 
 * @module assign-profile/AssignProfileDialog
 * @optimized Pour 8900+ utilisateurs avec virtualisation
 */

import { useCallback } from 'react';
import { Users, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { useCurrentUserGroup } from '../../../hooks/useCurrentUserGroup';
import { useAssignableUsers, useAssignProfileMutation, useAssignProfileState } from './hooks';
import { AssignProfileSearch, AssignProfileUserList, ConflictAlertDialog } from './components';
import type { AssignProfileDialogProps } from './types';

export const AssignProfileDialog = ({
  isOpen,
  onClose,
  role,
}: AssignProfileDialogProps) => {
  // Récupérer le groupe scolaire
  const { data: currentGroup, isLoading: groupLoading } = useCurrentUserGroup();

  // State management
  const state = useAssignProfileState({
    isOpen,
    users: [],
    profileCode: role?.code,
  });

  // Charger les utilisateurs avec recherche serveur
  const { data: users = [], isLoading: usersLoading } = useAssignableUsers(
    currentGroup?.id,
    isOpen && !!currentGroup?.id,
    state.debouncedSearch
  );

  // Réinitialiser le state avec les vrais utilisateurs
  const stateWithUsers = useAssignProfileState({
    isOpen,
    users,
    profileCode: role?.code,
  });

  // Mutation
  const assignMutation = useAssignProfileMutation();

  const isLoading = groupLoading || usersLoading;
  const isSaving = assignMutation.isPending;

  // Handler pour exécuter l'assignation
  const executeAssignment = useCallback(async () => {
    if (!role?.code) return;
    stateWithUsers.setIsAlertOpen(false);

    const { toAdd, toRemove } = stateWithUsers.getDiffs();

    if (toAdd.length === 0 && toRemove.length === 0) {
      toast.info('Aucune modification');
      onClose();
      return;
    }

    try {
      const result = await assignMutation.mutateAsync({
        profileCode: role.code,
        toAdd,
        toRemove,
      });

      toast.success('Mise à jour réussie', {
        description: `${result.added} assigné(s), ${result.removed} retiré(s).`,
      });

      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur assignation:', error);
      toast.error("Erreur lors de l'assignation", { description: message });
    }
  }, [role, stateWithUsers, assignMutation, onClose]);

  // Handler pour vérifier les conflits avant assignation
  const handleCheckConflicts = useCallback(() => {
    const conflicts = stateWithUsers.checkConflicts();

    if (conflicts.length > 0) {
      stateWithUsers.setConflictingUsers(conflicts);
      stateWithUsers.setIsAlertOpen(true);
    } else {
      executeAssignment();
    }
  }, [stateWithUsers, executeAssignment]);

  if (!role) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-[#1D3557]" />
              Assigner le profil
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les utilisateurs à basculer vers le rôle{' '}
              <span className="font-bold text-gray-900">{role.name_fr}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Search & Stats */}
          <AssignProfileSearch
            searchQuery={stateWithUsers.searchQuery}
            onSearchChange={stateWithUsers.setSearchQuery}
            stats={stateWithUsers.stats}
            isAllSelected={users.length > 0 && stateWithUsers.selectedUsers.size === users.length}
            onSelectAll={stateWithUsers.handleSelectAll}
            disabled={users.length === 0}
          />

          {/* User List */}
          <AssignProfileUserList
            users={users}
            selectedUsers={stateWithUsers.selectedUsers}
            currentProfileCode={role.code}
            isLoading={isLoading}
            searchQuery={stateWithUsers.searchQuery}
            onToggleUser={stateWithUsers.handleToggleUser}
          />

          {/* Footer */}
          <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-400">
                {stateWithUsers.stats.total} utilisateurs au total
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCheckConflicts}
                  disabled={isSaving || (stateWithUsers.stats.toAdd === 0 && stateWithUsers.stats.toRemove === 0)}
                  className="bg-[#1D3557] hover:bg-[#162942] gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Appliquer les modifications
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Alert */}
      <ConflictAlertDialog
        isOpen={stateWithUsers.isAlertOpen}
        onOpenChange={stateWithUsers.setIsAlertOpen}
        conflictingUsers={stateWithUsers.conflictingUsers}
        targetProfileName={role.name_fr}
        targetProfileCode={role.code}
        onConfirm={executeAssignment}
        isSaving={isSaving}
      />
    </>
  );
};
