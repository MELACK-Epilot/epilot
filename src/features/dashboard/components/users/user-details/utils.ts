/**
 * Helpers pour le modal UserDetails
 * @module user-details/utils
 */

// Réexporter depuis la source centralisée
export { getRoleLabel } from '@/config/roles';

/**
 * Labels par défaut des profils d'accès (synchronisés avec les templates BDD)
 * Ces labels correspondent aux name_fr des profils templates
 */
const DEFAULT_PROFILE_LABELS: Record<string, string> = {
  chef_etablissement: "Chef d'Établissement",
  financier_sans_suppression: 'Comptable/Économe',
  administratif_basique: 'Secrétaire',
  enseignant_saisie_notes: 'Enseignant',
  parent_consultation: 'Parent',
  eleve_consultation: 'Élève',
};

/**
 * Retourne le libellé français d'un profil d'accès
 * @param code - Code du profil
 * @param profilesMap - Map optionnelle des profils depuis la BDD pour labels dynamiques
 */
export const getProfileLabel = (
  code: string | null | undefined, 
  profilesMap?: Map<string, { name_fr: string }>
): string => {
  if (!code) return 'Aucun profil';
  
  // Si une map dynamique est fournie, l'utiliser en priorité
  if (profilesMap?.has(code)) {
    return profilesMap.get(code)!.name_fr;
  }
  
  // Sinon, utiliser les labels par défaut
  return DEFAULT_PROFILE_LABELS[code] || code;
};

/**
 * Calcule les statistiques utilisateur
 */
export const calculateUserStats = (
  activityLogs: Array<{ action: string }>,
  userModulesCount: number,
  lastLogin: string | null | undefined
) => {
  return {
    totalLogins: activityLogs.filter((a) => a.action === 'login').length,
    lastLoginDays: lastLogin
      ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
      : -1,
    modulesCount: userModulesCount,
    activityScore: Math.min(100, activityLogs.length * 5),
  };
};

/**
 * Groupe les modules par catégorie
 */
export const groupModulesByCategory = <T extends { category_name: string }>(
  modules: T[]
): Record<string, T[]> => {
  return modules.reduce<Record<string, T[]>>((acc, mod) => {
    const key = mod.category_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mod);
    return acc;
  }, {});
};
