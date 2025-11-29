/**
 * ProfileFormDialog - Dialog pour créer/modifier un profil d'accès
 * 
 * Architecture modulaire:
 * - useProfileForm: Hook principal (data fetching, state, mutation)
 * - ProfileIdentitySection: Avatar upload
 * - ProfileInfoSection: Nom, code, description
 * - ProfileModulesSection: Configuration des modules
 * 
 * @module ProfileFormDialog
 */

import { Loader2, User as UserIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProfileForm, type ProfileToEdit } from '../../hooks/useProfileForm';
import {
  ProfileIdentitySection,
  ProfileInfoSection,
  ProfileModulesSection,
} from './profile-form';

// ============================================
// TYPES
// ============================================

interface ProfileFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: ProfileToEdit | null;
}

// ============================================
// COMPONENT (Pure UI - ~100 lignes)
// ============================================

export const ProfileFormDialog = ({
  isOpen,
  onClose,
  profileToEdit,
}: ProfileFormDialogProps) => {
  // Hook principal - toute la logique est encapsulée
  const {
    form,
    currentProfile,
    categories,
    permissions,
    setPermissions,
    isCustomRole,
    setIsCustomRole,
    avatarPreview,
    setEmojiIcon,
    activeCount,
    isDataLoading,
    handleAvatarChange,
    mutation,
  } = useProfileForm({ isOpen, onClose, profileToEdit });

  // Handler de soumission
  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#1D3557]">
            <UserIcon className={`w-6 h-6 ${currentProfile ? 'text-[#2A9D8F]' : 'text-[#1D3557]'}`} />
            {currentProfile ? 'Modifier le profil' : 'Créer un nouveau profil'}
          </DialogTitle>
          <DialogDescription>
            Définissez les informations générales et les accès aux modules pour ce profil.
          </DialogDescription>
        </DialogHeader>

        {/* Content - Scroll natif */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <form id="profile-form" onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Colonne 1: Identité Visuelle */}
              <div className="lg:col-span-1">
                <ProfileIdentitySection
                  avatarPreview={avatarPreview}
                  onAvatarChange={handleAvatarChange}
                  profileName={form.watch('name_fr')}
                />
              </div>

              {/* Colonnes 2-3: Formulaire */}
              <div className="lg:col-span-2 space-y-6">
                {/* Section Informations */}
                <ProfileInfoSection
                  form={form}
                  isEditing={!!currentProfile}
                  isCustomRole={isCustomRole}
                  setIsCustomRole={setIsCustomRole}
                  setEmojiIcon={setEmojiIcon}
                />

                {/* Section Modules */}
                <ProfileModulesSection
                  categories={categories}
                  permissions={permissions}
                  setPermissions={setPermissions}
                  activeCount={activeCount}
                  isLoading={isDataLoading}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="profile-form"
            disabled={mutation.isPending}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#1D3557] hover:from-[#238276] hover:to-[#152a45]"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentProfile ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              currentProfile ? 'Mettre à jour le profil' : 'Créer le profil'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
