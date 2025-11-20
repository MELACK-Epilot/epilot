/**
 * Types pour les analytics des plans
 * @module analytics.types
 */

export interface PlanSubscription {
  id: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
  previous_status?: string;
  end_date?: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: 'monthly' | 'yearly' | 'quarterly' | 'biannual';
  school_group_subscriptions: PlanSubscription[];
}

export interface Payment {
  amount: number;
  created_at: string;
  subscription_id: string;
  status: 'paid' | 'pending' | 'failed';
}

export interface PlanMetrics {
  planId: string;
  planName: string;
  planSlug: string;
  activeSubscriptions: number;
  newSubscriptions30d: number;
  churnedSubscriptions30d: number;
  monthlyRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  churnRate: number;
  retentionRate: number;
  growthRate30d: number;
}

export interface Insight {
  type: 'opportunity' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

export interface PlanAnalytics {
  totalRevenue: number;
  mrr: number;
  arr: number;
  planMetrics: PlanMetrics[];
  insights: Insight[];
  marketComparison: null;
}
