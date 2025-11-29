/**
 * useUserProfile - Hooks React Query pour profil utilisateur
 * Gère préférences, notifications, sessions et sécurité
 * @module useUserProfile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// =====================================================
// QUERY KEYS - Centralisées pour invalidation cohérente
// =====================================================
export const userProfileKeys = {
  all: ['user-profile'] as const,
  preferences: (userId: string) => ['user-preferences', userId] as const,
  notifications: (userId: string) => ['notification-settings', userId] as const,
  loginHistory: (userId: string, limit: number) => ['login-history', userId, limit] as const,
  sessions: (userId: string) => ['active-sessions', userId] as const,
  security: (userId: string) => ['user-security', userId] as const,
  complete: (userId: string) => ['complete-profile', userId] as const,
};

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
  accent_color?: string;
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

/** Paramètres pour mise à jour des préférences */
export interface UpdatePreferencesInput {
  p_user_id: string;
  p_language?: string;
  p_timezone?: string;
  p_theme?: string;
}

/** Paramètres pour mise à jour des notifications */
export interface UpdateNotificationsInput {
  p_user_id: string;
  p_email_enabled?: boolean;
  p_push_enabled?: boolean;
  p_sms_enabled?: boolean;
  p_email_weekly_report?: boolean;
  p_email_monthly_report?: boolean;
}

/** Paramètres pour toggle 2FA */
export interface Toggle2FAInput {
  p_user_id: string;
  p_enabled: boolean;
  p_method?: 'app' | 'sms' | 'email';
}

// =====================================================
// CONSTANTES
// =====================================================
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

// =====================================================
// HOOKS: PRÉFÉRENCES
// =====================================================
export const useUserPreferences = (userId: string | undefined) => {
  return useQuery({
    queryKey: userProfileKeys.preferences(userId || ''),
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!userId) return null;
      
      const { data, error } = await (supabase as any)
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      // PGRST116 = pas de données trouvées (normal pour nouveau user)
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement préférences:', error);
        throw error;
      }
      
      return data as UserPreferences | null;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdatePreferencesInput) => {
      const { data: result, error } = await (supabase.rpc as any)(
        'update_user_preferences', 
        input
      );
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: userProfileKeys.preferences(variables.p_user_id) 
      });
      toast.success('Préférences mises à jour ⚙️');
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour préférences:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
};

// =====================================================
// HOOKS: NOTIFICATIONS
// =====================================================
export const useNotificationSettings = (userId: string | undefined) => {
  return useQuery({
    queryKey: userProfileKeys.notifications(userId || ''),
    queryFn: async (): Promise<NotificationSettings | null> => {
      if (!userId) return null;
      
      const { data, error } = await (supabase as any)
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      // PGRST116 = pas de données trouvées (normal pour nouveau user)
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement notifications:', error);
        throw error;
      }
      
      return data as NotificationSettings | null;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
  });
};

export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateNotificationsInput) => {
      const { data: result, error } = await (supabase.rpc as any)(
        'update_notification_settings', 
        input
      );
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: userProfileKeys.notifications(variables.p_user_id) 
      });
      toast.success('Notifications mises à jour 🔔');
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour notifications:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
};

// =====================================================
// HOOKS: HISTORIQUE CONNEXIONS
// =====================================================
export const useLoginHistory = (userId: string | undefined, limit = 50) => {
  return useQuery({
    queryKey: userProfileKeys.loginHistory(userId || '', limit),
    queryFn: async (): Promise<LoginHistoryEntry[]> => {
      if (!userId) return [];
      
      const { data, error } = await (supabase.rpc as any)('get_login_history', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: 0,
      });
      
      if (error) {
        console.error('Erreur chargement historique:', error);
        throw error;
      }
      
      return (data || []) as LoginHistoryEntry[];
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
  });
};

// =====================================================
// HOOKS: SESSIONS ACTIVES
// =====================================================
export interface ActiveSession {
  id: string;
  user_id: string;
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  last_activity?: string;
  created_at: string;
}

export const useActiveSessions = (userId: string | undefined) => {
  return useQuery({
    queryKey: userProfileKeys.sessions(userId || ''),
    queryFn: async (): Promise<ActiveSession[]> => {
      if (!userId) return [];
      
      const { data, error } = await (supabase.rpc as any)('get_active_sessions', {
        p_user_id: userId,
      });
      
      if (error) {
        console.error('Erreur chargement sessions:', error);
        throw error;
      }
      
      return (data || []) as ActiveSession[];
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 secondes (sessions changent souvent)
    gcTime: GC_TIME,
    retry: 1,
  });
};

export const useTerminateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, sessionId }: { userId: string; sessionId: string }) => {
      const { data, error } = await (supabase.rpc as any)('terminate_session', {
        p_user_id: userId,
        p_session_id: sessionId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: userProfileKeys.sessions(variables.userId) 
      });
      toast.success('Session déconnectée 🔌');
    },
    onError: (error: Error) => {
      console.error('Erreur terminaison session:', error);
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
    mutationFn: async (input: Toggle2FAInput) => {
      const { data: result, error } = await (supabase.rpc as any)(
        'toggle_two_factor_auth', 
        input
      );
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: userProfileKeys.security(variables.p_user_id) 
      });
      const message = variables.p_enabled 
        ? '2FA activé 🛡️' 
        : '2FA désactivé';
      toast.success(message);
    },
    onError: (error: Error) => {
      console.error('Erreur toggle 2FA:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    },
  });
};

// =====================================================
// HOOKS: PROFIL COMPLET
// =====================================================
export interface CompleteUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  avatar?: string;
  phone?: string;
  school_group_id?: string;
  school_id?: string;
  access_profile_code?: string;
  preferences?: UserPreferences;
  notifications?: NotificationSettings;
  created_at: string;
  updated_at: string;
}

export const useCompleteProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: userProfileKeys.complete(userId || ''),
    queryFn: async (): Promise<CompleteUserProfile | null> => {
      if (!userId) return null;
      
      const { data, error } = await (supabase.rpc as any)('get_complete_user_profile', {
        p_user_id: userId,
      });
      
      if (error) {
        console.error('Erreur chargement profil complet:', error);
        throw error;
      }
      
      return data as CompleteUserProfile | null;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
  });
};
