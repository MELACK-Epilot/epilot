/**
 * Hook pour vérifier si un module est assigné à l'utilisateur
 * React 19 Best Practices
 * 
 * @module useHasModule
 */

import { useMemo } from 'react';
import { useUserModules } from './useUserModules';

/**
 * Hook pour vérifier si un module spécifique est assigné
 * Mémorisé pour éviter les recalculs
 */
export const useHasModule = (moduleSlug: string): boolean => {
  const { data: modules, isLoading } = useUserModules();

  return useMemo(() => {
    if (isLoading || !modules) return false;
    return modules.some(m => m.slug === moduleSlug);
  }, [modules, moduleSlug, isLoading]);
};

/**
 * Hook pour vérifier plusieurs modules à la fois
 * Retourne un objet avec les slugs comme clés
 */
export const useHasModules = (moduleSlugs: string[]): Record<string, boolean> => {
  const { data: modules, isLoading } = useUserModules();

  return useMemo(() => {
    if (isLoading || !modules) {
      return moduleSlugs.reduce((acc, slug) => ({ ...acc, [slug]: false }), {});
    }

    return moduleSlugs.reduce((acc, slug) => ({
      ...acc,
      [slug]: modules.some(m => m.slug === slug)
    }), {});
  }, [modules, moduleSlugs, isLoading]);
};

/**
 * Hook pour obtenir tous les slugs des modules assignés
 */
export const useAssignedModuleSlugs = (): string[] => {
  const { data: modules, isLoading } = useUserModules();

  return useMemo(() => {
    if (isLoading || !modules) return [];
    return modules.map(m => m.slug);
  }, [modules, isLoading]);
};

/**
 * Configuration des modules et leurs fonctionnalités
 */
export const MODULE_FEATURES = {
  'finances': {
    name: 'Finances',
    kpis: ['monthlyRevenue', 'pendingPayments'],
    routes: ['/user/finances'],
    icon: 'DollarSign',
    color: '#10B981',
  },
  'classes': {
    name: 'Classes',
    kpis: ['totalClasses'],
    routes: ['/user/classes'],
    icon: 'BookOpen',
    color: '#3B82F6',
  },
  'personnel': {
    name: 'Personnel',
    kpis: ['totalStaff'],
    routes: ['/user/staff'],
    icon: 'Users',
    color: '#1D3557',
  },
  'eleves': {
    name: 'Élèves',
    kpis: ['totalStudents'],
    routes: ['/user/students'],
    icon: 'GraduationCap',
    color: '#8B5CF6',
  },
  'inscriptions': {
    name: 'Inscriptions',
    kpis: [],
    routes: ['/user/inscriptions'],
    icon: 'UserPlus',
    color: '#F59E0B',
  },
  'vie-scolaire': {
    name: 'Vie Scolaire',
    kpis: [],
    routes: ['/user/vie-scolaire'],
    icon: 'Shield',
    color: '#EF4444',
  },
} as const;

export type ModuleSlug = keyof typeof MODULE_FEATURES;
