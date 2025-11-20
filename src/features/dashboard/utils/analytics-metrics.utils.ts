/**
 * Calculs de métriques SaaS - Analytics
 * @module analytics-metrics.utils
 */

import { isInLastNDays, isInCurrentMonth, getStartOfMonth } from './analytics-dates.utils';

/**
 * Calcule le taux de conversion mensuel
 * Formule: (Essais convertis ce mois) / (Total essais ce mois) * 100
 */
export const calculateMonthlyConversionRate = (subscriptions: any[]): number => {
  if (!subscriptions || subscriptions.length === 0) return 0;

  const trialsThisMonth = subscriptions.filter(sub => 
    sub.status === 'trial' && isInCurrentMonth(sub.created_at)
  );

  const convertedThisMonth = subscriptions.filter(sub => 
    sub.status === 'active' && 
    sub.previous_status === 'trial' &&
    isInCurrentMonth(sub.updated_at)
  );

  if (trialsThisMonth.length === 0) return 0;
  return (convertedThisMonth.length / trialsThisMonth.length) * 100;
};

/**
 * Calcule le taux de churn mensuel
 * Formule: (Annulés ce mois) / (Actifs début de mois) * 100
 */
export const calculateMonthlyChurnRate = (subscriptions: any[]): number => {
  if (!subscriptions || subscriptions.length === 0) return 0;

  const startOfMonth = getStartOfMonth();

  const activeStartOfMonth = subscriptions.filter(sub => {
    const createdDate = new Date(sub.created_at);
    return createdDate < startOfMonth && 
           (sub.status === 'active' || sub.status === 'cancelled' || sub.status === 'expired');
  });

  const churnedThisMonth = subscriptions.filter(sub =>
    (sub.status === 'cancelled' || sub.status === 'expired') &&
    isInCurrentMonth(sub.updated_at || sub.end_date)
  );

  if (activeStartOfMonth.length === 0) return 0;
  return (churnedThisMonth.length / activeStartOfMonth.length) * 100;
};

/**
 * Calcule le taux de rétention
 * Formule: 100 - Churn Rate
 */
export const calculateRetentionRate = (churnRate: number): number => {
  return 100 - churnRate;
};

/**
 * Calcule le taux de croissance sur N jours
 * Formule: (Nouveaux abonnés période) / (Actifs début période) * 100
 */
export const calculateGrowthRate = (
  subscriptions: any[], 
  days: number = 30
): number => {
  if (!subscriptions || subscriptions.length === 0) return 0;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const activeAtStart = subscriptions.filter(sub => {
    const createdDate = new Date(sub.created_at);
    return createdDate < startDate && sub.status === 'active';
  });

  const newInPeriod = subscriptions.filter(sub =>
    sub.status === 'active' && isInLastNDays(sub.created_at, days)
  );

  if (activeAtStart.length === 0) {
    return newInPeriod.length > 0 ? 100 : 0;
  }

  return (newInPeriod.length / activeAtStart.length) * 100;
};

/**
 * Calcule le MRR (Monthly Recurring Revenue)
 */
export const calculateMRR = (subscriptions: any[]): number => {
  if (!subscriptions || subscriptions.length === 0) return 0;

  return subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => {
      const price = sub.price || 0;
      const billingPeriod = sub.billing_period || 'monthly';
      
      switch (billingPeriod) {
        case 'yearly':
          return sum + (price / 12);
        case 'quarterly':
          return sum + (price / 3);
        case 'biannual':
          return sum + (price / 6);
        default:
          return sum + price;
      }
    }, 0);
};

/**
 * Calcule l'ARR (Annual Recurring Revenue)
 */
export const calculateARR = (mrr: number): number => {
  return mrr * 12;
};

/**
 * Calcule l'ARPU (Average Revenue Per User)
 */
export const calculateARPU = (totalRevenue: number, userCount: number): number => {
  if (userCount === 0) return 0;
  return totalRevenue / userCount;
};
