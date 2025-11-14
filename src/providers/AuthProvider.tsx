/**
 * Provider d'authentification avec gestion des événements Supabase
 * @module AuthProvider
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { LoadingPage } from '@/components/LoadingState';

interface AuthContextValue {
  // Le contexte expose directement le store
  // Les composants peuvent utiliser useAuthStore() directement
}

const AuthContext = createContext<AuthContextValue>({});

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider d'authentification
 * Gère l'initialisation et les événements auth de Supabase
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  const reset = useAuthStore((state) => state.reset);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // 1. Vérifier l'authentification au montage
    checkAuth();

    // 2. Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', { event });

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              // Récupérer les données utilisateur
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error) {
                logger.error('Failed to fetch user data', error);
                reset();
              } else {
                setUser(userData as any);
                setSession(session);
              }
            }
            break;

          case 'SIGNED_OUT':
            reset();
            break;

          case 'TOKEN_REFRESHED':
            setSession(session);
            logger.debug('Token refreshed');
            break;

          case 'USER_UPDATED':
            if (session?.user) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (userData) {
                setUser(userData as any);
              }
            }
            break;

          case 'PASSWORD_RECOVERY':
            logger.info('Password recovery initiated');
            break;

          default:
            break;
        }
      }
    );

    // 3. Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth, setUser, setSession, reset]);

  // Afficher un loader pendant la vérification initiale
  if (isLoading) {
    return <LoadingPage />;
  }

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Hooks utilitaires pour l'authentification
 */
export function useAuthUser() {
  return useAuthStore((state) => state.user);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.isAuthenticated);
}

export function useAuthLoading() {
  return useAuthStore((state) => state.isLoading);
}

export function useAuthError() {
  return useAuthStore((state) => state.error);
}

export function useUserRole() {
  return useAuthStore((state) => state.user?.role);
}

export function useSchoolId() {
  return useAuthStore((state) => state.user?.school_id);
}

export function useSchoolGroupId() {
  return useAuthStore((state) => state.user?.school_group_id);
}

export function useUserId() {
  return useAuthStore((state) => state.user?.id);
}
