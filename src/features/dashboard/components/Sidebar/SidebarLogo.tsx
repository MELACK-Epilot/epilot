/**
 * SidebarLogo Component - Logo avec animations GPU
 * ✅ Memoization React 19
 * ✅ GPU-accelerated animations (transform, will-change)
 * ✅ Responsive design
 * ✅ TypeScript strict
 * @module Sidebar/SidebarLogo
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { SidebarLogoProps } from './types';

/**
 * Composant Logo de la Sidebar
 * Affiche le logo E-Pilot avec animations fluides
 */
export const SidebarLogo = memo<SidebarLogoProps>(({ isOpen }) => {
  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
      {isOpen ? (
        <div 
          className={cn(
            "flex items-center gap-3",
            "transition-all duration-300 ease-out",
            "will-change-transform"
          )}
        >
          {/* Logo Container */}
          <div 
            className={cn(
              "w-10 h-10 bg-white/10 rounded-lg",
              "flex items-center justify-center p-2",
              "transition-transform duration-200",
              "hover:scale-105 hover:bg-white/15",
              "will-change-transform"
            )}
          >
            <img 
              src="/images/logo/logo.svg" 
              alt="E-Pilot Logo" 
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>

          {/* Texte Logo */}
          <div 
            className={cn(
              "overflow-hidden",
              "transition-opacity duration-300"
            )}
          >
            <span 
              className={cn(
                "font-bold text-base text-white block",
                "transition-opacity duration-300"
              )}
            >
              E-Pilot Congo
            </span>
            <span 
              className={cn(
                "text-xs text-white/60",
                "transition-opacity duration-300"
              )}
            >
              Super Admin
            </span>
          </div>
        </div>
      ) : (
        /* Logo Collapsed */
        <div 
          className={cn(
            "w-10 h-10 bg-white/10 rounded-lg",
            "flex items-center justify-center mx-auto p-2",
            "transition-transform duration-200",
            "hover:scale-105 hover:bg-white/15",
            "will-change-transform"
          )}
        >
          <img 
            src="/images/logo/logo.svg" 
            alt="E-Pilot Logo" 
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
      )}
    </div>
  );
});

SidebarLogo.displayName = 'SidebarLogo';
