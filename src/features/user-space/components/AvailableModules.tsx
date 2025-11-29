/**
 * Composant pour afficher les modules disponibles pour le groupe
 * Récupérés depuis group_module_configs
 * React 19 Best Practices
 * 
 * @module AvailableModules
 */

import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/providers/PermissionsProvider';
import { getLucideIcon } from '@/features/dashboard/utils/iconMapper';
import type { AssignedModule } from '@/stores/permissions.store';


/**
 * Composant carte module individuelle
 * Mémorisé pour performance
 */
const ModuleCard = memo(({ 
  module, 
  index 
}: { 
  module: AssignedModule; 
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <Link to={`/user/modules/${module.slug}`}>
        <Card className="group relative p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#2A9D8F] overflow-hidden">
          {/* Badge Core (si applicable) */}
          {module.isCore && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Core
              </Badge>
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* Icône du module */}
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${module.color}15, ${module.color}30)`,
                border: `2px solid ${module.color}40`
              }}
            >
              {getLucideIcon(module.icon, { 
                className: "h-7 w-7", 
                style: { color: module.color } 
              })}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Nom du module */}
              <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-[#2A9D8F] transition-colors">
                {module.name}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {module.description}
              </p>
              
              {/* Badge catégorie */}
              {module.categoryName && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs font-medium truncate text-gray-500">
                    {module.categoryName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </Card>
      </Link>
    </motion.div>
  );
});

ModuleCard.displayName = 'ModuleCard';

/**
 * Composant Skeleton pour le loading
 */
const ModuleSkeleton = memo(() => (
  <Card className="p-4">
    <div className="flex items-start gap-3">
      <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </Card>
));

ModuleSkeleton.displayName = 'ModuleSkeleton';

/**
 * État vide avec animation
 */
const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="relative inline-block">
      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-gray-200 rounded-full blur-xl"
      />
    </div>
    <p className="text-gray-600 font-medium mb-2">
      Aucun module assigné
    </p>
    <p className="text-sm text-gray-500">
      Contactez votre administrateur de groupe pour vous assigner des modules
    </p>
  </motion.div>
));

EmptyState.displayName = 'EmptyState';

/**
 * Composant principal AvailableModules
 * Utilise le Context temps réel pour les modules
 */
export const AvailableModules = () => {
  const { modules, isLoading, error } = usePermissions();

  // Groupement des modules par catégorie (mémorisé)
  const modulesByCategory = useMemo(() => {
    if (!modules) return new Map();

    const grouped = new Map<string, AssignedModule[]>();
    
    modules.forEach(module => {
      const categoryName = module.categoryName || 'Autres';
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)?.push(module);
    });

    return grouped;
  }, [modules]);

  // État de chargement
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ModuleSkeleton key={i} />
          ))}
        </div>
      </Card>
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
              Erreur de chargement des modules
            </h3>
            <p className="text-sm text-red-700">
              {typeof error === 'string' ? error : 'Une erreur est survenue'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
            <Package className="h-6 w-6 text-[#2A9D8F]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Mes Modules
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {modules?.length || 0} module{(modules?.length || 0) > 1 ? 's' : ''} assigné{(modules?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Badge compteur */}
        {modules && modules.length > 0 && (
          <Badge 
            variant="secondary" 
            className="bg-[#2A9D8F] text-white text-lg px-4 py-2"
          >
            {modules.length}
          </Badge>
        )}
      </div>

      {/* Liste des modules */}
      <AnimatePresence mode="wait">
        {!modules || modules.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {modules.map((module, index) => (
              <ModuleCard 
                key={module.id || index} 
                module={module} 
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Export mémorisé
export default memo(AvailableModules);
