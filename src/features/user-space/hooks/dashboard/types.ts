/**
 * Types pour le Dashboard Directeur
 */

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

export interface DashboardState {
  schoolLevels: SchoolLevel[];
  globalKPIs: DashboardKPIs;
  trendData: TrendData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface DashboardStats {
  totalLevels: number;
  bestPerformingLevel: SchoolLevel | null;
  growthRates: {
    students: number;
    revenue: number;
    successRate: number;
  };
  hasData: boolean;
}
