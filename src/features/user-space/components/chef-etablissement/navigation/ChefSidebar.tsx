/**
 * ChefSidebar - Sidebar pour le Chef d'Établissement
 * Navigation par catégories métier avec modules
 * 
 * @module ChefEtablissement/Components
 */

import { memo, useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Package,
  BookOpen,
  GraduationCap,
  Wallet,
  Users,
  Building2,
  Shield,
  FileText,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CategoryNavItem } from '../../../types/chef-etablissement.types';

interface ChefSidebarProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly categories: CategoryNavItem[];
  readonly schoolName?: string;
  readonly userName?: string;
}

/**
 * Mapping des icônes par slug de catégorie
 */
const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  'pedagogie-evaluations': BookOpen,
  'scolarite-admissions': GraduationCap,
  'finances-comptabilite': Wallet,
  'ressources-humaines': Users,
  'services-infrastructures': Building2,
  'securite-acces': Shield,
  'documents-rapports': FileText,
  'vie-scolaire-discipline': Heart,
  'communication': MessageSquare,
};

/**
 * Obtenir l'icône d'une catégorie
 */
const getCategoryIcon = (slug: string) => {
  return CATEGORY_ICONS[slug] || Package;
};

/**
 * Item de catégorie avec sous-menu
 */
const CategoryItem = memo<{
  category: CategoryNavItem;
  isOpen: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  currentPath: string;
}>(({ category, isOpen, isExpanded, onToggle, currentPath }) => {
  const Icon = getCategoryIcon(category.slug);
  const hasActiveModule = category.modules.some(m => currentPath.includes(m.slug));

  return (
    <div>
      {/* Header de catégorie */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
          "transition-all duration-200",
          (isExpanded || hasActiveModule)
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${category.color}30` }}
        >
          <Icon className="h-4 w-4" style={{ color: category.color }} />
        </div>

        {isOpen && (
          <>
            <span className="flex-1 text-left text-sm font-medium truncate">
              {category.name}
            </span>
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white text-xs px-1.5"
            >
              {category.modulesCount}
            </Badge>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Modules de la catégorie */}
      <AnimatePresence>
        {isExpanded && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-0.5">
              {category.modules.map((module) => {
                const isActive = currentPath.includes(module.slug);
                
                return (
                  <NavLink
                    key={module.id}
                    to={module.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                      "transition-all duration-200",
                      isActive
                        ? "bg-white text-[#1D3557] font-medium"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span className="truncate">{module.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CategoryItem.displayName = 'CategoryItem';

/**
 * Sidebar Chef d'Établissement
 */
export const ChefSidebar = memo<ChefSidebarProps>(({
  isOpen,
  onToggle,
  categories,
  schoolName,
  userName,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handleLogout = useCallback(() => {
    navigate('/logout');
  }, [navigate]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "bg-gradient-to-b from-[#1D3557] via-[#1D3557] to-[#2A9D8F]",
        "shadow-2xl transition-all duration-300 ease-in-out",
        "hidden lg:flex flex-col",
        isOpen ? "w-72" : "w-20"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1D3557] font-bold shadow-lg">
              EP
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-lg text-white block">E-Pilot</span>
              {schoolName && (
                <span className="text-xs text-white/60 truncate block">
                  {schoolName}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1D3557] font-bold shadow-lg mx-auto">
            EP
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-white/10 text-white flex-shrink-0"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Dashboard */}
        <div>
          {isOpen && (
            <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Principal
            </p>
          )}
          <NavLink
            to="/user"
            end
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "transition-all duration-200",
              isActive
                ? "bg-white text-[#1D3557] font-medium shadow-lg"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">Tableau de bord</span>}
          </NavLink>
        </div>

        {/* Catégories */}
        {categories.length > 0 && (
          <div>
            {isOpen && (
              <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                Catégories Métier
              </p>
            )}
            <div className="space-y-1">
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isOpen={isOpen}
                  isExpanded={expandedCategories.includes(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  currentPath={location.pathname}
                />
              ))}
            </div>
          </div>
        )}

        {/* Personnel */}
        <div>
          {isOpen && (
            <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Personnel
            </p>
          )}
          <div className="space-y-1">
            <NavLink
              to="/user/profile"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">Mon Profil</span>}
            </NavLink>
            <NavLink
              to="/user/settings"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">Paramètres</span>}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {isOpen && userName && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-white/60">Chef d'Établissement</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 px-3 py-2.5",
            "text-white/70 hover:bg-red-500/20 hover:text-white",
            "transition-all duration-200"
          )}
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span className="text-sm font-medium">Déconnexion</span>}
        </Button>
      </div>
    </aside>
  );
});

ChefSidebar.displayName = 'ChefSidebar';

export default ChefSidebar;
