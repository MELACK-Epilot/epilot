/**
 * Hook principal pour le formulaire de profil
 * Gère le state, la validation et la soumission
 * @module useProfileForm
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAccessProfile } from './useAccessProfiles';
import { useCurrentUserGroup } from './useCurrentUserGroup';
import { useGroupAvailableModules, useAllSystemModules } from './useGroupAvailableModules';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { extractModulePermissions } from '../utils/permissions.utils';
import { 
  createProfile, 
  updateProfile,
  ProfileServiceError,
  type ProfileData,
  type CreateProfileData 
} from '../services/profile.service';
import { DEFAULT_PROFILE_EMOJI } from '../constants/roles.constants';

// ============================================
// SCHEMA
// ============================================

export const profileSchema = z.object({
  name_fr: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  code: z.string()
    .min(3, 'Le code doit contenir au moins 3 caractères')
    .regex(/^[a-z0-9_]+$/, 'Le code ne doit contenir que des lettres minuscules, chiffres et underscores'),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
  icon: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ============================================
// TYPES
// ============================================

/** Type pour le profil en édition */
export interface ProfileToEdit {
  id: string;
  code: string;
  name_fr: string;
  description?: string | null;
  avatar_url?: string | null;
  icon?: string | null;
  permissions?: Record<string, boolean> | null;
}

interface UseProfileFormOptions {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: ProfileToEdit | null;
}

// Return type is inferred from the hook implementation

// ============================================
// HOOK
// ============================================

export const useProfileForm = ({
  isOpen,
  onClose,
  profileToEdit,
}: UseProfileFormOptions) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // ============================================
  // DATA FETCHING
  // ============================================
  
  const { data: freshProfile, isLoading: profileLoading } = useAccessProfile(
    isOpen && profileToEdit?.id ? profileToEdit.id : ''
  );
  
  const { data: currentGroup, isLoading: groupLoading } = useCurrentUserGroup();
  
  const isSuperAdmin = user?.role === 'super_admin' || !currentGroup;
  
  const { data: groupCategories, isLoading: groupModulesLoading } = useGroupAvailableModules();
  const { data: allCategories, isLoading: allModulesLoading } = useAllSystemModules();
  
  // ============================================
  // DERIVED STATE
  // ============================================
  
  const currentProfile = freshProfile || profileToEdit;
  const categories = isSuperAdmin ? allCategories : groupCategories;
  
  const isDataLoading = profileLoading || groupLoading || 
    (isSuperAdmin ? allModulesLoading : groupModulesLoading);
  
  // ============================================
  // LOCAL STATE
  // ============================================
  
  const [permissions, setPermissions] = useState<Record<string, boolean | 'read_only'>>({});
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [emojiIcon, setEmojiIcon] = useState<string>(DEFAULT_PROFILE_EMOJI);
  
  // ============================================
  // FORM
  // ============================================
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: currentProfile ? {
      name_fr: currentProfile.name_fr || '',
      code: currentProfile.code || '',
      description: currentProfile.description || '',
      avatar_url: currentProfile.avatar_url || '',
      icon: currentProfile.icon || DEFAULT_PROFILE_EMOJI,
    } : {
      name_fr: '',
      code: '',
      description: '',
      avatar_url: '',
      icon: DEFAULT_PROFILE_EMOJI,
    },
  });
  
  // ============================================
  // COMPUTED
  // ============================================
  
  const profileModulePermissions = useMemo(() => 
    extractModulePermissions(currentProfile?.permissions as Record<string, unknown> | null),
    [currentProfile?.permissions]
  );
  
  const activeCount = useMemo(() => 
    Object.values(permissions).filter(v => v === true || v === 'read_only').length,
    [permissions]
  );
  
  // ============================================
  // EFFECTS
  // ============================================
  
  // Sync state when profile data changes
  useEffect(() => {
    if (isOpen && currentProfile) {
      setPermissions(profileModulePermissions as Record<string, boolean | 'read_only'>);
      setAvatarPreview(currentProfile.avatar_url || null);
      setEmojiIcon(currentProfile.icon || DEFAULT_PROFILE_EMOJI);
      setIsCustomRole(true);
    }
  }, [isOpen, currentProfile, profileModulePermissions]);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPermissions({});
      setAvatarFile(null);
      setAvatarPreview(null);
      setEmojiIcon(DEFAULT_PROFILE_EMOJI);
      setIsCustomRole(false);
    }
  }, [isOpen]);
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const handleAvatarChange = useCallback((file: File | null, preview: string | null) => {
    setAvatarFile(file);
    setAvatarPreview(preview);
  }, []);
  
  // ============================================
  // MUTATION
  // ============================================
  
  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      // Build profile data
      const profileData: ProfileData = {
        name_fr: values.name_fr.trim(),
        description: values.description?.trim() || null,
        permissions,
        icon: emojiIcon,
        is_active: true,
      };
      
      // Create or Update (client Supabase injecté)
      if (currentProfile?.id) {
        await updateProfile(supabase, currentProfile.id, profileData);
      } else {
        // Vérifier qu'on a un groupe (obligatoire pour créer)
        if (!currentGroup?.id) {
          throw new Error('Groupe scolaire non trouvé. Impossible de créer le profil.');
        }
        
        const createData: CreateProfileData = {
          ...profileData,
          code: values.code.trim().toLowerCase(),
          name_en: values.name_fr.trim(),
          school_group_id: currentGroup.id, // Groupe propriétaire
          created_by: user?.id, // Admin qui crée
        };
        await createProfile(supabase, createData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['access-profile'] });
      toast.success(
        currentProfile 
          ? 'Profil mis à jour avec succès' 
          : 'Nouveau profil créé avec succès'
      );
      onClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof ProfileServiceError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'Une erreur inattendue est survenue';
      toast.error('Erreur', { description: message });
    },
  });
  
  const handleSubmit = useCallback(() => {
    form.handleSubmit((values) => mutation.mutate(values))();
  }, [form, mutation]);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    form,
    currentProfile,
    categories,
    isSuperAdmin,
    permissions,
    setPermissions,
    isCustomRole,
    setIsCustomRole,
    avatarFile,
    avatarPreview,
    emojiIcon,
    setEmojiIcon,
    activeCount,
    isDataLoading,
    handleAvatarChange,
    handleSubmit,
    mutation,
  };
};
