/**
 * Types TypeScript stricts pour la page Assigner des Modules
 */

export interface AssignModulesUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  photoUrl?: string;
  role: 'admin_groupe' | 'proviseur' | 'directeur' | 'enseignant' | 'cpe' | 'comptable' | 'secretaire' | 'autre';
  schoolId?: string;
  schoolName?: string;
  schoolGroupId?: string;
  status: 'active' | 'inactive' | 'suspended';
  assignedModulesCount?: number;
  lastModuleAssignedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ModuleAssignment {
  id: string;
  userId: string;
  moduleId: string;
  moduleName: string;
  assignedBy: string;
  assignedAt: string;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

export interface UsersBySchool {
  [schoolId: string]: AssignModulesUser[];
}

export interface UserStats {
  totalUsers: number;
  totalModules: number;
  totalSchools: number;
  roleCount: Record<string, number>;
  statusCount: Record<string, number>;
  assignedCount: number;
  unassignedCount: number;
}

export interface FilterOptions {
  search: string;
  role: string;
  school: string;
  status: string;
  hasModules: 'all' | 'assigned' | 'unassigned';
}

export interface SortConfig {
  field: 'name' | 'email' | 'role' | 'school' | 'modulesCount' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface BulkAction {
  type: 'assign' | 'revoke' | 'export';
  userIds: string[];
  moduleIds?: string[];
}

export interface ExportConfig {
  format: 'excel' | 'csv';
  includeModules: boolean;
  includePermissions: boolean;
  selectedOnly: boolean;
}

export interface AssignmentHistory {
  id: string;
  userId: string;
  userName: string;
  moduleId: string;
  moduleName: string;
  action: 'assigned' | 'revoked' | 'updated';
  performedBy: string;
  performedByName: string;
  performedAt: string;
  details?: string;
}
