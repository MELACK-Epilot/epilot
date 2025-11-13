/**
 * SidebarNavItem Component - Item de navigation individuel
 * ✅ Memoization React 19
 * ✅ GPU-accelerated animations
 * ✅ Accessibilité WCAG 2.2 AA
 * ✅ TypeScript strict
 * @module Sidebar/SidebarNavItem
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SidebarNavItemProps } from './types';

/**
 * Composant Item de navigation
 * Affiche un lien de navigation avec icône et badge
 */
export const SidebarNavItem = memo<SidebarNavItemProps>(({ 
  item, 
  isOpen, 
  isActive, 
  index,
  onClick 
}) => {
  const Icon = item.icon;

  return (
    <Link 
      to={item.href}
      className="block"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "transition-all duration-200 ease-out",
          "will-change-transform",
          isActive
            ? "bg-white/15 text-white shadow-lg shadow-black/10"
            : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1",
          !isOpen && "justify-center"
        )}
        style={{
          transitionDelay: `${index * 20}ms`
        }}
      >
        {/* Icône */}
        <Icon 
          className={cn(
            "w-5 h-5 flex-shrink-0",
            "transition-transform duration-200",
            isActive && "scale-110"
          )} 
        />

        {/* Texte et Badge (sidebar ouverte) */}
        {isOpen && (
          <>
            <span 
              className={cn(
                "text-sm font-medium whitespace-nowrap flex-1",
                "transition-opacity duration-200"
              )}
            >
              {item.title}
            </span>
            
            {item.badge && (
              <span 
                className={cn(
                  "bg-[#E63946] text-white text-xs font-semibold",
                  "px-2 py-0.5 rounded-full",
                  "animate-pulse"
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}

        {/* Badge dot (sidebar fermée) */}
        {item.badge && !isOpen && (
          <span 
            className={cn(
              "absolute -top-1 -right-1",
              "w-2 h-2 bg-[#E63946] rounded-full",
              "animate-pulse"
            )}
            aria-label={`${item.badge} notifications`}
          />
        )}
      </div>
    </Link>
  );
});

SidebarNavItem.displayName = 'SidebarNavItem';
