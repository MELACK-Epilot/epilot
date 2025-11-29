/**
 * Utilitaires pour la gestion des permissions
 * @module permissions.utils
 */

/**
 * Extrait uniquement les modules activés depuis les permissions
 * Ignore les domaines legacy (objets imbriqués) et 'scope'
 */
export const extractModulePermissions = (
  permissions: Record<string, unknown> | null
): Record<string, boolean> => {
  if (!permissions) return {};
  
  const modulePermissions: Record<string, boolean> = {};
  
  for (const [key, value] of Object.entries(permissions)) {
    // Ignorer 'scope' et les objets imbriqués (domaines legacy)
    if (key === 'scope') continue;
    if (typeof value === 'object' && value !== null) continue;
    
    // Garder uniquement les booléens (modules)
    if (typeof value === 'boolean') {
      modulePermissions[key] = value;
    }
  }
  
  return modulePermissions;
};

/**
 * Compte le nombre de modules activés
 */
export const countActiveModules = (permissions: Record<string, boolean>): number => {
  return Object.values(permissions).filter(Boolean).length;
};

/**
 * Vérifie si tous les modules d'une catégorie sont activés
 */
export const isCategoryFullyChecked = (
  categoryModules: Array<{ slug: string }>,
  permissions: Record<string, boolean>
): boolean => {
  if (categoryModules.length === 0) return false;
  return categoryModules.every((m) => permissions[m.slug] === true);
};

/**
 * Active ou désactive tous les modules d'une catégorie
 */
export const toggleCategoryModules = (
  categoryModules: Array<{ slug: string }>,
  permissions: Record<string, boolean>,
  checked: boolean
): Record<string, boolean> => {
  const newPermissions = { ...permissions };
  categoryModules.forEach((module) => {
    newPermissions[module.slug] = checked;
  });
  return newPermissions;
};
