/**
 * SidebarNav Component - Navigation principale
 * ✅ Memoization React 19
 * ✅ Liste de navigation optimisée
 * ✅ Accessibilité WCAG 2.2 AA
 * ✅ TypeScript strict
 * @module Sidebar/SidebarNav
 */

import { memo, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  CreditCard,
  Package,
  MessageSquare,
  FileText,
  Activity,
  Trash2,
  TrendingUp,
  Zap,
  ClipboardList,
  Share2,
  Calendar,
  Network,
} from 'lucide-react';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarNavItemWithSubmenu } from './SidebarNavItemWithSubmenu';
import { cn } from '@/lib/utils';
import type { SidebarNavProps, NavigationItem } from './types';

/**
 * Items de navigation - Configuration centralisée
 */
const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
    badge: null,
    roles: ['super_admin', 'admin_groupe'],
  },
  {
    title: 'Groupes Scolaires',
    icon: Building2,
    href: '/dashboard/school-groups',
    badge: null,
    roles: ['super_admin'],
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    href: '/dashboard/users',
    badge: null,
    roles: ['super_admin', 'admin_groupe'],
  },
  {
    title: 'Catégories Métiers',
    icon: Briefcase,
    href: '/dashboard/categories',
    badge: null,
    roles: ['super_admin'],
  },
  {
    title: 'Plans & Tarification',
    icon: CreditCard,
    href: '/dashboard/plans',
    badge: null,
    roles: ['super_admin'],
  },
  {
    title: 'Abonnements',
    icon: Package,
    href: '/dashboard/subscriptions',
    badge: 3,
    roles: ['super_admin'],
  },
  {
    title: 'Modules',
    icon: Package,
    href: '/dashboard/modules',
    badge: null,
    roles: ['super_admin', 'admin_groupe'],
  },
  {
    title: 'Actions',
    icon: Zap,
    href: '#',
    badge: null,
    roles: ['admin_groupe', 'proviseur', 'directeur', 'directeur_etudes'],
    subItems: [
      {
        title: 'Hub Documentaire',
        icon: FileText,
        href: '/user/documents',
        badge: null,
      },
      {
        title: 'État des Besoins',
        icon: ClipboardList,
        href: '/user/resource-requests',
        badge: null,
      },
      {
        title: 'Partager des Fichiers',
        icon: Share2,
        href: '/user/share-files',
        badge: null,
      },
      {
        title: 'Réseau des Écoles',
        icon: Network,
        href: '/user/school-network',
        badge: null,
      },
      {
        title: 'Demande de Réunion',
        icon: Calendar,
        href: '/user/meeting-requests',
        badge: null,
      },
    ],
  },
  {
    title: 'Finances Groupe',
    icon: TrendingUp,
    href: '/dashboard/finances-groupe',
    badge: null,
    roles: ['admin_groupe'],
  },
  {
    title: 'Finances',
    icon: TrendingUp,
    href: '/dashboard/finances',
    badge: null,
    roles: ['super_admin'],
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    href: '/dashboard/communication',
    badge: 5,
    roles: ['super_admin', 'admin_groupe'],
  },
  {
    title: 'Rapports',
    icon: FileText,
    href: '/dashboard/reports',
    badge: null,
    roles: ['super_admin', 'admin_groupe'],
  },
  {
    title: "Journal d'Activité",
    icon: Activity,
    href: '/dashboard/activity-logs',
    badge: null,
    roles: ['super_admin'],
  },
  {
    title: 'Corbeille',
    icon: Trash2,
    href: '/dashboard/trash',
    badge: null,
    roles: ['super_admin'],
  },
] as const;

/**
 * Composant Navigation de la Sidebar
 * Affiche la liste des liens de navigation
 */
export const SidebarNav = memo<SidebarNavProps>(({ 
  isOpen, 
  currentPath,
  userRole = null,
  onLinkClick 
}) => {
  const navigationItems = useMemo(() => {
    if (!userRole) {
      return [];
    }
    return NAVIGATION_ITEMS.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    });
  }, [userRole]);

  // Fonction pour déterminer si un lien est actif
  const isActive = useMemo(() => {
    return (href: string): boolean => {
      if (href === '/dashboard') {
        return currentPath === href;
      }
      return currentPath.startsWith(href);
    };
  }, [currentPath]);

  return (
    <nav 
      className={cn(
        "flex-1 overflow-y-auto py-4 px-3",
        "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      )}
      aria-label="Navigation principale"
    >
      <div className="space-y-1">
        {navigationItems.map((item, index) => {
          // Si l'item a des sous-items, utiliser le composant avec sous-menu
          if (item.subItems && item.subItems.length > 0) {
            return (
              <SidebarNavItemWithSubmenu
                key={item.href}
                item={item}
                isOpen={isOpen}
                isActive={isActive(item.href)}
                index={index}
                currentPath={currentPath}
                onClick={onLinkClick}
              />
            );
          }

          // Sinon, utiliser le composant standard
          return (
            <SidebarNavItem
              key={item.href}
              item={item}
              isOpen={isOpen}
              isActive={isActive(item.href)}
              index={index}
              onClick={onLinkClick}
            />
          );
        })}
      </div>
    </nav>
  );
});

SidebarNav.displayName = 'SidebarNav';
