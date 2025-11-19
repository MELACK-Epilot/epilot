/**
 * Types TypeScript pour le Dashboard Super Admin E-Pilot Congo
 * @module DashboardTypes
 */

/**
 * Statistiques globales du dashboard
 */
export interface DashboardStats {
  totalUsers: number;
  totalSchoolGroups: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  subscriptionGrowth: number;
  alerts: number;
}

/**
 * Groupe scolaire
 * Architecture : L'admin est lié via users.school_group_id (pas de admin_id direct)
 */
export interface SchoolGroup {
  id: string;
  name: string;
  code: string;
  region: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  foundedYear?: number;
  description?: string;
  logo?: string;
  // Informations de l'administrateur (jointure via users.school_group_id)
  adminId?: string; // Optionnel : peut ne pas avoir d'admin assigné
  adminName?: string; // Optionnel
  adminEmail?: string; // Optionnel
  adminPhone?: string; // Optionnel
  adminAvatar?: string; // Optionnel
  adminStatus?: 'active' | 'inactive' | 'suspended'; // Optionnel
  adminLastLogin?: string; // Optionnel
  schoolCount: number;
  studentCount: number;
  staffCount: number;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

/**
 * Plans d'abonnement
 */
export type SubscriptionPlan = 'gratuit' | 'premium' | 'pro' | 'institutionnel';

export interface Plan {
  id: string;
  name: string;
  slug: SubscriptionPlan;
  description: string;
  price: number;
  currency: 'FCFA' | 'EUR' | 'USD';
  billingCycle: 'monthly' | 'yearly';
  duration: number; // Durée en mois
  features: string[];
  maxSchools: number;
  maxStudents: number;
  maxPersonnel: number;
  storageLimit: string; // Ex: "10GB", "50GB", "Illimité"
  categoryIds?: string[]; // Catégories incluses
  moduleIds?: string[]; // Modules inclus
  supportLevel: 'email' | 'priority' | '24/7';
  customBranding: boolean;
  apiAccess: boolean;
  isActive: boolean;
  isPopular: boolean;
  discount?: number; // Pourcentage de réduction
  trialDays?: number; // Jours d'essai gratuit
  createdAt: string;
  updatedAt: string;
}

/**
 * Quotas d'utilisation d'un groupe scolaire
 */
export interface GroupQuotas {
  schoolGroupId: string;
  planId: string;
  // Limites du plan
  maxSchools: number;
  maxStudents: number;
  maxPersonnel: number;
  storageLimit: string;
  // Utilisation actuelle
  currentSchools: number;
  currentStudents: number;
  currentPersonnel: number;
  currentStorage: string;
  // Pourcentages d'utilisation
  schoolsUsagePercent: number;
  studentsUsagePercent: number;
  personnelUsagePercent: number;
  storageUsagePercent: number;
  // Statut
  isSchoolsLimitReached: boolean;
  isStudentsLimitReached: boolean;
  isPersonnelLimitReached: boolean;
  isStorageLimitReached: boolean;
}

/**
 * Abonnement
 */
export interface Subscription {
  id: string;
  schoolGroupId: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  planId: string;
  planName: string;
  planSlug: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial' | 'suspended';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  amount: number;
  currency: 'FCFA' | 'EUR' | 'USD';
  billingPeriod: 'monthly' | 'yearly';
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'card' | 'cash';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'failed';
  invoiceNumber?: string;
  notes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Utilisateur
 * HIÉRARCHIE E-PILOT :
 * 1. Super Admin (role='super_admin', schoolGroupId=undefined)
 *    → Crée les Groupes Scolaires
 *    → Crée les Administrateurs de Groupe
 * 
 * 2. Admin Groupe (role='admin_groupe', schoolGroupId=<group_id>)
 *    → Appartient à UN groupe (OBLIGATOIRE)
 *    → Gère les écoles de son groupe
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  gender?: 'M' | 'F'; // M = Masculin, F = Féminin
  dateOfBirth?: string; // Format ISO date
  email: string;
  phone?: string;
  avatar?: string; // URL Supabase Storage (source de vérité unique)
  role: UserRole;
  accessProfileCode?: string; // Profil d'accès (NULL pour admins)
  schoolGroupId?: string; // OBLIGATOIRE si role='admin_groupe'
  schoolGroupName?: string;
  schoolId?: string;
  schoolName?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 
  | 'super_admin'      // Niveau Plateforme : gère tous les groupes
  | 'admin_groupe'     // Niveau Groupe : gère UN groupe spécifique
  | 'directeur'        // Directeur d'école
  | 'enseignant'       // Enseignant
  | 'cpe'              // Conseiller Principal d'Éducation
  | 'comptable'        // Comptable
  | 'documentaliste'   // Documentaliste
  | 'surveillant';     // Surveillant

/**
 * Catégorie métier
 */
export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color
  order: number; // Ordre d'affichage
  moduleCount: number; // Nombre de modules
  isCore: boolean; // Catégorie essentielle
  requiredPlan: SubscriptionPlan; // Plan minimum requis
  status: 'active' | 'inactive' | 'beta';
  createdAt: string;
  updatedAt: string;
}

/**
 * Module
 */
export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  icon: string; // Lucide icon name
  color?: string; // Couleur personnalisée
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  requiredPlan: SubscriptionPlan;
  features: string[];
  dependencies?: string[]; // IDs des modules requis
  isCore: boolean; // Module essentiel
  isPremium: boolean; // Module premium
  order: number; // Ordre dans la catégorie
  usageCount?: number; // Nombre d'utilisations
  rating?: number; // Note moyenne (1-5)
  documentationUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Message
 */
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  recipientId?: string;
  recipientRole?: UserRole;
  isGlobal: boolean;
  status: 'unread' | 'read';
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

/**
 * Log d'activité
 */
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

/**
 * Élément de la corbeille
 */
export interface TrashItem {
  id: string;
  entityType: 'user' | 'school_group' | 'subscription' | 'module' | 'category';
  entityId: string;
  entityName: string;
  deletedBy: string;
  deletedByName: string;
  deletedAt: string;
  data: Record<string, any>;
  canRestore: boolean;
}

/**
 * Données de graphique
 */
export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

/**
 * Filtre de recherche
 */
export interface SearchFilter {
  query?: string;
  status?: string;
  role?: UserRole;
  plan?: SubscriptionPlan;
  region?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Réponse API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Paiement
 */
export interface Payment {
  id: string;
  subscriptionId: string;
  schoolGroupId: string;
  schoolGroupName: string;
  amount: number;
  currency: 'FCFA' | 'EUR' | 'USD';
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'card' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  invoiceNumber: string;
  paidAt?: string;
  refundedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statistiques financières
 */
export interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number; // Pourcentage
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  overduePayments: number;
  overdueAmount: number;
  averageRevenuePerGroup: number;
  churnRate: number; // Taux d'attrition
  retentionRate: number; // Taux de rétention
  conversionRate: number; // Taux de conversion trial → payant
  lifetimeValue: number; // Valeur vie client moyenne
  // Données période précédente (pour comparaisons)
  monthlyRevenuePrevious?: number;
  averageRevenuePerGroupPrevious?: number;
  churnRatePrevious?: number;
  retentionRatePrevious?: number;
  lifetimeValuePrevious?: number;
}

/**
 * Statistiques par plan
 */
export interface PlanStats {
  planId: string;
  planName: string;
  planSlug: SubscriptionPlan;
  subscriptionCount: number;
  revenue: number;
  growth: number;
  percentage: number;
}

/**
 * Statistiques par région
 */
export interface RegionStats {
  region: string;
  groupCount: number;
  revenue: number;
  growth: number;
  percentage: number;
}

/**
 * Alerte système
 */
export interface SystemAlert {
  id: string;
  type: 'payment_overdue' | 'subscription_expiring' | 'trial_ending' | 'quota_exceeded' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  entityType: 'school_group' | 'subscription' | 'user' | 'system';
  entityId?: string;
  entityName?: string;
  actionRequired: boolean;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

/**
 * Configuration de module pour un groupe
 */
export interface GroupModuleConfig {
  id: string;
  schoolGroupId: string;
  moduleId: string;
  moduleName: string;
  isEnabled: boolean;
  enabledAt?: string;
  disabledAt?: string;
  enabledBy?: string;
  settings?: Record<string, any>;
  usageStats?: {
    lastUsed?: string;
    totalUsage: number;
    activeUsers: number;
  };
}

/**
 * Historique d'abonnement
 */
export interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  schoolGroupId: string;
  action: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'cancelled' | 'suspended' | 'reactivated';
  oldPlanId?: string;
  oldPlanName?: string;
  newPlanId?: string;
  newPlanName?: string;
  amount?: number;
  reason?: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}
