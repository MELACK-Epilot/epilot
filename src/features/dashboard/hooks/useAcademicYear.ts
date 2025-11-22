/**
 * Hook pour l'année scolaire courante
 * Calcule dynamiquement l'année scolaire en fonction de la date actuelle
 * @module useAcademicYear
 */

import { useMemo } from 'react';

export const useAcademicYear = () => {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11 (Septembre est 8)

    // Si on est avant septembre (mois < 8), l'année scolaire a commencé l'année précédente
    // Ex: Mars 2025 => Année 2024-2025
    if (currentMonth < 8) {
      return `${currentYear - 1}-${currentYear}`;
    }
    
    // Si on est en septembre ou après, c'est l'année courante
    // Ex: Octobre 2024 => Année 2024-2025
    return `${currentYear}-${currentYear + 1}`;
  }, []);
};
