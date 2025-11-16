/**
 * Activity Logger - Utilitaire pour enregistrer les logs d'activité
 * Simplifie l'enregistrement des actions utilisateurs dans activity_logs
 */

import { supabase } from './supabase';

export type ActivityAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export'
  | 'login'
  | 'logout'
  | 'password_change'
  | 'permission_change'
  | 'upload'
  | 'download';

export type ActivityEntity = 
  | 'user'
  | 'student'
  | 'class'
  | 'grade'
  | 'payment'
  | 'expense'
  | 'document'
  | 'report'
  | 'school'
  | 'school_group'
  | 'module'
  | 'category';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enregistre une activité dans la table activity_logs
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId || null,
        details: params.details || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Erreur lors de l\'enregistrement du log:', error);
    } else {
      console.log('✅ Log enregistré:', params.action, params.entity);
    }
  } catch (error) {
    console.error('❌ Erreur inattendue lors de l\'enregistrement du log:', error);
  }
}

/**
 * Enregistre une création
 */
export async function logCreate(
  userId: string,
  entity: ActivityEntity,
  entityId: string,
  details?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'create',
    entity,
    entityId,
    details: details || `Création d'un(e) ${entity}`,
  });
}

/**
 * Enregistre une modification
 */
export async function logUpdate(
  userId: string,
  entity: ActivityEntity,
  entityId: string,
  details?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'update',
    entity,
    entityId,
    details: details || `Modification d'un(e) ${entity}`,
  });
}

/**
 * Enregistre une suppression
 */
export async function logDelete(
  userId: string,
  entity: ActivityEntity,
  entityId: string,
  details?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'delete',
    entity,
    entityId,
    details: details || `Suppression d'un(e) ${entity}`,
  });
}

/**
 * Enregistre une consultation
 */
export async function logView(
  userId: string,
  entity: ActivityEntity,
  entityId?: string,
  details?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'view',
    entity,
    entityId,
    details: details || `Consultation d'un(e) ${entity}`,
  });
}

/**
 * Enregistre un export
 */
export async function logExport(
  userId: string,
  entity: ActivityEntity,
  format: 'pdf' | 'excel' | 'csv',
  details?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'export',
    entity,
    details: details || `Export ${format.toUpperCase()} de ${entity}`,
  });
}

/**
 * Enregistre une connexion
 */
export async function logLogin(userId: string, ipAddress?: string): Promise<void> {
  await logActivity({
    userId,
    action: 'login',
    entity: 'user',
    entityId: userId,
    details: 'Connexion réussie à l\'application',
    ipAddress,
  });
}

/**
 * Enregistre une déconnexion
 */
export async function logLogout(userId: string): Promise<void> {
  await logActivity({
    userId,
    action: 'logout',
    entity: 'user',
    entityId: userId,
    details: 'Déconnexion de l\'application',
  });
}

/**
 * Récupère l'adresse IP de l'utilisateur (approximative)
 */
export async function getUserIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Impossible de récupérer l\'IP:', error);
    return undefined;
  }
}

/**
 * Exemples d'utilisation :
 * 
 * // Enregistrer une création d'élève
 * await logCreate(userId, 'student', studentId, 'Création de l\'élève Jean Dupont');
 * 
 * // Enregistrer une modification de note
 * await logUpdate(userId, 'grade', gradeId, 'Modification de la note de mathématiques');
 * 
 * // Enregistrer une suppression de paiement
 * await logDelete(userId, 'payment', paymentId, 'Suppression du paiement #123');
 * 
 * // Enregistrer une consultation de rapport
 * await logView(userId, 'report', reportId, 'Consultation du rapport mensuel');
 * 
 * // Enregistrer un export PDF
 * await logExport(userId, 'report', 'pdf', 'Export du rapport académique');
 * 
 * // Enregistrer une connexion avec IP
 * const ip = await getUserIP();
 * await logLogin(userId, ip);
 */
