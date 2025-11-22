/**
 * useUserProfile - Hooks React Query pour profil utilisateur
 * @module useUserProfile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// =====================================================
// TYPES
// =====================================================
export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  login_at: string;
  device_type?: string;
  location_city?: string;
  location_country?: string;
  ip_address?: string;
  user_agent?: string;
  status?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: 'fr' | 'en';
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  accent_color: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_weekly_report: boolean;
  email_monthly_report: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS: PRÉFÉRENCES
// =====================================================
export const useUserPreferences = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data as UserPreferences;
    },
    enabled: !!userId,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .rpc('update_user_preferences', data);
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-preferences', variables.p_user_id] 
      });
      toast.success('Préférences mises à jour! ⚙️');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
};

// =====================================================
// HOOKS: NOTIFICATIONS
// =====================================================
export const useNotificationSettings = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['notification-settings', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data as NotificationSettings;
    },
    enabled: !!userId,
  });
};

export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .rpc('update_notification_settings', data);
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['notification-settings', variables.p_user_id] 
      });
      toast.success('Notifications mises à jour! 🔔');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
};

// =====================================================
// HOOKS: HISTORIQUE CONNEXIONS
// =====================================================
export const useLoginHistory = (userId: string | undefined, limit = 50) => {
  return useQuery({
    queryKey: ['login-history', userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .rpc('get_login_history', {
          p_user_id: userId,
          p_limit: limit,
          p_offset: 0,
        });
      
      if (error) throw error;
      return (data || []) as LoginHistoryEntry[];
    },
    enabled: !!userId,
  });
};

// =====================================================
// HOOKS: SESSIONS ACTIVES
// =====================================================
export const useActiveSessions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['active-sessions', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .rpc('get_active_sessions', {
          p_user_id: userId,
        });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useTerminateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, sessionId }: { userId: string; sessionId: string }) => {
      const { data, error } = await supabase
        .rpc('terminate_session', {
          p_user_id: userId,
          p_session_id: sessionId,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['active-sessions', variables.userId] 
      });
      toast.success('Session déconnectée! 🔌');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la déconnexion');
    },
  });
};

// =====================================================
// HOOKS: SÉCURITÉ
// =====================================================
export const useToggle2FA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .rpc('toggle_two_factor_auth', data);
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-security', variables.p_user_id] 
      });
      const message = variables.p_enabled 
        ? '2FA activé! 🛡️' 
        : '2FA désactivé';
      toast.success(message);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la modification');
    },
  });
};

// =====================================================
// HOOKS: PROFIL COMPLET
// =====================================================
export const useCompleteProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['complete-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .rpc('get_complete_user_profile', {
          p_user_id: userId,
        });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
