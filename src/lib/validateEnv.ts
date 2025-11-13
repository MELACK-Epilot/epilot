/**
 * Validation des variables d'environnement au démarrage
 * @module validateEnv
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_APP_ENV: 'development' | 'staging' | 'production';
}

/**
 * Variables d'environnement requises
 */
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

/**
 * Variables d'environnement optionnelles avec valeurs par défaut
 */
const optionalEnvVars = {
  VITE_APP_NAME: 'E-Pilot Congo',
  VITE_APP_VERSION: '1.0.0',
  VITE_APP_ENV: 'development',
  VITE_API_TIMEOUT: '30000',
  VITE_ENABLE_DEV_TOOLS: 'true',
  VITE_ENABLE_REACT_QUERY_DEVTOOLS: 'true',
  VITE_ENABLE_DEBUG_LOGS: 'false',
  VITE_AVATAR_BUCKET: 'avatars',
  VITE_SCHOOL_LOGO_BUCKET: 'school-logos',
  VITE_MAX_UPLOAD_SIZE: '5',
} as const;

/**
 * Valider les variables d'environnement requises
 */
export const validateEnv = (): void => {
  const missing: string[] = [];
  const invalid: string[] = [];

  // Vérifier les variables requises
  for (const key of requiredEnvVars) {
    const value = import.meta.env[key];
    
    if (!value || value === '' || value === 'undefined') {
      missing.push(key);
    } else if (value.includes('your-') || value.includes('your_')) {
      invalid.push(key);
    }
  }

  // Afficher les erreurs
  if (missing.length > 0) {
    const errorMessage = `
❌ Variables d'environnement manquantes:
${missing.map(key => `  - ${key}`).join('\n')}

📝 Instructions:
1. Copiez le fichier .env.example vers .env.local
2. Remplissez les valeurs manquantes
3. Redémarrez le serveur de développement

Exemple .env.local:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    `.trim();

    console.error(errorMessage);
    throw new Error('Variables d\'environnement manquantes. Voir la console pour plus de détails.');
  }

  if (invalid.length > 0) {
    const errorMessage = `
⚠️ Variables d'environnement invalides (valeurs par défaut détectées):
${invalid.map(key => `  - ${key}: ${import.meta.env[key]}`).join('\n')}

📝 Instructions:
1. Remplacez les valeurs par défaut par vos vraies valeurs Supabase
2. Consultez https://app.supabase.com/project/_/settings/api
3. Redémarrez le serveur de développement
    `.trim();

    console.error(errorMessage);
    throw new Error('Variables d\'environnement invalides. Voir la console pour plus de détails.');
  }

  // Valider le format de l'URL Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error(`❌ Format d'URL Supabase invalide: ${supabaseUrl}`);
    throw new Error('VITE_SUPABASE_URL doit être au format: https://your-project.supabase.co');
  }

  // Valider la longueur de la clé Supabase
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseKey.length < 100) {
    console.error(`❌ Clé Supabase trop courte: ${supabaseKey.length} caractères`);
    throw new Error('VITE_SUPABASE_ANON_KEY semble invalide (trop courte)');
  }

  // Logs de succès en mode développement
  if (import.meta.env.DEV) {
    console.log('✅ Variables d\'environnement validées avec succès');
    console.log(`📦 Environnement: ${import.meta.env.VITE_APP_ENV || 'development'}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  }
};

/**
 * Obtenir une variable d'environnement avec valeur par défaut
 */
export const getEnv = <K extends keyof typeof optionalEnvVars>(
  key: K,
  defaultValue?: string
): string => {
  const value = import.meta.env[key];
  return value || defaultValue || optionalEnvVars[key];
};

/**
 * Vérifier si une fonctionnalité est activée
 */
export const isFeatureEnabled = (feature: string): boolean => {
  const value = import.meta.env[`VITE_ENABLE_${feature.toUpperCase()}`];
  return value === 'true' || value === '1';
};

/**
 * Obtenir la configuration complète
 */
export const getEnvConfig = (): EnvConfig => {
  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_APP_NAME: getEnv('VITE_APP_NAME'),
    VITE_APP_VERSION: getEnv('VITE_APP_VERSION'),
    VITE_APP_ENV: (import.meta.env.VITE_APP_ENV || 'development') as EnvConfig['VITE_APP_ENV'],
  };
};

/**
 * Afficher les informations de l'environnement (dev only)
 */
export const logEnvInfo = (): void => {
  if (!import.meta.env.DEV) return;

  console.group('🔧 Configuration Environnement');
  console.table({
    'Nom': getEnv('VITE_APP_NAME'),
    'Version': getEnv('VITE_APP_VERSION'),
    'Environnement': import.meta.env.VITE_APP_ENV || 'development',
    'Mode': import.meta.env.MODE,
    'Dev Tools': isFeatureEnabled('DEV_TOOLS') ? '✅' : '❌',
    'React Query DevTools': isFeatureEnabled('REACT_QUERY_DEVTOOLS') ? '✅' : '❌',
    'Debug Logs': isFeatureEnabled('DEBUG_LOGS') ? '✅' : '❌',
  });
  console.groupEnd();
};
