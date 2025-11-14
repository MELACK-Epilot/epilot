/**
 * Système de notifications avancé
 * Support: Toast, Push, Email, SMS
 * @module Notifications
 */

import { toast } from '@/hooks/use-toast';
import { logger } from './logger';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationChannel = 'toast' | 'push' | 'email' | 'sms';

interface NotificationOptions {
  title: string;
  description?: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: Record<string, any>;
}

/**
 * Classe de gestion des notifications
 */
class NotificationManager {
  private pushSupported = 'Notification' in window && 'serviceWorker' in navigator;
  private pushPermission: NotificationPermission = 'default';

  constructor() {
    if (this.pushSupported) {
      this.pushPermission = Notification.permission;
    }
  }

  /**
   * Envoyer une notification
   */
  async send(options: NotificationOptions): Promise<void> {
    const {
      title,
      description,
      type = 'info',
      channels = ['toast'],
      duration = 5000,
      action,
      data,
    } = options;

    // Logger la notification
    logger.info('Notification envoyée', { title, type, channels });

    // Envoyer sur chaque canal
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'toast':
            this.sendToast(title, description, type, duration, action);
            break;
          case 'push':
            await this.sendPush(title, description, type, data);
            break;
          case 'email':
            await this.sendEmail(title, description, data);
            break;
          case 'sms':
            await this.sendSMS(title, description, data);
            break;
        }
      } catch (error) {
        logger.error(`Erreur lors de l'envoi de notification (${channel})`, error as Error);
      }
    }
  }

  /**
   * Envoyer un toast
   */
  private sendToast(
    title: string,
    description?: string,
    type?: NotificationType,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ): void {
    const variant = type === 'error' ? 'destructive' : 'default';

    toast({
      title,
      description,
      variant,
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    });
  }

  /**
   * Envoyer une notification push
   */
  private async sendPush(
    title: string,
    description?: string,
    type?: NotificationType,
    data?: Record<string, any>
  ): Promise<void> {
    if (!this.pushSupported) {
      logger.warn('Push notifications non supportées');
      return;
    }

    // Demander la permission si nécessaire
    if (this.pushPermission === 'default') {
      this.pushPermission = await Notification.requestPermission();
    }

    if (this.pushPermission !== 'granted') {
      logger.warn('Permission de notification refusée');
      return;
    }

    // Créer la notification
    const notification = new Notification(title, {
      body: description,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: type,
      data,
      requireInteraction: type === 'error',
    });

    // Gérer les clics
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  /**
   * Envoyer un email
   */
  private async sendEmail(
    title: string,
    description?: string,
    data?: Record<string, any>
  ): Promise<void> {
    // TODO: Implémenter l'envoi d'email via API
    logger.debug('Envoi email', { title, description, data });

    // Exemple avec une API
    // await fetch('/api/notifications/email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ title, description, data }),
    // });
  }

  /**
   * Envoyer un SMS
   */
  private async sendSMS(
    title: string,
    description?: string,
    data?: Record<string, any>
  ): Promise<void> {
    // TODO: Implémenter l'envoi de SMS via API (Twilio, etc.)
    logger.debug('Envoi SMS', { title, description, data });

    // Exemple avec Twilio
    // await fetch('/api/notifications/sms', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ title, description, data }),
    // });
  }

  /**
   * Demander la permission pour les notifications push
   */
  async requestPushPermission(): Promise<boolean> {
    if (!this.pushSupported) return false;

    this.pushPermission = await Notification.requestPermission();
    return this.pushPermission === 'granted';
  }

  /**
   * Vérifier si les notifications push sont autorisées
   */
  isPushEnabled(): boolean {
    return this.pushSupported && this.pushPermission === 'granted';
  }
}

// Instance singleton
export const notificationManager = new NotificationManager();

/**
 * Helpers pour les notifications courantes
 */
export const notify = {
  success: (title: string, description?: string, channels?: NotificationChannel[]) =>
    notificationManager.send({ title, description, type: 'success', channels }),

  error: (title: string, description?: string, channels?: NotificationChannel[]) =>
    notificationManager.send({ title, description, type: 'error', channels }),

  warning: (title: string, description?: string, channels?: NotificationChannel[]) =>
    notificationManager.send({ title, description, type: 'warning', channels }),

  info: (title: string, description?: string, channels?: NotificationChannel[]) =>
    notificationManager.send({ title, description, type: 'info', channels }),
};

/**
 * Notifications spécifiques au domaine
 */
export const domainNotifications = {
  moduleUpdated: (moduleName: string) =>
    notify.info('📦 Module mis à jour', `Le module "${moduleName}" a été actualisé`, ['toast']),

  categoryUpdated: (categoryName: string) =>
    notify.info('📁 Catégorie mise à jour', `La catégorie "${categoryName}" a été actualisée`, [
      'toast',
    ]),

  inscriptionCreated: (studentName: string) =>
    notify.success(
      '✅ Inscription créée',
      `L'inscription de ${studentName} a été enregistrée`,
      ['toast', 'push']
    ),

  inscriptionValidated: (studentName: string) =>
    notify.success(
      '✅ Inscription validée',
      `L'inscription de ${studentName} a été validée`,
      ['toast', 'email']
    ),

  paymentReceived: (amount: number, studentName: string) =>
    notify.success(
      '💰 Paiement reçu',
      `Paiement de ${amount} FCFA reçu pour ${studentName}`,
      ['toast', 'push']
    ),

  syncError: (error: string) =>
    notify.error('❌ Erreur de synchronisation', error, ['toast']),

  sandboxDataGenerated: (count: number) =>
    notify.success(
      '🧪 Données sandbox générées',
      `${count} entités créées avec succès`,
      ['toast']
    ),
};
