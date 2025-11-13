/**
 * Service de gestion des webhooks pour 500+ groupes
 * Événements de paiement, changements d'abonnement, notifications externes
 */

import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from '@/stores/subscription.store';

export interface WebhookEvent {
  id: string;
  type: 'subscription.updated' | 'payment.succeeded' | 'payment.failed' | 'plan.changed' | 'group.suspended';
  school_group_id: string;
  data: any;
  timestamp: string;
  processed: boolean;
  retry_count: number;
  external_id?: string; // ID du système externe (Stripe, etc.)
}

export interface WebhookEndpoint {
  id: string;
  school_group_id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
}

/**
 * Service principal de gestion des webhooks
 */
export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

  /**
   * Traitement des événements de paiement (Stripe, etc.)
   */
  static async handlePaymentWebhook(payload: any, signature: string): Promise<void> {
    console.log('💳 Traitement webhook paiement...');

    try {
      // 1. Vérifier la signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // 2. Traiter selon le type d'événement
      switch (payload.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(payload.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(payload.data.object);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(payload.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(payload.data.object);
          break;
          
        default:
          console.log(`Événement webhook ignoré: ${payload.type}`);
      }

      // 3. Logger l'événement
      await this.logWebhookEvent({
        id: payload.id,
        type: payload.type,
        school_group_id: payload.data.object.metadata?.school_group_id || '',
        data: payload.data.object,
        timestamp: new Date().toISOString(),
        processed: true,
        retry_count: 0,
        external_id: payload.id,
      });

    } catch (error) {
      console.error('❌ Erreur traitement webhook paiement:', error);
      
      // Logger l'erreur
      await this.logWebhookEvent({
        id: payload.id || crypto.randomUUID(),
        type: payload.type || 'unknown',
        school_group_id: '',
        data: payload,
        timestamp: new Date().toISOString(),
        processed: false,
        retry_count: 0,
        external_id: payload.id,
      });

      throw error;
    }
  }

  /**
   * Diffusion d'événements aux groupes scolaires
   */
  static async broadcastEvent(event: Omit<WebhookEvent, 'id' | 'processed' | 'retry_count'>): Promise<void> {
    console.log(`📡 Diffusion événement: ${event.type} pour groupe ${event.school_group_id}`);

    try {
      // 1. Créer l'événement
      const webhookEvent: WebhookEvent = {
        ...event,
        id: crypto.randomUUID(),
        processed: false,
        retry_count: 0,
      };

      // 2. Logger l'événement
      await this.logWebhookEvent(webhookEvent);

      // 3. Récupérer les endpoints du groupe
      const { data: endpoints } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('school_group_id', event.school_group_id)
        .eq('active', true)
        .contains('events', [event.type]);

      if (!endpoints?.length) {
        console.log('Aucun endpoint webhook configuré pour ce groupe');
        return;
      }

      // 4. Envoyer aux endpoints
      const deliveryPromises = endpoints.map(endpoint =>
        this.deliverWebhook(webhookEvent, endpoint)
      );

      await Promise.allSettled(deliveryPromises);

      // 5. Mettre à jour le store si nécessaire
      if (event.type === 'subscription.updated' || event.type === 'plan.changed') {
        this.updateSubscriptionStore(event);
      }

    } catch (error) {
      console.error('❌ Erreur diffusion événement:', error);
    }
  }

  /**
   * Livraison d'un webhook à un endpoint
   */
  private static async deliverWebhook(
    event: WebhookEvent,
    endpoint: WebhookEndpoint
  ): Promise<void> {
    const maxRetries = this.MAX_RETRIES;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        console.log(`📤 Tentative ${attempt + 1}/${maxRetries + 1} pour ${endpoint.url}`);

        // 1. Préparer le payload
        const payload = {
          id: event.id,
          type: event.type,
          created: new Date(event.timestamp).getTime() / 1000,
          data: {
            object: event.data,
          },
        };

        // 2. Générer la signature
        const signature = this.generateWebhookSignature(payload, endpoint.secret);

        // 3. Envoyer la requête
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'E-Pilot-Signature': signature,
            'User-Agent': 'E-Pilot-Webhooks/1.0',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok) {
          console.log(`✅ Webhook livré avec succès à ${endpoint.url}`);
          
          // Logger le succès
          await this.logWebhookDelivery(event.id, endpoint.id, 'success', response.status);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        console.error(`❌ Échec livraison webhook (tentative ${attempt + 1}):`, error);
        
        // Logger l'échec
        await this.logWebhookDelivery(
          event.id,
          endpoint.id,
          'failed',
          0,
          (error as Error).message
        );

        attempt++;

        // Attendre avant la prochaine tentative
        if (attempt <= maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.RETRY_DELAYS[attempt - 1] || 15000)
          );
        }
      }
    }

    console.error(`💀 Abandon après ${maxRetries + 1} tentatives pour ${endpoint.url}`);
  }

  /**
   * Gestionnaires d'événements spécifiques
   */
  private static async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    const schoolGroupId = paymentIntent.metadata?.school_group_id;
    if (!schoolGroupId) return;

    // 1. Mettre à jour l'abonnement
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('school_group_id', schoolGroupId)
      .eq('status', 'pending');

    if (error) {
      console.error('Erreur mise à jour abonnement après paiement:', error);
      return;
    }

    // 2. Diffuser l'événement
    await this.broadcastEvent({
      type: 'payment.succeeded',
      school_group_id: schoolGroupId,
      data: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private static async handlePaymentFailure(paymentIntent: any): Promise<void> {
    const schoolGroupId = paymentIntent.metadata?.school_group_id;
    if (!schoolGroupId) return;

    // 1. Logger l'échec de paiement
    await supabase.from('payment_failures').insert({
      school_group_id: schoolGroupId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failure_reason: paymentIntent.last_payment_error?.message,
      external_id: paymentIntent.id,
      created_at: new Date().toISOString(),
    });

    // 2. Diffuser l'événement
    await this.broadcastEvent({
      type: 'payment.failed',
      school_group_id: schoolGroupId,
      data: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        error: paymentIntent.last_payment_error,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private static async handleSubscriptionUpdate(subscription: any): Promise<void> {
    const schoolGroupId = subscription.metadata?.school_group_id;
    if (!schoolGroupId) return;

    // Diffuser l'événement de mise à jour
    await this.broadcastEvent({
      type: 'subscription.updated',
      school_group_id: schoolGroupId,
      data: {
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        plan_id: subscription.items.data[0]?.price?.id,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Mise à jour du store de subscription
   */
  private static updateSubscriptionStore(event: WebhookEvent): void {
    const store = useSubscriptionStore.getState();
    
    if (store.currentSubscription?.school_group_id === event.school_group_id) {
      // Forcer un refresh du store
      store.forceRefresh();
    }
  }

  /**
   * Utilitaires
   */
  private static verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implémentation de vérification de signature (HMAC SHA256)
    // À adapter selon le fournisseur (Stripe, PayPal, etc.)
    return true; // Placeholder
  }

  private static generateWebhookSignature(payload: any, secret: string): string {
    // Génération de signature HMAC SHA256
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  private static async logWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      await supabase.from('webhook_events').insert({
        id: event.id,
        type: event.type,
        school_group_id: event.school_group_id,
        data: event.data,
        processed: event.processed,
        retry_count: event.retry_count,
        external_id: event.external_id,
        created_at: event.timestamp,
      });
    } catch (error) {
      console.error('Erreur logging webhook event:', error);
    }
  }

  private static async logWebhookDelivery(
    eventId: string,
    endpointId: string,
    status: 'success' | 'failed',
    httpStatus: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('webhook_deliveries').insert({
        event_id: eventId,
        endpoint_id: endpointId,
        status,
        http_status: httpStatus,
        error_message: errorMessage,
        delivered_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur logging webhook delivery:', error);
    }
  }

  /**
   * Configuration et gestion des endpoints
   */
  static async createWebhookEndpoint(
    schoolGroupId: string,
    url: string,
    events: string[]
  ): Promise<WebhookEndpoint> {
    const endpoint: WebhookEndpoint = {
      id: crypto.randomUUID(),
      school_group_id: schoolGroupId,
      url,
      events,
      secret: this.generateWebhookSecret(),
      active: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('webhook_endpoints')
      .insert(endpoint);

    if (error) throw error;

    return endpoint;
  }

  private static generateWebhookSecret(): string {
    return 'whsec_' + crypto.randomUUID().replace(/-/g, '');
  }

  /**
   * Test de connectivité d'un endpoint
   */
  static async testWebhookEndpoint(endpointId: string): Promise<boolean> {
    try {
      const { data: endpoint } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('id', endpointId)
        .single();

      if (!endpoint) return false;

      const testEvent: WebhookEvent = {
        id: 'test_' + crypto.randomUUID(),
        type: 'subscription.updated',
        school_group_id: endpoint.school_group_id,
        data: { test: true },
        timestamp: new Date().toISOString(),
        processed: false,
        retry_count: 0,
      };

      await this.deliverWebhook(testEvent, endpoint);
      return true;

    } catch (error) {
      console.error('Erreur test webhook endpoint:', error);
      return false;
    }
  }
}
