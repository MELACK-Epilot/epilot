/**
 * Système de rôles robuste pour E-Pilot
 * Support pour 15+ rôles avec permissions granulaires
 * Architecture évolutive et maintenable
 * 
 * @module RolesTypes
 */

/**
 * Énumération des rôles disponibles dans le système
 */
export enum UserRole {
  // Rôles administratifs
  SUPER_ADMIN = 'super_admin',
  ADMIN_GROUPE = 'admin_groupe',
  
  // Direction
  PROVISEUR = 'proviseur',
  DIRECTEUR = 'directeur',
  DIRECTEUR_ETUDES = 'directeur_etudes',
  DIRECTEUR_ADJOINT = 'directeur_adjoint',
  
  // Personnel enseignant
  ENSEIGNANT = 'enseignant',
  PROFESSEUR_PRINCIPAL = 'professeur_principal',
  COORDINATEUR_MATIERE = 'coordinateur_matiere',
  
  // Personnel éducatif
  CPE = 'cpe',
  SURVEILLANT = 'surveillant',
  ASSISTANT_EDUCATION = 'assistant_education',
  
  // Personnel administratif
  SECRETAIRE = 'secretaire',
  SECRETAIRE_DIRECTION = 'secretaire_direction',
  AGENT_COMPTABLE = 'agent_comptable',
  COMPTABLE = 'comptable',
  
  // Personnel technique
  INFORMATICIEN = 'informaticien',
  BIBLIOTHECAIRE = 'bibliothecaire',
  INFIRMIER = 'infirmier',
  
  // Personnel de service
  AGENT_SERVICE = 'agent_service',
  GARDIEN = 'gardien',
  
  // Utilisateurs externes
  PARENT = 'parent',
  ELEVE = 'eleve',
  INVITE = 'invite',
}

/**
 * Hiérarchie des rôles (du plus élevé au plus bas)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN_GROUPE]: 90,
  [UserRole.PROVISEUR]: 80,
  [UserRole.DIRECTEUR]: 75,
  [UserRole.DIRECTEUR_ETUDES]: 70,
  [UserRole.DIRECTEUR_ADJOINT]: 65,
  [UserRole.CPE]: 60,
  [UserRole.PROFESSEUR_PRINCIPAL]: 55,
  [UserRole.COORDINATEUR_MATIERE]: 50,
  [UserRole.ENSEIGNANT]: 45,
  [UserRole.SECRETAIRE_DIRECTION]: 40,
  [UserRole.AGENT_COMPTABLE]: 38,
  [UserRole.COMPTABLE]: 35,
  [UserRole.SECRETAIRE]: 30,
  [UserRole.INFORMATICIEN]: 28,
  [UserRole.BIBLIOTHECAIRE]: 25,
  [UserRole.INFIRMIER]: 23,
  [UserRole.SURVEILLANT]: 20,
  [UserRole.ASSISTANT_EDUCATION]: 18,
  [UserRole.AGENT_SERVICE]: 15,
  [UserRole.GARDIEN]: 12,
  [UserRole.PARENT]: 10,
  [UserRole.ELEVE]: 5,
  [UserRole.INVITE]: 1,
};

/**
 * Permissions granulaires par domaine
 */
export interface DomainPermissions {
  // Permissions générales
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManage: boolean;
  canApprove: boolean;
}

/**
 * Permissions système par rôle
 */
export interface RolePermissions {
  // Gestion des utilisateurs
  users: DomainPermissions & {
    canCreateUsers: boolean;
    canAssignRoles: boolean;
    canSuspendUsers: boolean;
    canViewAllUsers: boolean;
  };
  
  // Gestion académique
  academic: DomainPermissions & {
    canManageClasses: boolean;
    canManageStudents: boolean;
    canManageGrades: boolean;
    canManageSchedule: boolean;
    canManageCurriculum: boolean;
    canViewReports: boolean;
  };
  
  // Gestion administrative
  administrative: DomainPermissions & {
    canManageStaff: boolean;
    canManagePayroll: boolean;
    canManageInventory: boolean;
    canManageDocuments: boolean;
    canManageEvents: boolean;
    canManageCommunication: boolean;
  };
  
  // Gestion financière
  financial: DomainPermissions & {
    canViewBudget: boolean;
    canManageBudget: boolean;
    canViewPayments: boolean;
    canManagePayments: boolean;
    canGenerateInvoices: boolean;
    canViewFinancialReports: boolean;
  };
  
  // Gestion technique
  technical: DomainPermissions & {
    canManageSystem: boolean;
    canManageModules: boolean;
    canViewLogs: boolean;
    canManageBackups: boolean;
    canManageIntegrations: boolean;
  };
  
  // Gestion des modules
  modules: DomainPermissions & {
    canAssignModules: boolean;
    canConfigureModules: boolean;
    canViewModuleStats: boolean;
  };
}

/**
 * Configuration des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    users: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
      canManage: true,
      canApprove: true,
      canCreateUsers: true,
      canAssignRoles: true,
      canSuspendUsers: true,
      canViewAllUsers: true,
    },
    academic: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageClasses: true,
      canManageStudents: true,
      canManageGrades: true,
      canManageSchedule: true,
      canManageCurriculum: true,
      canViewReports: true,
    },
    administrative: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageStaff: true,
      canManagePayroll: true,
      canManageInventory: true,
      canManageDocuments: true,
      canManageEvents: true,
      canManageCommunication: true,
    },
    financial: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
      canManage: true,
      canApprove: true,
      canViewBudget: true,
      canManageBudget: true,
      canViewPayments: true,
      canManagePayments: true,
      canGenerateInvoices: true,
      canViewFinancialReports: true,
    },
    technical: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageSystem: true,
      canManageModules: true,
      canViewLogs: true,
      canManageBackups: true,
      canManageIntegrations: true,
    },
    modules: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true,
      canManage: true,
      canApprove: true,
      canAssignModules: true,
      canConfigureModules: true,
      canViewModuleStats: true,
    },
  },

  [UserRole.ADMIN_GROUPE]: {
    users: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canCreateUsers: true,
      canAssignRoles: true,
      canSuspendUsers: true,
      canViewAllUsers: true,
    },
    academic: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageClasses: true,
      canManageStudents: true,
      canManageGrades: true,
      canManageSchedule: true,
      canManageCurriculum: true,
      canViewReports: true,
    },
    administrative: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageStaff: true,
      canManagePayroll: true,
      canManageInventory: true,
      canManageDocuments: true,
      canManageEvents: true,
      canManageCommunication: true,
    },
    financial: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canViewBudget: true,
      canManageBudget: true,
      canViewPayments: true,
      canManagePayments: true,
      canGenerateInvoices: true,
      canViewFinancialReports: true,
    },
    technical: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: false,
      canManage: false,
      canApprove: false,
      canManageSystem: false,
      canManageModules: false,
      canViewLogs: false,
      canManageBackups: false,
      canManageIntegrations: false,
    },
    modules: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canAssignModules: true,
      canConfigureModules: true,
      canViewModuleStats: true,
    },
  },

  [UserRole.PROVISEUR]: {
    users: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canCreateUsers: false,
      canAssignRoles: false,
      canSuspendUsers: false,
      canViewAllUsers: true,
    },
    academic: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageClasses: true,
      canManageStudents: true,
      canManageGrades: true,
      canManageSchedule: true,
      canManageCurriculum: true,
      canViewReports: true,
    },
    administrative: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageStaff: true,
      canManagePayroll: false,
      canManageInventory: true,
      canManageDocuments: true,
      canManageEvents: true,
      canManageCommunication: true,
    },
    financial: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: true,
      canManage: false,
      canApprove: true,
      canViewBudget: true,
      canManageBudget: false,
      canViewPayments: true,
      canManagePayments: false,
      canGenerateInvoices: false,
      canViewFinancialReports: true,
    },
    technical: {
      canRead: false,
      canWrite: false,
      canDelete: false,
      canExport: false,
      canManage: false,
      canApprove: false,
      canManageSystem: false,
      canManageModules: false,
      canViewLogs: false,
      canManageBackups: false,
      canManageIntegrations: false,
    },
    modules: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: true,
      canManage: false,
      canApprove: false,
      canAssignModules: false,
      canConfigureModules: false,
      canViewModuleStats: true,
    },
  },

  // Configuration pour les autres rôles (directeur, enseignant, etc.)
  [UserRole.DIRECTEUR]: {
    users: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: true,
      canManage: false,
      canApprove: false,
      canCreateUsers: false,
      canAssignRoles: false,
      canSuspendUsers: false,
      canViewAllUsers: true,
    },
    academic: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: true,
      canManageClasses: true,
      canManageStudents: true,
      canManageGrades: true,
      canManageSchedule: true,
      canManageCurriculum: true,
      canViewReports: true,
    },
    administrative: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: true,
      canManage: true,
      canApprove: false,
      canManageStaff: false,
      canManagePayroll: false,
      canManageInventory: true,
      canManageDocuments: true,
      canManageEvents: true,
      canManageCommunication: true,
    },
    financial: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: true,
      canManage: false,
      canApprove: false,
      canViewBudget: true,
      canManageBudget: false,
      canViewPayments: true,
      canManagePayments: false,
      canGenerateInvoices: false,
      canViewFinancialReports: true,
    },
    technical: {
      canRead: false,
      canWrite: false,
      canDelete: false,
      canExport: false,
      canManage: false,
      canApprove: false,
      canManageSystem: false,
      canManageModules: false,
      canViewLogs: false,
      canManageBackups: false,
      canManageIntegrations: false,
    },
    modules: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canExport: true,
      canManage: false,
      canApprove: false,
      canAssignModules: false,
      canConfigureModules: false,
      canViewModuleStats: true,
    },
  },

  // Configuration basique pour les autres rôles (à compléter selon les besoins)
  [UserRole.ENSEIGNANT]: {
    users: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canCreateUsers: false, canAssignRoles: false, canSuspendUsers: false, canViewAllUsers: false },
    academic: { canRead: true, canWrite: true, canDelete: false, canExport: true, canManage: false, canApprove: false, canManageClasses: false, canManageStudents: true, canManageGrades: true, canManageSchedule: false, canManageCurriculum: false, canViewReports: true },
    administrative: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canManageStaff: false, canManagePayroll: false, canManageInventory: false, canManageDocuments: false, canManageEvents: false, canManageCommunication: false },
    financial: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canViewBudget: false, canManageBudget: false, canViewPayments: false, canManagePayments: false, canGenerateInvoices: false, canViewFinancialReports: false },
    technical: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canManageSystem: false, canManageModules: false, canViewLogs: false, canManageBackups: false, canManageIntegrations: false },
    modules: { canRead: true, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canAssignModules: false, canConfigureModules: false, canViewModuleStats: false },
  },

  // Configuration par défaut pour tous les autres rôles
  ...Object.fromEntries(
    [
      UserRole.DIRECTEUR_ETUDES, UserRole.DIRECTEUR_ADJOINT, UserRole.PROFESSEUR_PRINCIPAL,
      UserRole.COORDINATEUR_MATIERE, UserRole.CPE, UserRole.SURVEILLANT, UserRole.ASSISTANT_EDUCATION,
      UserRole.SECRETAIRE, UserRole.SECRETAIRE_DIRECTION, UserRole.AGENT_COMPTABLE, UserRole.COMPTABLE,
      UserRole.INFORMATICIEN, UserRole.BIBLIOTHECAIRE, UserRole.INFIRMIER, UserRole.AGENT_SERVICE,
      UserRole.GARDIEN, UserRole.PARENT, UserRole.ELEVE, UserRole.INVITE
    ].map(role => [
      role,
      {
        users: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canCreateUsers: false, canAssignRoles: false, canSuspendUsers: false, canViewAllUsers: false },
        academic: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canManageClasses: false, canManageStudents: false, canManageGrades: false, canManageSchedule: false, canManageCurriculum: false, canViewReports: false },
        administrative: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canManageStaff: false, canManagePayroll: false, canManageInventory: false, canManageDocuments: false, canManageEvents: false, canManageCommunication: false },
        financial: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canViewBudget: false, canManageBudget: false, canViewPayments: false, canManagePayments: false, canGenerateInvoices: false, canViewFinancialReports: false },
        technical: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canManageSystem: false, canManageModules: false, canViewLogs: false, canManageBackups: false, canManageIntegrations: false },
        modules: { canRead: false, canWrite: false, canDelete: false, canExport: false, canManage: false, canApprove: false, canAssignModules: false, canConfigureModules: false, canViewModuleStats: false },
      }
    ])
  ) as Record<UserRole, RolePermissions>,

};

/**
 * Labels des rôles pour l'affichage
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrateur',
  [UserRole.ADMIN_GROUPE]: 'Administrateur Groupe',
  [UserRole.PROVISEUR]: 'Proviseur',
  [UserRole.DIRECTEUR]: 'Directeur',
  [UserRole.DIRECTEUR_ETUDES]: 'Directeur des Études',
  [UserRole.DIRECTEUR_ADJOINT]: 'Directeur Adjoint',
  [UserRole.ENSEIGNANT]: 'Enseignant',
  [UserRole.PROFESSEUR_PRINCIPAL]: 'Professeur Principal',
  [UserRole.COORDINATEUR_MATIERE]: 'Coordinateur de Matière',
  [UserRole.CPE]: 'Conseiller Principal d\'Éducation',
  [UserRole.SURVEILLANT]: 'Surveillant',
  [UserRole.ASSISTANT_EDUCATION]: 'Assistant d\'Éducation',
  [UserRole.SECRETAIRE]: 'Secrétaire',
  [UserRole.SECRETAIRE_DIRECTION]: 'Secrétaire de Direction',
  [UserRole.AGENT_COMPTABLE]: 'Agent Comptable',
  [UserRole.COMPTABLE]: 'Comptable',
  [UserRole.INFORMATICIEN]: 'Informaticien',
  [UserRole.BIBLIOTHECAIRE]: 'Bibliothécaire',
  [UserRole.INFIRMIER]: 'Infirmier',
  [UserRole.AGENT_SERVICE]: 'Agent de Service',
  [UserRole.GARDIEN]: 'Gardien',
  [UserRole.PARENT]: 'Parent',
  [UserRole.ELEVE]: 'Élève',
  [UserRole.INVITE]: 'Invité',
};

/**
 * Couleurs des badges par rôle
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-700 border-red-200',
  [UserRole.ADMIN_GROUPE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [UserRole.PROVISEUR]: 'bg-green-100 text-green-700 border-green-200',
  [UserRole.DIRECTEUR]: 'bg-green-100 text-green-700 border-green-200',
  [UserRole.DIRECTEUR_ETUDES]: 'bg-green-100 text-green-700 border-green-200',
  [UserRole.DIRECTEUR_ADJOINT]: 'bg-green-100 text-green-700 border-green-200',
  [UserRole.ENSEIGNANT]: 'bg-orange-100 text-orange-700 border-orange-200',
  [UserRole.PROFESSEUR_PRINCIPAL]: 'bg-orange-100 text-orange-700 border-orange-200',
  [UserRole.COORDINATEUR_MATIERE]: 'bg-orange-100 text-orange-700 border-orange-200',
  [UserRole.CPE]: 'bg-purple-100 text-purple-700 border-purple-200',
  [UserRole.SURVEILLANT]: 'bg-purple-100 text-purple-700 border-purple-200',
  [UserRole.ASSISTANT_EDUCATION]: 'bg-purple-100 text-purple-700 border-purple-200',
  [UserRole.SECRETAIRE]: 'bg-pink-100 text-pink-700 border-pink-200',
  [UserRole.SECRETAIRE_DIRECTION]: 'bg-pink-100 text-pink-700 border-pink-200',
  [UserRole.AGENT_COMPTABLE]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [UserRole.COMPTABLE]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [UserRole.INFORMATICIEN]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [UserRole.BIBLIOTHECAIRE]: 'bg-teal-100 text-teal-700 border-teal-200',
  [UserRole.INFIRMIER]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [UserRole.AGENT_SERVICE]: 'bg-gray-100 text-gray-700 border-gray-200',
  [UserRole.GARDIEN]: 'bg-gray-100 text-gray-700 border-gray-200',
  [UserRole.PARENT]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [UserRole.ELEVE]: 'bg-lime-100 text-lime-700 border-lime-200',
  [UserRole.INVITE]: 'bg-slate-100 text-slate-700 border-slate-200',
};

/**
 * Utilitaires pour les rôles
 */
export class RoleUtils {
  /**
   * Vérifier si un rôle a une permission spécifique
   */
  static hasPermission(role: UserRole, domain: keyof RolePermissions, permission: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role];
    if (!rolePermissions || !rolePermissions[domain]) return false;
    
    return (rolePermissions[domain] as any)[permission] === true;
  }

  /**
   * Vérifier si un rôle est supérieur à un autre
   */
  static isRoleHigher(role1: UserRole, role2: UserRole): boolean {
    return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
  }

  /**
   * Obtenir tous les rôles inférieurs à un rôle donné
   */
  static getLowerRoles(role: UserRole): UserRole[] {
    const currentLevel = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
      .filter(([, level]) => level < currentLevel)
      .map(([roleName]) => roleName as UserRole);
  }

  /**
   * Vérifier si un utilisateur peut gérer un autre utilisateur
   */
  static canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    return this.isRoleHigher(managerRole, targetRole) && 
           this.hasPermission(managerRole, 'users', 'canManage');
  }

  /**
   * Obtenir le label d'un rôle
   */
  static getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] || role;
  }

  /**
   * Obtenir la couleur d'un rôle
   */
  static getRoleColor(role: UserRole): string {
    return ROLE_COLORS[role] || ROLE_COLORS[UserRole.INVITE];
  }
}
