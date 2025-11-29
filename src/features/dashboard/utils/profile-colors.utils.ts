/**
 * Utilitaires pour les couleurs des profils/rôles
 * Design System cohérent
 * @module profile-colors.utils
 */

export interface RoleColorScheme {
  bg: string;
  text: string;
  border: string;
  icon: string;
  progress: string;
}

/**
 * Palette de couleurs pour les rôles (Design System)
 */
export const ROLE_COLORS: Record<string, RoleColorScheme> = {
  admin: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-700', 
    border: 'border-rose-200', 
    icon: 'bg-rose-100', 
    progress: 'bg-rose-500' 
  },
  pedagogy: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-200', 
    icon: 'bg-blue-100', 
    progress: 'bg-blue-500' 
  },
  student: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200', 
    icon: 'bg-emerald-100', 
    progress: 'bg-emerald-500' 
  },
  finance: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200', 
    icon: 'bg-amber-100', 
    progress: 'bg-amber-500' 
  },
  default: { 
    bg: 'bg-slate-50', 
    text: 'text-slate-700', 
    border: 'border-slate-200', 
    icon: 'bg-slate-100', 
    progress: 'bg-slate-500' 
  },
} as const;

/**
 * Détermine le schéma de couleurs pour un rôle donné
 */
export const getRoleColor = (code: string): RoleColorScheme => {
  const lowerCode = code.toLowerCase();
  
  if (lowerCode.includes('admin') || lowerCode.includes('directeur') || lowerCode.includes('chef')) {
    return ROLE_COLORS.admin;
  }
  if (lowerCode.includes('enseignant') || lowerCode.includes('cpe') || lowerCode.includes('pedagog')) {
    return ROLE_COLORS.pedagogy;
  }
  if (lowerCode.includes('eleve') || lowerCode.includes('parent')) {
    return ROLE_COLORS.student;
  }
  if (lowerCode.includes('comptable') || lowerCode.includes('econom') || lowerCode.includes('financ') || lowerCode.includes('secretaire')) {
    return ROLE_COLORS.finance;
  }
  
  return ROLE_COLORS.default;
};

/**
 * Calcule le nombre de modules activés pour un profil
 * Ignore les domaines legacy et 'scope'
 */
export const countActiveModules = (permissions: Record<string, unknown> | null): number => {
  if (!permissions) return 0;
  
  return Object.entries(permissions).filter(
    ([key, value]) => value === true && key !== 'scope'
  ).length;
};

/**
 * Calcule le niveau de puissance (pourcentage) basé sur les modules
 * Max 43 modules pour plan Pro
 */
export const calculatePowerLevel = (permissionsCount: number, maxModules = 43): number => {
  return Math.min(100, Math.max(5, (permissionsCount / maxModules) * 100));
};
