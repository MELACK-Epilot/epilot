/**
 * Page Mes Modules - VERSION DEBUG FORCÉE
 * Affiche l'interface debug pour diagnostiquer le problème
 */

import { useAuth } from '@/features/auth/store/auth.store';
import { MyModulesDebugSimple } from './MyModulesDebugSimple';

export const MyModules = () => {
  const { user } = useAuth();
  
  // FORCER L'INTERFACE DEBUG POUR DIAGNOSTIQUER
  console.log('🔍 MyModules - User role:', user?.role);
  console.log('🔍 MyModules - User email:', user?.email);
  console.log('🔍 MyModules - School Group ID:', user?.schoolGroupId);
  
  // Interface debug forcée
  return <MyModulesDebugSimple />;
};
