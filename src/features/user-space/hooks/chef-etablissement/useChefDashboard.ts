/**
 * Hook principal pour le Dashboard Chef d'Établissement
 * Agrège toutes les données nécessaires au dashboard
 * 
 * @module ChefEtablissement/Hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '../useCurrentUser';
import { usePermissions } from '@/providers/PermissionsProvider';
import type {
  ChefDashboardData,
  ChefDashboardState,
  ChefDashboardActions,
  SchoolKPIs,
  SchoolAlert,
  QuickAction,
  CategoryNavItem,
  StudentsWidgetData,
  FinancesWidgetData,
  AttendanceWidgetData,
  PerformanceWidgetData,
  StaffWidgetData,
  AlertSeverity,
  AlertCategory,
} from '../../types/chef-etablissement.types';
import {
  UserPlus,
  FileEdit,
  CreditCard,
  FileBarChart,
  ClipboardList,
  Calendar,
} from 'lucide-react';

// ============================================
// QUERY KEYS
// ============================================

export const chefDashboardKeys = {
  all: ['chef-dashboard'] as const,
  school: (schoolId: string) => [...chefDashboardKeys.all, 'school', schoolId] as const,
  kpis: (schoolId: string) => [...chefDashboardKeys.all, 'kpis', schoolId] as const,
  alerts: (schoolId: string) => [...chefDashboardKeys.all, 'alerts', schoolId] as const,
  widgets: (schoolId: string) => [...chefDashboardKeys.all, 'widgets', schoolId] as const,
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export const useChefDashboard = () => {
  const { data: user } = useCurrentUser();
  const { modules, isLoading: modulesLoading } = usePermissions();
  const queryClient = useQueryClient();

  // État local
  const [state, setState] = useState<ChefDashboardState>({
    isLoading: true,
    isRefreshing: false,
    error: null,
    selectedCategory: null,
    expandedCategories: [],
    dismissedAlerts: [],
  });

  const schoolId = user?.schoolId;
  const _schoolGroupId = user?.schoolGroupId; // Préfixé pour éviter le warning unused

  // ============================================
  // QUERY: Informations École
  // ============================================
  const schoolQuery = useQuery({
    queryKey: chefDashboardKeys.school(schoolId || ''),
    queryFn: async () => {
      if (!schoolId) throw new Error('School ID requis');

      // Requête simplifiée sans logo pour éviter les erreurs de types
      const { data, error } = await supabase
        .from('schools')
        .select(`
          id,
          name,
          code,
          address,
          phone,
          email,
          school_group_id,
          created_at,
          school_groups (
            id,
            name
          )
        `)
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      const schoolData = data as any;
      return {
        id: schoolData.id,
        name: schoolData.name,
        code: schoolData.code || '',
        address: schoolData.address,
        phone: schoolData.phone,
        email: schoolData.email,
        logo: undefined, // logo_url sera ajouté plus tard si nécessaire
        coverImage: undefined,
        schoolGroupId: schoolData.school_group_id,
        schoolGroupName: schoolData.school_groups?.name || '',
        createdAt: schoolData.created_at,
      };
    },
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // ============================================
  // QUERY: KPIs École (données simulées pour l'instant)
  // ============================================
  const kpisQuery = useQuery({
    queryKey: chefDashboardKeys.kpis(schoolId || ''),
    queryFn: async (): Promise<SchoolKPIs> => {
      // TODO: Remplacer par des vraies requêtes quand les tables existent
      // Pour l'instant, données de démonstration
      return {
        totalStudents: 1250,
        totalTeachers: 48,
        totalStaff: 65,
        totalClasses: 32,
        successRate: 85.5,
        attendanceRate: 92.3,
        monthlyRevenue: 12500000,
        recoveryRate: 78.5,
        pendingPayments: 3200000,
        trends: {
          students: 'up',
          revenue: 'up',
          attendance: 'stable',
          success: 'up',
        },
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ============================================
  // QUERY: Alertes (données simulées)
  // ============================================
  const alertsQuery = useQuery({
    queryKey: chefDashboardKeys.alerts(schoolId || ''),
    queryFn: async (): Promise<SchoolAlert[]> => {
      // TODO: Implémenter avec vraies données
      const now = new Date().toISOString();
      const alerts: SchoolAlert[] = [
        {
          id: 'alert-1',
          title: 'Absences élevées',
          message: '12 élèves absents aujourd\'hui sans justification',
          severity: 'warning' as AlertSeverity,
          category: 'attendance' as AlertCategory,
          count: 12,
          href: '/user/modules/suivi-absences',
          createdAt: now,
          isRead: false,
          actionLabel: 'Voir les absences',
        },
        {
          id: 'alert-2',
          title: 'Impayés critiques',
          message: '5 familles avec plus de 2 mois d\'arriérés',
          severity: 'critical' as AlertSeverity,
          category: 'finance' as AlertCategory,
          count: 5,
          href: '/user/modules/arrieres-relances',
          createdAt: now,
          isRead: false,
          actionLabel: 'Gérer les impayés',
        },
        {
          id: 'alert-3',
          title: 'Retards répétés',
          message: '8 élèves avec plus de 3 retards cette semaine',
          severity: 'warning' as AlertSeverity,
          category: 'attendance' as AlertCategory,
          count: 8,
          href: '/user/modules/suivi-retards',
          createdAt: now,
          isRead: false,
          actionLabel: 'Voir les retards',
        },
      ];
      return alerts.filter(alert => !state.dismissedAlerts.includes(alert.id));
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ============================================
  // COMPUTED: Actions Rapides basées sur les modules
  // ============================================
  const quickActions = useMemo((): QuickAction[] => {
    if (!modules || modules.length === 0) return [];

    const actionsConfig = [
      {
        moduleSlug: 'gestion-inscriptions',
        label: 'Nouvel élève',
        description: 'Inscrire un nouvel élève',
        icon: UserPlus,
        color: '#10B981',
      },
      {
        moduleSlug: 'notes-evaluations',
        label: 'Saisir notes',
        description: 'Saisir les notes des élèves',
        icon: FileEdit,
        color: '#3B82F6',
      },
      {
        moduleSlug: 'paiements-recus',
        label: 'Encaisser',
        description: 'Enregistrer un paiement',
        icon: CreditCard,
        color: '#F59E0B',
      },
      {
        moduleSlug: 'rapports-pedagogiques',
        label: 'Rapport',
        description: 'Générer un rapport',
        icon: FileBarChart,
        color: '#8B5CF6',
      },
      {
        moduleSlug: 'suivi-absences',
        label: 'Absences',
        description: 'Gérer les absences',
        icon: ClipboardList,
        color: '#EF4444',
      },
      {
        moduleSlug: 'emplois-du-temps',
        label: 'Planning',
        description: 'Voir les emplois du temps',
        icon: Calendar,
        color: '#06B6D4',
      },
    ];

    const actions: QuickAction[] = [];
    
    for (const config of actionsConfig) {
      const module = modules.find(m => m.slug === config.moduleSlug);
      if (module) {
        actions.push({
          id: `action-${config.moduleSlug}`,
          label: config.label,
          description: config.description,
          icon: config.icon,
          color: config.color,
          href: `/user/modules/${config.moduleSlug}`,
          moduleSlug: config.moduleSlug,
          categorySlug: module.categorySlug || '',
          isEnabled: true,
        });
      }
    }
    
    return actions.slice(0, 6); // Max 6 actions rapides
  }, [modules]);

  // ============================================
  // COMPUTED: Navigation par catégorie
  // ============================================
  const categories = useMemo((): CategoryNavItem[] => {
    if (!modules || modules.length === 0) return [];

    const categoryMap = new Map<string, CategoryNavItem>();

    modules.forEach(module => {
      const categoryId = module.categoryId || 'other';
      const categoryName = module.categoryName || 'Autres';
      const categorySlug = module.categorySlug || 'autres';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          slug: categorySlug,
          icon: module.icon || 'Package',
          color: module.color || '#6B7280',
          modulesCount: 0,
          modules: [],
          isExpanded: state.expandedCategories.includes(categoryId),
        });
      }

      const category = categoryMap.get(categoryId)!;
      categoryMap.set(categoryId, {
        ...category,
        modulesCount: category.modulesCount + 1,
        modules: [
          ...category.modules,
          {
            id: module.id,
            name: module.name,
            slug: module.slug,
            icon: module.icon || 'Package',
            color: module.color || '#6B7280',
            href: `/user/modules/${module.slug}`,
            isEnabled: true,
            permissions: {
              canRead: module.permissions?.canRead ?? true,
              canWrite: module.permissions?.canWrite ?? false,
              canDelete: module.permissions?.canDelete ?? false,
            },
          },
        ],
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'fr')
    );
  }, [modules, state.expandedCategories]);

  // ============================================
  // WIDGETS DATA (simulées pour l'instant)
  // ============================================
  const widgetsQuery = useQuery({
    queryKey: chefDashboardKeys.widgets(schoolId || ''),
    queryFn: async () => {
      // TODO: Implémenter avec vraies données
      const students: StudentsWidgetData = {
        total: 1250,
        byLevel: [
          { levelId: '1', levelName: 'Maternelle', count: 180, color: '#EC4899' },
          { levelId: '2', levelName: 'Primaire', count: 520, color: '#3B82F6' },
          { levelId: '3', levelName: 'Collège', count: 350, color: '#10B981' },
          { levelId: '4', levelName: 'Lycée', count: 200, color: '#F59E0B' },
        ],
        byGender: { male: 640, female: 610 },
        newThisMonth: 15,
        trend: 'up',
      };

      const finances: FinancesWidgetData = {
        monthlyRevenue: 12500000,
        yearlyRevenue: 125000000,
        pendingAmount: 3200000,
        recoveryRate: 78.5,
        recentPayments: [
          { id: '1', studentName: 'Jean Dupont', amount: 150000, date: new Date().toISOString(), type: 'Scolarité' },
          { id: '2', studentName: 'Marie Koumba', amount: 75000, date: new Date().toISOString(), type: 'Cantine' },
        ],
        trend: 'up',
      };

      const attendance: AttendanceWidgetData = {
        todayAbsent: 12,
        todayLate: 8,
        weeklyRate: 94.5,
        monthlyRate: 92.3,
        recentAbsences: [
          { id: '1', studentName: 'Paul Mbemba', className: '3ème A', date: new Date().toISOString(), isJustified: false },
          { id: '2', studentName: 'Claire Nzaba', className: 'Terminale S', date: new Date().toISOString(), reason: 'Maladie', isJustified: true },
        ],
        trend: 'stable',
      };

      const performance: PerformanceWidgetData = {
        averageGrade: 12.5,
        successRate: 85.5,
        topPerformers: 45,
        atRisk: 23,
        bySubject: [
          { subjectId: '1', subjectName: 'Mathématiques', average: 11.8, trend: 'up' },
          { subjectId: '2', subjectName: 'Français', average: 13.2, trend: 'stable' },
          { subjectId: '3', subjectName: 'Sciences', average: 12.1, trend: 'up' },
        ],
        monthlyTrend: [
          { month: 'Sep', rate: 82 },
          { month: 'Oct', rate: 84 },
          { month: 'Nov', rate: 85.5 },
        ],
      };

      const staff: StaffWidgetData = {
        totalTeachers: 48,
        totalAdmin: 8,
        totalSupport: 9,
        presentToday: 62,
        onLeave: 3,
        recentActivity: [
          { id: '1', staffName: 'M. Bakala', action: 'Notes saisies', date: new Date().toISOString() },
          { id: '2', staffName: 'Mme Ngoma', action: 'Rapport généré', date: new Date().toISOString() },
        ],
      };

      return { students, finances, attendance, performance, staff };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  // ============================================
  // ACTIONS
  // ============================================
  const actions: ChefDashboardActions = {
    refresh: useCallback(async () => {
      setState(prev => ({ ...prev, isRefreshing: true }));
      await queryClient.invalidateQueries({ queryKey: chefDashboardKeys.all });
      setState(prev => ({ ...prev, isRefreshing: false }));
    }, [queryClient]),

    selectCategory: useCallback((categoryId: string | null) => {
      setState(prev => ({ ...prev, selectedCategory: categoryId }));
    }, []),

    toggleCategory: useCallback((categoryId: string) => {
      setState(prev => ({
        ...prev,
        expandedCategories: prev.expandedCategories.includes(categoryId)
          ? prev.expandedCategories.filter(id => id !== categoryId)
          : [...prev.expandedCategories, categoryId],
      }));
    }, []),

    dismissAlert: useCallback((alertId: string) => {
      setState(prev => ({
        ...prev,
        dismissedAlerts: [...prev.dismissedAlerts, alertId],
      }));
    }, []),

    markAlertAsRead: useCallback((alertId: string) => {
      // TODO: Implémenter la persistance
      console.log('Mark alert as read:', alertId);
    }, []),
  };

  // ============================================
  // DONNÉES AGRÉGÉES
  // ============================================
  const dashboardData: ChefDashboardData | null = useMemo(() => {
    if (!user || !schoolQuery.data) return null;

    return {
      chef: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role as 'proviseur' | 'directeur' | 'directeur_etudes',
        avatar: user.avatar,
        phone: user.phone,
        accessProfileCode: 'chef_etablissement',
        schoolId: user.schoolId || '',
        schoolGroupId: user.schoolGroupId || '',
      },
      school: schoolQuery.data,
      kpis: kpisQuery.data || {
        totalStudents: 0,
        totalTeachers: 0,
        totalStaff: 0,
        totalClasses: 0,
        successRate: 0,
        attendanceRate: 0,
        monthlyRevenue: 0,
        recoveryRate: 0,
        pendingPayments: 0,
        trends: { students: 'stable', revenue: 'stable', attendance: 'stable', success: 'stable' },
      },
      alerts: alertsQuery.data || [],
      quickActions,
      categories,
      widgets: widgetsQuery.data || {
        students: { total: 0, byLevel: [], byGender: { male: 0, female: 0 }, newThisMonth: 0, trend: 'stable' },
        finances: { monthlyRevenue: 0, yearlyRevenue: 0, pendingAmount: 0, recoveryRate: 0, recentPayments: [], trend: 'stable' },
        attendance: { todayAbsent: 0, todayLate: 0, weeklyRate: 0, monthlyRate: 0, recentAbsences: [], trend: 'stable' },
        performance: { averageGrade: 0, successRate: 0, topPerformers: 0, atRisk: 0, bySubject: [], monthlyTrend: [] },
        staff: { totalTeachers: 0, totalAdmin: 0, totalSupport: 0, presentToday: 0, onLeave: 0, recentActivity: [] },
      },
      lastUpdated: new Date().toISOString(),
    };
  }, [user, schoolQuery.data, kpisQuery.data, alertsQuery.data, quickActions, categories, widgetsQuery.data]);

  // ============================================
  // RETURN
  // ============================================
  const isLoading = schoolQuery.isLoading || kpisQuery.isLoading || modulesLoading;
  const error = schoolQuery.error || kpisQuery.error || alertsQuery.error;

  return {
    data: dashboardData,
    isLoading,
    isRefreshing: state.isRefreshing,
    error: error ? (error as Error).message : null,
    state,
    actions,
    // Accès direct aux données
    school: schoolQuery.data,
    kpis: kpisQuery.data,
    alerts: alertsQuery.data,
    quickActions,
    categories,
    widgets: widgetsQuery.data,
  };
};

export default useChefDashboard;
