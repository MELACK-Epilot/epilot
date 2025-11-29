/**
 * Hook personnalisé pour la gestion de la connexion
 * 
 * ✅ OPTIMISÉ pour 8000+ utilisateurs
 * - Utilise RPC get_user_login_data() pour une seule requête DB
 * - Gestion des erreurs robuste
 * - Redirection intelligente selon rôle + profil
 * 
 * @module useLogin
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { LoginCredentials, User } from '../types/auth.types';
import { saveAuthToIndexedDB, clearAuthFromIndexedDB } from '../utils/auth.db';
import { supabase } from '@/lib/supabase';

/** Constantes pour les messages d'erreur */
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  EMAIL_NOT_CONFIRMED: 'Veuillez confirmer votre email avant de vous connecter',
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans quelques minutes',
  USER_NOT_FOUND: 'Utilisateur introuvable',
  ACCOUNT_INACTIVE: 'Votre compte n\'est pas actif. Contactez l\'administrateur',
  PROFILE_ERROR: 'Erreur lors de la récupération du profil',
  UNKNOWN_ERROR: 'Erreur de connexion',
  VALIDATION_ERROR: 'Email et mot de passe requis',
} as const;

/** Interface pour la réponse RPC */
interface LoginRpcResponse {
  success: boolean;
  error?: string;
  message?: string;
  user?: User;
  meta?: {
    modulesCount: number;
    hasAccessProfile: boolean;
    isAdmin: boolean;
  };
}

/**
 * Hook pour gérer la connexion utilisateur
 * Optimisé pour la performance avec 8000+ utilisateurs
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setUser, setToken } = useAuthStore();

  /**
   * Traduit les erreurs Supabase Auth en messages utilisateur
   */
  const translateAuthError = useCallback((errorMessage: string): string => {
    switch (errorMessage) {
      case 'Invalid login credentials':
        return ERROR_MESSAGES.INVALID_CREDENTIALS;
      case 'Email not confirmed':
        return ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
      case 'Too many requests':
        return ERROR_MESSAGES.TOO_MANY_REQUESTS;
      default:
        return errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }, []);

  /**
   * Fonction de connexion avec Supabase Auth
   * ✅ Optimisée avec RPC pour une seule requête DB
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // ============================================
      // ÉTAPE 1: Validation des entrées
      // ============================================
      if (!credentials.email?.trim() || !credentials.password) {
        throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
      }

      // ============================================
      // ÉTAPE 2: Authentification Supabase
      // ============================================
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      if (authError) {
        throw new Error(translateAuthError(authError.message));
      }

      if (!authData.user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // ============================================
      // ÉTAPE 3: Récupérer les données via RPC optimisée
      // ============================================
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('get_user_login_data', { p_user_id: authData.user.id });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(ERROR_MESSAGES.PROFILE_ERROR);
      }

      const response = rpcData as LoginRpcResponse;

      // Vérifier la réponse RPC
      if (!response || !response.success) {
        const errorCode = response?.error;
        switch (errorCode) {
          case 'USER_NOT_FOUND':
            throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
          case 'ACCOUNT_INACTIVE':
            throw new Error(ERROR_MESSAGES.ACCOUNT_INACTIVE);
          default:
            throw new Error(response?.message || ERROR_MESSAGES.PROFILE_ERROR);
        }
      }

      if (!response.user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // ============================================
      // ÉTAPE 4: Construire l'objet utilisateur
      // ============================================
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName || 'Utilisateur',
        lastName: response.user.lastName || '',
        role: response.user.role,
        avatar: response.user.avatar,
        gender: response.user.gender,
        dateOfBirth: response.user.dateOfBirth,
        phone: response.user.phone,
        schoolGroupId: response.user.schoolGroupId,
        schoolGroupName: response.user.schoolGroupName,
        schoolGroupLogo: response.user.schoolGroupLogo,
        schoolId: response.user.schoolId,
        createdAt: response.user.createdAt,
        lastLogin: response.user.lastLogin,
        accessProfileCode: response.user.accessProfileCode,
        accessProfileName: response.user.accessProfileName,
      };

      // 🔍 Debug: Afficher les infos de connexion
      if (import.meta.env.DEV) {
        console.log('🔐 Login Success:', {
          email: user.email,
          role: user.role,
          accessProfileCode: user.accessProfileCode,
          modulesCount: response.meta?.modulesCount,
          isAdmin: response.meta?.isAdmin,
          hasProfile: response.meta?.hasAccessProfile,
        });
      }

      // ============================================
      // ÉTAPE 5: Mettre à jour le store Zustand
      // ============================================
      const store = useAuthStore.getState();
      store.setToken(authData.session?.access_token || '', authData.session?.refresh_token);
      store.setUser(user);

      // ============================================
      // ÉTAPE 6: Persistance IndexedDB (si "Se souvenir")
      // ============================================
      if (credentials.rememberMe) {
        await saveAuthToIndexedDB({
          email: credentials.email,
          token: authData.session?.access_token || '',
          refreshToken: authData.session?.refresh_token || '',
          user: user,
          rememberMe: true,
          expiresAt: Date.now() + (authData.session?.expires_in || 3600) * 1000,
          createdAt: Date.now(),
        });
      } else {
        await clearAuthFromIndexedDB();
      }

      // ============================================
      // ÉTAPE 7: Redirection intelligente
      // ============================================
      const isAdmin = response.meta?.isAdmin ?? false;
      const hasAccessProfile = response.meta?.hasAccessProfile ?? false;

      if (isAdmin) {
        console.log('🔄 Redirection Admin → /dashboard');
        navigate('/dashboard', { replace: true });
      } else if (hasAccessProfile) {
        console.log('🔄 Redirection Utilisateur avec profil → /user');
        navigate('/user', { replace: true });
      } else {
        console.log('🔄 Redirection Utilisateur sans profil → / (ProfilePendingPage)');
        navigate('/', { replace: true });
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      console.error('Login error:', err);

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [navigate, translateAuthError]);

  /**
   * Connexion avec mock (pour développement)
   */
  const loginWithMock = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simuler un délai réseau
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock: Vérifier les identifiants
      if (credentials.email === 'admin@epilot.cg' && credentials.password === 'admin123') {
        const mockUser = {
          id: '1',
          email: 'admin@epilot.cg',
          firstName: 'Admin',
          lastName: 'E-Pilot',
          role: 'super_admin' as any, // UserRole.SUPER_ADMIN
          avatar: 'https://ui-avatars.com/api/?name=Admin+E-Pilot&background=00A3E0&color=fff',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        const mockToken = 'mock-jwt-token-' + Date.now();
        const mockRefreshToken = 'mock-refresh-token-' + Date.now();

        // Mettre à jour le store
        setToken(mockToken, mockRefreshToken);
        setUser(mockUser);

        // Sauvegarder si "Se souvenir de moi"
        if (credentials.rememberMe) {
          await saveAuthToIndexedDB({
            email: credentials.email,
            token: mockToken,
            refreshToken: mockRefreshToken,
            user: mockUser,
            rememberMe: true,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
            createdAt: Date.now(),
          });
        }

        // Redirection
        navigate('/dashboard', { replace: true });

        return { success: true };
      } else {
        throw new Error('Email ou mot de passe incorrect');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Effacer les erreurs
   */
  const clearError = () => {
    setError(null);
  };

  return {
    login,
    loginWithMock, // Pour le développement
    isLoading,
    error,
    clearError,
  };
};
