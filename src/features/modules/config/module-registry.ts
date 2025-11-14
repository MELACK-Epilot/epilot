/**
 * Registre des modules disponibles
 * Permet de mapper dynamiquement les slugs vers leurs composants
 * @module ModuleRegistry
 */

import { lazy, ComponentType } from 'react';
import type { ModuleContext } from '@/features/user-space/utils/module-navigation';

/**
 * Type pour les composants de modules
 */
export type ModuleComponent = ComponentType<{ context: ModuleContext }>;

/**
 * Interface pour un module enregistré
 */
export interface RegisteredModule {
  slug: string;
  component: ModuleComponent;
  isLazy?: boolean;
}

/**
 * Registre des modules avec lazy loading
 * ⭐ Seuls les modules EXISTANTS sont enregistrés
 */
export const MODULE_REGISTRY: Record<string, ModuleComponent> = {
  // ✅ Scolarité & Admissions (EXISTANTS)
  'admission-eleves': lazy(() => 
    import('../components/AdmissionElevesModule').then(m => ({ default: m.AdmissionElevesModule }))
  ),
  'gestion-inscriptions': lazy(() => 
    import('../components/GestionInscriptionsModule').then(m => ({ default: m.GestionInscriptionsModule }))
  ),
  
  // ⏳ Autres modules (À CRÉER au fur et à mesure)
  // 'gestion-classes': lazy(() => ...),
  // 'notes-evaluations': lazy(() => ...),
  // etc.
};

/**
 * Vérifier si un module est enregistré
 */
export function isModuleRegistered(slug: string): boolean {
  return slug in MODULE_REGISTRY;
}

/**
 * Obtenir le composant d'un module
 */
export function getModuleComponent(slug: string): ModuleComponent | null {
  return MODULE_REGISTRY[slug] || null;
}

/**
 * Liste de tous les slugs de modules enregistrés
 */
export const REGISTERED_MODULE_SLUGS = Object.keys(MODULE_REGISTRY);
