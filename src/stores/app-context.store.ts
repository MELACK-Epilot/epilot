/**
 * Store Zustand pour le contexte global de l'application
 * Garantit l'isolation des données entre les groupes scolaires
 * @module AppContextStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

/**
 * Interface pour le contexte global de l'application
 */
export interface AppContext {
  userId: string | null;
  schoolId: string | null;
  schoolGroupId: string | null;
  role: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isInitialized: boolean;
}

/**
 * Interface pour le store
 */
interface AppContextStore {
  context: AppContext;
  
  // Actions
  initializeContext: () => Promise<void>;
  validateContext: () => boolean;
  clearContext: () => void;
  refreshContext: () => Promise<void>;
  
  // Getters sécurisés
  getSchoolId: () => string;
  getSchoolGroupId: () => string;
  getUserId: () => string;
  getRole: () => string;
}

/**
 * Store Zustand pour le contexte global
 * Utilise devtools + persist pour debug et persistence
 */
export const useAppContextStore = create<AppContextStore>()(
  devtools(
    persist(
      (set, get) => ({
        context: {
          userId: null,
          schoolId: null,
          schoolGroupId: null,
          role: null,
          email: null,
          firstName: null,
          lastName: null,
          isInitialized: false,
        },

        /**
         * Initialiser le contexte depuis Supabase
         */
        initializeContext: async () => {
          try {
            console.log('🔄 [AppContext] Initialisation du contexte...');

            // 1. Vérifier l'authentification
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
              throw new Error('Utilisateur non connecté');
            }

            // 2. Récupérer le contexte complet depuis la base
            const { data: userData, error } = await supabase
              .from('users')
              .select('id, school_id, school_group_id, role, email, first_name, last_name')
              .eq('id', user.id)
              .single();

            if (error) throw error;

            if (!userData) {
              throw new Error('Données utilisateur non trouvées');
            }

            // 3. Validation stricte du contexte
            if (!userData.school_id || !userData.school_group_id) {
              console.error('❌ [AppContext] Contexte incomplet:', userData);
              throw new Error('Contexte utilisateur incomplet: school_id ou school_group_id manquant');
            }

            // 4. Mettre à jour le store
            set({
              context: {
                userId: userData.id,
                schoolId: userData.school_id,
                schoolGroupId: userData.school_group_id,
                role: userData.role,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name,
                isInitialized: true,
              },
            });

            console.log('✅ [AppContext] Contexte initialisé avec succès:', {
              userId: userData.id,
              école: userData.school_id,
              groupe: userData.school_group_id,
              rôle: userData.role,
            });
          } catch (error: any) {
            console.error('❌ [AppContext] Erreur initialisation:', error);
            
            // Effacer le contexte en cas d'erreur
            set({
              context: {
                userId: null,
                schoolId: null,
                schoolGroupId: null,
                role: null,
                email: null,
                firstName: null,
                lastName: null,
                isInitialized: false,
              },
            });
            
            throw error;
          }
        },

        /**
         * Valider que le contexte est complet et valide
         */
        validateContext: () => {
          const { context } = get();
          
          const isValid = 
            context.isInitialized &&
            context.userId !== null &&
            context.schoolId !== null &&
            context.schoolGroupId !== null &&
            context.role !== null;

          if (!isValid) {
            console.error('❌ [AppContext] Validation échouée:', context);
          }

          return isValid;
        },

        /**
         * Effacer le contexte (déconnexion)
         */
        clearContext: () => {
          set({
            context: {
              userId: null,
              schoolId: null,
              schoolGroupId: null,
              role: null,
              email: null,
              firstName: null,
              lastName: null,
              isInitialized: false,
            },
          });
          console.log('🔄 [AppContext] Contexte effacé');
        },

        /**
         * Rafraîchir le contexte
         */
        refreshContext: async () => {
          const { clearContext, initializeContext } = get();
          clearContext();
          await initializeContext();
        },

        /**
         * Getters sécurisés avec validation
         */
        getSchoolId: () => {
          const { context, validateContext } = get();
          if (!validateContext()) {
            throw new Error('❌ Contexte invalide: impossible d\'obtenir school_id');
          }
          return context.schoolId!;
        },

        getSchoolGroupId: () => {
          const { context, validateContext } = get();
          if (!validateContext()) {
            throw new Error('❌ Contexte invalide: impossible d\'obtenir school_group_id');
          }
          return context.schoolGroupId!;
        },

        getUserId: () => {
          const { context, validateContext } = get();
          if (!validateContext()) {
            throw new Error('❌ Contexte invalide: impossible d\'obtenir user_id');
          }
          return context.userId!;
        },

        getRole: () => {
          const { context, validateContext } = get();
          if (!validateContext()) {
            throw new Error('❌ Contexte invalide: impossible d\'obtenir role');
          }
          return context.role!;
        },
      }),
      {
        name: 'app-context-storage',
        partialize: (state) => ({ context: state.context }),
      }
    ),
    { name: 'AppContextStore' }
  )
);

/**
 * Sélecteurs optimisés
 */
export const selectContext = (state: AppContextStore) => state.context;
export const selectIsInitialized = (state: AppContextStore) => state.context.isInitialized;
export const selectSchoolId = (state: AppContextStore) => state.context.schoolId;
export const selectSchoolGroupId = (state: AppContextStore) => state.context.schoolGroupId;
export const selectRole = (state: AppContextStore) => state.context.role;
