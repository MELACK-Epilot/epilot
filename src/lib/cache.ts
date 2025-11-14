/**
 * Système de cache avancé pour optimiser les performances
 * @module Cache
 */

/**
 * Cache en mémoire avec TTL (Time To Live)
 */
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes par défaut
    this.defaultTTL = defaultTTL;
  }

  /**
   * Définir une valeur dans le cache
   */
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
  }

  /**
   * Obtenir une valeur du cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // Vérifier si expiré
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Vérifier si une clé existe et est valide
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Supprimer une clé
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtenir la taille du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Cache pour les modules
 */
export const modulesCache = new MemoryCache<any>(10 * 60 * 1000); // 10 minutes

/**
 * Cache pour les catégories
 */
export const categoriesCache = new MemoryCache<any>(10 * 60 * 1000); // 10 minutes

/**
 * Cache pour les utilisateurs
 */
export const usersCache = new MemoryCache<any>(5 * 60 * 1000); // 5 minutes

/**
 * Cache pour les écoles
 */
export const schoolsCache = new MemoryCache<any>(10 * 60 * 1000); // 10 minutes

/**
 * Nettoyer tous les caches périodiquement
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    modulesCache.cleanup();
    categoriesCache.cleanup();
    usersCache.cleanup();
    schoolsCache.cleanup();
  }, 60 * 1000); // Toutes les minutes
}

/**
 * Helper pour utiliser le cache avec une fonction async
 */
export async function withCache<T>(
  cache: MemoryCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Vérifier le cache d'abord
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Sinon, récupérer les données
  const data = await fetcher();

  // Mettre en cache
  cache.set(key, data, ttl);

  return data;
}

/**
 * Invalider tous les caches liés aux modules
 */
export function invalidateModulesCache(): void {
  modulesCache.clear();
  categoriesCache.clear();
}

/**
 * Invalider tous les caches
 */
export function invalidateAllCaches(): void {
  modulesCache.clear();
  categoriesCache.clear();
  usersCache.clear();
  schoolsCache.clear();
}
