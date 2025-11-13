/**
 * Point d'entrée principal pour toutes les features E-Pilot
 * Structure organisée par niveaux d'accès
 */

// Niveau 1 - Super Admin (Plateforme)
export * from './super-admin';

// Niveau 2 - Admin Groupe (Réseau d'écoles)
export * from './admin-groupe';

// Niveau 3 - User Space (Personnel)
export * from './user-space';

// Composants partagés
export * from './shared';

// Authentification
export * from './auth';

// Modules métier
export * from './modules';
