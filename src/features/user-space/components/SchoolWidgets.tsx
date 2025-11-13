/**
 * Widgets KPIs pour le Proviseur/Directeur
 * Affiche les statistiques de l'école avec design glassmorphism moderne
 * React 19 Best Practices
 * 
 * @module SchoolWidgets
 */

import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSchoolStats } from '../hooks/useSchoolStats';
import { useHasModulesRT } from '@/contexts/UserPermissionsProvider';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Interface pour un widget KPI
 */
interface WidgetConfig {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  link: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * Composant Widget KPI individuel
 * Mémorisé pour éviter les re-renders inutiles
 */
const WidgetCard = memo(({ 
  widget, 
  index 
}: { 
  widget: WidgetConfig; 
  index: number;
}) => {
  const Icon = widget.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] // Cubic bezier pour animation fluide
      }}
    >
      <Link to={widget.link}>
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
          {/* Gradient de fond */}
          <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-90`} />
          
          {/* Cercles décoratifs animés */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="relative p-6">
            {/* Header avec icône */}
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-7 w-7 text-white" />
              </div>
              
              {/* Badge trend (si disponible) */}
              {widget.trend && (
                <div className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg flex items-center gap-1">
                  <TrendingUp className={`h-3.5 w-3.5 ${
                    widget.trend.isPositive ? 'text-green-200' : 'text-red-200 rotate-180'
                  }`} />
                  <span className="text-xs font-bold text-white/90">
                    {widget.trend.isPositive ? '+' : ''}{widget.trend.value}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Titre */}
            <h3 className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">
              {widget.title}
            </h3>
            
            {/* Valeur principale */}
            <p className="text-4xl font-extrabold text-white drop-shadow-lg mb-1">
              {widget.value}
            </p>
            
            {/* Description */}
            <p className="text-white/60 text-xs font-medium">
              {widget.description}
            </p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});

WidgetCard.displayName = 'WidgetCard';

/**
 * Composant Skeleton pour le loading
 * Mémorisé car statique
 */
const WidgetSkeleton = memo(() => (
  <Card className="p-6 border-0 shadow-lg">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-14 w-14 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  </Card>
));

WidgetSkeleton.displayName = 'WidgetSkeleton';

/**
 * Composant principal SchoolWidgets
 * Affiche les KPIs de l'école du Proviseur
 */
export const SchoolWidgets = () => {
  const { data: stats, isLoading, error } = useSchoolStats();
  
  // Vérifier les modules assignés (temps réel)
  const modulePermissions = useHasModulesRT([
    'finances',
    'classes',
    'personnel',
    'eleves'
  ]);

  // Mémoisation des widgets conditionnels
  const widgets = useMemo<WidgetConfig[]>(() => {
    if (!stats) return [];

    const baseWidgets: WidgetConfig[] = [
      {
        title: 'Mon École',
        value: stats.school?.name || '...',
        icon: Building2,
        color: 'from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f]',
        description: stats.school?.address || 'Établissement scolaire',
        link: '/user/school/info',
      },
    ];

    // Widget Personnel (conditionnel)
    if (modulePermissions.personnel) {
      baseWidgets.push({
        title: 'Personnel',
        value: stats.totalStaff,
        icon: Users,
        color: 'from-[#1D3557] via-[#152844] to-[#0d1f3d]',
        description: 'Membres actifs',
        link: '/user/staff',
        trend: {
          value: 5,
          isPositive: true,
        },
      });
    }

    // Widget Élèves (conditionnel)
    if (modulePermissions.eleves) {
      baseWidgets.push({
        title: 'Élèves',
        value: stats.totalStudents,
        icon: GraduationCap,
        color: 'from-purple-500 via-purple-600 to-purple-700',
        description: 'Inscrits cette année',
        link: '/user/students',
        trend: {
          value: 8,
          isPositive: true,
        },
      });
    }

    // Widget Classes (conditionnel)
    if (modulePermissions.classes) {
      baseWidgets.push({
        title: 'Classes',
        value: stats.totalClasses,
        icon: BookOpen,
        color: 'from-blue-500 via-blue-600 to-blue-700',
        description: 'Classes actives',
        link: '/user/classes',
      });
    }

    // Widget Finances (conditionnel)
    if (modulePermissions.finances) {
      baseWidgets.push({
        title: 'Revenus Mois',
        value: `${((stats.monthlyRevenue || 0) / 1000).toFixed(0)}K`,
        icon: DollarSign,
        color: 'from-green-500 via-green-600 to-green-700',
        description: 'FCFA ce mois',
        link: '/user/finances',
        trend: {
          value: 12,
          isPositive: true,
        },
      });
    }

    return baseWidgets;
  }, [stats, modulePermissions]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <WidgetSkeleton key={i} />
        ))}
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Card className="p-6 border-l-4 border-red-500 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">
              Erreur de chargement
            </h3>
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Une erreur est survenue'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Pas de données
  if (!stats) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Aucune donnée disponible</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {widgets.map((widget, index) => (
        <WidgetCard 
          key={widget.title} 
          widget={widget} 
          index={index}
        />
      ))}
    </div>
  );
};

// Export mémorisé du composant principal
export default memo(SchoolWidgets);
