/**
 * Utilitaires pour le formulaire de plan
 * @module planForm.utils
 */

/**
 * Génère un slug à partir d'un nom
 * @param name - Nom du plan
 * @returns Slug formaté
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Retirer les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-'); // Remplacer les tirets multiples par un seul
};

/**
 * Convertit les features d'un tableau vers une chaîne (une par ligne)
 * @param features - Tableau de features
 * @returns Chaîne avec retours à la ligne
 */
export const featuresToString = (features?: string[]): string => {
  return features ? features.join('\n') : '';
};

/**
 * Convertit les features d'une chaîne vers un tableau
 * @param features - Chaîne avec retours à la ligne
 * @returns Tableau de features
 */
export const stringToFeatures = (features: string): string[] => {
  return features.split('\n').filter(f => f.trim() !== '');
};
