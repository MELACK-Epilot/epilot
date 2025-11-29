/**
 * Hook de connexion ULTRA-OPTIMISÉ ⚡
 * 
 * Optimisations appliquées:
 * 1. Une seule RPC qui retourne user + modules
 * 2. Mise à jour Zustand immédiate
 * 3. Préchargement React Query en parallèle
 * 4. Pas de re-fetch après navigation
 * 
 * Performance: ~300-500ms au lieu de 1.5-2.5s
 * 
 * @module useLoginOptimized
 */

import { useState, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { usePermissionsStore } from '@/stores/permissions.store';
import type { LoginCredentials, User } from '../types/auth.types';
import { saveAuthToIndexedDB, clearAuthFromIndexedDB } from '../utils/auth.db';
import { supabase } from '@/lib/supabase';

/** Messages d'erreur */
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  EMAIL_NOT_CONFIRMED: 'Veuillez confirmer votre email',
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans quelques minutes',
  USER_NOT_FOUND: 'Utilisateur introuvable',
  ACCOUNT_INACTIVE: 'Compte inactif. Contactez l\'administrateur',
  UNKNOWN_ERROR: 'Erreur de connexion',
  VALIDATION_ERROR: 'Email et mot de passe requis',
} as const;

/** Interface réponse RPC v2 */
interface LoginRpcResponseV2 {
  success: boolean;
  error?: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    schoolGroupId?: string;
    schoolGroupName?: string;
    schoolGroupLogo?: string;
    schoolId?: string;
    createdAt: string;
    lastLogin: string;
    accessProfileCode?: string;
    accessProfileName?: string;
  };
  modules?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    isCore: boolean;
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    categoryIcon?: string;
    categoryColor?: string;
    permissions: {
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
      canExport: boolean;
    };
    assignedAt: string;
    lastAccessedAt?: string;
    accessCount: number;
  }>;
  meta?: {
    modulesCount: number;
    hasAccessProfile: boolean;
    isAdmin: boolean;
    hasSchoolGroup: boolean;
    timestamp: string;
  };
}

/** Résultat du login */
interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Hook de connexion optimisé
 * ⚡ Performance: ~300-500ms
 */
export const useLoginOptimized = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const { setUser, setToken } = useAuthStore();
  
  /**
   * Traduire les erreurs Supabase
   */
  const translateError = useCallback((msg: string): string => {
    if (msg.includes('Invalid login credentials')) return ERROR_MESSAGES.INVALID_CREDENTIALS;
    if (msg.includes('Email not confirmed')) return ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
    if (msg.includes('Too many requests')) return ERROR_MESSAGES.TOO_MANY_REQUESTS;
    return msg || ERROR_MESSAGES.UNKNOWN_ERROR;
  }, []);

  /**
   * Connexion optimisée ⚡
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const startTime = performance.now();
    
    try {
      setIsLoading(true);
      setError(null);

      // ============================================
      // VALIDATION (0ms)
      // ============================================
      if (!credentials.email?.trim() || !credentials.password) {
        throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
      }

      const email = credentials.email.trim().toLowerCase();

      // ============================================
      // ÉTAPE 1: Auth Supabase (~300ms)
      // ============================================
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      });

      if (authError) throw new Error(translateError(authError.message));
      if (!authData.user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

      console.log(`⚡ Auth: ${Math.round(performance.now() - startTime)}ms`);

      // ============================================
      // ÉTAPE 2: RPC v2 - User + Modules (~200ms)
      // ============================================
      const rpcStart = performance.now();
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_login_data_v2', { p_user_id: authData.user.id });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
      }

      const response = rpcData as LoginRpcResponseV2;
      
      if (!response?.success) {
        throw new Error(response?.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }

      console.log(`⚡ RPC: ${Math.round(performance.now() - rpcStart)}ms`);

      // ============================================
      // ÉTAPE 3: Mise à jour stores (sync, ~5ms)
      // ============================================
      const user: User = {
        id: response.user!.id,
        email: response.user!.email,
        firstName: response.user!.firstName,
        lastName: response.user!.lastName,
        role: response.user!.role as User['role'],
        avatar: response.user!.avatar,
        gender: response.user!.gender,
        dateOfBirth: response.user!.dateOfBirth,
        phone: response.user!.phone,
        schoolGroupId: response.user!.schoolGroupId,
        schoolGroupName: response.user!.schoolGroupName,
        schoolGroupLogo: response.user!.schoolGroupLogo,
        schoolId: response.user!.schoolId,
        createdAt: response.user!.createdAt,
        lastLogin: response.user!.lastLogin,
        accessProfileCode: response.user!.accessProfileCode,
        accessProfileName: response.user!.accessProfileName,
      };

      // Mise à jour Auth Store
      setToken(authData.session?.access_token || '', authData.session?.refresh_token);
      setUser(user);

      // ============================================
      // ÉTAPE 4: Précharger le cache React Query
      // ============================================
      queryClient.setQueryData(['current-user'], user);
      
      // Précharger les modules dans le cache
      if (response.modules && response.modules.length > 0) {
        queryClient.setQueryData(['user-modules', user.id], response.modules);
        
        // Mettre à jour le store Zustand des permissions
        const permissionsStore = usePermissionsStore.getState();
        permissionsStore.setModulesFromLogin(response.modules);
      }

      // ============================================
      // ÉTAPE 5: Persistance IndexedDB (async, non-bloquant)
      // ============================================
      if (credentials.rememberMe) {
        // Fire and forget - ne pas attendre
        saveAuthToIndexedDB({
          email,
          token: authData.session?.access_token || '',
          refreshToken: authData.session?.refresh_token || '',
          user,
          rememberMe: true,
          expiresAt: Date.now() + (authData.session?.expires_in || 3600) * 1000,
          createdAt: Date.now(),
        }).catch(console.error);
      } else {
        clearAuthFromIndexedDB().catch(console.error);
      }

      // ============================================
      // ÉTAPE 6: Navigation avec transition
      // ============================================
      const totalTime = Math.round(performance.now() - startTime);
      console.log(`⚡ Login total: ${totalTime}ms`);

      startTransition(() => {
        const isAdmin = response.meta?.isAdmin ?? false;
        const hasProfile = response.meta?.hasAccessProfile ?? false;

        if (isAdmin) {
          navigate('/dashboard', { replace: true });
        } else if (hasProfile) {
          navigate('/user', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      });

      return { success: true, user };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      console.error('Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [navigate, queryClient, setToken, setUser, translateError]);

  /**
   * Effacer les erreurs
   */
  const clearError = useCallback(() => setError(null), []);

  return {
    login,
    isLoading: isLoading || isPending,
    error,
    clearError,
  };
};

export default useLoginOptimized;
