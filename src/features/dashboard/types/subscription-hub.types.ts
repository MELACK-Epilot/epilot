/**
 * Types pour le Hub Abonnements
 * @module subscription-hub.types
 */

export interface SubscriptionHubKPIs {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalActive: number;
  totalInactive: number;
  totalPending: number;
  totalTrial: number;
  renewalRate: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  overduePayments: number;
  overdueAmount: number;
}

export interface PlanDistribution {
  planName: string;
  planSlug: string;
  count: number;
  percentage: number;
  revenue: number;
  color: string;
}

export interface SubscriptionWithDetails {
  id: string;
  schoolGroupId: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial' | 'suspended';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  amount: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'failed';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  invoiceNumber?: string;
  schoolsCount: number;
  usersCount: number;
  storageUsed: number;
  notes?: string;
  daysRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpgradeRequest {
  id: string;
  schoolGroupId: string;
  schoolGroupName: string;
  currentPlanId: string;
  currentPlanName: string;
  requestedPlanId: string;
  requestedPlanName: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  requestedBy: string;
  requestedByName: string;
  priceDifference: number;
  prorata: number;
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  processedByName?: string;
  notes?: string;
  history: UpgradeRequestHistory[];
}

export interface UpgradeRequestHistory {
  id: string;
  action: string;
  comment: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  schoolGroupId: string;
  schoolGroupName: string;
  planName: string;
  period: string;
  issueDate: string;
  dueDate: string;
  amountHT: number;
  taxRate: number;
  taxAmount: number;
  amountTTC: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  schoolsCount: number;
}

export interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  action: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'cancelled' | 'suspended' | 'reactivated';
  oldPlanName?: string;
  newPlanName?: string;
  amount?: number;
  reason?: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface SubscriptionAlert {
  id: string;
  type: 'expiring_soon' | 'payment_overdue' | 'upgrade_request' | 'payment_failed' | 'usage_threshold';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  subscriptionId?: string;
  schoolGroupName?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface SubscriptionFilters {
  query?: string;
  status?: string;
  planSlug?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  subscriptions: number;
  label: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  trial: number;
  suspended: number;
  cancelled: number;
  totalRevenue: number;
  averageRevenue: number;
}
