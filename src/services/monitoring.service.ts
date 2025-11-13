/**
 * Système de monitoring critique pour 500+ groupes
 * Alertes automatiques, métriques temps réel, health checks
 */

import { supabase } from '@/lib/supabase';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    activeSubscriptions: number;
    failedRenewals: number;
    suspendedGroups: number;
    avgResponseTime: number;
    errorRate: number;
  };
  alerts: Alert[];
  lastCheck: Date;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  category: 'subscription' | 'performance' | 'security' | 'billing';
  affectedGroups: string[];
  createdAt: Date;
  resolved: boolean;
}

/**
 * Service de monitoring principal
 */
export class MonitoringService {
  private static alertThresholds = {
    FAILED_RENEWALS_PERCENT: 5, // 5% de renouvellements échoués
    RESPONSE_TIME_MS: 2000, // 2 secondes max
    ERROR_RATE_PERCENT: 1, // 1% d'erreurs max
    SUSPENDED_GROUPS_PERCENT: 2, // 2% de groupes suspendus max
  };

  /**
   * Health check complet du système
   */
  static async performHealthCheck(): Promise<SystemHealth> {
    console.log('🏥 Début du health check système...');

    const startTime = Date.now();
    const alerts: Alert[] = [];

    try {
      // 1. Métriques des abonnements
      const subscriptionMetrics = await this.getSubscriptionMetrics();
      
      // 2. Métriques de performance
      const performanceMetrics = await this.getPerformanceMetrics();
      
      // 3. Vérifications critiques
      const criticalChecks = await this.performCriticalChecks();
      
      // 4. Générer les alertes
      alerts.push(...this.generateAlerts(subscriptionMetrics, performanceMetrics));
      
      // 5. Déterminer le statut global
      const status = this.determineSystemStatus(alerts);
      
      const healthReport: SystemHealth = {
        status,
        metrics: {
          ...subscriptionMetrics,
          ...performanceMetrics,
        },
        alerts,
        lastCheck: new Date(),
      };

      // 6. Logger le rapport
      await this.logHealthReport(healthReport);
      
      // 7. Envoyer les alertes critiques
      await this.sendCriticalAlerts(alerts.filter(a => a.level === 'critical'));

      console.log(`✅ Health check terminé en ${Date.now() - startTime}ms`);
      return healthReport;

    } catch (error) {
      console.error('❌ Erreur lors du health check:', error);
      
      return {
        status: 'critical',
        metrics: {
          activeSubscriptions: 0,
          failedRenewals: 0,
          suspendedGroups: 0,
          avgResponseTime: 0,
          errorRate: 100,
        },
        alerts: [{
          id: crypto.randomUUID(),
          level: 'critical',
          message: `Health check failed: ${(error as Error).message}`,
          category: 'performance',
          affectedGroups: [],
          createdAt: new Date(),
          resolved: false,
        }],
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Métriques des abonnements
   */
  private static async getSubscriptionMetrics() {
    const [activeCount, failedRenewals, suspendedCount, totalGroups] = await Promise.all([
      // Abonnements actifs
      supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),
      
      // Renouvellements échoués (dernières 24h)
      supabase
        .from('subscription_logs')
        .select('id', { count: 'exact' })
        .eq('action', 'renewal_failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // Groupes suspendus
      supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'suspended'),
      
      // Total des groupes
      supabase
        .from('school_groups')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),
    ]);

    return {
      activeSubscriptions: activeCount.count || 0,
      failedRenewals: failedRenewals.count || 0,
      suspendedGroups: suspendedCount.count || 0,
      totalGroups: totalGroups.count || 0,
    };
  }

  /**
   * Métriques de performance
   */
  private static async getPerformanceMetrics() {
    // Récupérer les métriques des dernières 24h
    const { data: metrics } = await supabase
      .from('performance_metrics')
      .select('duration_ms, success')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!metrics?.length) {
      return { avgResponseTime: 0, errorRate: 0 };
    }

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.duration_ms, 0) / metrics.length;
    const errorRate = (metrics.filter(m => !m.success).length / metrics.length) * 100;

    return { avgResponseTime, errorRate };
  }

  /**
   * Vérifications critiques
   */
  private static async performCriticalChecks() {
    const checks = [];

    // 1. Vérifier la connectivité base de données
    try {
      const { error } = await supabase.from('school_groups').select('id').limit(1);
      checks.push({ name: 'database_connectivity', success: !error });
    } catch {
      checks.push({ name: 'database_connectivity', success: false });
    }

    // 2. Vérifier les vues matérialisées
    try {
      const { error } = await supabase.from('plan_modules_view').select('plan_id').limit(1);
      checks.push({ name: 'materialized_views', success: !error });
    } catch {
      checks.push({ name: 'materialized_views', success: false });
    }

    // 3. Vérifier les indexes critiques
    const { data: indexCheck } = await supabase.rpc('check_critical_indexes');
    checks.push({ name: 'critical_indexes', success: indexCheck?.all_present || false });

    return checks;
  }

  /**
   * Génération des alertes
   */
  private static generateAlerts(subscriptionMetrics: any, performanceMetrics: any): Alert[] {
    const alerts: Alert[] = [];

    // Alerte renouvellements échoués
    if (subscriptionMetrics.totalGroups > 0) {
      const failureRate = (subscriptionMetrics.failedRenewals / subscriptionMetrics.totalGroups) * 100;
      
      if (failureRate > this.alertThresholds.FAILED_RENEWALS_PERCENT) {
        alerts.push({
          id: crypto.randomUUID(),
          level: failureRate > 10 ? 'critical' : 'warning',
          message: `Taux de renouvellements échoués élevé: ${failureRate.toFixed(1)}%`,
          category: 'subscription',
          affectedGroups: [], // À remplir avec les groupes affectés
          createdAt: new Date(),
          resolved: false,
        });
      }
    }

    // Alerte performance
    if (performanceMetrics.avgResponseTime > this.alertThresholds.RESPONSE_TIME_MS) {
      alerts.push({
        id: crypto.randomUUID(),
        level: performanceMetrics.avgResponseTime > 5000 ? 'critical' : 'warning',
        message: `Temps de réponse élevé: ${performanceMetrics.avgResponseTime.toFixed(0)}ms`,
        category: 'performance',
        affectedGroups: [],
        createdAt: new Date(),
        resolved: false,
      });
    }

    // Alerte taux d'erreur
    if (performanceMetrics.errorRate > this.alertThresholds.ERROR_RATE_PERCENT) {
      alerts.push({
        id: crypto.randomUUID(),
        level: performanceMetrics.errorRate > 5 ? 'critical' : 'warning',
        message: `Taux d'erreur élevé: ${performanceMetrics.errorRate.toFixed(1)}%`,
        category: 'performance',
        affectedGroups: [],
        createdAt: new Date(),
        resolved: false,
      });
    }

    // Alerte groupes suspendus
    if (subscriptionMetrics.totalGroups > 0) {
      const suspensionRate = (subscriptionMetrics.suspendedGroups / subscriptionMetrics.totalGroups) * 100;
      
      if (suspensionRate > this.alertThresholds.SUSPENDED_GROUPS_PERCENT) {
        alerts.push({
          id: crypto.randomUUID(),
          level: suspensionRate > 5 ? 'critical' : 'warning',
          message: `Taux de groupes suspendus élevé: ${suspensionRate.toFixed(1)}%`,
          category: 'billing',
          affectedGroups: [],
          createdAt: new Date(),
          resolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Déterminer le statut global du système
   */
  private static determineSystemStatus(alerts: Alert[]): 'healthy' | 'warning' | 'critical' {
    if (alerts.some(a => a.level === 'critical')) {
      return 'critical';
    }
    
    if (alerts.some(a => a.level === 'warning')) {
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Logger le rapport de santé
   */
  private static async logHealthReport(report: SystemHealth): Promise<void> {
    try {
      await supabase.from('system_health_logs').insert({
        status: report.status,
        metrics: report.metrics,
        alert_count: report.alerts.length,
        critical_alert_count: report.alerts.filter(a => a.level === 'critical').length,
        created_at: report.lastCheck.toISOString(),
      });
    } catch (error) {
      console.error('Erreur logging health report:', error);
    }
  }

  /**
   * Envoyer les alertes critiques
   */
  private static async sendCriticalAlerts(criticalAlerts: Alert[]): Promise<void> {
    if (criticalAlerts.length === 0) return;

    console.log(`🚨 ${criticalAlerts.length} alertes critiques détectées`);

    for (const alert of criticalAlerts) {
      try {
        // 1. Notification email aux super admins
        await this.sendEmailAlert(alert);
        
        // 2. Notification Slack/Discord
        await this.sendSlackAlert(alert);
        
        // 3. Log de l'alerte
        await supabase.from('system_alerts').insert({
          id: alert.id,
          level: alert.level,
          message: alert.message,
          category: alert.category,
          affected_groups: alert.affectedGroups,
          created_at: alert.createdAt.toISOString(),
        });

      } catch (error) {
        console.error(`Erreur envoi alerte ${alert.id}:`, error);
      }
    }
  }

  /**
   * Monitoring en temps réel des métriques clés
   */
  static async startRealTimeMonitoring(): Promise<void> {
    console.log('📊 Démarrage du monitoring temps réel...');

    // Health check toutes les 5 minutes
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Erreur health check périodique:', error);
      }
    }, 5 * 60 * 1000);

    // Métriques légères toutes les minutes
    setInterval(async () => {
      try {
        await this.collectLightMetrics();
      } catch (error) {
        console.error('Erreur collecte métriques:', error);
      }
    }, 60 * 1000);
  }

  /**
   * Collecte de métriques légères
   */
  private static async collectLightMetrics(): Promise<void> {
    const startTime = Date.now();

    try {
      // Test de connectivité simple
      const { error } = await supabase
        .from('school_groups')
        .select('id')
        .limit(1);

      const duration = Date.now() - startTime;
      const success = !error;

      // Enregistrer la métrique
      await supabase.from('performance_metrics').insert({
        operation_name: 'health_ping',
        duration_ms: duration,
        success,
        error_message: error?.message,
        created_at: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Erreur collecte métriques légères:', error);
    }
  }

  /**
   * Dashboard des métriques en temps réel
   */
  static async getDashboardMetrics(): Promise<{
    realTime: any;
    trends: any;
    alerts: Alert[];
  }> {
    const [realTimeMetrics, trends, recentAlerts] = await Promise.all([
      this.getRealTimeMetrics(),
      this.getTrendMetrics(),
      this.getRecentAlerts(),
    ]);

    return {
      realTime: realTimeMetrics,
      trends,
      alerts: recentAlerts,
    };
  }

  private static async getRealTimeMetrics() {
    // Métriques des 5 dernières minutes
    const { data } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    return {
      currentResponseTime: data?.[0]?.duration_ms || 0,
      recentErrorRate: data ? (data.filter(m => !m.success).length / data.length) * 100 : 0,
      totalRequests: data?.length || 0,
    };
  }

  private static async getTrendMetrics() {
    // Tendances sur 24h
    const { data } = await supabase
      .rpc('get_performance_trends', {
        hours_back: 24,
      });

    return data || [];
  }

  private static async getRecentAlerts(): Promise<Alert[]> {
    const { data } = await supabase
      .from('system_alerts')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    return (data || []).map(alert => ({
      id: alert.id,
      level: alert.level,
      message: alert.message,
      category: alert.category,
      affectedGroups: alert.affected_groups || [],
      createdAt: new Date(alert.created_at),
      resolved: alert.resolved || false,
    }));
  }

  // Méthodes d'envoi d'alertes (à implémenter selon vos besoins)
  private static async sendEmailAlert(alert: Alert): Promise<void> {
    // Implémentation email (SendGrid, AWS SES, etc.)
    console.log('📧 Email alert:', alert.message);
  }

  private static async sendSlackAlert(alert: Alert): Promise<void> {
    // Implémentation Slack webhook
    console.log('💬 Slack alert:', alert.message);
  }
}
