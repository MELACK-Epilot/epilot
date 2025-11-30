/**
 * Types pour le Dashboard Chef d'Établissement
 * Proviseur / Directeur / Directeur des Études
 * 
 * @module ChefEtablissement/Types
 */

import type { LucideIcon } from 'lucide-react';

// ============================================
// TYPES DE BASE
// ============================================

/**
 * Informations de l'école
 */
export interface SchoolInfo {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly address?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly logo?: string;
  readonly coverImage?: string;
  readonly schoolGroupId: string;
  readonly schoolGroupName: string;
  readonly createdAt: string;
}

/**
 * Informations du Chef d'Établissement
 */
export interface ChefInfo {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: 'proviseur' | 'directeur' | 'directeur_etudes';
  readonly avatar?: string;
  readonly phone?: string;
  readonly accessProfileCode: 'chef_etablissement';
  readonly schoolId: string;
  readonly schoolGroupId: string;
}

// ============================================
// KPIs
// ============================================

/**
 * KPIs principaux de l'école
 */
export interface SchoolKPIs {
  readonly totalStudents: number;
  readonly totalTeachers: number;
  readonly totalStaff: number;
  readonly totalClasses: number;
  readonly successRate: number;
  readonly attendanceRate: number;
  readonly monthlyRevenue: number;
  readonly recoveryRate: number;
  readonly pendingPayments: number;
  readonly trends: {
    readonly students: TrendDirection;
    readonly revenue: TrendDirection;
    readonly attendance: TrendDirection;
    readonly success: TrendDirection;
  };
}

export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Carte KPI pour affichage
 */
export interface KPICardData {
  readonly id: string;
  readonly title: string;
  readonly value: number | string;
  readonly unit?: string;
  readonly change?: number;
  readonly changeLabel?: string;
  readonly trend: TrendDirection;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly bgColor: string;
  readonly href?: string;
}

// ============================================
// ALERTES
// ============================================

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'attendance' | 'finance' | 'academic' | 'staff' | 'system';

/**
 * Alerte système
 */
export interface SchoolAlert {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly severity: AlertSeverity;
  readonly category: AlertCategory;
  readonly count?: number;
  readonly href?: string;
  readonly createdAt: string;
  readonly isRead: boolean;
  readonly actionLabel?: string;
}

// ============================================
// ACTIONS RAPIDES
// ============================================

/**
 * Action rapide
 */
export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly href: string;
  readonly moduleSlug: string;
  readonly categorySlug: string;
  readonly isEnabled: boolean;
}

// ============================================
// WIDGETS MÉTIER
// ============================================

/**
 * Données widget Effectifs
 */
export interface StudentsWidgetData {
  readonly total: number;
  readonly byLevel: Array<{
    readonly levelId: string;
    readonly levelName: string;
    readonly count: number;
    readonly color: string;
  }>;
  readonly byGender: {
    readonly male: number;
    readonly female: number;
  };
  readonly newThisMonth: number;
  readonly trend: TrendDirection;
}

/**
 * Données widget Finances
 */
export interface FinancesWidgetData {
  readonly monthlyRevenue: number;
  readonly yearlyRevenue: number;
  readonly pendingAmount: number;
  readonly recoveryRate: number;
  readonly recentPayments: Array<{
    readonly id: string;
    readonly studentName: string;
    readonly amount: number;
    readonly date: string;
    readonly type: string;
  }>;
  readonly trend: TrendDirection;
}

/**
 * Données widget Absences
 */
export interface AttendanceWidgetData {
  readonly todayAbsent: number;
  readonly todayLate: number;
  readonly weeklyRate: number;
  readonly monthlyRate: number;
  readonly recentAbsences: Array<{
    readonly id: string;
    readonly studentName: string;
    readonly className: string;
    readonly date: string;
    readonly reason?: string;
    readonly isJustified: boolean;
  }>;
  readonly trend: TrendDirection;
}

/**
 * Données widget Performances
 */
export interface PerformanceWidgetData {
  readonly averageGrade: number;
  readonly successRate: number;
  readonly topPerformers: number;
  readonly atRisk: number;
  readonly bySubject: Array<{
    readonly subjectId: string;
    readonly subjectName: string;
    readonly average: number;
    readonly trend: TrendDirection;
  }>;
  readonly monthlyTrend: Array<{
    readonly month: string;
    readonly rate: number;
  }>;
}

/**
 * Données widget Personnel
 */
export interface StaffWidgetData {
  readonly totalTeachers: number;
  readonly totalAdmin: number;
  readonly totalSupport: number;
  readonly presentToday: number;
  readonly onLeave: number;
  readonly recentActivity: Array<{
    readonly id: string;
    readonly staffName: string;
    readonly action: string;
    readonly date: string;
  }>;
}

// ============================================
// NAVIGATION PAR CATÉGORIE
// ============================================

/**
 * Catégorie de navigation
 */
export interface CategoryNavItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly icon: string;
  readonly color: string;
  readonly modulesCount: number;
  readonly modules: ModuleNavItem[];
  readonly isExpanded?: boolean;
}

/**
 * Module de navigation
 */
export interface ModuleNavItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly icon: string;
  readonly color: string;
  readonly href: string;
  readonly isEnabled: boolean;
  readonly permissions: {
    readonly canRead: boolean;
    readonly canWrite: boolean;
    readonly canDelete: boolean;
  };
}

// ============================================
// DASHBOARD COMPLET
// ============================================

/**
 * Données complètes du Dashboard Chef d'Établissement
 */
export interface ChefDashboardData {
  readonly chef: ChefInfo;
  readonly school: SchoolInfo;
  readonly kpis: SchoolKPIs;
  readonly alerts: SchoolAlert[];
  readonly quickActions: QuickAction[];
  readonly categories: CategoryNavItem[];
  readonly widgets: {
    readonly students: StudentsWidgetData;
    readonly finances: FinancesWidgetData;
    readonly attendance: AttendanceWidgetData;
    readonly performance: PerformanceWidgetData;
    readonly staff: StaffWidgetData;
  };
  readonly lastUpdated: string;
}

// ============================================
// ÉTATS ET ACTIONS
// ============================================

/**
 * État du dashboard
 */
export interface ChefDashboardState {
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error: string | null;
  readonly selectedCategory: string | null;
  readonly expandedCategories: string[];
  readonly dismissedAlerts: string[];
}

/**
 * Actions du dashboard
 */
export interface ChefDashboardActions {
  readonly refresh: () => Promise<void>;
  readonly selectCategory: (categoryId: string | null) => void;
  readonly toggleCategory: (categoryId: string) => void;
  readonly dismissAlert: (alertId: string) => void;
  readonly markAlertAsRead: (alertId: string) => void;
}

// ============================================
// CONSTANTES
// ============================================

/**
 * Couleurs des catégories métier
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'pedagogie-evaluations': '#3B82F6',      // Bleu
  'scolarite-admissions': '#10B981',       // Vert
  'finances-comptabilite': '#F59E0B',      // Orange
  'ressources-humaines': '#8B5CF6',        // Violet
  'services-infrastructures': '#EC4899',   // Rose
  'securite-acces': '#EF4444',             // Rouge
  'documents-rapports': '#6366F1',         // Indigo
  'vie-scolaire-discipline': '#14B8A6',    // Teal
  'communication': '#06B6D4',              // Cyan
} as const;

/**
 * Icônes des catégories métier
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'pedagogie-evaluations': 'BookOpen',
  'scolarite-admissions': 'GraduationCap',
  'finances-comptabilite': 'Wallet',
  'ressources-humaines': 'Users',
  'services-infrastructures': 'Building2',
  'securite-acces': 'Shield',
  'documents-rapports': 'FileText',
  'vie-scolaire-discipline': 'Heart',
  'communication': 'MessageSquare',
} as const;

/**
 * Labels des rôles Chef d'Établissement
 */
export const CHEF_ROLE_LABELS: Record<string, string> = {
  proviseur: 'Proviseur',
  directeur: 'Directeur',
  directeur_etudes: 'Directeur des Études',
} as const;
