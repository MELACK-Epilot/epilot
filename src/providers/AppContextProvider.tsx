/**
 * Provider React pour le contexte global de l'application
 * Garantit que le contexte est initialisé avant d'afficher l'application
 * @module AppContextProvider
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppContextStore, type AppContext } from '@/stores/app-context.store';

/**
 * Context React pour le contexte global
 */
const AppContextContext = createContext<AppContext | null>(null);

/**
 * Props du Provider
 */
interface AppContextProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte global de l'application
 * Initialise automatiquement le contexte au montage
 */
export function AppContextProvider({ children }: AppContextProviderProps) {
  const context = useAppContextStore((state) => state.context);
  const initializeContext = useAppContextStore((state) => state.initializeContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le contexte au montage
  useEffect(() => {
    const init = async () => {
      try {
        if (!context.isInitialized) {
          console.log('🔄 [AppContextProvider] Initialisation...');
          await initializeContext();
        }
      } catch (err: any) {
        console.error('❌ [AppContextProvider] Erreur:', err);
        setError(err.message || 'Erreur d\'initialisation du contexte');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []); // Exécuter une seule fois au montage

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Chargement du contexte...</p>
          <p className="text-sm text-gray-500 mt-2">Initialisation de votre espace de travail</p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de Contexte</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Affichage si le contexte n'est pas initialisé
  if (!context.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Contexte Non Initialisé</h2>
          <p className="text-gray-600 mb-6">
            Votre contexte utilisateur n'est pas encore initialisé. Veuillez patienter...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContextContext.Provider value={context}>
      {children}
    </AppContextContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte global
 * @throws Error si utilisé hors du Provider
 */
export function useAppContext(): AppContext {
  const context = useContext(AppContextContext);
  
  if (!context) {
    throw new Error('useAppContext doit être utilisé dans un AppContextProvider');
  }

  if (!context.isInitialized) {
    throw new Error('Contexte non initialisé');
  }

  if (!context.schoolId || !context.schoolGroupId) {
    throw new Error('Contexte incomplet: school_id ou school_group_id manquant');
  }

  return context;
}

/**
 * Hook sécurisé pour obtenir le schoolId
 * @throws Error si le contexte est invalide
 */
export function useSchoolId(): string {
  const context = useAppContext();
  return context.schoolId!;
}

/**
 * Hook sécurisé pour obtenir le schoolGroupId
 * @throws Error si le contexte est invalide
 */
export function useSchoolGroupId(): string {
  const context = useAppContext();
  return context.schoolGroupId!;
}

/**
 * Hook sécurisé pour obtenir le userId
 * @throws Error si le contexte est invalide
 */
export function useUserId(): string {
  const context = useAppContext();
  return context.userId!;
}

/**
 * Hook sécurisé pour obtenir le role
 * @throws Error si le contexte est invalide
 */
export function useUserRole(): string {
  const context = useAppContext();
  return context.role!;
}

/**
 * Hook pour obtenir le contexte complet (optionnel)
 * Retourne null si le contexte n'est pas disponible
 */
export function useAppContextOptional(): AppContext | null {
  return useContext(AppContextContext);
}
