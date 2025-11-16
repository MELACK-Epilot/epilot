/**
 * Hook pour le dashboard du directeur/proviseur - Données réelles
 * Connecté aux vraies tables Supabase
 */

import { useState, useCallback, useMemo, useEffect, startTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { loadSchoolLevels as loadLevelsModule } from './dashboard/loadSchoolLevels';
import { loadTrendData as loadTrendDataModule } from './dashboard/loadTrendData';

// Types pour les données du dashboard
export interface SchoolLevel {
  id: string;
  name: string;
  color: string;
  icon: string;
  students_count: number;
  classes_count: number;
  teachers_count: number;
  success_rate: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardKPIs {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  averageSuccessRate: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface TrendData {
  period: string;
  students: number;
  success_rate: number;
  revenue: number;
  teachers: number;
}

interface DashboardState {
  schoolLevels: SchoolLevel[];
  globalKPIs: DashboardKPIs;
  trendData: TrendData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useDirectorDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    schoolLevels: [],
    globalKPIs: {
      totalStudents: 0,
      totalClasses: 0,
      totalTeachers: 0,
      averageSuccessRate: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
    },
    trendData: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Charger les données des niveaux scolaires DYNAMIQUEMENT depuis la BDD
  const loadSchoolLevels = useCallback(async () => {
    console.log('🔍 DEBUG loadSchoolLevels - user:', {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      schoolId: user?.schoolId,
      hasSchoolId: !!user?.schoolId
    });

    if (!user?.schoolId) {
      console.error('⚠️ Pas de schoolId, chargement annulé');
      console.error('⚠️ User complet:', user);
      return [];
    }

    try {
      console.log('🔄 Chargement dashboard pour école:', user.schoolId);
      
      // ✅ Utiliser le module externe (import statique)
      return await loadLevelsModule({ schoolId: user.schoolId });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des niveaux:', error);
      throw error;
    }
  }, [user?.schoolId]);

  // Charger les KPIs globaux
  const loadGlobalKPIs = useCallback(async (schoolLevels: SchoolLevel[]) => {
    if (!user?.schoolId) return null;

    try {
      // Calculer les totaux à partir des niveaux
      const totals = schoolLevels.reduce(
        (acc, level) => ({
          totalStudents: acc.totalStudents + level.students_count,
          totalClasses: acc.totalClasses + level.classes_count,
          totalTeachers: acc.totalTeachers + level.teachers_count,
          totalRevenue: acc.totalRevenue + level.revenue,
        }),
        { totalStudents: 0, totalClasses: 0, totalTeachers: 0, totalRevenue: 0 }
      );

      // Calculer le taux de réussite moyen
      const averageSuccessRate = schoolLevels.length > 0
        ? Math.round(schoolLevels.reduce((sum, level) => sum + level.success_rate, 0) / schoolLevels.length)
        : 0;

      // Calculer la croissance mensuelle réelle
      // Comparer le total d'élèves actuel avec le mois dernier
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const { count: lastMonthTotal } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', user.schoolId)
        .eq('status', 'active')
        .lt('created_at', new Date().toISOString().slice(0, 7) + '-01');

      const monthlyGrowth = lastMonthTotal && lastMonthTotal > 0
        ? Math.round(((totals.totalStudents - lastMonthTotal) / lastMonthTotal) * 100)
        : 0;

      return {
        ...totals,
        averageSuccessRate,
        monthlyGrowth,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des KPIs globaux:', error);
      throw error;
    }
  }, [user?.schoolId]);

  // ✅ Charger les données de tendance avec VRAIES NOTES (module externe)
  const loadTrendData = useCallback(async () => {
    if (!user?.schoolId) return [];

    try {
      return await loadTrendDataModule({ schoolId: user.schoolId });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des tendances:', error);
      return [];
    }
  }, [user?.schoolId]);

  // Fonction principale de chargement
  const loadDashboardData = useCallback(async () => {
    if (!user?.schoolId) return;

    startTransition(() => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    });

    try {
      // Charger toutes les données en parallèle
      const [schoolLevels, trendData] = await Promise.all([
        loadSchoolLevels(),
        loadTrendData(),
      ]);

      // Calculer les KPIs globaux à partir des niveaux
      const globalKPIs = await loadGlobalKPIs(schoolLevels);

      startTransition(() => {
        setState(prev => ({
          ...prev,
          schoolLevels,
          globalKPIs: globalKPIs || prev.globalKPIs,
          trendData,
          isLoading: false,
          lastUpdated: new Date(),
        }));
      });

    } catch (error) {
      console.error('❌ Erreur critique lors du chargement du dashboard:', error);
      
      // ✅ Ne plus afficher de fausses données, mais un message d'erreur clair
      startTransition(() => {
        setState(prev => ({
          ...prev,
          schoolLevels: [],
          isLoading: false,
          error: 'Impossible de charger les données. Vérifiez votre connexion et réessayez.',
          lastUpdated: null,
        }));
      });
    }
  }, [user?.schoolId, loadSchoolLevels, loadGlobalKPIs, loadTrendData]);

  // Rafraîchir les données
  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Chargement initial
  useEffect(() => {
    if (user?.schoolId) {
      console.log('🚀 Chargement initial du dashboard pour l\'\u00e9cole:', user.schoolId);
      loadDashboardData();
    }
  }, [user?.schoolId, loadDashboardData]);

  // Écoute temps réel des changements
  useEffect(() => {
    if (!user?.schoolId) return;

    console.log('🔊 Activation des écoutes temps réel pour l\'\u00e9cole:', user.schoolId);

    const channel = supabase
      .channel('director_dashboard_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `school_id=eq.${user.schoolId}`,
        },
        () => {
          console.log('🔄 Changement détecté dans les étudiants, rechargement...');
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `school_id=eq.${user.schoolId}`,
        },
        () => {
          console.log('🔄 Changement détecté dans les classes, rechargement...');
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_payments',
          filter: `school_id=eq.${user.schoolId}`,
        },
        () => {
          console.log('🔄 Changement détecté dans les paiements, rechargement...');
          refreshData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Déconnexion des écoutes temps réel');
      supabase.removeChannel(channel);
    };
  }, [user?.schoolId, refreshData]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const currentMonth = state.trendData[state.trendData.length - 1];
    const previousMonth = state.trendData[state.trendData.length - 2];

    const growthRates = {
      students: currentMonth && previousMonth 
        ? Math.round(((currentMonth.students - previousMonth.students) / previousMonth.students) * 100)
        : 0,
      revenue: currentMonth && previousMonth 
        ? Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100)
        : 0,
      successRate: currentMonth && previousMonth 
        ? Math.round(((currentMonth.success_rate - previousMonth.success_rate) / previousMonth.success_rate) * 100)
        : 0,
    };

    return Object.freeze({
      totalLevels: state.schoolLevels.length,
      bestPerformingLevel: state.schoolLevels.reduce((best, level) => 
        level.success_rate > (best?.success_rate || 0) ? level : best, null as SchoolLevel | null),
      growthRates: Object.freeze(growthRates),
      hasData: state.schoolLevels.length > 0,
    });
  }, [state.schoolLevels, state.trendData]);

  // API publique
  return useMemo(() => Object.freeze({
    // Données
    schoolLevels: state.schoolLevels,
    globalKPIs: state.globalKPIs,
    trendData: state.trendData,
    
    // État
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    stats,
    
    // Actions
    refreshData,
    loadDashboardData,
    
    // Utilitaires
    getLevelById: (id: string) => state.schoolLevels.find(level => level.id === id),
    getLevelsByTrend: (trend: 'up' | 'down' | 'stable') => 
      state.schoolLevels.filter(level => level.trend === trend),
    getTotalRevenue: () => state.globalKPIs.totalRevenue,
    getAverageClassSize: () => state.globalKPIs.totalStudents / Math.max(state.globalKPIs.totalClasses, 1),
  }), [
    state.schoolLevels,
    state.globalKPIs,
    state.trendData,
    state.isLoading,
    state.error,
    state.lastUpdated,
    stats,
    refreshData,
    loadDashboardData,
  ]);
}
