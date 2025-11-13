/**
 * Gestion de la persistance locale avec Dexie.js (IndexedDB)
 * @module auth.db
 */

import Dexie, { type Table } from 'dexie';
import type { PersistedAuth } from '../types/auth.types';

/**
 * Base de données IndexedDB pour E-Pilot
 */
class EPilotDatabase extends Dexie {
  auth!: Table<PersistedAuth>;

  constructor() {
    super('EPilotDB');
    
    this.version(1).stores({
      auth: '++id, email, expiresAt',
    });
  }
}

// Instance unique de la base de données
const db = new EPilotDatabase();

/**
 * Sauvegarder les données d'authentification dans IndexedDB
 */
export const saveAuthToIndexedDB = async (authData: PersistedAuth): Promise<void> => {
  try {
    // Supprimer les anciennes entrées
    await db.auth.clear();
    
    // Ajouter la nouvelle entrée
    await db.auth.add(authData);
    
    console.log('✅ Auth saved to IndexedDB');
  } catch (error) {
    console.error('❌ Error saving auth to IndexedDB:', error);
    throw error;
  }
};

/**
 * Récupérer les données d'authentification depuis IndexedDB
 */
export const getAuthFromIndexedDB = async (): Promise<PersistedAuth | null> => {
  try {
    const authData = await db.auth.toArray();
    
    if (authData.length === 0) {
      return null;
    }

    const auth = authData[0];

    // Vérifier si le token est expiré
    if (auth.expiresAt < Date.now()) {
      console.log('⚠️ Token expired, clearing IndexedDB');
      await clearAuthFromIndexedDB();
      return null;
    }

    return auth;
  } catch (error) {
    console.error('❌ Error getting auth from IndexedDB:', error);
    return null;
  }
};

/**
 * Supprimer les données d'authentification d'IndexedDB
 */
export const clearAuthFromIndexedDB = async (): Promise<void> => {
  try {
    await db.auth.clear();
    console.log('✅ Auth cleared from IndexedDB');
  } catch (error) {
    console.error('❌ Error clearing auth from IndexedDB:', error);
  }
};

/**
 * Vérifier si des données d'authentification existent
 */
export const hasPersistedAuth = async (): Promise<boolean> => {
  try {
    const count = await db.auth.count();
    return count > 0;
  } catch (error) {
    console.error('❌ Error checking persisted auth:', error);
    return false;
  }
};

export default db;
