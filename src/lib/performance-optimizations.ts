/**
 * Optimisations critiques pour 500+ groupes scolaires
 * Cache distribué, pagination, indexation, rate limiting
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Configuration pour la scalabilité
 */
export const SCALE_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Cache
  CACHE_TTL: {
    SUBSCRIPTIONS: 5 * 60 * 1000, // 5 minutes
    MODULES: 15 * 60 * 1000, // 15 minutes
    PLANS: 30 * 60 * 1000, // 30 minutes
  },
  
  // Rate limiting
  MAX_CONCURRENT_REQUESTS: 10,
  REQUEST_DELAY_MS: 100,
  
  // Batch operations
  BATCH_SIZE: 50,
  MAX_BATCH_OPERATIONS: 5,
};

/**
 * Hook pour la pagination infinie des groupes scolaires
 */
export const useInfiniteSchoolGroups = (filters?: {
  search?: string;
  plan?: string;
  status?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['school-groups-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('school_groups')
        .select(`
          id,
          name,
          code,
          region,
          status,
          plan_id,
          subscription_plans:plan_id(name, slug),
          subscriptions!inner(status, end_date),
          _count:group_module_configs(count)
        `)
        .range(
          pageParam * SCALE_CONFIG.DEFAULT_PAGE_SIZE,
          (pageParam + 1) * SCALE_CONFIG.DEFAULT_PAGE_SIZE - 1
        )
        .order('created_at', { ascending: false });

      // Filtres dynamiques
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }
      
      if (filters?.plan) {
        query = query.eq('subscription_plans.slug', filters.plan);
      }
      
      if (filters?.status) {
        query = query.eq('subscriptions.status', filters.status);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;

      return {
        data: data || [],
        nextCursor: data?.length === SCALE_CONFIG.DEFAULT_PAGE_SIZE ? pageParam + 1 : null,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: SCALE_CONFIG.CACHE_TTL.SUBSCRIPTIONS,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Cache distribué pour les modules par plan
 */
export const useCachedModulesByPlan = (planId: string) => {
  return useQuery({
    queryKey: ['modules-by-plan', planId],
    queryFn: async () => {
      // Utiliser une vue matérialisée pour les performances
      const { data, error } = await supabase
        .from('plan_modules_view') // Vue pré-calculée
        .select(`
          module_id,
          module_name,
          module_icon,
          module_color,
          category_id,
          category_name,
          category_color
        `)
        .eq('plan_id', planId);

      if (error) throw error;
      return data || [];
    },
    staleTime: SCALE_CONFIG.CACHE_TTL.MODULES,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Batch operations avec rate limiting
 */
export class BatchOperationManager {
  private queue: (() => Promise<any>)[] = [];
  private running = 0;
  private results: any[] = [];

  async addOperation<T>(operation: () => Promise<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          this.results.push(result);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= SCALE_CONFIG.MAX_CONCURRENT_REQUESTS || this.queue.length === 0) {
      return;
    }

    this.running++;
    const operation = this.queue.shift()!;
    
    try {
      await operation();
    } finally {
      this.running--;
      
      // Délai entre les requêtes pour éviter la surcharge
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), SCALE_CONFIG.REQUEST_DELAY_MS);
      }
    }
  }

  async waitForCompletion(): Promise<any[]> {
    while (this.queue.length > 0 || this.running > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.results;
  }
}

/**
 * Système de cache intelligent multi-niveaux
 */
export class MultiLevelCache {
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 1. Vérifier le cache mémoire
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // 2. Vérifier le localStorage (cache navigateur)
    const localCached = this.getFromLocalStorage(key);
    if (localCached) {
      this.memoryCache.set(key, {
        data: localCached,
        expires: Date.now() + this.TTL,
      });
      return localCached;
    }

    // 3. Fetch depuis l'API
    const data = await fetcher();
    
    // 4. Mettre en cache à tous les niveaux
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + this.TTL,
    });
    
    this.setToLocalStorage(key, data);
    
    return data;
  }

  invalidate(pattern: string): void {
    // Invalider le cache mémoire
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalider le localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes(pattern)) {
        localStorage.removeItem(key);
      }
    }
  }

  private getFromLocalStorage(key: string): any {
    try {
      const item = localStorage.getItem(`epilot_cache_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (parsed.expires < Date.now()) {
        localStorage.removeItem(`epilot_cache_${key}`);
        return null;
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  }

  private setToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(`epilot_cache_${key}`, JSON.stringify({
        data,
        expires: Date.now() + this.TTL,
      }));
    } catch {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  }
}

/**
 * Optimisations de requêtes pour les gros volumes
 */
export const optimizedQueries = {
  
  /**
   * Récupération optimisée des statistiques globales
   */
  getGlobalStats: async () => {
    // Utiliser des vues matérialisées pour les stats
    const { data, error } = await supabase
      .from('global_stats_view')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Recherche full-text optimisée
   */
  searchSchoolGroups: async (query: string, limit = 20) => {
    const { data, error } = await supabase
      .rpc('search_school_groups_fts', {
        search_query: query,
        result_limit: limit,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Agrégations optimisées par région
   */
  getRegionalStats: async () => {
    const { data, error } = await supabase
      .rpc('get_regional_aggregations');

    if (error) throw error;
    return data;
  },
};

/**
 * Monitoring des performances
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      
      const times = this.metrics.get(operation)!;
      times.push(duration);
      
      // Garder seulement les 100 dernières mesures
      if (times.length > 100) {
        times.shift();
      }
      
      // Log si l'opération est lente
      if (duration > 1000) {
        console.warn(`🐌 Opération lente détectée: ${operation} (${duration.toFixed(2)}ms)`);
      }
    };
  }

  static getStats(operation: string) {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return null;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return { avg, max, min, count: times.length };
  }

  static getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      stats[operation] = this.getStats(operation);
    }
    
    return stats;
  }
}
