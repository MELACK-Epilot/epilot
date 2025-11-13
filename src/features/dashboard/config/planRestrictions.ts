/**
 * Configuration des restrictions par plan d'abonnement
 * Définit les limites et fonctionnalités de chaque plan
 * @module planRestrictions
 */

export interface PlanLimits {
  slug: string;
  name: string;
  maxSchools: number | null; // null = illimité
  maxUsers: number | null;
  maxStorage: number | null; // en GB
  maxModules: number | null;
  features: {
    // Modules de base
    dashboard: boolean;
    users: boolean;
    schools: boolean;
    
    // Modules avancés
    finance: boolean;
    subscriptions: boolean;
    analytics: boolean;
    reports: boolean;
    api: boolean;
    
    // Fonctionnalités premium
    customBranding: boolean;
    prioritySupport: boolean;
    advancedSecurity: boolean;
    multiLanguage: boolean;
    whiteLabel: boolean;
    
    // Limites techniques
    bulkOperations: boolean;
    exportData: boolean;
    importData: boolean;
    automation: boolean;
  };
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
}

/**
 * Configuration des plans
 */
export const PLAN_RESTRICTIONS: Record<string, PlanLimits> = {
  gratuit: {
    slug: 'gratuit',
    name: 'Gratuit',
    maxSchools: 1,
    maxUsers: 10,
    maxStorage: 1, // 1 GB
    maxModules: 5,
    features: {
      dashboard: true,
      users: true,
      schools: false,
      finance: false,
      subscriptions: false,
      analytics: false,
      reports: false,
      api: false,
      customBranding: false,
      prioritySupport: false,
      advancedSecurity: false,
      multiLanguage: false,
      whiteLabel: false,
      bulkOperations: false,
      exportData: false,
      importData: false,
      automation: false,
    },
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'FCFA',
    },
  },

  premium: {
    slug: 'premium',
    name: 'Premium',
    maxSchools: 5,
    maxUsers: 50,
    maxStorage: 10, // 10 GB
    maxModules: 15,
    features: {
      dashboard: true,
      users: true,
      schools: true,
      finance: true,
      subscriptions: false,
      analytics: true,
      reports: true,
      api: false,
      customBranding: true,
      prioritySupport: false,
      advancedSecurity: false,
      multiLanguage: true,
      whiteLabel: false,
      bulkOperations: true,
      exportData: true,
      importData: true,
      automation: false,
    },
    price: {
      monthly: 50000,
      yearly: 500000,
      currency: 'FCFA',
    },
  },

  pro: {
    slug: 'pro',
    name: 'Pro',
    maxSchools: 20,
    maxUsers: 200,
    maxStorage: 50, // 50 GB
    maxModules: null, // Illimité
    features: {
      dashboard: true,
      users: true,
      schools: true,
      finance: true,
      subscriptions: true,
      analytics: true,
      reports: true,
      api: true,
      customBranding: true,
      prioritySupport: true,
      advancedSecurity: true,
      multiLanguage: true,
      whiteLabel: false,
      bulkOperations: true,
      exportData: true,
      importData: true,
      automation: true,
    },
    price: {
      monthly: 150000,
      yearly: 1500000,
      currency: 'FCFA',
    },
  },

  institutionnel: {
    slug: 'institutionnel',
    name: 'Institutionnel',
    maxSchools: null, // Illimité
    maxUsers: null, // Illimité
    maxStorage: null, // Illimité
    maxModules: null, // Illimité
    features: {
      dashboard: true,
      users: true,
      schools: true,
      finance: true,
      subscriptions: true,
      analytics: true,
      reports: true,
      api: true,
      customBranding: true,
      prioritySupport: true,
      advancedSecurity: true,
      multiLanguage: true,
      whiteLabel: true,
      bulkOperations: true,
      exportData: true,
      importData: true,
      automation: true,
    },
    price: {
      monthly: 500000,
      yearly: 5000000,
      currency: 'FCFA',
    },
  },
};

/**
 * Vérifier si un groupe peut effectuer une action selon son plan
 */
export const canPerformAction = (
  planSlug: string,
  action: keyof PlanLimits['features']
): boolean => {
  const plan = PLAN_RESTRICTIONS[planSlug];
  if (!plan) return false;
  return plan.features[action];
};

/**
 * Vérifier si un groupe a atteint une limite
 */
export const hasReachedLimit = (
  planSlug: string,
  limitType: 'schools' | 'users' | 'storage' | 'modules',
  currentValue: number
): boolean => {
  const plan = PLAN_RESTRICTIONS[planSlug];
  if (!plan) return true;

  const limitMap = {
    schools: plan.maxSchools,
    users: plan.maxUsers,
    storage: plan.maxStorage,
    modules: plan.maxModules,
  };

  const limit = limitMap[limitType];
  if (limit === null) return false; // Illimité
  return currentValue >= limit;
};

/**
 * Obtenir le pourcentage d'utilisation d'une limite
 */
export const getLimitUsagePercentage = (
  planSlug: string,
  limitType: 'schools' | 'users' | 'storage' | 'modules',
  currentValue: number
): number => {
  const plan = PLAN_RESTRICTIONS[planSlug];
  if (!plan) return 100;

  const limitMap = {
    schools: plan.maxSchools,
    users: plan.maxUsers,
    storage: plan.maxStorage,
    modules: plan.maxModules,
  };

  const limit = limitMap[limitType];
  if (limit === null) return 0; // Illimité = 0%
  return Math.min(100, (currentValue / limit) * 100);
};

/**
 * Obtenir les limites restantes
 */
export const getRemainingLimit = (
  planSlug: string,
  limitType: 'schools' | 'users' | 'storage' | 'modules',
  currentValue: number
): number | null => {
  const plan = PLAN_RESTRICTIONS[planSlug];
  if (!plan) return 0;

  const limitMap = {
    schools: plan.maxSchools,
    users: plan.maxUsers,
    storage: plan.maxStorage,
    modules: plan.maxModules,
  };

  const limit = limitMap[limitType];
  if (limit === null) return null; // Illimité
  return Math.max(0, limit - currentValue);
};

/**
 * Obtenir le plan recommandé selon l'utilisation
 */
export const getRecommendedPlan = (
  currentPlanSlug: string,
  usage: {
    schools: number;
    users: number;
    storage: number;
    modules: number;
  }
): string | null => {
  const plans = ['gratuit', 'premium', 'pro', 'institutionnel'];
  const currentIndex = plans.indexOf(currentPlanSlug);

  // Vérifier si le plan actuel suffit
  const currentPlan = PLAN_RESTRICTIONS[currentPlanSlug];
  if (currentPlan) {
    const needsUpgrade =
      (currentPlan.maxSchools !== null && usage.schools > currentPlan.maxSchools) ||
      (currentPlan.maxUsers !== null && usage.users > currentPlan.maxUsers) ||
      (currentPlan.maxStorage !== null && usage.storage > currentPlan.maxStorage) ||
      (currentPlan.maxModules !== null && usage.modules > currentPlan.maxModules);

    if (!needsUpgrade) return null; // Plan actuel OK
  }

  // Trouver le plan minimum qui convient
  for (let i = currentIndex + 1; i < plans.length; i++) {
    const plan = PLAN_RESTRICTIONS[plans[i]];
    const canFit =
      (plan.maxSchools === null || usage.schools <= plan.maxSchools) &&
      (plan.maxUsers === null || usage.users <= plan.maxUsers) &&
      (plan.maxStorage === null || usage.storage <= plan.maxStorage) &&
      (plan.maxModules === null || usage.modules <= plan.maxModules);

    if (canFit) return plans[i];
  }

  return 'institutionnel'; // Plan max
};

/**
 * Obtenir le message d'erreur pour une limite atteinte
 */
export const getLimitErrorMessage = (
  planSlug: string,
  limitType: 'schools' | 'users' | 'storage' | 'modules'
): string => {
  const plan = PLAN_RESTRICTIONS[planSlug];
  if (!plan) return 'Plan inconnu';

  const limitMap = {
    schools: plan.maxSchools,
    users: plan.maxUsers,
    storage: plan.maxStorage,
    modules: plan.maxModules,
  };

  const limit = limitMap[limitType];
  if (limit === null) return '';

  const messages = {
    schools: `Limite de ${limit} école(s) atteinte pour le plan ${plan.name}`,
    users: `Limite de ${limit} utilisateur(s) atteinte pour le plan ${plan.name}`,
    storage: `Limite de ${limit} GB de stockage atteinte pour le plan ${plan.name}`,
    modules: `Limite de ${limit} module(s) atteinte pour le plan ${plan.name}`,
  };

  return messages[limitType];
};
