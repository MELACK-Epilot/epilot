/**
 * Navigation modulaire dynamique selon modules assignés
 * React 19 Best Practices + Temps Réel
 * 
 * @module ModularNavigation
 */

import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard,
  DollarSign,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  Bell,
  UserCircle,
  BarChart3,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUserModulesContext } from '@/contexts/UserPermissionsProvider';

/**
 * Interface pour un item de navigation
 */
interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  moduleSlug?: string; // Si undefined, toujours visible
  badge?: number;
  description?: string;
}

/**
 * Configuration de la navigation par module
 */
const MODULE_NAV_CONFIG: Record<string, NavItem[]> = {
  // Navigation toujours visible
  core: [
    {
      label: 'Tableau de bord',
      path: '/user',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble de votre école',
    },
    {
      label: 'Mon profil',
      path: '/user/profile',
      icon: UserCircle,
      description: 'Gérer vos informations personnelles',
    },
    {
      label: 'Notifications',
      path: '/user/notifications',
      icon: Bell,
      description: 'Vos notifications et alertes',
    },
  ],

  // Module Finances
  finances: [
    {
      label: 'Finances',
      path: '/user/finances',
      icon: DollarSign,
      moduleSlug: 'finances',
      description: 'Gestion financière de l\'école',
    },
    {
      label: 'Paiements',
      path: '/user/finances/payments',
      icon: FileText,
      moduleSlug: 'finances',
      description: 'Suivi des paiements',
    },
  ],

  // Module Personnel
  personnel: [
    {
      label: 'Personnel',
      path: '/user/staff',
      icon: Users,
      moduleSlug: 'personnel',
      description: 'Gestion du personnel',
    },
  ],

  // Module Élèves
  eleves: [
    {
      label: 'Élèves',
      path: '/user/students',
      icon: GraduationCap,
      moduleSlug: 'eleves',
      description: 'Gestion des élèves',
    },
  ],

  // Module Classes
  classes: [
    {
      label: 'Classes',
      path: '/user/classes',
      icon: BookOpen,
      moduleSlug: 'classes',
      description: 'Gestion des classes',
    },
  ],

  // Module Emploi du temps
  emploi_temps: [
    {
      label: 'Emploi du temps',
      path: '/user/schedule',
      icon: Calendar,
      moduleSlug: 'emploi_temps',
      description: 'Planning et horaires',
    },
  ],

  // Module Inscriptions
  inscriptions: [
    {
      label: 'Inscriptions',
      path: '/user/inscriptions',
      icon: ClipboardList,
      moduleSlug: 'inscriptions',
      description: 'Gestion des inscriptions',
    },
  ],

  // Module Rapports
  rapports: [
    {
      label: 'Rapports',
      path: '/user/reports',
      icon: BarChart3,
      moduleSlug: 'rapports',
      description: 'Statistiques et rapports',
    },
  ],

  // Navigation secondaire
  secondary: [
    {
      label: 'Mes modules',
      path: '/user/modules',
      icon: Settings,
      description: 'Voir tous mes modules',
    },
  ],
};

/**
 * Composant de navigation modulaire
 */
export const ModularNavigation = () => {
  const location = useLocation();
  const { modules, isLoading } = useUserModulesContext();

  // Construire la navigation selon les modules assignés
  const navItems = useMemo(() => {
    const items: NavItem[] = [];

    // Toujours ajouter les items core
    items.push(...MODULE_NAV_CONFIG.core);

    // Ajouter les items selon les modules assignés
    if (!isLoading && modules) {
      modules.forEach(module => {
        const moduleNav = MODULE_NAV_CONFIG[module.slug];
        if (moduleNav) {
          items.push(...moduleNav);
        }
      });
    }

    // Ajouter la navigation secondaire
    items.push(...MODULE_NAV_CONFIG.secondary);

    return items;
  }, [modules, isLoading]);

  // Grouper par section
  const groupedNav = useMemo(() => {
    return {
      principal: navItems.filter(item => 
        MODULE_NAV_CONFIG.core.includes(item) ||
        item.moduleSlug
      ),
      secondaire: navItems.filter(item => 
        MODULE_NAV_CONFIG.secondary.includes(item)
      ),
    };
  }, [navItems]);

  if (isLoading) {
    return (
      <nav className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-6">
      {/* Navigation principale */}
      <div className="space-y-1">
        {groupedNav.principal.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] text-white shadow-lg shadow-[#2A9D8F]/30'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#2A9D8F]'
                )}
              >
                {/* Indicateur actif */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icône */}
                <div className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Label */}
                <span className={cn(
                  'flex-1 font-medium text-sm',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>

                {/* Badge (si présent) */}
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'default'}
                    className={cn(
                      'ml-auto',
                      isActive 
                        ? 'bg-white text-[#2A9D8F]' 
                        : 'bg-[#2A9D8F] text-white'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}

                {/* Effet hover */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2A9D8F]/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-200" />

      {/* Navigation secondaire */}
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Paramètres
        </p>
        {groupedNav.secondaire.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (groupedNav.principal.length + index) * 0.05 }}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gray-100 text-[#2A9D8F] font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Composant de navigation mobile (drawer)
 */
export const MobileModularNavigation = () => {
  // Même logique que ModularNavigation mais optimisé pour mobile
  return <ModularNavigation />;
};
