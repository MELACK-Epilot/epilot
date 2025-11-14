/**
 * Page Mes Modules - INTERFACE PREMIUM
 * Interface moderne et performante pour tous les rôles
 */

import { useAuth } from '@/features/auth/store/auth.store';
import MyModulesProviseurModern from './MyModulesProviseurModern';
import { MyModulesDebugSimple } from './MyModulesDebugSimple';

export const MyModules = () => {
  const { user } = useAuth();

  // Log pour debug
  console.log('🔍 MyModules - User:', user);
  console.log('🔍 MyModules - School Group ID:', user?.schoolGroupId);
  
  // Interface Moderne pour le Proviseur - Dashboard avec animations simples !
  if (user?.role && user.role.toString() === 'proviseur') {
    return <MyModulesProviseurModern />;
  }
  
  // Interface debug pour les autres rôles
  return <MyModulesDebugSimple />;
};
