/**
 * Sidebar Component - PARFAITE avec meilleures pratiques React 19
 * ✅ Memoization optimale
 * ✅ Animations GPU-accelerated
 * ✅ Accessibilité WCAG 2.2 AA
 * ✅ TypeScript strict
 * ✅ Performance maximale
 * @module Sidebar
 */

import { memo, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { SidebarLogo } from './SidebarLogo';
import { SidebarNav } from './SidebarNav';
import { cn } from '@/lib/utils';
import type { SidebarProps } from './types';
import { useAuth } from '@/features/auth/store/auth.store';

/**
 * Composant Sidebar principal
 * Memoized pour éviter re-renders inutiles
 */
export const Sidebar = memo<SidebarProps>(({ 
  isOpen, 
  onClose, 
  isMobile = false,
  className 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Memoize la fonction de déconnexion
  const handleLogout = useMemo(() => {
    return () => {
      navigate('/logout');
    };
  }, [navigate]);

  // Memoize le handler de fermeture mobile
  const handleMobileClose = useMemo(() => {
    return isMobile && onClose ? onClose : undefined;
  }, [isMobile, onClose]);

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-[#1D3557]",
        className
      )}
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Logo Section */}
      <SidebarLogo isOpen={isOpen} />

      {/* Navigation Section */}
      <SidebarNav 
        isOpen={isOpen} 
        currentPath={location.pathname}
        userRole={user?.role ?? null}
        onLinkClick={handleMobileClose}
      />

      {/* Footer - Déconnexion */}
      <div className="p-3 border-t border-white/10">
        {isOpen ? (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start",
              "text-white/70 hover:text-white",
              "hover:bg-[#E63946]",
              "transition-all duration-200",
              "hover:translate-x-1",
              "will-change-transform"
            )}
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5 mr-3 transition-transform duration-200" />
            <span className="text-sm font-medium">Déconnexion</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(
              "w-full",
              "text-white/70 hover:text-white",
              "hover:bg-[#E63946]",
              "transition-all duration-200",
              "hover:scale-110",
              "will-change-transform"
            )}
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
