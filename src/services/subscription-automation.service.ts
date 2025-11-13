/**
 * Service d'automatisation des abonnements pour 500+ groupes
 * Gestion des cycles de facturation, renouvellements, suspensions
 */

import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from '@/stores/subscription.store';

export interface AutoSubscriptionConfig {
  auto_renewal: boolean;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  grace_period_days: number;
  auto_suspend_on_failure: boolean;
  max_retry_attempts: number;
  notification_days_before_expiry: number[];
}

export interface BulkSubscriptionOperation {
  operation: 'create' | 'update' | 'suspend' | 'reactivate' | 'cancel';
  school_group_ids: string[];
  plan_id?: string;
  effective_date?: string;
  reason?: string;
}

/**
 * Service principal d'automatisation des abonnements
 */
export class SubscriptionAutomationService {
  
  /**
   * Traitement en lot des abonnements (CRITIQUE pour 500+ groupes)
   */
  static async processBulkSubscriptions(
    operations: BulkSubscriptionOperation[]
  ): Promise<{
    success: string[];
    failed: { group_id: string; error: string }[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as { group_id: string; error: string }[],
    };

    // Traitement par chunks pour éviter les timeouts
    const CHUNK_SIZE = 50;
    
    for (const operation of operations) {
      const chunks = this.chunkArray(operation.school_group_ids, CHUNK_SIZE);
      
      for (const chunk of chunks) {
        try {
          await this.processBulkChunk(operation, chunk);
          results.success.push(...chunk);
        } catch (error: any) {
          chunk.forEach(groupId => {
            results.failed.push({
              group_id: groupId,
              error: error.message,
            });
          });
        }
      }
    }

    return results;
  }

  /**
   * Renouvellement automatique des abonnements
   */
  static async processAutoRenewals(): Promise<void> {
    console.log('🔄 Traitement des renouvellements automatiques...');

    // Récupérer les abonnements expirant dans les 7 prochains jours
    const { data: expiringSubscriptions } = await supabase
      .from('subscriptions')
      .select(`
        *,
        school_groups!inner(
          id,
          name,
          auto_subscription_config
        )
      `)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .lte('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!expiringSubscriptions?.length) return;

    // Traitement par lots
    const renewalPromises = expiringSubscriptions.map(async (subscription) => {
      const config = subscription.school_groups.auto_subscription_config as AutoSubscriptionConfig;
      
      if (!config?.auto_renewal) return;

      try {
        await this.renewSubscription(subscription.id, config);
        console.log(`✅ Renouvellement réussi: ${subscription.school_groups.name}`);
      } catch (error) {
        console.error(`❌ Échec renouvellement: ${subscription.school_groups.name}`, error);
        await this.handleRenewalFailure(subscription, error as Error);
      }
    });

    await Promise.allSettled(renewalPromises);
  }

  /**
   * Suspension automatique des abonnements impayés
   */
  static async processSuspensions(): Promise<void> {
    console.log('⏸️ Traitement des suspensions automatiques...');

    const { data: overdueSubscriptions } = await supabase
      .from('subscriptions')
      .select(`
        *,
        school_groups!inner(
          id,
          name,
          auto_subscription_config
        ),
        payment_history(
          status,
          due_date,
          attempts
        )
      `)
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (!overdueSubscriptions?.length) return;

    const suspensionPromises = overdueSubscriptions.map(async (subscription) => {
      const config = subscription.school_groups.auto_subscription_config as AutoSubscriptionConfig;
      
      if (!config?.auto_suspend_on_failure) return;

      const gracePeriodEnd = new Date(subscription.end_date);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + config.grace_period_days);

      if (new Date() > gracePeriodEnd) {
        await this.suspendSubscription(subscription.id, 'auto_suspension_overdue');
      }
    });

    await Promise.allSettled(suspensionPromises);
  }

  /**
   * Notifications automatiques avant expiration
   */
  static async processExpirationNotifications(): Promise<void> {
    console.log('📧 Envoi des notifications d\'expiration...');

    const notificationDays = [30, 15, 7, 3, 1]; // Jours avant expiration

    for (const days of notificationDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          *,
          school_groups!inner(
            id,
            name,
            contact_email,
            auto_subscription_config
          )
        `)
        .eq('status', 'active')
        .gte('end_date', targetDate.toISOString().split('T')[0])
        .lt('end_date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (subscriptions?.length) {
        await this.sendBulkExpirationNotifications(subscriptions, days);
      }
    }
  }

  /**
   * Méthodes privées
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private static async processBulkChunk(
    operation: BulkSubscriptionOperation,
    groupIds: string[]
  ): Promise<void> {
    switch (operation.operation) {
      case 'create':
        await this.bulkCreateSubscriptions(groupIds, operation.plan_id!);
        break;
      case 'update':
        await this.bulkUpdateSubscriptions(groupIds, operation.plan_id!);
        break;
      case 'suspend':
        await this.bulkSuspendSubscriptions(groupIds, operation.reason);
        break;
      case 'reactivate':
        await this.bulkReactivateSubscriptions(groupIds);
        break;
      case 'cancel':
        await this.bulkCancelSubscriptions(groupIds, operation.reason);
        break;
    }
  }

  private static async bulkCreateSubscriptions(
    groupIds: string[],
    planId: string
  ): Promise<void> {
    const subscriptions = groupIds.map(groupId => ({
      id: crypto.randomUUID(),
      school_group_id: groupId,
      plan_id: planId,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('subscriptions')
      .insert(subscriptions);

    if (error) throw error;
  }

  private static async bulkUpdateSubscriptions(
    groupIds: string[],
    planId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        updated_at: new Date().toISOString(),
      })
      .in('school_group_id', groupIds)
      .eq('status', 'active');

    if (error) throw error;
  }

  private static async renewSubscription(
    subscriptionId: string,
    config: AutoSubscriptionConfig
  ): Promise<void> {
    const cycleDays = {
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };

    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + cycleDays[config.billing_cycle]);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        end_date: newEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  }

  private static async suspendSubscription(
    subscriptionId: string,
    reason: string
  ): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  }

  private static async handleRenewalFailure(
    subscription: any,
    error: Error
  ): Promise<void> {
    // Log de l'erreur
    await supabase.from('subscription_logs').insert({
      subscription_id: subscription.id,
      action: 'renewal_failed',
      error_message: error.message,
      created_at: new Date().toISOString(),
    });

    // Notification à l'admin
    await this.notifyAdminOfFailure(subscription, error);
  }

  private static async sendBulkExpirationNotifications(
    subscriptions: any[],
    daysBeforeExpiry: number
  ): Promise<void> {
    // Implémentation du système de notification en masse
    // Email, SMS, notifications in-app
    console.log(`📧 Envoi de ${subscriptions.length} notifications (${daysBeforeExpiry} jours)`);
  }

  private static async notifyAdminOfFailure(
    subscription: any,
    error: Error
  ): Promise<void> {
    // Notification critique aux super admins
    console.error(`🚨 Échec critique renouvellement: ${subscription.school_groups.name}`, error);
  }
}
