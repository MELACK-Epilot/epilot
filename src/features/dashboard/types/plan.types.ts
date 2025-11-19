/**
 * Types pour les plans d'abonnement
 * Mapping exact avec la base de données subscription_plans
 * @module plan.types
 */

export type PlanType = 'gratuit' | 'premium' | 'pro' | 'institutionnel';
export type BillingPeriod = 'monthly' | 'quarterly' | 'biannual' | 'yearly';
export type Currency = 'FCFA' | 'EUR' | 'USD';
export type SupportLevel = 'email' | 'priority' | '24/7';
export type PlanStatus = 'active' | 'archived' | 'draft';

/**
 * Interface complète pour un plan d'abonnement
 * Correspond EXACTEMENT au schéma BD subscription_plans
 */
export interface SubscriptionPlan {
  // Identifiants
  id: string;
  name: string;
  slug: string;
  description: string | null;
  
  // Tarification
  price: number;
  currency: Currency;
  billing_cycle: BillingPeriod;  // BD utilise snake_case
  billing_period: BillingPeriod; // Alias pour compatibilité
  duration: number;
  discount: number | null;
  trial_days: number | null;
  
  // Limites
  max_schools: number;
  max_students: number;
  max_personnel: number;
  max_staff: number;  // Alias
  storage_limit: string;  // Format: "5GB"
  max_storage: number;    // En GB (nombre)
  
  // Contenu
  features: string[];
  category_ids: string[];
  module_ids: string[];
  
  // Options
  support_level: SupportLevel;
  custom_branding: boolean;
  api_access: boolean;
  
  // Status
  is_active: boolean;
  is_popular: boolean;
  status: PlanStatus;
  
  // Type
  plan_type: PlanType;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Plan avec contenu (catégories et modules)
 */
export interface PlanWithContent extends SubscriptionPlan {
  categories?: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  }>;
  modules?: Array<{
    id: string;
    name: string;
    description: string | null;
    category_id: string;
    is_premium: boolean;
    is_core: boolean;
  }>;
}

/**
 * Statistiques d'un plan
 */
export interface PlanStats {
  total: number;
  active: number;
  archived: number;
  subscriptions: number;
}

/**
 * Revenus d'un plan
 */
export interface PlanRevenue {
  mrr: number;  // Monthly Recurring Revenue
  arr: number;  // Annual Recurring Revenue
  total: number;
}

/**
 * Input pour créer un plan
 */
export interface CreatePlanInput {
  name: string;
  slug: string;
  planType: PlanType;
  description: string;
  price: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  features: string[];
  maxSchools: number;
  maxStudents: number;
  maxStaff: number;
  maxStorage: number;
  supportLevel: SupportLevel;
  customBranding: boolean;
  apiAccess: boolean;
  isPopular: boolean;
  discount?: number;
  trialDays?: number;
}

/**
 * Input pour mettre à jour un plan
 */
export interface UpdatePlanInput {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  billingPeriod: BillingPeriod;
  features: string[];
  maxSchools: number;
  maxStudents: number;
  maxStaff: number;
  maxStorage: number;
  supportLevel: SupportLevel;
  customBranding: boolean;
  apiAccess: boolean;
  isPopular: boolean;
  discount?: number;
  trialDays?: number;
}
