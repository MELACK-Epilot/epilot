/**
 * Hook d'authentification
 * Gère l'utilisateur connecté et son rôle
 * @module useAuth
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  role?: string;
  school_group_id?: string;
  school_id?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Récupérer les infos supplémentaires depuis la table users
          const { data: userData } = await supabase
            .from('users')
            .select('role, school_group_id, school_id')
            .eq('id', authUser.id)
            .single();

          setUser({
            ...authUser,
            ...userData,
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, school_group_id, school_id')
          .eq('id', session.user.id)
          .single();

        setUser({
          ...session.user,
          ...userData,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isAdminGroupe: user?.role === 'admin_groupe',
    isDirecteur: user?.role === 'directeur',
  };
};
