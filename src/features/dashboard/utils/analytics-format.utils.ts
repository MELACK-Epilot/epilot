/**
 * Formatage des données - Analytics
 * @module analytics-format.utils
 */

/**
 * Formate un nombre en devise
 */
export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`;
  }
  return `${amount.toFixed(0)} ${currency}`;
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
