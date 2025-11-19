/**
 * Hook pour récupérer l'utilisateur connecté
 * ⚠️ LOGIQUE MÉTIER E-PILOT:
 * - S'exécute UNIQUEMENT si session Supabase active
 * - Retourne null si non authentifié (pas d'erreur)
 * - Utilisé par tous les dashboards utilisateurs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  schoolGroupId?: string;
  avatar?: string;
  status: string;
}

export const useCurrentUser = () => {
  const [hasSession, setHasSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Vérifier la session Supabase au mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session);
      } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        setHasSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      setIsCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      // 1. Récupérer l'utilisateur Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return null; // Retourner null au lieu de throw (pas d'erreur dans la console)
      }

      // 2. Récupérer les données complètes depuis la table users
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          school_id,
          school_group_id,
          avatar,
          status
        `)
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('❌ Erreur récupération user:', error);
        return null;
      }
      
      if (!data) return null;

      // Cast explicite pour éviter les erreurs TypeScript
      const userData = data as any;

      return {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        schoolId: userData.school_id,
        schoolGroupId: userData.school_group_id,
        avatar: userData.avatar,
        status: userData.status,
      } as CurrentUser;
    },
    // ⚠️ LOGIQUE MÉTIER: Exécuter UNIQUEMENT si session active
    enabled: hasSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Ne pas retry si non authentifié
  });

  // Retourner query avec isLoading personnalisé
  return {
    ...query,
    isLoading: isCheckingSession || query.isLoading,
  };
};
