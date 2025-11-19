/**
 * Hook de Recherche Optimisé avec Debounce
 * Évite les appels API excessifs pendant la frappe
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOptimizedSearchOptions {
  delay?: number;
  minLength?: number;
  onSearch?: (value: string) => void;
}

interface UseOptimizedSearchReturn {
  searchValue: string;
  debouncedSearch: string;
  isSearching: boolean;
  handleSearch: (value: string) => void;
  clearSearch: () => void;
}

/**
 * Hook pour recherche optimisée avec debounce
 * 
 * @param initialValue - Valeur initiale
 * @param options - Options de configuration
 * @returns Objet avec valeurs et handlers
 * 
 * @example
 * const { searchValue, debouncedSearch, handleSearch, isSearching } = useOptimizedSearch('', {
 *   delay: 300,
 *   minLength: 2,
 *   onSearch: (value) => console.log('Searching:', value)
 * });
 */
export const useOptimizedSearch = (
  initialValue = '',
  options: UseOptimizedSearchOptions = {}
): UseOptimizedSearchReturn => {
  const {
    delay = 300,
    minLength = 0,
    onSearch
  } = options;
  
  const [searchValue, setSearchValue] = useState(initialValue);
  const [debouncedSearch, setDebouncedSearch] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Debounce effect
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // Apply minLength filter
      if (searchValue.length >= minLength || searchValue.length === 0) {
        setDebouncedSearch(searchValue);
        onSearch?.(searchValue);
      }
    }, delay);
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchValue, delay, minLength, onSearch]);
  
  // Handler pour changer la valeur
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);
  
  // Handler pour clear
  const clearSearch = useCallback(() => {
    setSearchValue('');
    setDebouncedSearch('');
  }, []);
  
  // Indicateur de recherche en cours
  const isSearching = searchValue !== debouncedSearch;
  
  return {
    searchValue,
    debouncedSearch,
    isSearching,
    handleSearch,
    clearSearch
  };
};

/**
 * Hook pour filtrage local optimisé
 * Utilise useMemo pour éviter re-calculs inutiles
 */
export const useOptimizedFilter = <T>(
  items: T[],
  searchValue: string,
  filterFn: (item: T, search: string) => boolean
): T[] => {
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  
  useEffect(() => {
    if (!searchValue) {
      setFilteredItems(items);
      return;
    }
    
    // Utiliser requestIdleCallback si disponible
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(() => {
        const filtered = items.filter(item => filterFn(item, searchValue));
        setFilteredItems(filtered);
      });
      
      return () => cancelIdleCallback(handle);
    } else {
      // Fallback: setTimeout
      const timeout = setTimeout(() => {
        const filtered = items.filter(item => filterFn(item, searchValue));
        setFilteredItems(filtered);
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [items, searchValue, filterFn]);
  
  return filteredItems;
};

/**
 * Hook pour multi-filtres optimisé
 */
interface MultiFilterOptions<T> {
  search?: string;
  filters?: Record<string, any>;
  filterFn: (item: T, search: string, filters: Record<string, any>) => boolean;
}

export const useOptimizedMultiFilter = <T>(
  items: T[],
  options: MultiFilterOptions<T>
): T[] => {
  const { search = '', filters = {}, filterFn } = options;
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  
  useEffect(() => {
    if (!search && Object.keys(filters).length === 0) {
      setFilteredItems(items);
      return;
    }
    
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(() => {
        const filtered = items.filter(item => filterFn(item, search, filters));
        setFilteredItems(filtered);
      });
      
      return () => cancelIdleCallback(handle);
    } else {
      const timeout = setTimeout(() => {
        const filtered = items.filter(item => filterFn(item, search, filters));
        setFilteredItems(filtered);
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [items, search, filters, filterFn]);
  
  return filteredItems;
};

/**
 * Hook pour recherche avec historique
 */
export const useSearchWithHistory = (maxHistory = 10) => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [currentSearch, setCurrentSearch] = useState('');
  
  const addToHistory = useCallback((value: string) => {
    if (!value.trim()) return;
    
    setSearchHistory(prev => {
      // Remove duplicates
      const filtered = prev.filter(item => item !== value);
      // Add to beginning
      const newHistory = [value, ...filtered];
      // Limit size
      return newHistory.slice(0, maxHistory);
    });
  }, [maxHistory]);
  
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);
  
  const removeFromHistory = useCallback((value: string) => {
    setSearchHistory(prev => prev.filter(item => item !== value));
  }, []);
  
  return {
    searchHistory,
    currentSearch,
    setCurrentSearch,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
};
