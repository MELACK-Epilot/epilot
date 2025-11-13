/**
 * Configuration par Environnement - E-Pilot Congo
 * Gestion centralisée des configurations selon l'environnement
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // Informations de base
  name: string;
  version: string;
  environment: Environment;
  
  // API et services
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    enableRealtime: boolean;
    enableAuth: boolean;
  };
  
  // Features
  features: {
    enableDevTools: boolean;
    enableDebugLogs: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
  };
  
  // Sécurité
  security: {
    enableCSP: boolean;
    enableHTTPS: boolean;
    sessionTimeout: number; // en minutes
  };
  
  // Performance
  performance: {
    enableLazyLoading: boolean;
    enableCodeSplitting: boolean;
    enableServiceWorker: boolean;
    cacheStrategy: 'aggressive' | 'conservative' | 'disabled';
  };
  
  // Monitoring
  monitoring: {
    enableAnalytics: boolean;
    enableErrorTracking: boolean;
    enablePerformanceTracking: boolean;
    sampleRate: number; // 0-1
  };
  
  // Limites
  limits: {
    maxFileUploadSize: number; // en MB
    maxConcurrentRequests: number;
    rateLimitPerMinute: number;
  };
}

/**
 * Configuration pour l'environnement de développement
 */
const developmentConfig: EnvironmentConfig = {
  name: 'E-Pilot Congo',
  version: '1.0.0-dev',
  environment: 'development',
  
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000,
    retries: 3,
  },
  
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://localhost.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'dev-key',
    enableRealtime: true,
    enableAuth: true,
  },
  
  features: {
    enableDevTools: true,
    enableDebugLogs: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: false, // Pas besoin en dev
  },
  
  security: {
    enableCSP: false, // Plus flexible en dev
    enableHTTPS: false,
    sessionTimeout: 480, // 8 heures
  },
  
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableServiceWorker: false, // Peut interférer en dev
    cacheStrategy: 'disabled',
  },
  
  monitoring: {
    enableAnalytics: false,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    sampleRate: 1.0, // 100% en dev
  },
  
  limits: {
    maxFileUploadSize: 10, // 10MB
    maxConcurrentRequests: 10,
    rateLimitPerMinute: 1000, // Très permissif en dev
  },
};

/**
 * Configuration pour l'environnement de staging
 */
const stagingConfig: EnvironmentConfig = {
  name: 'E-Pilot Congo',
  version: '1.0.0-staging',
  environment: 'staging',
  
  api: {
    baseUrl: 'https://staging-api.e-pilot-congo.com',
    timeout: 15000,
    retries: 2,
  },
  
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enableRealtime: true,
    enableAuth: true,
  },
  
  features: {
    enableDevTools: true, // Utile pour les tests
    enableDebugLogs: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
  },
  
  security: {
    enableCSP: true,
    enableHTTPS: true,
    sessionTimeout: 240, // 4 heures
  },
  
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
    cacheStrategy: 'conservative',
  },
  
  monitoring: {
    enableAnalytics: true,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    sampleRate: 0.5, // 50% en staging
  },
  
  limits: {
    maxFileUploadSize: 5, // 5MB
    maxConcurrentRequests: 8,
    rateLimitPerMinute: 500,
  },
};

/**
 * Configuration pour l'environnement de production
 */
const productionConfig: EnvironmentConfig = {
  name: 'E-Pilot Congo',
  version: '1.0.0',
  environment: 'production',
  
  api: {
    baseUrl: 'https://api.e-pilot-congo.com',
    timeout: 10000,
    retries: 1,
  },
  
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enableRealtime: true,
    enableAuth: true,
  },
  
  features: {
    enableDevTools: false,
    enableDebugLogs: false,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
  },
  
  security: {
    enableCSP: true,
    enableHTTPS: true,
    sessionTimeout: 120, // 2 heures
  },
  
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
    cacheStrategy: 'aggressive',
  },
  
  monitoring: {
    enableAnalytics: true,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    sampleRate: 0.1, // 10% en production
  },
  
  limits: {
    maxFileUploadSize: 5, // 5MB
    maxConcurrentRequests: 5,
    rateLimitPerMinute: 100,
  },
};

/**
 * Récupération de la configuration selon l'environnement
 */
const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = (import.meta.env.VITE_APP_ENV || 'development') as Environment;
  
  switch (env) {
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
};

// Export de la configuration active
export const config = getEnvironmentConfig();

/**
 * Utilitaires pour vérifier l'environnement
 */
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';
export const isProduction = () => config.environment === 'production';

/**
 * Utilitaire pour logger selon l'environnement
 */
export const logger = {
  debug: (...args: any[]) => {
    if (config.features.enableDebugLogs) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    
    if (config.features.enableErrorReporting) {
      // TODO: Intégrer avec un service de reporting d'erreurs (Sentry, etc.)
    }
  },
};

/**
 * Validation de la configuration
 */
export const validateConfig = (): boolean => {
  const errors: string[] = [];
  
  // Vérification Supabase
  if (!config.supabase.url || config.supabase.url.includes('localhost')) {
    if (isProduction()) {
      errors.push('URL Supabase manquante en production');
    }
  }
  
  if (!config.supabase.anonKey || config.supabase.anonKey === 'dev-key') {
    if (isProduction()) {
      errors.push('Clé Supabase manquante en production');
    }
  }
  
  // Vérification sécurité
  if (isProduction() && !config.security.enableHTTPS) {
    errors.push('HTTPS doit être activé en production');
  }
  
  if (errors.length > 0) {
    logger.error('Erreurs de configuration:', errors);
    return false;
  }
  
  logger.info('Configuration validée pour l\'environnement:', config.environment);
  return true;
};

// Validation automatique au chargement
validateConfig();
