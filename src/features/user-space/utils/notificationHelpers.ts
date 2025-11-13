/**
 * Utilitaires pour créer et gérer les notifications
 * Basé sur la vraie structure de la table notifications
 */

import { supabase } from '@/lib/supabase';

export interface CreateNotificationParams {
  // Destinataire (une seule option requise)
  userId?: string;           // Notification personnelle
  recipientId?: string;      // Notification à un utilisateur spécifique
  recipientRole?: string;    // Notification à tous les utilisateurs d'un rôle
  isGlobal?: boolean;        // Notification globale du groupe
  
  // Contenu
  title: string;
  message: string;
  type: string;              // 'message', 'grade', 'payment', 'system', etc.
  
  // Métadonnées
  schoolGroupId?: string;
  data?: Record<string, any>; // JSONB pour données supplémentaires
}

/**
 * Créer une notification personnelle pour un utilisateur
 */
export async function createPersonalNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: params.recipientId || params.userId,
        school_group_id: params.schoolGroupId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        is_read: false,
        is_global: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la notification personnelle:', error);
    throw error;
  }
}

/**
 * Créer une notification pour tous les utilisateurs d'un rôle
 */
export async function createRoleNotification(params: CreateNotificationParams & { recipientRole: string }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_role: params.recipientRole,
        school_group_id: params.schoolGroupId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        is_read: false,
        is_global: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la notification de rôle:', error);
    throw error;
  }
}

/**
 * Créer une notification globale pour tout le groupe scolaire
 */
export async function createGlobalNotification(params: CreateNotificationParams & { schoolGroupId: string }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        school_group_id: params.schoolGroupId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        is_read: false,
        is_global: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la notification globale:', error);
    throw error;
  }
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    throw error;
  }
}

/**
 * Marquer toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string, schoolGroupId?: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .or(`recipient_id.eq.${userId},user_id.eq.${userId}${schoolGroupId ? `,and(is_global.eq.true,school_group_id.eq.${schoolGroupId})` : ''}`);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage global:', error);
    throw error;
  }
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
}

/**
 * Exemples de notifications prédéfinies
 */
export const NotificationTemplates = {
  // Messages
  newMessage: (senderName: string, recipientId: string, schoolGroupId: string) => 
    createPersonalNotification({
      recipientId,
      schoolGroupId,
      type: 'message',
      title: 'Nouveau message',
      message: `Vous avez reçu un message de ${senderName}`,
      data: { 
        priority: 'medium', 
        actionUrl: '/user/messages',
        sender: senderName 
      }
    }),

  // Notes
  gradesUpdated: (subject: string, count: number, recipientRole: string, schoolGroupId: string) =>
    createRoleNotification({
      recipientRole,
      schoolGroupId,
      type: 'grade',
      title: 'Notes mises à jour',
      message: `${count} nouvelles notes ont été saisies en ${subject}`,
      data: { 
        priority: 'low', 
        actionUrl: '/user/grades',
        subject,
        count 
      }
    }),

  // Paiements
  paymentReceived: (amount: number, studentName: string, recipientId: string, schoolGroupId: string) =>
    createPersonalNotification({
      recipientId,
      schoolGroupId,
      type: 'payment',
      title: 'Paiement reçu',
      message: `Paiement de ${amount}€ reçu pour l'élève ${studentName}`,
      data: { 
        priority: 'medium', 
        actionUrl: '/user/payments',
        amount,
        student: studentName 
      }
    }),

  // Système
  systemMaintenance: (startTime: string, endTime: string, schoolGroupId: string) =>
    createGlobalNotification({
      schoolGroupId,
      type: 'system',
      title: 'Maintenance système',
      message: `Maintenance programmée de ${startTime} à ${endTime}`,
      data: { 
        priority: 'high',
        startTime,
        endTime 
      }
    }),

  // Réunions
  meetingScheduled: (meetingType: string, date: string, time: string, recipientRole: string, schoolGroupId: string) =>
    createRoleNotification({
      recipientRole,
      schoolGroupId,
      type: 'meeting',
      title: 'Réunion programmée',
      message: `${meetingType} prévu le ${date} à ${time}`,
      data: { 
        priority: 'high', 
        actionUrl: '/user/schedule',
        meetingType,
        date,
        time 
      }
    }),
};
