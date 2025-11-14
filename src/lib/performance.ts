/**
 * Système de monitoring des performances
 * @module Performance
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 500;
  private timers = new Map<string, number>();

  /**
   * Démarrer un timer
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * Arrêter un timer et enregistrer la métrique
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer "${name}" non trouvé`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.addMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Logger si la durée est trop longue
    if (duration > 1000) {
      logger.warn(`Performance lente: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    }

    return duration;
  }

  /**
   * Mesurer une fonction async
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Ajouter une métrique
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Limiter la taille
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Obtenir les métriques
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return this.metrics;
  }

  /**
   * Obtenir les statistiques
   */
  getStats(name?: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } {
    const metrics = name ? this.getMetrics(name) : this.metrics;

    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);

    return {
      count: metrics.length,
      avg: sum / metrics.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
    };
  }

  /**
   * Vider les métriques
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Exporter les métriques
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        stats: this.getStats(),
      },
      null,
      2
    );
  }
}

// Instance singleton
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook React pour mesurer les performances d'un composant
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  return {
    measure: (actionName: string) => {
      const duration = performance.now() - startTime;
      performanceMonitor.addMetric({
        name: `${componentName}.${actionName}`,
        duration,
        timestamp: Date.now(),
      });
    },
  };
}

/**
 * Mesurer le temps de chargement initial
 */
export function measurePageLoad(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (perfData) {
      performanceMonitor.addMetric({
        name: 'page.load',
        duration: perfData.loadEventEnd - perfData.fetchStart,
        timestamp: Date.now(),
        metadata: {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
          domInteractive: perfData.domInteractive - perfData.fetchStart,
        },
      });

      logger.info('Page chargée', {
        loadTime: `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
      });
    }
  });
}

/**
 * Mesurer les Core Web Vitals
 */
export function measureWebVitals(): void {
  if (typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;

    performanceMonitor.addMetric({
      name: 'webvital.lcp',
      duration: lastEntry.renderTime || lastEntry.loadTime,
      timestamp: Date.now(),
    });
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // FID (First Input Delay)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      performanceMonitor.addMetric({
        name: 'webvital.fid',
        duration: entry.processingStart - entry.startTime,
        timestamp: Date.now(),
      });
    });
  }).observe({ entryTypes: ['first-input'] });

  // CLS (Cumulative Layout Shift)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });

    performanceMonitor.addMetric({
      name: 'webvital.cls',
      duration: clsValue,
      timestamp: Date.now(),
    });
  }).observe({ entryTypes: ['layout-shift'] });
}

/**
 * Initialiser le monitoring des performances
 */
export function initPerformanceMonitoring(): void {
  measurePageLoad();
  measureWebVitals();

  // Logger les stats toutes les 30 secondes en dev
  if (import.meta.env.DEV) {
    setInterval(() => {
      const stats = performanceMonitor.getStats();
      if (stats.count > 0) {
        logger.debug('Performance Stats', stats);
      }
    }, 30000);
  }
}
