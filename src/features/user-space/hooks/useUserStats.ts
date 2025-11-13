/**
 * Hook pour récupérer les statistiques de l'utilisateur
 * Adapté selon le rôle et le groupe scolaire
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface UserStats {
  // Direction
  totalSchools?: number;
  totalUsers?: number;
  totalStudents?: number;
  monthlyBudget?: number;
  
  // Enseignant
  totalClasses?: number;
  totalStudentsInClasses?: number;
  pendingGrades?: number;
  successRate?: number;
  
  // CPE
  totalStudentsFollowed?: number;
  todayAbsences?: number;
  weekRetards?: number;
  positiveRate?: number;
  
  // Comptable
  monthlyPayments?: number;
  pendingPaymentsComptable?: number;
  
  // Élève
  totalCourses?: number;
  averageGrade?: number;
  pendingHomework?: number;
  
  // Parent
  totalChildren?: number;
  childrenAverage?: number;
  pendingPaymentsParent?: number;
}

export const useUserStats = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['user-stats', user?.id, user?.role, user?.schoolGroupId],
    queryFn: async (): Promise<UserStats> => {
      if (!user) throw new Error('Utilisateur non connecté');

      const stats: UserStats = {};

      // DIRECTION (proviseur, directeur, directeur_etudes)
      if (['proviseur', 'directeur', 'directeur_etudes'].includes(user.role)) {
        // Nombre d'écoles du groupe
        const { count: schoolsCount } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true })
          .eq('school_group_id', user.schoolGroupId || '');
        
        stats.totalSchools = schoolsCount || 0;

        // Nombre d'utilisateurs du groupe
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('school_group_id', user.schoolGroupId || '');
        
        stats.totalUsers = usersCount || 0;

        // TODO: Nombre d'élèves (quand table students sera créée)
        stats.totalStudents = 0;

        // TODO: Budget mensuel (quand table budgets sera créée)
        stats.monthlyBudget = 0;
      }

      // ENSEIGNANT
      if (user.role === 'enseignant') {
        // TODO: Nombre de classes (quand table classes sera créée)
        stats.totalClasses = 4;
        stats.totalStudentsInClasses = 120;
        stats.pendingGrades = 12;
        stats.successRate = 85;
      }

      // CPE
      if (user.role === 'cpe') {
        // TODO: Statistiques CPE (quand tables absences/retards seront créées)
        stats.totalStudentsFollowed = 250;
        stats.todayAbsences = 8;
        stats.weekRetards = 5;
        stats.positiveRate = 92;
      }

      // COMPTABLE
      if (user.role === 'comptable') {
        // TODO: Statistiques paiements (quand table payments sera créée)
        stats.monthlyPayments = 45;
        stats.pendingPaymentsComptable = 12;
      }

      // ÉLÈVE
      if (user.role === 'eleve') {
        // TODO: Statistiques élève (quand tables courses/grades seront créées)
        stats.totalCourses = 8;
        stats.averageGrade = 14.5;
        stats.pendingHomework = 3;
      }

      // PARENT
      if (user.role === 'parent') {
        // TODO: Statistiques parent (quand table children sera créée)
        stats.totalChildren = 2;
        stats.childrenAverage = 13.8;
        stats.pendingPaymentsParent = 2;
      }

      return stats;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer les écoles du groupe de l'utilisateur
 */
export const useUserSchools = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['user-schools', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('Utilisateur non associé à un groupe scolaire');
      }

      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('school_group_id', user.schoolGroupId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les utilisateurs du groupe
 */
export const useGroupUsers = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['group-users', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('Utilisateur non associé à un groupe scolaire');
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, status')
        .eq('school_group_id', user.schoolGroupId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 5 * 60 * 1000,
  });
};
