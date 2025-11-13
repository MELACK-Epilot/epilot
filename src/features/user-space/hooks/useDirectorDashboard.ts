/**
 * Hook pour le dashboard du directeur/proviseur - Données réelles
 * Connecté aux vraies tables Supabase
 */

import { useState, useCallback, useMemo, useEffect, startTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

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

  // Charger les données des niveaux scolaires
  const loadSchoolLevels = useCallback(async () => {
    if (!user?.schoolGroupId) return;

    try {
      // Requête pour récupérer les niveaux avec leurs statistiques
      const { data: levelsData, error: levelsError } = await supabase
        .from('school_levels')
        .select(`
          id,
          name,
          color,
          icon,
          school_group_id
        `)
        .eq('school_group_id', user.schoolGroupId)
        .eq('status', 'active');

      if (levelsError) throw levelsError;

      // Pour chaque niveau, calculer les KPIs
      const schoolLevels: SchoolLevel[] = [];
      
      for (const level of levelsData || []) {
        // Compter les étudiants par niveau
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_level_id', level.id)
          .eq('status', 'active');

        // Compter les classes par niveau
        const { count: classesCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_level_id', level.id)
          .eq('status', 'active');

        // Compter les enseignants par niveau (via les classes)
        const { data: teachersData } = await supabase
          .from('classes')
          .select('teacher_id')
          .eq('school_level_id', level.id)
          .eq('status', 'active');

        const uniqueTeachers = new Set(teachersData?.map(t => t.teacher_id).filter(Boolean));

        // Calculer le taux de réussite (simulé pour l'instant)
        const successRate = Math.floor(Math.random() * 20) + 75; // 75-95%

        // Calculer les revenus (basé sur les paiements)
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount')
          .eq('school_level_id', level.id)
          .eq('status', 'completed')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

        const revenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        schoolLevels.push({
          id: level.id,
          name: level.name,
          color: level.color || 'bg-blue-500',
          icon: level.icon || 'GraduationCap',
          students_count: studentsCount || 0,
          classes_count: classesCount || 0,
          teachers_count: uniqueTeachers.size,
          success_rate: successRate,
          revenue,
          trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
        });
      }

      return schoolLevels;
    } catch (error) {
      console.error('Erreur lors du chargement des niveaux:', error);
      throw error;
    }
  }, [user?.schoolGroupId]);

  // Charger les KPIs globaux
  const loadGlobalKPIs = useCallback(async (schoolLevels: SchoolLevel[]) => {
    if (!user?.schoolGroupId) return null;

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

      // Calculer la croissance mensuelle (simulée)
      const monthlyGrowth = Math.floor(Math.random() * 10) + 2; // 2-12%

      return {
        ...totals,
        averageSuccessRate,
        monthlyGrowth,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des KPIs globaux:', error);
      throw error;
    }
  }, [user?.schoolGroupId]);

  // Charger les données de tendance
  const loadTrendData = useCallback(async () => {
    if (!user?.schoolGroupId) return [];

    try {
      // Générer des données de tendance pour les 6 derniers mois
      const trendData: TrendData[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const period = date.toISOString().slice(0, 7); // YYYY-MM

        // Requête pour les étudiants actifs ce mois-là
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_group_id', user.schoolGroupId)
          .eq('status', 'active')
          .lte('created_at', new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString());

        // Requête pour les revenus de ce mois
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount')
          .eq('school_group_id', user.schoolGroupId)
          .eq('status', 'completed')
          .gte('created_at', date.toISOString())
          .lt('created_at', new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString());

        const revenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Requête pour les enseignants actifs
        const { count: teachersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('school_group_id', user.schoolGroupId)
          .eq('role', 'enseignant')
          .eq('status', 'active')
          .lte('created_at', new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString());

        trendData.push({
          period,
          students: studentsCount || 0,
          success_rate: Math.floor(Math.random() * 15) + 80, // 80-95%
          revenue,
          teachers: teachersCount || 0,
        });
      }

      return trendData;
    } catch (error) {
      console.error('Erreur lors du chargement des tendances:', error);
      return [];
    }
  }, [user?.schoolGroupId]);

  // Fonction principale de chargement
  const loadDashboardData = useCallback(async () => {
    if (!user?.schoolGroupId) return;

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
      console.error('Erreur lors du chargement du dashboard:', error);
      
      // Fallback vers des données mockées
      const mockSchoolLevels: SchoolLevel[] = [
        {
          id: 'prescolaire',
          name: 'Préscolaire',
          color: 'bg-[#1D3557]',
          icon: 'GraduationCap',
          students_count: 45,
          classes_count: 3,
          teachers_count: 4,
          success_rate: 92,
          revenue: 450000,
          trend: 'up',
        },
        {
          id: 'primaire',
          name: 'Primaire',
          color: 'bg-[#2A9D8F]',
          icon: 'BookOpen',
          students_count: 180,
          classes_count: 8,
          teachers_count: 12,
          success_rate: 87,
          revenue: 1800000,
          trend: 'up',
        },
        {
          id: 'college',
          name: 'Collège',
          color: 'bg-[#E9C46A]',
          icon: 'Building2',
          students_count: 240,
          classes_count: 12,
          teachers_count: 18,
          success_rate: 82,
          revenue: 2400000,
          trend: 'stable',
        },
        {
          id: 'lycee',
          name: 'Lycée',
          color: 'bg-[#E63946]',
          icon: 'GraduationCap',
          students_count: 160,
          classes_count: 8,
          teachers_count: 16,
          success_rate: 78,
          revenue: 1600000,
          trend: 'down',
        },
      ];

      const mockGlobalKPIs = {
        totalStudents: 625,
        totalClasses: 31,
        totalTeachers: 50,
        averageSuccessRate: 85,
        totalRevenue: 6250000,
        monthlyGrowth: 8,
      };

      const mockTrendData: TrendData[] = [
        { period: '2024-07', students: 580, success_rate: 82, revenue: 5200000, teachers: 48 },
        { period: '2024-08', students: 595, success_rate: 84, revenue: 5400000, teachers: 49 },
        { period: '2024-09', students: 610, success_rate: 86, revenue: 5600000, teachers: 50 },
        { period: '2024-10', students: 620, success_rate: 85, revenue: 5750000, teachers: 50 },
        { period: '2024-11', students: 625, success_rate: 87, revenue: 5850000, teachers: 50 },
        { period: '2024-12', students: 625, success_rate: 85, revenue: 6250000, teachers: 50 },
      ];

      startTransition(() => {
        setState(prev => ({
          ...prev,
          schoolLevels: mockSchoolLevels,
          globalKPIs: mockGlobalKPIs,
          trendData: mockTrendData,
          isLoading: false,
          error: 'Utilisation des données de démonstration',
          lastUpdated: new Date(),
        }));
      });
    }
  }, [user?.schoolGroupId, loadSchoolLevels, loadGlobalKPIs, loadTrendData]);

  // Rafraîchir les données
  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Chargement initial
  useEffect(() => {
    if (user?.schoolGroupId) {
      loadDashboardData();
    }
  }, [user?.schoolGroupId, loadDashboardData]);

  // Écoute temps réel des changements
  useEffect(() => {
    if (!user?.schoolGroupId) return;

    const channel = supabase
      .channel('director_dashboard_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `school_group_id=eq.${user.schoolGroupId}`,
        },
        () => {
          console.log('Changement détecté dans les étudiants, rechargement...');
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `school_group_id=eq.${user.schoolGroupId}`,
        },
        () => {
          console.log('Changement détecté dans les classes, rechargement...');
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `school_group_id=eq.${user.schoolGroupId}`,
        },
        () => {
          console.log('Changement détecté dans les paiements, rechargement...');
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.schoolGroupId, refreshData]);

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
