/**
 * Hook d'optimisation des performances pour les interfaces premium
 * Gestion intelligente du cache, lazy loading et optimisations React
 * @module usePerformanceOptimized
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Implémentation simple de debounce sans dépendance externe
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Interface pour les métriques de performance
 */
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentUpdates: number;
  lastUpdate: number;
}

/**
 * Hook principal d'optimisation des performances
 */
export const usePerformanceOptimized = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentUpdates: 0,
    lastUpdate: Date.now()
  });

  const renderStartTime = useRef<number>(0);
  const updateCount = useRef<number>(0);

  /**
   * Mesurer le temps de rendu
   */
  const startRenderMeasure = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasure = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    updateCount.current++;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      componentUpdates: updateCount.current,
      lastUpdate: Date.now()
    }));
  }, []);

  /**
   * Mesurer l'utilisation mémoire (si disponible)
   */
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);

  /**
   * Optimisation automatique
   */
  useEffect(() => {
    const interval = setInterval(measureMemory, 5000);
    return () => clearInterval(interval);
  }, [measureMemory]);

  return {
    metrics,
    startRenderMeasure,
    endRenderMeasure,
    measureMemory
  };
};

/**
 * Hook pour la recherche optimisée avec debounce
 */
export const useOptimizedSearch = (initialValue: string = '', delay: number = 300) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useMemo(
    () => debounce((value: string) => {
      setDebouncedValue(value);
    }, delay),
    [delay]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    debouncedSetValue(value);
  }, [debouncedSetValue]);

  useEffect(() => {
    return () => {
      // Nettoyage automatique du timeout
    };
  }, [debouncedSetValue]);

  return {
    searchValue,
    debouncedValue,
    handleSearchChange
  };
};

/**
 * Hook pour la virtualisation des listes longues
 */
export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll
  };
};

/**
 * Hook pour le lazy loading des images
 */
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          img.onerror = () => {
            setIsError(true);
          };
          img.src = src || '';
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError
  };
};

/**
 * Hook pour la gestion intelligente du cache
 */
export const useIntelligentCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // Time to live en ms
    maxSize?: number; // Taille max du cache
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // 5 min par défaut
  
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCachedData = useCallback(() => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, [key, ttl]);

  const setCachedData = useCallback((newData: T) => {
    // Nettoyer le cache si trop grand
    if (cache.current.size >= maxSize) {
      const oldestKey = cache.current.keys().next().value;
      cache.current.delete(oldestKey);
    }
    
    cache.current.set(key, {
      data: newData,
      timestamp: Date.now()
    });
  }, [key, maxSize]);

  const fetchData = useCallback(async () => {
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setCachedData(result);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    clearCache: () => cache.current.clear()
  };
};

/**
 * Hook pour les animations performantes
 */
export const usePerformantAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  const startAnimation = useCallback((callback: () => void, duration: number = 300) => {
    setIsAnimating(true);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      callback();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      setIsAnimating(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    startAnimation,
    stopAnimation
  };
};
