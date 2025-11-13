/**
 * Export barrel pour tous les hooks Inscriptions
 * Architecture modulaire - Chaque hook dans son propre fichier
 */

// Query Keys
export { inscriptionKeys } from './keys';

// Types
export type { 
  SupabaseInscription, 
  SupabaseInscriptionInsert, 
  SupabaseInscriptionUpdate 
} from './types';

// Transformers
export { transformInscription } from './transformers';

// Queries
export { useInscriptions } from './queries/useInscriptions';
export { useInscription } from './queries/useInscription';
export { useInscriptionStats } from './queries/useInscriptionStats';

// Mutations
export { useCreateInscription } from './mutations/useCreateInscription';
export { useUpdateInscription } from './mutations/useUpdateInscription';
export { useDeleteInscription } from './mutations/useDeleteInscription';
export { useValidateInscription } from './mutations/useValidateInscription';
export { useRejectInscription } from './mutations/useRejectInscription';

// Utils
export { createEmptyStats, calculateStats } from './utils/stats';
