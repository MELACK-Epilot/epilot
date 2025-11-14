/**
 * Système de permissions avancé avec RBAC (Role-Based Access Control)
 * @module Permissions
 */

import { logger } from './logger';

export type Role =
  | 'super_admin'
  | 'admin_groupe'
  | 'proviseur'
  | 'directeur'
  | 'enseignant'
  | 'secretaire'
  | 'cpe'
  | 'comptable';

export type Permission =
  // Modules
  | 'modules.view'
  | 'modules.create'
  | 'modules.update'
  | 'modules.delete'
  | 'modules.assign'
  // Catégories
  | 'categories.view'
  | 'categories.create'
  | 'categories.update'
  | 'categories.delete'
  // Groupes scolaires
  | 'school_groups.view'
  | 'school_groups.create'
  | 'school_groups.update'
  | 'school_groups.delete'
  // Écoles
  | 'schools.view'
  | 'schools.create'
  | 'schools.update'
  | 'schools.delete'
  // Utilisateurs
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.assign_roles'
  // Élèves
  | 'students.view'
  | 'students.create'
  | 'students.update'
  | 'students.delete'
  // Inscriptions
  | 'inscriptions.view'
  | 'inscriptions.create'
  | 'inscriptions.update'
  | 'inscriptions.delete'
  | 'inscriptions.validate'
  // Classes
  | 'classes.view'
  | 'classes.create'
  | 'classes.update'
  | 'classes.delete'
  // Notes
  | 'grades.view'
  | 'grades.create'
  | 'grades.update'
  | 'grades.delete'
  // Finances
  | 'finances.view'
  | 'finances.create'
  | 'finances.update'
  | 'finances.delete'
  // Sandbox
  | 'sandbox.view'
  | 'sandbox.manage';

/**
 * Matrice des permissions par rôle
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    // Tout
    'modules.view',
    'modules.create',
    'modules.update',
    'modules.delete',
    'modules.assign',
    'categories.view',
    'categories.create',
    'categories.update',
    'categories.delete',
    'school_groups.view',
    'school_groups.create',
    'school_groups.update',
    'school_groups.delete',
    'schools.view',
    'schools.create',
    'schools.update',
    'schools.delete',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.assign_roles',
    'students.view',
    'students.create',
    'students.update',
    'students.delete',
    'inscriptions.view',
    'inscriptions.create',
    'inscriptions.update',
    'inscriptions.delete',
    'inscriptions.validate',
    'classes.view',
    'classes.create',
    'classes.update',
    'classes.delete',
    'grades.view',
    'grades.create',
    'grades.update',
    'grades.delete',
    'finances.view',
    'finances.create',
    'finances.update',
    'finances.delete',
    'sandbox.view',
    'sandbox.manage',
  ],

  admin_groupe: [
    'modules.view',
    'modules.assign',
    'categories.view',
    'school_groups.view',
    'school_groups.update',
    'schools.view',
    'schools.create',
    'schools.update',
    'schools.delete',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.assign_roles',
    'students.view',
    'inscriptions.view',
    'classes.view',
    'finances.view',
  ],

  proviseur: [
    'modules.view',
    'schools.view',
    'users.view',
    'users.create',
    'users.update',
    'students.view',
    'students.create',
    'students.update',
    'students.delete',
    'inscriptions.view',
    'inscriptions.create',
    'inscriptions.update',
    'inscriptions.validate',
    'classes.view',
    'classes.create',
    'classes.update',
    'classes.delete',
    'grades.view',
    'finances.view',
  ],

  directeur: [
    'modules.view',
    'schools.view',
    'users.view',
    'students.view',
    'students.create',
    'students.update',
    'inscriptions.view',
    'inscriptions.create',
    'inscriptions.update',
    'inscriptions.validate',
    'classes.view',
    'classes.create',
    'classes.update',
    'grades.view',
    'finances.view',
  ],

  enseignant: [
    'modules.view',
    'students.view',
    'classes.view',
    'grades.view',
    'grades.create',
    'grades.update',
  ],

  secretaire: [
    'modules.view',
    'students.view',
    'students.create',
    'students.update',
    'inscriptions.view',
    'inscriptions.create',
    'inscriptions.update',
    'classes.view',
  ],

  cpe: [
    'modules.view',
    'students.view',
    'classes.view',
    'grades.view',
  ],

  comptable: [
    'modules.view',
    'students.view',
    'finances.view',
    'finances.create',
    'finances.update',
  ],
};

/**
 * Classe de gestion des permissions
 */
class PermissionManager {
  /**
   * Vérifier si un rôle a une permission
   */
  hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  }

  /**
   * Vérifier si un rôle a toutes les permissions
   */
  hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(role, permission));
  }

  /**
   * Vérifier si un rôle a au moins une permission
   */
  hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(role, permission));
  }

  /**
   * Obtenir toutes les permissions d'un rôle
   */
  getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Vérifier si un utilisateur peut accéder à une ressource
   */
  canAccess(
    userRole: Role,
    resource: string,
    action: 'view' | 'create' | 'update' | 'delete'
  ): boolean {
    const permission = `${resource}.${action}` as Permission;
    const hasPermission = this.hasPermission(userRole, permission);

    // Logger l'accès
    logger.debug('Permission check', {
      role: userRole,
      resource,
      action,
      permission,
      granted: hasPermission,
    });

    return hasPermission;
  }

  /**
   * Obtenir les rôles qui ont une permission
   */
  getRolesWithPermission(permission: Permission): Role[] {
    return Object.entries(ROLE_PERMISSIONS)
      .filter(([_, permissions]) => permissions.includes(permission))
      .map(([role]) => role as Role);
  }

  /**
   * Vérifier si un rôle est supérieur à un autre
   */
  isRoleHigherThan(role1: Role, role2: Role): boolean {
    const hierarchy: Role[] = [
      'super_admin',
      'admin_groupe',
      'proviseur',
      'directeur',
      'cpe',
      'enseignant',
      'secretaire',
      'comptable',
    ];

    const index1 = hierarchy.indexOf(role1);
    const index2 = hierarchy.indexOf(role2);

    return index1 < index2;
  }
}

// Instance singleton
export const permissionManager = new PermissionManager();

/**
 * Hook React pour vérifier les permissions
 */
export function usePermission(permission: Permission) {
  // TODO: Récupérer le rôle de l'utilisateur depuis le contexte
  // const { user } = useAuth();
  // return permissionManager.hasPermission(user.role, permission);
  
  return true; // Temporaire
}

/**
 * Hook React pour vérifier plusieurs permissions
 */
export function usePermissions(permissions: Permission[], mode: 'all' | 'any' = 'all') {
  // TODO: Récupérer le rôle de l'utilisateur depuis le contexte
  // const { user } = useAuth();
  
  // if (mode === 'all') {
  //   return permissionManager.hasAllPermissions(user.role, permissions);
  // } else {
  //   return permissionManager.hasAnyPermission(user.role, permissions);
  // }
  
  return true; // Temporaire
}

/**
 * Composant pour afficher conditionnellement selon les permissions
 */
export function Can({
  permission,
  children,
  fallback,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasPermission = usePermission(permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Helpers pour les permissions courantes
 */
export const can = {
  viewModules: (role: Role) => permissionManager.hasPermission(role, 'modules.view'),
  createModules: (role: Role) => permissionManager.hasPermission(role, 'modules.create'),
  updateModules: (role: Role) => permissionManager.hasPermission(role, 'modules.update'),
  deleteModules: (role: Role) => permissionManager.hasPermission(role, 'modules.delete'),
  assignModules: (role: Role) => permissionManager.hasPermission(role, 'modules.assign'),
  
  viewSandbox: (role: Role) => permissionManager.hasPermission(role, 'sandbox.view'),
  manageSandbox: (role: Role) => permissionManager.hasPermission(role, 'sandbox.manage'),
  
  validateInscriptions: (role: Role) =>
    permissionManager.hasPermission(role, 'inscriptions.validate'),
};
