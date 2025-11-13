/**
 * Types pour les widgets du tableau de bord
 * @module WidgetTypes
 */

export type WidgetId = 
  | 'system-alerts'
  | 'financial-overview'
  | 'module-status'
  | 'realtime-activity';

export interface WidgetLayoutItem {
  id: WidgetId;
  cols: number;
  rows: number;
  order: number;
  enabled: boolean;
}

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  description: string;
  defaultCols: number;
  defaultRows: number;
  minCols?: number;
  minRows?: number;
}

export interface DashboardStats {
  totalSchoolGroups: number;
  activeUsers: number;
  estimatedMRR: number;
  criticalSubscriptions: number;
  trends: {
    schoolGroups: number;
    users: number;
    mrr: number;
    subscriptions: number;
  };
}

/**
 * Interface spécifique pour Admin Groupe
 * Noms cohérents avec la hiérarchie : Groupe → Écoles → Élèves/Personnel
 */
export interface AdminGroupStats {
  totalSchools: number;        // Nombre d'écoles du groupe
  totalStudents: number;       // Total élèves de toutes les écoles
  totalStaff: number;          // Total personnel de toutes les écoles
  activeUsers: number;         // Utilisateurs actifs du groupe
  trends: {
    schools: number;           // Tendance écoles (%)
    students: number;          // Tendance élèves (%)
    staff: number;             // Tendance personnel (%)
    users: number;             // Tendance users actifs (%)
  };
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  handled: boolean;
}

export interface FinancialData {
  month: string;
  revenue: number;
  target: number;
}

export interface ModuleAdoption {
  name: string;
  adoption: number;
  schools: number;
}

export interface RealtimeActivity {
  id: string;
  type: 'login' | 'school_added' | 'subscription_updated' | 'user_created';
  user: string;
  action: string;
  timestamp: string;
}
