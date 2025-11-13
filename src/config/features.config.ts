/**
 * Configuration des Feature Flags - E-Pilot Congo
 * Système avancé de gestion des fonctionnalités par environnement et rôle
 */

export type FeatureFlag = {
  enabled: boolean;
  environments?: ('development' | 'staging' | 'production')[];
  roles?: ('super-admin' | 'admin-groupe' | 'user')[];
  beta?: boolean;
  rolloutPercentage?: number;
  dependencies?: string[];
};

export type FeatureFlags = {
  // Niveaux d'accès
  SUPER_ADMIN_LEVEL: FeatureFlag;
  ADMIN_GROUPE_LEVEL: FeatureFlag;
  USER_SPACE_LEVEL: FeatureFlag;
  
  // Modules métier
  STUDENT_MANAGEMENT: FeatureFlag;
  FINANCIAL_MODULE: FeatureFlag;
  COMMUNICATION_MODULE: FeatureFlag;
  ANALYTICS_MODULE: FeatureFlag;
  
  // Fonctionnalités avancées
  ADVANCED_REPORTING: FeatureFlag;
  REAL_TIME_NOTIFICATIONS: FeatureFlag;
  MOBILE_APP_SYNC: FeatureFlag;
  AI_INSIGHTS: FeatureFlag;
  
  // Intégrations
  SUPABASE_INTEGRATION: FeatureFlag;
  PAYMENT_INTEGRATION: FeatureFlag;
  SMS_INTEGRATION: FeatureFlag;
  EMAIL_INTEGRATION: FeatureFlag;
  
  // Expérimental
  NEW_DASHBOARD_UI: FeatureFlag;
  DARK_MODE: FeatureFlag;
  OFFLINE_MODE: FeatureFlag;
};

export const FEATURE_FLAGS: FeatureFlags = {
  // Niveaux d'accès
  SUPER_ADMIN_LEVEL: {
    enabled: false,
    environments: ['development', 'staging'],
    roles: ['super-admin'],
    beta: true,
    rolloutPercentage: 10,
  },
  
  ADMIN_GROUPE_LEVEL: {
    enabled: false,
    environments: ['development', 'staging'],
    roles: ['super-admin', 'admin-groupe'],
    beta: true,
    rolloutPercentage: 25,
  },
  
  USER_SPACE_LEVEL: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    roles: ['super-admin', 'admin-groupe', 'user'],
  },
  
  // Modules métier
  STUDENT_MANAGEMENT: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    roles: ['admin-groupe', 'user'],
  },
  
  FINANCIAL_MODULE: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    roles: ['admin-groupe', 'user'],
  },
  
  COMMUNICATION_MODULE: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    roles: ['admin-groupe', 'user'],
  },
  
  ANALYTICS_MODULE: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    roles: ['super-admin', 'admin-groupe'],
  },
  
  // Fonctionnalités avancées
  ADVANCED_REPORTING: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    roles: ['super-admin', 'admin-groupe'],
    dependencies: ['ANALYTICS_MODULE'],
  },
  
  REAL_TIME_NOTIFICATIONS: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    dependencies: ['SUPABASE_INTEGRATION'],
  },
  
  MOBILE_APP_SYNC: {
    enabled: false,
    environments: ['development'],
    beta: true,
    rolloutPercentage: 5,
  },
  
  AI_INSIGHTS: {
    enabled: false,
    environments: ['development'],
    roles: ['super-admin'],
    beta: true,
    rolloutPercentage: 1,
  },
  
  // Intégrations
  SUPABASE_INTEGRATION: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },
  
  PAYMENT_INTEGRATION: {
    enabled: true,
    environments: ['staging', 'production'],
    roles: ['admin-groupe', 'user'],
  },
  
  SMS_INTEGRATION: {
    enabled: true,
    environments: ['staging', 'production'],
    dependencies: ['COMMUNICATION_MODULE'],
  },
  
  EMAIL_INTEGRATION: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    dependencies: ['COMMUNICATION_MODULE'],
  },
  
  // Expérimental
  NEW_DASHBOARD_UI: {
    enabled: false,
    environments: ['development'],
    beta: true,
    rolloutPercentage: 20,
  },
  
  DARK_MODE: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },
  
  OFFLINE_MODE: {
    enabled: false,
    environments: ['development'],
    beta: true,
    rolloutPercentage: 5,
  },
};

/**
 * Utilitaire pour vérifier si une feature est activée
 */
export const isFeatureEnabled = (
  featureKey: keyof FeatureFlags,
  userRole?: string,
  environment: string = import.meta.env.VITE_APP_ENV || 'development'
): boolean => {
  const feature = FEATURE_FLAGS[featureKey];
  
  if (!feature.enabled) return false;
  
  // Vérification de l'environnement
  if (feature.environments && !feature.environments.includes(environment as any)) {
    return false;
  }
  
  // Vérification du rôle
  if (feature.roles && userRole && !feature.roles.includes(userRole as any)) {
    return false;
  }
  
  // Vérification du rollout percentage
  if (feature.rolloutPercentage && feature.rolloutPercentage < 100) {
    const hash = hashString(featureKey + (userRole || ''));
    return (hash % 100) < feature.rolloutPercentage;
  }
  
  return true;
};

/**
 * Vérification des dépendances de features
 */
export const checkFeatureDependencies = (
  featureKey: keyof FeatureFlags,
  userRole?: string,
  environment?: string
): boolean => {
  const feature = FEATURE_FLAGS[featureKey];
  
  if (!feature.dependencies) return true;
  
  return feature.dependencies.every(dep => 
    isFeatureEnabled(dep as keyof FeatureFlags, userRole, environment)
  );
};

/**
 * Hash simple pour le rollout percentage
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Hook pour utiliser les feature flags dans les composants
 */
export const useFeatureFlag = (featureKey: keyof FeatureFlags) => {
  // TODO: Intégrer avec le système d'auth pour récupérer le rôle utilisateur
  const userRole = 'user'; // Placeholder
  
  return {
    isEnabled: isFeatureEnabled(featureKey, userRole),
    hasDependencies: checkFeatureDependencies(featureKey, userRole),
    feature: FEATURE_FLAGS[featureKey],
  };
};
