/**
 * Store Zustand pour la gestion de l'état d'authentification
 * @module auth.store
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, AuthActions, User } from '../types/auth.types';

/**
 * Store d'authentification avec persistance localStorage
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Connexion utilisateur (logique déléguée au hook useLogin)
       */
      login: async () => {
        // Cette méthode est gérée par le hook useLogin
        // Elle est ici pour la cohérence du type
        throw new Error('Use useLogin hook for login logic');
      },

      /**
       * Déconnexion utilisateur
       */
      logout: () => {
        // Nettoyer le localStorage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-refresh-token');
        
        // Réinitialiser l'état
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      /**
       * Rafraîchir le token d'authentification
       */
      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          set({ isLoading: true, error: null });

          // TODO: Remplacer par l'appel API réel
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          get().setToken(data.token, data.refreshToken);
          set({ isLoading: false });
        } catch (error) {
          console.error('Refresh auth error:', error);
          set({ 
            error: 'Session expirée. Veuillez vous reconnecter.',
            isLoading: false 
          });
          get().logout();
        }
      },

      /**
       * Définir l'utilisateur connecté
       */
      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          error: null 
        });
      },

      /**
       * Définir les tokens d'authentification
       */
      setToken: (token: string, refreshToken?: string) => {
        // Stocker dans localStorage
        localStorage.setItem('auth-token', token);
        if (refreshToken) {
          localStorage.setItem('auth-refresh-token', refreshToken);
        }

        set({ 
          token, 
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          error: null 
        });
      },

      /**
       * Effacer les erreurs
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Vérifier si l'utilisateur est authentifié
       */
      checkAuth: () => {
        const { token, user } = get();
        return !!(token && user);
      },
    }),
    {
      name: 'e-pilot-auth', // Clé localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Ne persister que les données essentielles
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hook pour accéder aux données d'authentification
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
    checkAuth,
    setUser,
  };
};

/**
 * Hook pour obtenir le token d'authentification
 */
export const useAuthToken = () => {
  return useAuthStore((state) => state.token);
};
