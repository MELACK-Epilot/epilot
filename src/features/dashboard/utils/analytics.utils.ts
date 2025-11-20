/**
 * Utilitaires pour les calculs d'analytics
 * @module analytics.utils
 */

/**
 * Vérifie si une date est dans les N derniers jours
 */
export const isInLastNDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
};

/**
 * Vérifie si une date est dans le mois en cours
 */
export const isInCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
};

/**
 * Obtient le début du mois en cours
 */
export const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Obtient le début du mois précédent
 */
export const getStartOfPreviousMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

/**
 * Calcule le taux de conversion mensuel
 * Formule: (Essais convertis ce mois) / (Total essais ce mois) * 100
 */
export const calculateMonthlyConversionRate = (subscriptions: any[]): number => {
  if (!subscriptions || subscriptions.length === 0) return 0;

  // Essais démarrés ce mois
  const trialsThisMonth = subscriptions.filter(sub => 
    sub.status === 'trial' && isInCurrentMonth(sub.created_at)
  );

  // Essais convertis en payants ce mois
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

  // Abonnements actifs au début du mois
  const activeStartOfMonth = subscriptions.filter(sub => {
    const createdDate = new Date(sub.created_at);
    return createdDate < startOfMonth && 
           (sub.status === 'active' || sub.status === 'cancelled' || sub.status === 'expired');
  });

  // Abonnements annulés/expirés ce mois
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

  // Actifs au début de la période
  const activeAtStart = subscriptions.filter(sub => {
    const createdDate = new Date(sub.created_at);
    return createdDate < startDate && sub.status === 'active';
  });

  // Nouveaux abonnés pendant la période
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
      
      // Normaliser au mois
      switch (billingPeriod) {
        case 'yearly':
          return sum + (price / 12);
        case 'quarterly':
          return sum + (price / 3);
        case 'biannual':
          return sum + (price / 6);
        default: // monthly
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

/**
 * Formate un nombre en devise
 */
export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`;
  }
  return `${amount.toFixed(0)} ${currency}`;
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
