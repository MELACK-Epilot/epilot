/**
 * Types et interfaces pour les modules du Proviseur
 * @module ProviseurModulesTypes
 */

import type { ProviseurModule } from '@/hooks/useProviseurModules';

/**
 * Interface pour un module enrichi pour l'affichage
 */
export interface ModuleEnrichi extends Omit<ProviseurModule, 'module_name' | 'module_slug' | 'module_description' | 'module_icon' | 'module_color'> {
  name: string;
  slug: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  isNew?: boolean;
  isPopular?: boolean;
}

/**
 * Interface pour les KPI
 */
export interface KPIData {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

/**
 * Type pour le mode d'affichage
 */
export type ViewMode = 'grid' | 'list';

/**
 * Type pour le tri
 */
export type SortOption = 'name' | 'recent' | 'popular';
