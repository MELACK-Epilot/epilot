/**
 * Configuration Supabase pour E-Pilot Congo
 * @module Supabase
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variables Supabase manquantes. Vérifiez votre fichier .env.local'
  );
}

/**
 * Client Supabase singleton
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'e-pilot-congo',
    },
  },
});

/**
 * Helper pour gérer les erreurs Supabase
 */
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error:', error);
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Une erreur est survenue. Veuillez réessayer.';
};

/**
 * Helper pour vérifier la connexion
 */
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
      return false;
    }
    
    console.log('✅ Connexion Supabase établie');
    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion Supabase:', err);
    return false;
  }
};

export default supabase;
