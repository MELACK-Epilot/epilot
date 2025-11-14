/**
 * Wrapper pour le module Gestion des Inscriptions
 * Adapte InscriptionsHub pour l'interface ModuleWorkspace
 * @module GestionInscriptionsModule
 */

import { InscriptionsHub } from '../inscriptions/pages/InscriptionsHub';
import type { ModuleContext } from '@/features/user-space/utils/module-navigation';

interface GestionInscriptionsModuleProps {
  context: ModuleContext;
}

/**
 * Composant wrapper pour Gestion des Inscriptions
 */
export function GestionInscriptionsModule({ context }: GestionInscriptionsModuleProps) {
  console.log('📋 [GestionInscriptions] Module chargé avec contexte:', {
    école: context.schoolId,
    groupe: context.schoolGroupId,
    utilisateur: context.userId,
  });

  return <InscriptionsHub />;
}
