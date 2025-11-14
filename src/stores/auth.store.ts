/**
 * Store Zustand pour l'authentification
 * Gestion centralisée de l'état d'authentification avec persistence
 * @module AuthStore
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole =
  | 'super_admin'
  | 'admin_groupe'
  | 'proviseur'
  | 'directeur'
  | 'enseignant'
  | 'secretaire'
  | 'cpe'
  | 'comptable';

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  school_id?: string;
  school_group_id?: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
}

interface AuthState {
  // État
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Méthodes d'authentification
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<AuthUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  
  // Méthodes utilitaires
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  
  // Reset
  reset: () => void;
}

/**
 * Store Zustand d'authentification
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // État initial
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,

        // Setters
        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
          logger.debug('User set', { userId: user?.id, role: user?.role });
        },

        setSession: (session) => {
          set({ session });
          logger.debug('Session set', { hasSession: !!session });
        },

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => {
          set({ error });
          if (error) {
            logger.error('Auth error', new Error(error));
          }
        },

        /**
         * Connexion
         */
        signIn: async (email, password) => {
          set({ isLoading: true, error: null });

          try {
            logger.info('Sign in attempt', { email });

            // 1. Connexion Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user returned');

            // 2. Récupérer les données utilisateur
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (userError) throw userError;
            if (!userData) throw new Error('User not found in database');

            // 3. Mettre à jour le store
            set({
              user: userData as AuthUser,
              session: authData.session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            logger.info('Sign in successful', {
              userId: userData.id,
              role: userData.role,
            });
          } catch (error: any) {
            const errorMessage = error.message || 'Erreur de connexion';
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });

            logger.error('Sign in failed', error);
            throw error;
          }
        },

        /**
         * Déconnexion
         */
        signOut: async () => {
          set({ isLoading: true });

          try {
            logger.info('Sign out attempt');

            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Reset complet du store
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });

            logger.info('Sign out successful');
          } catch (error: any) {
            logger.error('Sign out failed', error);
            set({ isLoading: false, error: error.message });
            throw error;
          }
        },

        /**
         * Inscription
         */
        signUp: async (email, password, userData) => {
          set({ isLoading: true, error: null });

          try {
            logger.info('Sign up attempt', { email });

            // 1. Créer le compte Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email,
              password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user returned');

            // 2. Créer l'utilisateur dans la base
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email,
                ...userData,
              })
              .select()
              .single();

            if (userError) throw userError;

            set({
              user: newUser as AuthUser,
              session: authData.session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            logger.info('Sign up successful', { userId: newUser.id });
          } catch (error: any) {
            const errorMessage = error.message || 'Erreur d\'inscription';
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });

            logger.error('Sign up failed', error);
            throw error;
          }
        },

        /**
         * Réinitialiser le mot de passe
         */
        resetPassword: async (email) => {
          set({ isLoading: true, error: null });

          try {
            logger.info('Password reset attempt', { email });

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            set({ isLoading: false });
            logger.info('Password reset email sent', { email });
          } catch (error: any) {
            set({ isLoading: false, error: error.message });
            logger.error('Password reset failed', error);
            throw error;
          }
        },

        /**
         * Mettre à jour le mot de passe
         */
        updatePassword: async (newPassword) => {
          set({ isLoading: true, error: null });

          try {
            logger.info('Password update attempt');

            const { error } = await supabase.auth.updateUser({
              password: newPassword,
            });

            if (error) throw error;

            set({ isLoading: false });
            logger.info('Password updated successfully');
          } catch (error: any) {
            set({ isLoading: false, error: error.message });
            logger.error('Password update failed', error);
            throw error;
          }
        },

        /**
         * Vérifier l'authentification
         */
        checkAuth: async () => {
          set({ isLoading: true });

          try {
            logger.debug('Checking auth');

            // 1. Récupérer la session Supabase
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (!session) {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            // 2. Récupérer les données utilisateur
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userError) throw userError;

            set({
              user: userData as AuthUser,
              session,
              isAuthenticated: true,
              isLoading: false,
            });

            logger.debug('Auth check successful', {
              userId: userData.id,
              role: userData.role,
            });
          } catch (error: any) {
            logger.error('Auth check failed', error);
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message,
            });
          }
        },

        /**
         * Rafraîchir la session
         */
        refreshSession: async () => {
          try {
            logger.debug('Refreshing session');

            const { data: { session }, error } = await supabase.auth.refreshSession();

            if (error) throw error;

            set({ session });
            logger.debug('Session refreshed');
          } catch (error: any) {
            logger.error('Session refresh failed', error);
            throw error;
          }
        },

        /**
         * Mettre à jour le profil
         */
        updateProfile: async (updates) => {
          const { user } = get();
          if (!user) throw new Error('No user logged in');

          set({ isLoading: true, error: null });

          try {
            logger.info('Profile update attempt', { userId: user.id });

            const { data: updatedUser, error } = await supabase
              .from('users')
              .update(updates)
              .eq('id', user.id)
              .select()
              .single();

            if (error) throw error;

            set({
              user: updatedUser as AuthUser,
              isLoading: false,
            });

            logger.info('Profile updated successfully');
          } catch (error: any) {
            set({ isLoading: false, error: error.message });
            logger.error('Profile update failed', error);
            throw error;
          }
        },

        /**
         * Reset complet du store
         */
        reset: () => {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          logger.debug('Auth store reset');
        },
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

/**
 * Sélecteurs optimisés
 */
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectSchoolId = (state: AuthState) => state.user?.school_id;
export const selectSchoolGroupId = (state: AuthState) => state.user?.school_group_id;
