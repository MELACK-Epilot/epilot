/**
 * Hook pour debouncer une valeur
 * Utile pour les recherches et filtres
 */

import { useState, useEffect } from 'react';

/**
 * Debounce une valeur avec un délai spécifié
 * @param value - Valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 300ms)
 * @returns Valeur debouncée
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 * 
 * useEffect(() => {
 *   // Effectuer la recherche avec debouncedSearch
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour debouncer une fonction callback
 * @param callback - Fonction à debouncer
 * @param delay - Délai en millisecondes (défaut: 300ms)
 * @returns Fonction debouncée
 * 
 * @example
 * const handleSearch = useDebouncedCallback((term: string) => {
 *   // Effectuer la recherche
 * }, 500);
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
