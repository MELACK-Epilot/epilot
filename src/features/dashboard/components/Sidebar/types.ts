/**
 * Sidebar Types - TypeScript strict
 * @module Sidebar/types
 */

import { LucideIcon } from 'lucide-react';

/**
 * Props du composant Sidebar principal
 */
export interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose?: () => void;
  readonly isMobile?: boolean;
  readonly className?: string;
}

/**
 * Props du composant SidebarLogo
 */
export interface SidebarLogoProps {
  readonly isOpen: boolean;
}

/**
 * Item de navigation
 */
export interface NavigationItem {
  readonly title: string;
  readonly icon: LucideIcon;
  readonly href: string;
  readonly badge?: number | null;
  readonly roles?: string[];
}

/**
 * Props du composant SidebarNav
 */
export interface SidebarNavProps {
  readonly isOpen: boolean;
  readonly currentPath: string;
  readonly userRole?: string | null;
  readonly onLinkClick?: () => void;
}

/**
 * Props du composant SidebarNavItem
 */
export interface SidebarNavItemProps {
  readonly item: NavigationItem;
  readonly isOpen: boolean;
  readonly isActive: boolean;
  readonly index: number;
  readonly onClick?: () => void;
}
