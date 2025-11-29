/**
 * Helpers pour le modal UserDetails
 * @module user-details/utils
 */

/**
 * Retourne le libellé français d'un rôle
 */
export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_groupe: 'Admin Groupe',
    proviseur: 'Proviseur',
    directeur: 'Directeur',
    directeur_etudes: 'Directeur des Études',
    enseignant: 'Enseignant',
    comptable: 'Comptable',
    secretaire: 'Secrétaire',
    surveillant: 'Surveillant',
    cpe: 'CPE',
    bibliothecaire: 'Bibliothécaire',
    infirmier: 'Infirmier',
    parent: 'Parent',
    eleve: 'Élève',
  };
  return labels[role] || role;
};

/**
 * Retourne le libellé français d'un profil d'accès
 */
export const getProfileLabel = (code: string | null | undefined): string => {
  if (!code) return 'Aucun profil';
  const labels: Record<string, string> = {
    chef_etablissement: "Chef d'Établissement",
    financier_sans_suppression: 'Financier',
    administratif_basique: 'Administratif',
    enseignant_saisie_notes: 'Enseignant',
    parent_consultation: 'Parent',
    eleve_consultation: 'Élève',
  };
  return labels[code] || code;
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
