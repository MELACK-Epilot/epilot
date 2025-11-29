/**
 * Hook principal pour la vue des profils
 * Gère le state, les handlers et la logique métier
 * @module useProfilesView
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAccessProfiles } from './useAccessProfiles';
import { useProfileStats } from './useProfileStats';
import { deleteProfile, ProfileServiceError } from '../services/profile.service';

// ============================================
// TYPES
// ============================================

export type ViewMode = 'grid' | 'list';

export interface AccessProfile {
  id: string;
  code: string;
  name_fr: string;
  description?: string | null;
  permissions?: Record<string, boolean> | null;
  avatar_url?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

interface UseProfilesViewOptions {
  onRefresh?: () => void;
}

// ============================================
// HOOK
// ============================================

export const useProfilesView = ({ onRefresh }: UseProfilesViewOptions = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Data fetching
  const { data: profiles, isLoading } = useAccessProfiles();
  const { stats: profileStats, modulesCounts, isLoading: statsLoading } = useProfileStats();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AccessProfile | null>(null);
  
  // ============================================
  // COMPUTED
  // ============================================
  
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!searchQuery.trim()) return profiles;
    
    const query = searchQuery.toLowerCase();
    return profiles.filter((p: AccessProfile) => 
      p.name_fr.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    );
  }, [profiles, searchQuery]);
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const handleCreateProfile = useCallback(() => {
    setSelectedProfile(null);
    setIsDialogOpen(true);
  }, []);
  
  const handleEditProfile = useCallback((profile: AccessProfile) => {
    setSelectedProfile(profile);
    setIsDialogOpen(true);
  }, []);
  
  const handleAssignProfile = useCallback((profile: AccessProfile) => {
    setSelectedProfile(profile);
    setIsAssignDialogOpen(true);
  }, []);
  
  const handleViewUsers = useCallback((roleCode: string) => {
    navigate(`/dashboard/users?role=${roleCode}`);
  }, [navigate]);
  
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);
  
  const handleCloseAssignDialog = useCallback(() => {
    setIsAssignDialogOpen(false);
  }, []);
  
  // ============================================
  // DELETE MUTATION
  // ============================================
  
  const deleteMutation = useMutation({
    mutationFn: (profileId: string) => deleteProfile(supabase, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast.success('Profil supprimé avec succès');
      onRefresh?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof ProfileServiceError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'Une erreur inattendue est survenue';
      toast.error('Erreur lors de la suppression', { description: message });
    },
  });
  
  const handleDeleteProfile = useCallback((profileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) return;
    deleteMutation.mutate(profileId);
  }, [deleteMutation]);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Data
    profiles: filteredProfiles,
    profileStats,
    modulesCounts,
    isLoading: isLoading || statsLoading,
    
    // UI State
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    
    // Dialog State
    isDialogOpen,
    isAssignDialogOpen,
    selectedProfile,
    
    // Handlers
    handleCreateProfile,
    handleEditProfile,
    handleAssignProfile,
    handleViewUsers,
    handleDeleteProfile,
    handleCloseDialog,
    handleCloseAssignDialog,
    
    // Mutation state
    isDeleting: deleteMutation.isPending,
  };
};
