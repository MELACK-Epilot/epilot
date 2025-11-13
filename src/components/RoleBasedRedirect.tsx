/**
 * Composant de redirection automatique selon le rôle
 * Redirige les utilisateurs vers leur espace approprié
 * Utilise la configuration centralisée des rôles
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { isAdminRole, isUserRole, normalizeRole } from '@/config/roles';

export const RoleBasedRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    // 🔍 DEBUG
    console.log('🔄 RoleBasedRedirect:', {
      path: currentPath,
      user: user?.email,
      isAuthenticated,
      isLoading,
    });

    // Ne pas rediriger si on est sur la page de déconnexion ou login
    if (currentPath === '/logout' || currentPath === '/login') {
      return;
    }

    // Si pas authentifié et pas en chargement, rediriger vers login
    if (!isLoading && !isAuthenticated) {
      console.log('🔄 Non authentifié → /login');
      navigate('/login', { replace: true });
      return;
    }

    // Si en chargement ou pas d'utilisateur, ne rien faire
    if (isLoading || !user) return;

    // Utiliser les fonctions centralisées pour déterminer le type de rôle
    const isAdmin = isAdminRole(user.role);
    const isUser = isUserRole(user.role);

    // Si utilisateur école essaie d'accéder au dashboard admin
    // ⚠️ IMPORTANT : Ne rediriger que depuis /dashboard exact, pas les sous-routes
    if (isUser && currentPath === '/dashboard') {
      console.log('🔄 Redirection : Utilisateur école vers /user');
      navigate('/user', { replace: true });
      return;
    }

    // Si admin essaie d'accéder à l'espace utilisateur (sauf admin_groupe qui peut)
    const normalizedRole = normalizeRole(user.role);
    if (isAdmin && normalizedRole === 'super_admin' && currentPath.startsWith('/user')) {
      console.log('🔄 Redirection : Super Admin vers /dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Redirection depuis la racine uniquement (pas depuis /login pour éviter boucle)
    if (currentPath === '/') {
      if (isAdmin) {
        console.log('🔄 Redirection : Admin vers /dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('🔄 Redirection : Utilisateur école vers /user');
        navigate('/user', { replace: true });
      }
    }
  }, [user, isAuthenticated, isLoading, location.pathname, navigate]);

  return <>{children}</>;
};
