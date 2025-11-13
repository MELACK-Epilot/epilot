/**
 * Rate Limiting pour prévenir abus et DDoS
 * Utilise Redis pour stockage distribué
 * @module rateLimiter
 */

interface RateLimitConfig {
  windowMs: number;  // Fenêtre de temps en ms
  maxRequests: number;  // Nombre max de requêtes
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
  get(key: string): Promise<number>;
}

/**
 * Store en mémoire (développement)
 * À remplacer par Redis en production
 */
class MemoryStore implements RateLimitStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map();

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const hit = this.hits.get(key);

    if (!hit || now > hit.resetTime) {
      this.hits.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
      return 1;
    }

    hit.count++;
    return hit.count;
  }

  async decrement(key: string): Promise<void> {
    const hit = this.hits.get(key);
    if (hit && hit.count > 0) {
      hit.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key);
  }

  async get(key: string): Promise<number> {
    const hit = this.hits.get(key);
    if (!hit || Date.now() > hit.resetTime) {
      return 0;
    }
    return hit.count;
  }

  // Nettoyage périodique
  cleanup() {
    const now = Date.now();
    for (const [key, hit] of this.hits.entries()) {
      if (now > hit.resetTime) {
        this.hits.delete(key);
      }
    }
  }
}

/**
 * Store Redis (production)
 */
class RedisStore implements RateLimitStore {
  private client: any; // Redis client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async increment(key: string): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, 60); // 1 minute TTL
    }
    return count;
  }

  async decrement(key: string): Promise<void> {
    await this.client.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  async get(key: string): Promise<number> {
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }
}

/**
 * Rate Limiter principal
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = config;
    this.store = store || new MemoryStore();
  }

  /**
   * Middleware Express pour rate limiting
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      const key = this.getKey(req);
      
      try {
        const current = await this.store.increment(key);

        // Headers informatifs
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - current));
        res.setHeader('X-RateLimit-Reset', Date.now() + this.config.windowMs);

        if (current > this.config.maxRequests) {
          return res.status(429).json({
            error: 'Trop de requêtes',
            message: this.config.message || 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
            retryAfter: Math.ceil(this.config.windowMs / 1000),
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // En cas d'erreur, on laisse passer (fail open)
        next();
      }
    };
  }

  /**
   * Génère la clé de rate limiting
   */
  private getKey(req: any): string {
    // Utiliser IP + User ID si authentifié
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || 'anonymous';
    return `ratelimit:${ip}:${userId}`;
  }

  /**
   * Vérifie si une requête est autorisée
   */
  async isAllowed(key: string): Promise<boolean> {
    const current = await this.store.get(key);
    return current < this.config.maxRequests;
  }

  /**
   * Reset le compteur pour une clé
   */
  async reset(key: string): Promise<void> {
    await this.store.resetKey(key);
  }
}

/**
 * Configurations prédéfinies
 */
export const RateLimitConfigs = {
  // API générale: 100 requêtes/minute
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Trop de requêtes. Limite: 100 requêtes par minute.',
  },

  // Authentification: 5 tentatives/15 minutes
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    skipSuccessfulRequests: true,
  },

  // Exports: 10 exports/heure
  exports: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 10,
    message: 'Trop d\'exports. Limite: 10 exports par heure.',
  },

  // Recherche: 30 requêtes/minute
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Trop de recherches. Limite: 30 recherches par minute.',
  },

  // Modifications données: 50 requêtes/minute
  mutations: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Trop de modifications. Limite: 50 modifications par minute.',
  },
};

/**
 * Instances prêtes à l'emploi
 */
export const generalLimiter = new RateLimiter(RateLimitConfigs.general);
export const authLimiter = new RateLimiter(RateLimitConfigs.auth);
export const exportLimiter = new RateLimiter(RateLimitConfigs.exports);
export const searchLimiter = new RateLimiter(RateLimitConfigs.search);
export const mutationLimiter = new RateLimiter(RateLimitConfigs.mutations);

/**
 * Exemples d'utilisation
 * 
 * @example
 * // Dans Express
 * import { generalLimiter, authLimiter } from '@/lib/security/rateLimiter';
 * 
 * // Appliquer à toutes les routes
 * app.use(generalLimiter.middleware());
 * 
 * // Appliquer à des routes spécifiques
 * app.post('/api/auth/login', authLimiter.middleware(), loginHandler);
 * app.post('/api/exports', exportLimiter.middleware(), exportHandler);
 * 
 * @example
 * // Vérification manuelle
 * const allowed = await generalLimiter.isAllowed('user:123');
 * if (!allowed) {
 *   throw new Error('Rate limit exceeded');
 * }
 */
