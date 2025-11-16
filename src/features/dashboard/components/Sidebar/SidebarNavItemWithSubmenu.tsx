/**
 * SidebarNavItemWithSubmenu - Item avec sous-menu déroulant
 * ✅ Animation fluide
 * ✅ État persistant
 * ✅ Accessibilité
 */

import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { NavigationItem } from './types';

interface SidebarNavItemWithSubmenuProps {
  readonly item: NavigationItem;
  readonly isOpen: boolean;
  readonly isActive: boolean;
  readonly index: number;
  readonly currentPath: string;
  readonly onClick?: () => void;
}

export const SidebarNavItemWithSubmenu = memo<SidebarNavItemWithSubmenuProps>(({
  item,
  isOpen,
  isActive,
  index,
  currentPath,
  onClick
}) => {
  const Icon = item.icon;
  const [isExpanded, setIsExpanded] = useState(item.defaultOpen || false);

  // Vérifier si un sous-item est actif
  const hasActiveSubItem = item.subItems?.some(subItem => 
    currentPath.startsWith(subItem.href)
  );

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div>
      {/* Item parent */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "transition-all duration-200 ease-out",
          "will-change-transform",
          (isActive || hasActiveSubItem)
            ? "bg-white/15 text-white shadow-lg shadow-black/10"
            : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1",
          !isOpen && "justify-center"
        )}
        style={{
          transitionDelay: `${index * 20}ms`
        }}
        aria-expanded={isExpanded}
      >
        {/* Icône */}
        <Icon 
          className={cn(
            "w-5 h-5 flex-shrink-0",
            "transition-transform duration-200",
            (isActive || hasActiveSubItem) && "scale-110"
          )} 
        />

        {/* Texte et Chevron (sidebar ouverte) */}
        {isOpen && (
          <>
            <span 
              className={cn(
                "text-sm font-medium whitespace-nowrap flex-1 text-left",
                "transition-opacity duration-200"
              )}
            >
              {item.title}
            </span>
            
            <ChevronRight 
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />

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
      </button>

      {/* Sous-items */}
      <AnimatePresence>
        {isExpanded && isOpen && item.subItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1 mt-1">
              {item.subItems.map((subItem, subIndex) => {
                const SubIcon = subItem.icon;
                const isSubActive = currentPath.startsWith(subItem.href);

                return (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={onClick}
                    className="block"
                    aria-current={isSubActive ? 'page' : undefined}
                  >
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: subIndex * 0.05 }}
                      className={cn(
                        "relative flex items-center gap-3 pl-11 pr-3 py-2 rounded-lg",
                        "transition-all duration-200 ease-out",
                        isSubActive
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white/90 hover:translate-x-1"
                      )}
                    >
                      <SubIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium whitespace-nowrap flex-1">
                        {subItem.title}
                      </span>
                      
                      {subItem.badge && (
                        <span 
                          className={cn(
                            "bg-[#E63946] text-white text-xs font-semibold",
                            "px-1.5 py-0.5 rounded-full",
                            "animate-pulse"
                          )}
                        >
                          {subItem.badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SidebarNavItemWithSubmenu.displayName = 'SidebarNavItemWithSubmenu';
