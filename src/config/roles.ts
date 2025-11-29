/**
 * Configuration centralisée des rôles E-Pilot Congo
 * Source unique de vérité pour tous les rôles et permissions
 * @module roles
 */

// ============================================================================
// NORMALISATION DES RÔLES (Aliases)
// ============================================================================

/**
 * Mapping des alias de rôles vers leurs noms normalisés
 * Utilisé pour gérer les incohérences entre BDD et application
 */
export const ROLE_ALIASES: Record<string, string> = {
  'group_admin': 'admin_groupe',
  // Note: admin_ecole/school_admin N'EXISTE PAS
  // C'est admin_groupe qui gère les écoles
} as const;

// ============================================================================
// RÔLES ADMINISTRATEURS (Accès Dashboard)
// ============================================================================

/**
 * Rôles ayant accès au dashboard administrateur (/dashboard)
 * Ces rôles gèrent la plateforme au niveau global ou groupe
 */
export const ADMIN_ROLES = [
  'super_admin',      // Gère toute la plateforme
  'admin_groupe',     // Gère un groupe scolaire
] as const;

// ============================================================================
// RÔLES UTILISATEURS ÉCOLE (Accès Espace Utilisateur)
// ============================================================================

/**
 * Rôles ayant accès à l'espace utilisateur école (/user)
 * Ces rôles sont liés à un établissement scolaire spécifique
 * Note: admin_ecole/school_admin N'EXISTE PAS - c'est admin_groupe qui gère
 */
export const USER_ROLES = [
  // Direction
  'proviseur',             // Proviseur
  'directeur',             // Directeur
  'directeur_etudes',      // Directeur des études
  
  // Personnel administratif
  'secretaire',            // Secrétaire
  'comptable',             // Comptable
  
  // Personnel éducatif
  'enseignant',            // Enseignant
  'cpe',                   // Conseiller Principal d'Éducation
  'surveillant',           // Surveillant
  
  // Personnel spécialisé
  'bibliothecaire',        // Bibliothécaire
  'gestionnaire_cantine',  // Gestionnaire de cantine
  'conseiller_orientation',// Conseiller d'orientation
  'infirmier',             // Infirmier
  
  // Utilisateurs finaux
  'eleve',                 // Élève
  'parent',                // Parent
  'autre',                 // Autre (rôle générique)
] as const;

// ============================================================================
// TOUS LES RÔLES
// ============================================================================

/**
 * Liste complète de tous les rôles de la plateforme
 */
export const ALL_ROLES = [...ADMIN_ROLES, ...USER_ROLES] as const;

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type AdminRole = typeof ADMIN_ROLES[number];
export type UserRole = typeof USER_ROLES[number];
export type Role = typeof ALL_ROLES[number];

/**
 * Type union de tous les rôles pour utilisation dans les types Supabase
 */
export type UserRoleType = 
  | 'super_admin' 
  | 'admin_groupe' 
  | 'proviseur' 
  | 'directeur' 
  | 'directeur_etudes' 
  | 'secretaire' 
  | 'comptable' 
  | 'enseignant' 
  | 'cpe' 
  | 'surveillant' 
  | 'bibliothecaire' 
  | 'gestionnaire_cantine' 
  | 'conseiller_orientation' 
  | 'infirmier' 
  | 'eleve' 
  | 'parent' 
  | 'autre';

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Normalise un rôle en appliquant les alias
 * @param role - Rôle brut venant de la BDD
 * @returns Rôle normalisé
 * 
 * @example
 * normalizeRole('group_admin') // 'admin_groupe'
 * normalizeRole('directeur')   // 'directeur'
 */
export function normalizeRole(role: string): string {
  return ROLE_ALIASES[role] || role;
}

/**
 * Vérifie si un rôle est un rôle administrateur
 * @param role - Rôle à vérifier (brut ou normalisé)
 * @returns true si le rôle est admin
 * 
 * @example
 * isAdminRole('super_admin')  // true
 * isAdminRole('group_admin')  // true (alias)
 * isAdminRole('directeur')    // false
 */
export function isAdminRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return ADMIN_ROLES.includes(normalized as AdminRole);
}

/**
 * Vérifie si un rôle est un rôle utilisateur école
 * @param role - Rôle à vérifier (brut ou normalisé)
 * @returns true si le rôle est utilisateur école
 * 
 * @example
 * isUserRole('directeur')     // true
 * isUserRole('school_admin')  // true (alias)
 * isUserRole('super_admin')   // false
 */
export function isUserRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return USER_ROLES.includes(normalized as UserRole);
}

/**
 * Vérifie si un rôle est valide
 * @param role - Rôle à vérifier
 * @returns true si le rôle existe
 * 
 * @example
 * isValidRole('directeur')    // true
 * isValidRole('invalid_role') // false
 */
export function isValidRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return ALL_ROLES.includes(normalized as Role);
}

/**
 * Labels d'affichage des rôles
 * Note: proviseur et directeur sont des "Chefs d'établissement"
 */
export const ROLE_LABELS: Record<string, string> = {
  'super_admin': 'Super Admin',
  'admin_groupe': 'Admin Groupe',
  'proviseur': "Chef d'établissement",      // Proviseur = Chef d'établissement
  'directeur': "Chef d'établissement",      // Directeur = Chef d'établissement
  'directeur_etudes': 'Directeur des Études',
  'secretaire': 'Secrétaire',
  'comptable': 'Comptable',
  'enseignant': 'Enseignant',
  'cpe': 'CPE',
  'surveillant': 'Surveillant',
  'bibliothecaire': 'Bibliothécaire',
  'gestionnaire_cantine': 'Gestionnaire Cantine',
  'conseiller_orientation': "Conseiller d'Orientation",
  'infirmier': 'Infirmier',
  'eleve': 'Élève',
  'parent': 'Parent',
  'autre': 'Autre',
} as const;

/**
 * Labels détaillés (avec distinction proviseur/directeur si nécessaire)
 */
export const ROLE_LABELS_DETAILED: Record<string, string> = {
  ...ROLE_LABELS,
  'proviseur': 'Proviseur (Chef d\'établissement)',
  'directeur': 'Directeur (Chef d\'établissement)',
} as const;

/**
 * Vérifie si un rôle est un chef d'établissement
 * @param role - Rôle à vérifier
 * @returns true si proviseur ou directeur
 */
export function isChefEtablissement(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'proviseur' || normalized === 'directeur';
}

/**
 * Obtient le label d'affichage d'un rôle
 * @param role - Rôle à formater
 * @param detailed - Si true, affiche "Proviseur (Chef d'établissement)"
 * @returns Label formaté pour l'affichage
 * 
 * @example
 * getRoleLabel('proviseur')           // "Chef d'établissement"
 * getRoleLabel('proviseur', true)     // "Proviseur (Chef d'établissement)"
 * getRoleLabel('directeur_etudes')    // "Directeur des Études"
 */
export function getRoleLabel(role: string, detailed: boolean = false): string {
  const normalized = normalizeRole(role);
  
  if (detailed) {
    return ROLE_LABELS_DETAILED[normalized] || normalized.replace('_', ' ');
  }
  
  return ROLE_LABELS[normalized] || normalized.replace('_', ' ');
}

// ============================================================================
// PERMISSIONS PAR RÔLE
// ============================================================================

/**
 * Définit les permissions spécifiques par rôle
 */
export const ROLE_PERMISSIONS = {
  // Super Admin : Accès total
  super_admin: {
    canManageUsers: true,
    canManageSchoolGroups: true,
    canManageSchools: false,
    canManagePlans: true,
    canViewActivityLogs: true,
    canAccessDashboard: true,
    canAccessUserSpace: false,
  },
  
  // Admin Groupe : Gestion groupe + écoles
  admin_groupe: {
    canManageUsers: true,
    canManageSchoolGroups: false,
    canManageSchools: true,
    canManagePlans: false,
    canViewActivityLogs: false,
    canAccessDashboard: true,
    canAccessUserSpace: true, // Peut aussi accéder à l'espace user
  },
  
  // Autres rôles : Accès limité
  default: {
    canManageUsers: false,
    canManageSchoolGroups: false,
    canManageSchools: false,
    canManagePlans: false,
    canViewActivityLogs: false,
    canAccessDashboard: false,
    canAccessUserSpace: true,
  },
} as const;

/**
 * Obtient les permissions d'un rôle
 * @param role - Rôle à vérifier
 * @returns Objet de permissions
 */
export function getRolePermissions(role: string) {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.default;
}

/**
 * Vérifie si un rôle a une permission spécifique
 * @param role - Rôle à vérifier
 * @param permission - Permission à vérifier
 * @returns true si le rôle a la permission
 */
export function hasPermission(role: string, permission: keyof typeof ROLE_PERMISSIONS.default): boolean {
  const permissions = getRolePermissions(role);
  return permissions[permission];
}
