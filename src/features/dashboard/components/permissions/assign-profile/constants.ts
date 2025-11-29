/**
 * Constantes pour le dialogue d'assignation de profil
 * @module assign-profile/constants
 */

/** Rôles exclus de l'assignation (admins) */
export const EXCLUDED_ROLES = ['admin_groupe', 'super_admin'] as const;

/** Hauteur d'un item dans la liste virtualisée */
export const ITEM_HEIGHT = 64;

/** Nombre max d'utilisateurs à charger */
export const MAX_USERS_LIMIT = 500;

/** Taille des batches pour les updates */
export const BATCH_SIZE = 100;

/** Délai de debounce pour la recherche (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

/** Durée de cache pour les utilisateurs (ms) */
export const USERS_STALE_TIME = 2 * 60 * 1000; // 2 minutes
