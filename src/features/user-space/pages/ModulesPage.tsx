/**
 * Page Mes Modules - React 19 Best Practices
 * Interface moderne avec Suspense, Error Boundaries, etc.
 */

import { memo, Suspense, useEffect, startTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Settings, 
  MessageSquare, 
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import { useModules } from '../hooks/useModules';

// Types pour les catégories
const CATEGORIES = {
  pedagogique: { label: 'Pédagogique', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
  administratif: { label: 'Administratif', color: 'bg-purple-100 text-purple-800', icon: Settings },
  communication: { label: 'Communication', color: 'bg-green-100 text-green-800', icon: MessageSquare },
  evaluation: { label: 'Évaluation', color: 'bg-orange-100 text-orange-800', icon: ClipboardCheck },
} as const;

const STATUS_CONFIG = {
  active: { label: 'Actif', color: 'bg-green-500' },
  inactive: { label: 'Inactif', color: 'bg-gray-400' },
  maintenance: { label: 'Maintenance', color: 'bg-yellow-500' },
} as const;

// Composant de chargement moderne
const ModulesLoading = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
));

// Composant de carte de module optimisé
const ModuleCard = memo(({ module }: { module: any }) => {
  const category = CATEGORIES[module.category as keyof typeof CATEGORIES];
  const status = STATUS_CONFIG[module.status as keyof typeof STATUS_CONFIG];
  const IconComponent = category.icon;

  return (
    <Card className="group p-6 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
      {/* Header avec icône et statut */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color.replace('text-', 'bg-').replace('800', '500')} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {module.name}
            </h3>
            <Badge variant="outline" className={category.color}>
              {category.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
          <span className="text-xs text-gray-500">{status.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {module.description}
      </p>

      {/* Permissions */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Permissions :</p>
        <div className="flex flex-wrap gap-1">
          {module.permissions.slice(0, 3).map((permission: string) => (
            <Badge key={permission} variant="secondary" className="text-xs">
              {permission.replace('_', ' ')}
            </Badge>
          ))}
          {module.permissions.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{module.permissions.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Mis à jour le {module.lastUpdated.toLocaleDateString('fr-FR')}
        </span>
        <Button 
          size="sm" 
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={module.status === 'maintenance'}
        >
          {module.status === 'maintenance' ? 'Maintenance' : 'Ouvrir'}
        </Button>
      </div>
    </Card>
  );
});

// Composant principal
export const ModulesPage = memo(() => {
  const {
    modules,
    isLoading,
    error,
    selectedCategory,
    stats,
    loadModules,
    setSelectedCategory,
  } = useModules();

  // Chargement initial avec startTransition
  useEffect(() => {
    startTransition(() => {
      loadModules();
    });
  }, [loadModules]);

  // Gestion du rafraîchissement
  const handleRefresh = () => {
    startTransition(() => {
      loadModules();
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Modules</h1>
          <p className="text-gray-600">Gérez vos modules et fonctionnalités</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Actifs</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          <div className="text-sm text-gray-600">Maintenance</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(CATEGORIES).length}
          </div>
          <div className="text-sm text-gray-600">Catégories</div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Tous
          </Button>
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="gap-2"
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Liste des modules */}
      <Suspense fallback={<ModulesLoading />}>
        {isLoading ? (
          <ModulesLoading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </Suspense>

      {/* État vide */}
      {!isLoading && modules.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Aucun module trouvé</h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory 
              ? `Aucun module dans la catégorie "${CATEGORIES[selectedCategory as keyof typeof CATEGORIES]?.label}"`
              : "Aucun module disponible pour le moment"
            }
          </p>
          {selectedCategory && (
            <Button variant="outline" onClick={() => setSelectedCategory(null)}>
              Voir tous les modules
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

ModulesPage.displayName = 'ModulesPage';
