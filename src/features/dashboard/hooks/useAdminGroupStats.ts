/**
 * Hook pour récupérer les statistiques Admin Groupe
 * Interface claire et cohérente avec la hiérarchie
 * @module useAdminGroupStats
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import type { AdminGroupStats } from '../types/widget.types';

/**
 * Récupère les statistiques d'un groupe scolaire
 */
const fetchAdminGroupStats = async (schoolGroupId: string): Promise<AdminGroupStats> => {
  try {
    // 1. Compter les écoles du groupe
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId);

    // 2. Récupérer student_count et staff_count de toutes les écoles
    const { data: schoolsData } = await supabase
      .from('schools')
      .select('student_count, staff_count, created_at')
      .eq('school_group_id', schoolGroupId);

    const totalStudents = schoolsData?.reduce((sum, s: any) => sum + (s.student_count || 0), 0) || 0;
    const totalStaff = schoolsData?.reduce((sum, s: any) => sum + (s.staff_count || 0), 0) || 0;

    // 3. Compter les utilisateurs actifs du groupe
    const { count: activeUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId)
      .eq('status', 'active');

    // 4. Calculer les tendances (mois N vs N-1)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Écoles créées le mois dernier
    const { count: schoolsLastMonth } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId)
      .lt('created_at', lastMonth.toISOString());

    // Users actifs le mois dernier
    const { count: usersLastMonth } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId)
      .eq('status', 'active')
      .lt('created_at', lastMonth.toISOString());

    // Récupérer les données historiques pour élèves/personnel (si disponible)
    // TODO: Implémenter table school_history pour tracking précis
    const { data: schoolsLastMonthData } = await supabase
      .from('schools')
      .select('student_count, staff_count')
      .eq('school_group_id', schoolGroupId)
      .lt('created_at', lastMonth.toISOString());

    const studentsLastMonth = schoolsLastMonthData?.reduce((sum, s: any) => sum + (s.student_count || 0), 0) || 0;
    const staffLastMonth = schoolsLastMonthData?.reduce((sum, s: any) => sum + (s.staff_count || 0), 0) || 0;

    // Fonction de calcul de tendance
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalSchools: totalSchools || 0,
      totalStudents,
      totalStaff,
      activeUsers: activeUsers || 0,
      trends: {
        schools: calculateTrend(totalSchools || 0, schoolsLastMonth || 0),
        students: calculateTrend(totalStudents, studentsLastMonth),
        staff: calculateTrend(totalStaff, staffLastMonth),
        users: calculateTrend(activeUsers || 0, usersLastMonth || 0),
      },
    };
  } catch (error) {
    console.error('❌ Erreur fetchAdminGroupStats:', error);
    
    // Fallback sur données vides
    return {
      totalSchools: 0,
      totalStudents: 0,
      totalStaff: 0,
      activeUsers: 0,
      trends: {
        schools: 0,
        students: 0,
        staff: 0,
        users: 0,
      },
    };
  }
};

/**
 * Hook React Query pour Admin Groupe
 */
export const useAdminGroupStats = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Temps réel avec Supabase Realtime
  useEffect(() => {
    if (!user?.schoolGroupId) return;

    console.log('🔄 [Admin Groupe] Activation temps réel pour groupe:', user.schoolGroupId);

    // S'abonner aux changements sur les écoles
    const schoolsChannel = supabase
      .channel('admin_group_schools_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'schools',
          filter: `school_group_id=eq.${user.schoolGroupId}`
        },
        (payload) => {
          console.log('📊 [Temps Réel] Mise à jour écoles détectée:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-group-stats', user.schoolGroupId] });
        }
      )
      .subscribe();

    // S'abonner aux changements sur les utilisateurs
    const usersChannel = supabase
      .channel('admin_group_users_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'users',
          filter: `school_group_id=eq.${user.schoolGroupId}`
        },
        (payload) => {
          console.log('👥 [Temps Réel] Mise à jour utilisateurs détectée:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-group-stats', user.schoolGroupId] });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔌 [Admin Groupe] Déconnexion temps réel');
      supabase.removeChannel(schoolsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [queryClient, user?.schoolGroupId]);

  return useQuery({
    queryKey: ['admin-group-stats', user?.schoolGroupId],
    queryFn: () => {
      if (!user?.schoolGroupId) {
        throw new Error('schoolGroupId manquant');
      }
      return fetchAdminGroupStats(user.schoolGroupId);
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
