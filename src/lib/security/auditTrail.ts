/**
 * Audit Trail - Traçabilité complète des actions
 * Enregistre qui a fait quoi, quand, et depuis où
 * @module auditTrail
 */

import { supabase } from '@/lib/supabase';

/**
 * Types d'actions auditées
 */
export enum AuditAction {
  // Authentification
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Données financières
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_DELETE = 'PAYMENT_DELETE',
  EXPENSE_CREATE = 'EXPENSE_CREATE',
  EXPENSE_UPDATE = 'EXPENSE_UPDATE',
  EXPENSE_DELETE = 'EXPENSE_DELETE',
  
  // Alertes
  ALERT_CREATE = 'ALERT_CREATE',
  ALERT_RESOLVE = 'ALERT_RESOLVE',
  ALERT_DELETE = 'ALERT_DELETE',
  
  // Exports
  EXPORT_PDF = 'EXPORT_PDF',
  EXPORT_EXCEL = 'EXPORT_EXCEL',
  EXPORT_CSV = 'EXPORT_CSV',
  
  // Écoles
  SCHOOL_CREATE = 'SCHOOL_CREATE',
  SCHOOL_UPDATE = 'SCHOOL_UPDATE',
  SCHOOL_DELETE = 'SCHOOL_DELETE',
  
  // Utilisateurs
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_PERMISSIONS_UPDATE = 'USER_PERMISSIONS_UPDATE',
  
  // Vues
  VIEW_FINANCIAL_REPORT = 'VIEW_FINANCIAL_REPORT',
  VIEW_SCHOOL_DETAILS = 'VIEW_SCHOOL_DETAILS',
  
  // Système
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  BACKUP_CREATE = 'BACKUP_CREATE',
  RESTORE_DATA = 'RESTORE_DATA',
}

/**
 * Niveaux de sévérité
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Interface log audit
 */
interface AuditLog {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  severity: AuditSeverity;
  resource?: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Classe principale Audit Trail
 */
export class AuditTrail {
  /**
   * Enregistre une action dans l'audit trail
   */
  static async log(log: AuditLog): Promise<void> {
    try {
      const auditEntry = {
        user_id: log.userId,
        user_name: log.userName,
        user_email: log.userEmail,
        action: log.action,
        severity: log.severity,
        resource: log.resource,
        resource_id: log.resourceId,
        old_value: log.oldValue ? JSON.stringify(log.oldValue) : null,
        new_value: log.newValue ? JSON.stringify(log.newValue) : null,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        metadata: log.metadata ? JSON.stringify(log.metadata) : null,
        success: log.success,
        error_message: log.errorMessage,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Ne pas bloquer l'application si l'audit échoue
      }
    } catch (error) {
      console.error('Audit trail error:', error);
    }
  }

  /**
   * Enregistre une action réussie
   */
  static async logSuccess(
    userId: string,
    action: AuditAction,
    options: Partial<AuditLog> = {}
  ): Promise<void> {
    await this.log({
      userId,
      action,
      severity: AuditSeverity.INFO,
      success: true,
      ...options,
    });
  }

  /**
   * Enregistre une action échouée
   */
  static async logFailure(
    userId: string,
    action: AuditAction,
    errorMessage: string,
    options: Partial<AuditLog> = {}
  ): Promise<void> {
    await this.log({
      userId,
      action,
      severity: AuditSeverity.ERROR,
      success: false,
      errorMessage,
      ...options,
    });
  }

  /**
   * Enregistre une modification de données
   */
  static async logDataChange(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId: string,
    oldValue: any,
    newValue: any,
    options: Partial<AuditLog> = {}
  ): Promise<void> {
    await this.log({
      userId,
      action,
      severity: AuditSeverity.INFO,
      resource,
      resourceId,
      oldValue,
      newValue,
      success: true,
      ...options,
    });
  }

  /**
   * Récupère les logs d'audit
   */
  static async getLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Récupère l'historique d'une ressource
   */
  static async getResourceHistory(
    resource: string,
    resourceId: string
  ): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource', resource)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch resource history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Génère un rapport d'audit
   */
  static async generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
  }> {
    const logs = await this.getLogs({ startDate, endDate });

    const report = {
      totalActions: logs.length,
      successfulActions: logs.filter(l => l.success).length,
      failedActions: logs.filter(l => !l.success).length,
      actionsByType: {} as Record<string, number>,
      actionsByUser: {} as Record<string, number>,
    };

    logs.forEach(log => {
      // Par type
      report.actionsByType[log.action] = (report.actionsByType[log.action] || 0) + 1;
      
      // Par utilisateur
      const userKey = log.userName || log.userId;
      report.actionsByUser[userKey] = (report.actionsByUser[userKey] || 0) + 1;
    });

    return report;
  }
}

/**
 * Middleware Express pour audit automatique
 */
export function auditMiddleware() {
  return async (req: any, res: any, next: any) => {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;

      // Enregistrer l'audit après la réponse
      setImmediate(() => {
        if (req.user && req.auditAction) {
          AuditTrail.log({
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            action: req.auditAction,
            severity: success ? AuditSeverity.INFO : AuditSeverity.ERROR,
            resource: req.auditResource,
            resourceId: req.auditResourceId,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              method: req.method,
              path: req.path,
              duration,
              statusCode: res.statusCode,
            },
            success,
            errorMessage: success ? undefined : 'Request failed',
          });
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Helper pour marquer une route comme auditée
 */
export function auditRoute(action: AuditAction, resource?: string) {
  return (req: any, res: any, next: any) => {
    req.auditAction = action;
    req.auditResource = resource;
    next();
  };
}

/**
 * Migration SQL pour créer la table audit_logs
 */
export const AUDIT_LOGS_MIGRATION = `
-- Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  severity TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin_group', 'super_admin')
    )
  );

-- Politique: Système peut insérer
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Fonction pour nettoyer les vieux logs (> 1 an)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Cron job pour nettoyage mensuel
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 0 1 * *', -- 1er de chaque mois à minuit
  'SELECT cleanup_old_audit_logs();'
);
`;

/**
 * Exemples d'utilisation
 * 
 * @example
 * // Enregistrer une action simple
 * await AuditTrail.logSuccess(
 *   user.id,
 *   AuditAction.PAYMENT_CREATE,
 *   { resourceId: payment.id }
 * );
 * 
 * @example
 * // Enregistrer une modification
 * await AuditTrail.logDataChange(
 *   user.id,
 *   AuditAction.SCHOOL_UPDATE,
 *   'schools',
 *   school.id,
 *   oldSchool,
 *   newSchool
 * );
 * 
 * @example
 * // Dans Express avec middleware
 * app.use(auditMiddleware());
 * app.post('/api/payments',
 *   auditRoute(AuditAction.PAYMENT_CREATE, 'payments'),
 *   createPaymentHandler
 * );
 * 
 * @example
 * // Récupérer l'historique
 * const history = await AuditTrail.getResourceHistory('schools', schoolId);
 * 
 * @example
 * // Générer un rapport
 * const report = await AuditTrail.generateReport(
 *   new Date('2025-01-01'),
 *   new Date('2025-12-31')
 * );
 */
