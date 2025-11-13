/**
 * Types pour le système de modules et catégories
 */

// ============================================
// TYPES DE BASE
// ============================================

export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category_id: string;
  is_core: boolean;
  required_plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  status: 'active' | 'inactive' | 'coming_soon';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
  module_count: number;
  is_core: boolean;
  required_plan: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// ============================================
// TYPES D'ASSIGNATION
// ============================================

export interface UserModule {
  id: string;
  user_id: string;
  module_id: string;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  module?: Module; // Relation
}

export interface UserCategory {
  id: string;
  user_id: string;
  category_id: string;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  category?: BusinessCategory; // Relation
}

export interface PlanModule {
  id: string;
  plan_id: string;
  module_id: string;
  created_at: string;
  module?: Module; // Relation
}

export interface PlanCategory {
  id: string;
  plan_id: string;
  category_id: string;
  created_at: string;
  category?: BusinessCategory; // Relation
}

// ============================================
// TYPES DE REQUÊTES
// ============================================

export interface AssignModuleParams {
  userId: string;
  moduleId: string;
}

export interface UnassignModuleParams {
  userId: string;
  moduleId: string;
}

export interface AssignCategoryParams {
  userId: string;
  categoryId: string;
}

export interface UnassignCategoryParams {
  userId: string;
  categoryId: string;
}

// ============================================
// TYPES DE RÉPONSES
// ============================================

export interface UserModulesResponse {
  modules: UserModule[];
  total: number;
}

export interface AvailableModulesResponse {
  modules: Module[];
  total: number;
}

export interface ModuleWithAssignment extends Module {
  isAssigned: boolean;
  assignedAt?: string;
}

export interface CategoryWithModules extends BusinessCategory {
  modules: Module[];
}

// ============================================
// TYPES DE PERMISSIONS
// ============================================

export interface ModulePermission {
  moduleSlug: string;
  hasAccess: boolean;
  assignedAt?: string;
}

export interface CategoryPermission {
  categorySlug: string;
  hasAccess: boolean;
  assignedAt?: string;
}
