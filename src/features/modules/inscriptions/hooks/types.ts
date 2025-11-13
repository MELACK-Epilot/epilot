/**
 * Types Supabase pour Inscriptions
 * Utilise les types générés automatiquement
 */

import type { Database } from '@/types/supabase.types';

export type SupabaseInscription = Database['public']['Tables']['inscriptions']['Row'];
export type SupabaseInscriptionInsert = Database['public']['Tables']['inscriptions']['Insert'];
export type SupabaseInscriptionUpdate = Database['public']['Tables']['inscriptions']['Update'];
