/**
 * Utilitaires pour les dates - Analytics
 * @module analytics-dates.utils
 */

/**
 * Vérifie si une date est dans les N derniers jours
 */
export const isInLastNDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
};

/**
 * Vérifie si une date est dans le mois en cours
 */
export const isInCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
};

/**
 * Obtient le début du mois en cours
 */
export const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Obtient le début du mois précédent
 */
export const getStartOfPreviousMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};
