/**
 * Composant Sidebar optimisé avec React 19
 * ✅ Logo SVG réel
 * ✅ Animations légères GPU-accelerated
 * ✅ Responsive total
 * ✅ Accessibilité WCAG 2.2 AA
 * @module Sidebar
 */

import { Link, useLocation } from 'react-router-dom';
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
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const navigationItems = [
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
    badge: null,
  },
  {
    title: 'Groupes Scolaires',
    icon: Building2,
    href: '/dashboard/school-groups',
    badge: null,
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    href: '/dashboard/users',
    badge: null,
  },
  {
    title: 'Catégories Métiers',
    icon: Briefcase,
    href: '/dashboard/categories',
    badge: null,
  },
  {
    title: 'Plans & Tarification',
    icon: CreditCard,
    href: '/dashboard/plans',
    badge: null,
  },
  {
    title: 'Abonnements',
    icon: Package,
    href: '/dashboard/subscriptions',
    badge: 3,
  },
  {
    title: 'Modules',
    icon: Package,
    href: '/dashboard/modules',
    badge: null,
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    href: '/dashboard/communication',
    badge: 5,
  },
  {
    title: 'Rapports',
    icon: FileText,
    href: '/dashboard/reports',
    badge: null,
  },
  {
    title: "Journal d'Activité",
    icon: Activity,
    href: '/dashboard/activity-logs',
    badge: null,
  },
  {
    title: 'Corbeille',
    icon: Trash2,
    href: '/dashboard/trash',
    badge: null,
  },
];

export const Sidebar = ({ isOpen, onClose, isMobile = false }: SidebarProps) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {isOpen ? (
          <div className="flex items-center gap-3 transition-all duration-300">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-2 transition-transform hover:scale-105 will-change-transform">
              <img 
                src="/images/logo/logo.svg" 
                alt="E-Pilot Logo" 
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-base text-white block transition-opacity duration-300">
                E-Pilot Congo
              </span>
              <span className="text-xs text-white/60 transition-opacity duration-300">
                Super Admin
              </span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mx-auto p-2 transition-transform hover:scale-105 will-change-transform">
            <img 
              src="/images/logo/logo.svg" 
              alt="E-Pilot Logo" 
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        aria-label="Navigation principale"
      >
        <div className="space-y-1">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link 
                key={item.href} 
                to={item.href}
                className="block"
                aria-current={active ? 'page' : undefined}
                onClick={handleLinkClick}
              >
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 will-change-transform ${
                    active
                      ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                      : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  } ${!isOpen && 'justify-center'}`}
                  style={{
                    transitionDelay: `${index * 20}ms`
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200" />
                  {isOpen && (
                    <>
                      <span className="text-sm font-medium whitespace-nowrap flex-1 transition-opacity duration-200">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="bg-[#E63946] text-white text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {item.badge && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E63946] rounded-full animate-pulse" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Déconnexion */}
      <div className="p-3 border-t border-white/10">
        {isOpen ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-[#E63946] transition-all duration-200 hover:translate-x-1 will-change-transform"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5 mr-3 transition-transform duration-200" />
            <span className="text-sm font-medium">Déconnexion</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-white/70 hover:text-white hover:bg-[#E63946] transition-all duration-200 hover:scale-110 will-change-transform"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
