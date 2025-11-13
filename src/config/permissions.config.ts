/**
 * Système de Permissions Granulaire - E-Pilot Congo
 * Gestion fine des autorisations par rôle et contexte
 */

export type Permission = {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  conditions?: PermissionCondition[];
  scope?: 'own' | 'school' | 'group' | 'platform';
};

export type PermissionCondition = {
  field: string;
  operator: 'equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
};

export type Role = {
  id: string;
  name: string;
  level: 1 | 2 | 3; // 1=Super Admin, 2=Admin Groupe, 3=User
  permissions: Permission[];
  inherits?: string[]; // Héritage de rôles
};

/**
 * Définition des ressources du système
 */
export const RESOURCES = {
  // Gestion des utilisateurs
  USERS: 'users',
  PROFILES: 'profiles',
  ROLES: 'roles',
  
  // Gestion scolaire
  SCHOOLS: 'schools',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  SUBJECTS: 'subjects',
  
  // Gestion financière
  FEES: 'fees',
  PAYMENTS: 'payments',
  INVOICES: 'invoices',
  FINANCIAL_REPORTS: 'financial_reports',
  
  // Communication
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  ANNOUNCEMENTS: 'announcements',
  
  // Rapports et analytics
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  DASHBOARDS: 'dashboards',
  
  // Configuration système
  SYSTEM_SETTINGS: 'system_settings',
  SCHOOL_SETTINGS: 'school_settings',
  FEATURE_FLAGS: 'feature_flags',
} as const;

/**
 * Définition des rôles et permissions
 */
export const ROLES: Record<string, Role> = {
  SUPER_ADMIN: {
    id: 'super-admin',
    name: 'Super Administrateur',
    level: 1,
    permissions: [
      // Accès total à toutes les ressources
      { resource: '*', action: 'create', scope: 'platform' },
      { resource: '*', action: 'read', scope: 'platform' },
      { resource: '*', action: 'update', scope: 'platform' },
      { resource: '*', action: 'delete', scope: 'platform' },
      { resource: '*', action: 'execute', scope: 'platform' },
    ],
  },
  
  ADMIN_GROUPE: {
    id: 'admin-groupe',
    name: 'Administrateur de Groupe',
    level: 2,
    permissions: [
      // Gestion des écoles du groupe
      { resource: RESOURCES.SCHOOLS, action: 'create', scope: 'group' },
      { resource: RESOURCES.SCHOOLS, action: 'read', scope: 'group' },
      { resource: RESOURCES.SCHOOLS, action: 'update', scope: 'group' },
      { resource: RESOURCES.SCHOOLS, action: 'delete', scope: 'group' },
      
      // Gestion des utilisateurs du groupe
      { resource: RESOURCES.USERS, action: 'create', scope: 'group' },
      { resource: RESOURCES.USERS, action: 'read', scope: 'group' },
      { resource: RESOURCES.USERS, action: 'update', scope: 'group' },
      
      // Rapports du groupe
      { resource: RESOURCES.REPORTS, action: 'read', scope: 'group' },
      { resource: RESOURCES.ANALYTICS, action: 'read', scope: 'group' },
      { resource: RESOURCES.DASHBOARDS, action: 'read', scope: 'group' },
      
      // Configuration du groupe
      { resource: RESOURCES.SCHOOL_SETTINGS, action: 'update', scope: 'group' },
    ],
  },
  
  DIRECTEUR_ECOLE: {
    id: 'directeur-ecole',
    name: 'Directeur d\'École',
    level: 3,
    permissions: [
      // Gestion de son école
      { resource: RESOURCES.SCHOOLS, action: 'read', scope: 'school' },
      { resource: RESOURCES.SCHOOLS, action: 'update', scope: 'own' },
      
      // Gestion des élèves
      { resource: RESOURCES.STUDENTS, action: 'create', scope: 'school' },
      { resource: RESOURCES.STUDENTS, action: 'read', scope: 'school' },
      { resource: RESOURCES.STUDENTS, action: 'update', scope: 'school' },
      { resource: RESOURCES.STUDENTS, action: 'delete', scope: 'school' },
      
      // Gestion des enseignants
      { resource: RESOURCES.TEACHERS, action: 'create', scope: 'school' },
      { resource: RESOURCES.TEACHERS, action: 'read', scope: 'school' },
      { resource: RESOURCES.TEACHERS, action: 'update', scope: 'school' },
      
      // Gestion financière
      { resource: RESOURCES.FEES, action: 'create', scope: 'school' },
      { resource: RESOURCES.FEES, action: 'read', scope: 'school' },
      { resource: RESOURCES.FEES, action: 'update', scope: 'school' },
      { resource: RESOURCES.PAYMENTS, action: 'read', scope: 'school' },
      { resource: RESOURCES.INVOICES, action: 'create', scope: 'school' },
      { resource: RESOURCES.INVOICES, action: 'read', scope: 'school' },
      
      // Rapports de l'école
      { resource: RESOURCES.REPORTS, action: 'read', scope: 'school' },
      { resource: RESOURCES.FINANCIAL_REPORTS, action: 'read', scope: 'school' },
      
      // Communication
      { resource: RESOURCES.ANNOUNCEMENTS, action: 'create', scope: 'school' },
      { resource: RESOURCES.ANNOUNCEMENTS, action: 'read', scope: 'school' },
      { resource: RESOURCES.ANNOUNCEMENTS, action: 'update', scope: 'school' },
      
      // Configuration de l'école
      { resource: RESOURCES.SCHOOL_SETTINGS, action: 'update', scope: 'own' },
    ],
  },
  
  ENSEIGNANT: {
    id: 'enseignant',
    name: 'Enseignant',
    level: 3,
    permissions: [
      // Lecture des informations de base
      { resource: RESOURCES.STUDENTS, action: 'read', scope: 'school' },
      { resource: RESOURCES.CLASSES, action: 'read', scope: 'school' },
      { resource: RESOURCES.SUBJECTS, action: 'read', scope: 'school' },
      
      // Gestion de ses classes
      { 
        resource: RESOURCES.CLASSES, 
        action: 'update', 
        scope: 'own',
        conditions: [{ field: 'teacher_id', operator: 'equals', value: '@user.id' }]
      },
      
      // Communication avec les parents
      { resource: RESOURCES.MESSAGES, action: 'create', scope: 'school' },
      { resource: RESOURCES.MESSAGES, action: 'read', scope: 'own' },
      
      // Profil personnel
      { resource: RESOURCES.PROFILES, action: 'read', scope: 'own' },
      { resource: RESOURCES.PROFILES, action: 'update', scope: 'own' },
    ],
  },
  
  PARENT: {
    id: 'parent',
    name: 'Parent',
    level: 3,
    permissions: [
      // Informations de ses enfants uniquement
      { 
        resource: RESOURCES.STUDENTS, 
        action: 'read', 
        scope: 'own',
        conditions: [{ field: 'parent_id', operator: 'equals', value: '@user.id' }]
      },
      
      // Paiements de ses enfants
      { 
        resource: RESOURCES.PAYMENTS, 
        action: 'create', 
        scope: 'own',
        conditions: [{ field: 'student.parent_id', operator: 'equals', value: '@user.id' }]
      },
      { 
        resource: RESOURCES.PAYMENTS, 
        action: 'read', 
        scope: 'own',
        conditions: [{ field: 'student.parent_id', operator: 'equals', value: '@user.id' }]
      },
      
      // Communication avec l'école
      { resource: RESOURCES.MESSAGES, action: 'create', scope: 'school' },
      { resource: RESOURCES.MESSAGES, action: 'read', scope: 'own' },
      
      // Profil personnel
      { resource: RESOURCES.PROFILES, action: 'read', scope: 'own' },
      { resource: RESOURCES.PROFILES, action: 'update', scope: 'own' },
    ],
  },
};

/**
 * Vérification des permissions
 */
export const hasPermission = (
  userRole: string,
  resource: string,
  action: Permission['action'],
  context?: {
    userId?: string;
    schoolId?: string;
    groupId?: string;
    resourceData?: any;
  }
): boolean => {
  const role = ROLES[userRole.toUpperCase().replace('-', '_')];
  if (!role) return false;
  
  // Vérification des permissions directes
  const hasDirectPermission = role.permissions.some(permission => {
    // Wildcard permission
    if (permission.resource === '*') return true;
    
    // Resource match
    if (permission.resource !== resource) return false;
    
    // Action match
    if (permission.action !== action) return false;
    
    // Scope verification
    if (permission.scope && context) {
      switch (permission.scope) {
        case 'own':
          // Vérification des conditions pour "own"
          if (permission.conditions) {
            return permission.conditions.every(condition => 
              evaluateCondition(condition, context)
            );
          }
          return true;
        case 'school':
          return !!context.schoolId;
        case 'group':
          return !!context.groupId;
        case 'platform':
          return role.level === 1; // Seuls les super admins
      }
    }
    
    return true;
  });
  
  return hasDirectPermission;
};

/**
 * Évaluation des conditions de permission
 */
const evaluateCondition = (
  condition: PermissionCondition,
  context: any
): boolean => {
  const fieldValue = getNestedValue(context.resourceData || context, condition.field);
  
  switch (condition.operator) {
    case 'equals':
      const expectedValue = condition.value === '@user.id' ? context.userId : condition.value;
      return fieldValue === expectedValue;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case 'greater_than':
      return fieldValue > condition.value;
    case 'less_than':
      return fieldValue < condition.value;
    default:
      return false;
  }
};

/**
 * Récupération de valeur nested dans un objet
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Hook pour vérifier les permissions dans les composants
 */
export const usePermission = () => {
  // TODO: Intégrer avec le système d'auth
  const userRole = 'directeur-ecole'; // Placeholder
  const userId = 'user-123'; // Placeholder
  
  return {
    hasPermission: (resource: string, action: Permission['action'], context?: any) =>
      hasPermission(userRole, resource, action, { userId, ...context }),
    
    canCreate: (resource: string, context?: any) =>
      hasPermission(userRole, resource, 'create', { userId, ...context }),
    
    canRead: (resource: string, context?: any) =>
      hasPermission(userRole, resource, 'read', { userId, ...context }),
    
    canUpdate: (resource: string, context?: any) =>
      hasPermission(userRole, resource, 'update', { userId, ...context }),
    
    canDelete: (resource: string, context?: any) =>
      hasPermission(userRole, resource, 'delete', { userId, ...context }),
    
    userRole,
    userId,
  };
};
