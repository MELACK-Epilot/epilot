/**
 * Utilitaires pour les statistiques d'inscriptions
 */

import type { InscriptionStats } from '../../types/inscriptions.types';

/**
 * Crée un objet de stats vide
 */
export function createEmptyStats(): InscriptionStats {
  return {
    total: 0,
    enAttente: 0,
    enCours: 0,
    validees: 0,
    refusees: 0,
    annulees: 0,
    byMonth: [],
    byLevel: [],
    validationRate: 0,
  };
}

/**
 * Calcule les statistiques à partir des données brutes
 */
export function calculateStats(
  data: Array<{ status: string; submitted_at: string; requested_level: string }>
): InscriptionStats {
  return {
    total: data.length,
    enAttente: data.filter(i => i.status === 'pending').length,
    enCours: data.filter(i => i.status === 'pending').length, // TODO: Ajouter statut en_cours
    validees: data.filter(i => i.status === 'validated').length,
    refusees: data.filter(i => i.status === 'rejected').length,
    annulees: data.filter(i => i.status === 'rejected').length, // TODO: Ajouter statut annulee
    byMonth: [],
    byLevel: [],
    validationRate: data.length > 0 
      ? Math.round((data.filter(i => i.status === 'validated').length / data.length) * 100)
      : 0,
  };
}
