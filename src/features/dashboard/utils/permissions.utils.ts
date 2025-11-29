/**
 * Utilitaires pour la gestion des permissions
 * @module permissions.utils
 */

/** Clés legacy à ignorer */
const LEGACY_KEYS = ['scope', 'finances', 'pedagogie', 'statistiques', 'vie_scolaire', 'administration'];

/**
 * Extrait les modules activés depuis les permissions
 * Inclut les permissions true ET 'read_only'
 * Ignore les domaines legacy (objets imbriqués) et 'scope'
 */
export const extractModulePermissions = (
  permissions: Record<string, unknown> | null
): Record<string, boolean | 'read_only'> => {
  if (!permissions) return {};
  
  const modulePermissions: Record<string, boolean | 'read_only'> = {};
  
  for (const [key, value] of Object.entries(permissions)) {
    // Ignorer les clés legacy et les objets imbriqués
    if (LEGACY_KEYS.includes(key)) continue;
    if (typeof value === 'object' && value !== null) continue;
    
    // Garder les booléens ET 'read_only'
    if (typeof value === 'boolean') {
      modulePermissions[key] = value;
    } else if (value === 'read_only') {
      modulePermissions[key] = 'read_only';
    }
  }
  
  return modulePermissions;
};

/**
 * Compte le nombre de modules activés (true ou 'read_only')
 */
export const countActiveModules = (permissions: Record<string, boolean | string>): number => {
  return Object.values(permissions).filter(v => v === true || v === 'read_only').length;
};

/**
 * Vérifie si tous les modules d'une catégorie sont activés (true ou read_only)
 */
export const isCategoryFullyChecked = (
  categoryModules: Array<{ slug: string }>,
  permissions: Record<string, boolean | 'read_only'>
): boolean => {
  if (categoryModules.length === 0) return false;
  return categoryModules.every((m) => 
    permissions[m.slug] === true || permissions[m.slug] === 'read_only'
  );
};

/**
 * Active ou désactive tous les modules d'une catégorie
 */
export const toggleCategoryModules = (
  categoryModules: Array<{ slug: string }>,
  permissions: Record<string, boolean | 'read_only'>,
  checked: boolean
): Record<string, boolean | 'read_only'> => {
  const newPermissions = { ...permissions };
  categoryModules.forEach((module) => {
    newPermissions[module.slug] = checked;
  });
  return newPermissions;
};
