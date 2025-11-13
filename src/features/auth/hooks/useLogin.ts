/**
 * Hook personnalisé pour la gestion de la connexion
 * @module useLogin
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { LoginCredentials } from '../types/auth.types';
import { saveAuthToIndexedDB, clearAuthFromIndexedDB } from '../utils/auth.db';
import { supabase } from '@/lib/supabase';

/**
 * Pas de conversion nécessaire - on utilise les rôles directement depuis la BDD
 * Les rôles sont gérés par la configuration centralisée dans config/roles.ts
 */

/**
 * Hook pour gérer la connexion utilisateur
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setUser, setToken } = useAuthStore();

  /**
   * Fonction de connexion avec Supabase Auth
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validation basique
      if (!credentials.email || !credentials.password) {
        throw new Error('Email et mot de passe requis');
      }

      // Connexion avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        // Gestion des erreurs Supabase
        switch (authError.message) {
          case 'Invalid login credentials':
            throw new Error('Email ou mot de passe incorrect');
          case 'Email not confirmed':
            throw new Error('Veuillez confirmer votre email avant de vous connecter');
          case 'Too many requests':
            throw new Error('Trop de tentatives. Réessayez dans quelques minutes');
          default:
            throw new Error(authError.message || 'Erreur de connexion');
        }
      }

      // Vérifier que l'utilisateur existe
      if (!authData.user) {
        throw new Error('Utilisateur introuvable');
      }

      // Récupérer les données utilisateur depuis la table users
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          school_groups(name, logo)
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile data error:', profileError);
        throw new Error('Erreur lors de la récupération du profil: ' + profileError.message);
      }

      if (!profileData) {
        throw new Error('Aucun profil trouvé');
      }

      // Cast pour éviter les erreurs TypeScript avec les types auto-générés
      const profile = profileData as any;

      // Vérifier que le compte est actif
      if (profile.status !== 'active') {
        throw new Error('Votre compte n\'est pas actif. Contactez l\'administrateur');
      }

      // Construire l'objet utilisateur
      const schoolGroup = profile.school_groups as { name: string; logo: string } | null;
      const user = {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name || 'Utilisateur',
        lastName: profile.last_name || '',
        role: profile.role, // ✅ Utiliser le rôle directement depuis la BDD
        avatar: profile.avatar || undefined,
        schoolGroupId: profile.school_group_id || undefined,
        schoolGroupName: schoolGroup?.name || undefined,
        schoolGroupLogo: schoolGroup?.logo || undefined,
        schoolId: profile.school_id || undefined,
        createdAt: profile.created_at,
        lastLogin: profile.last_login || undefined,
      };

      // 🔍 Debug: Afficher les infos de connexion
      console.log('🔐 Login Success:', {
        email: user.email,
        role: user.role,
        schoolGroupId: user.schoolGroupId,
        schoolId: user.schoolId,
        isAdmin: user.role === 'super_admin' || user.role === 'admin_groupe',
      });

      // Mettre à jour le store Zustand
      const { setUser, setToken } = useAuthStore.getState();
      setToken(authData.session?.access_token || '', authData.session?.refresh_token);
      setUser(user);

      // 🔍 DEBUG: Vérifier l'état du store après mise à jour
      await new Promise(resolve => setTimeout(resolve, 100)); // Attendre 100ms
      const storeState = useAuthStore.getState();
      console.log('🔐 Store après connexion:', {
        user: storeState.user ? 'présent' : 'absent',
        email: storeState.user?.email,
        role: storeState.user?.role,
        isAuthenticated: storeState.isAuthenticated,
        token: storeState.token ? 'présent' : 'absent',
      });

      // Sauvegarder dans IndexedDB si "Se souvenir de moi"
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
        // Nettoyer IndexedDB si non coché
        await clearAuthFromIndexedDB();
      }

      // Redirection vers le dashboard
      navigate('/dashboard', { replace: true });

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Login error:', err);

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

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
