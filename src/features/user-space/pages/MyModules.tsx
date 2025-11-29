/**
 * Page Mes Modules - Interface Unifiée
 * Affiche les modules assignés à l'utilisateur
 * 
 * @module MyModules
 */

import { AvailableModules } from '../components/AvailableModules';

/**
 * Page des modules utilisateur
 * Utilise le composant AvailableModules qui récupère les modules via usePermissions
 */
export const MyModules = () => {
  return (
    <div className="p-4 md:p-6">
      <AvailableModules />
    </div>
  );
};
