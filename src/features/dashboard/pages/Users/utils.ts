/**
 * Fonctions utilitaires pour la page Users
 * @module Users/utils
 */

import type { User } from '../../types/dashboard.types';

/**
 * Calcule les statistiques avancées des utilisateurs
 */
export function calculateAdvancedStats(users: User[]) {
  const superAdmins = users.filter((u) => u.role === 'super_admin').length;
  const adminGroups = users.filter((u) => u.role === 'admin_groupe').length;
  const withAvatar = users.filter((u) => u.avatar).length;
  
  const connectedToday = users.filter((u) => {
    if (!u.lastLogin) return false;
    const lastLogin = new Date(u.lastLogin);
    const today = new Date();
    return lastLogin.toDateString() === today.toDateString();
  }).length;

  const newThisMonth = users.filter((u) => {
    if (!u.createdAt) return false;
    const created = new Date(u.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return {
    superAdmins,
    adminGroups,
    withAvatar,
    connectedToday,
    newThisMonth,
  };
}

/**
 * Génère les données pour le graphique d'évolution
 */
export function generateEvolutionData(total: number) {
  return [
    { month: 'Mai', users: Math.max(0, total - 23) },
    { month: 'Juin', users: Math.max(0, total - 20) },
    { month: 'Juil', users: Math.max(0, total - 17) },
    { month: 'Août', users: Math.max(0, total - 13) },
    { month: 'Sept', users: Math.max(0, total - 7) },
    { month: 'Oct', users: total },
  ];
}

/**
 * Génère les données pour le graphique de distribution
 */
export function generateDistributionData(
  users: User[],
  schoolGroups: any[]
) {
  return schoolGroups?.slice(0, 4).map((group, index) => ({
    name: group.name,
    value: users.filter((u) => u.schoolGroupId === group.id).length || 0,
    color: ['#1D3557', '#2A9D8F', '#E9C46A', '#E63946'][index],
  })) || [];
}
