/**
 * Composant de redirection automatique selon le rôle ET le profil d'accès
 * 
 * LOGIQUE UNIQUE DE CONNEXION (Architecture Robuste) :
 * 
 * 1. Admins (super_admin, admin_groupe) → /dashboard
 *    - Pas besoin de profil d'accès
 *    - Pas besoin de school_group_id
 * 
 * 2. Utilisateurs école AVEC profil ET groupe → /user
 *    - Accès aux modules du profil
 *    - Modules synchronisés automatiquement
 * 
 * 3. Utilisateurs école SANS profil OU SANS groupe → ProfilePendingPage
 *    - Page d'attente avec message clair
 *    - Écoute temps réel pour changements
 * 
 * @module RoleBasedRedirect
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import { isAdminRole, isUserRole, normalizeRole } from '@/config/roles';
import { ProfilePendingPage } from './ProfilePendingPage';

/** Type pour les vérifications utilisateur */
interface UserCheckResult {
  hasProfile: boolean;
  hasSchoolGroup: boolean;
  isComplete: boolean;
  issue?: 'NO_PROFILE' | 'NO_SCHOOL_GROUP' | 'BOTH_MISSING';
}

/**
 * Vérifie si un utilisateur école a une configuration complète
 */
const checkUserConfiguration = (user: { 
  accessProfileCode?: string; 
  schoolGroupId?: string;
} | null): UserCheckResult => {
  if (!user) {
    return { hasProfile: false, hasSchoolGroup: false, isComplete: false, issue: 'BOTH_MISSING' };
  }
  
  const hasProfile = !!(user.accessProfileCode && user.accessProfileCode.trim() !== '');
  const hasSchoolGroup = !!(user.schoolGroupId && user.schoolGroupId.trim() !== '');
  
  let issue: UserCheckResult['issue'] = undefined;
  if (!hasProfile && !hasSchoolGroup) issue = 'BOTH_MISSING';
  else if (!hasProfile) issue = 'NO_PROFILE';
  else if (!hasSchoolGroup) issue = 'NO_SCHOOL_GROUP';
  
  return {
    hasProfile,
    hasSchoolGroup,
    isComplete: hasProfile && hasSchoolGroup,
    issue,
  };
};

export const RoleBasedRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPendingPage, setShowPendingPage] = useState(false);
  const [configIssue, setConfigIssue] = useState<UserCheckResult['issue']>(undefined);

  useEffect(() => {
    const currentPath = location.pathname;

    // 🔍 DEBUG
    console.log('🔄 RoleBasedRedirect:', {
      path: currentPath,
      user: user?.email,
      role: user?.role,
      accessProfile: user?.accessProfileCode,
      isAuthenticated,
      isLoading,
    });

    // Ne pas rediriger si on est sur la page de déconnexion, login ou profile-pending
    if (currentPath === '/logout' || currentPath === '/login' || currentPath === '/profile-pending') {
      setShowPendingPage(false);
      return;
    }

    // Si pas authentifié et pas en chargement, rediriger vers login
    if (!isLoading && !isAuthenticated) {
      console.log('🔄 Non authentifié → /login');
      setShowPendingPage(false);
      navigate('/login', { replace: true });
      return;
    }

    // Si en chargement ou pas d'utilisateur, ne rien faire
    if (isLoading || !user) {
      setShowPendingPage(false);
      return;
    }

    // Déterminer le type de rôle
    const isAdmin = isAdminRole(user.role);
    const isUser = isUserRole(user.role);
    const normalizedRole = normalizeRole(user.role);
    
    // Vérifier la configuration complète de l'utilisateur
    const userConfig = checkUserConfiguration(user);

    // 🔍 DEBUG
    console.log('🔄 RoleBasedRedirect - Config:', {
      isAdmin,
      isUser,
      ...userConfig,
    });

    // ============================================
    // RÈGLE 1 : Admins → Dashboard (pas besoin de profil ni groupe)
    // ============================================
    if (isAdmin) {
      setShowPendingPage(false);
      
      // Super Admin ne peut pas accéder à /user
      if (normalizedRole === 'super_admin' && currentPath.startsWith('/user')) {
        console.log('🔄 Super Admin → /dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // Redirection depuis la racine
      if (currentPath === '/') {
        console.log('🔄 Admin → /dashboard');
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // ============================================
    // RÈGLE 2 : Utilisateurs école INCOMPLETS → Page d'attente
    // (Sans profil OU sans groupe scolaire)
    // ============================================
    if (isUser && !userConfig.isComplete) {
      console.log('⚠️ Utilisateur incomplet → Page d\'attente', userConfig.issue);
      setConfigIssue(userConfig.issue);
      setShowPendingPage(true);
      return;
    }

    // ============================================
    // RÈGLE 3 : Utilisateurs école COMPLETS → /user
    // (Avec profil ET groupe scolaire)
    // ============================================
    if (isUser && userConfig.isComplete) {
      setShowPendingPage(false);
      
      // Empêcher l'accès au dashboard admin
      if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard/')) {
        console.log('🔄 Utilisateur école → /user');
        navigate('/user', { replace: true });
        return;
      }
      
      // Redirection depuis la racine
      if (currentPath === '/') {
        console.log('🔄 Utilisateur école complet → /user');
        navigate('/user', { replace: true });
      }
      return;
    }

    // Cas par défaut : ne rien faire
    setShowPendingPage(false);
  }, [user, isAuthenticated, isLoading, location.pathname, navigate]);

  // Afficher la page d'attente si nécessaire
  if (showPendingPage && user) {
    return (
      <ProfilePendingPage 
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
        userId={user.id}
        issue={configIssue}
      />
    );
  }

  return <>{children}</>;
};
