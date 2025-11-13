/**
 * Page Mes Modules - Admin Groupe
 * Affiche les modules disponibles selon l'abonnement du groupe
 */

import { useState, useMemo, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid3x3, List, Package, AlertCircle, Settings, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useAdminGroupModules, useAdminGroupModuleStats, useToggleGroupModule } from '../hooks/useAdminGroupModules';
import { useAdminGroupCategories, useAdminGroupCategoryStats } from '../hooks/useAdminGroupCategories';
import { useAuth } from '@/features/auth/store/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const MyModulesAdminGroup = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [isPending, startTransition] = useTransition();

  const { data: modules, isLoading: modulesLoading, error: modulesError } = useAdminGroupModules();
  const { data: categories, isLoading: categoriesLoading } = useAdminGroupCategories();
  const { data: moduleStats } = useAdminGroupModuleStats();
  const { data: categoryStats } = useAdminGroupCategoryStats();
  const { toggleModule } = useToggleGroupModule();

  // Filtrage avec useMemo pour optimisation
  const filteredModules = useMemo(() => {
    if (!modules) return [];

    return modules.filter((module) => {
      // Filtre recherche
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchName = module.name.toLowerCase().includes(searchLower);
        const matchDesc = module.description?.toLowerCase().includes(searchLower);
        if (!matchName && !matchDesc) return false;
      }

      // Filtre catégorie
      if (selectedCategory !== 'all' && module.category_id !== selectedCategory) {
        return false;
      }

      // Filtre statut
      if (statusFilter === 'enabled' && !module.is_enabled) return false;
      if (statusFilter === 'disabled' && module.is_enabled) return false;

      return true;
    });
  }, [modules, searchQuery, selectedCategory, statusFilter]);

  // Gestion recherche avec transition
  const handleSearch = (value: string) => {
    startTransition(() => {
      setSearchQuery(value);
    });
  };

  // Toggle module
  const handleToggleModule = async (moduleId: string, currentStatus: boolean) => {
    try {
      await toggleModule(moduleId, !currentStatus);
      
      // Invalider les caches pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['admin-group-modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-group-module-stats'] });
      
      toast.success(
        !currentStatus ? 'Module activé avec succès' : 'Module désactivé avec succès'
      );
    } catch (error) {
      console.error('Erreur toggle module:', error);
      toast.error('Erreur lors de la modification du module');
    }
  };

  // Loading state
  if (modulesLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des modules...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (modulesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">
              Impossible de charger les modules. Veuillez réessayer.
            </p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-[#2A9D8F]" />
            Modules & Catégories Disponibles
          </h1>
          <p className="text-gray-600 mt-1">
            Découvrez les modules pédagogiques accessibles avec votre plan d'abonnement
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Groupe : {user?.schoolGroupName}
            </Badge>
            {user?.subscription?.plan && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                Plan : {user.subscription.plan}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* Modules Disponibles */}
        <Card className="p-4 bg-gradient-to-br from-[#2A9D8F] to-[#238276] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Modules Disponibles</p>
              <p className="text-2xl font-bold">{moduleStats?.totalModules || 0}</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Catégories Métiers */}
        <Card className="p-4 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Catégories Métiers</p>
              <p className="text-2xl font-bold">{categoryStats?.totalCategories || 0}</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Filter className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Modules Actifs */}
        <Card className="p-4 bg-gradient-to-br from-[#10B981] to-[#059669] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Modules Actifs</p>
              <p className="text-2xl font-bold">{moduleStats?.enabledModules || 0}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">{moduleStats?.enabledPercentage || 0}%</span>
              </div>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Eye className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Modules Inactifs */}
        <Card className="p-4 bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Modules Inactifs</p>
              <p className="text-2xl font-bold">{moduleStats?.disabledModules || 0}</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <EyeOff className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre catégorie */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({category.module_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtre statut */}
          <Select value={statusFilter} onValueChange={setStatusFilter as any}>
            <SelectTrigger className="w-full md:w-[150px]">
              <Settings className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="enabled">Actifs</SelectItem>
              <SelectItem value="disabled">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle vue */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#2A9D8F]' : ''}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#2A9D8F]' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Résumé filtres */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          <span>
            {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé{filteredModules.length > 1 ? 's' : ''}
          </span>
          {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="h-6 px-2 text-xs"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      </Card>

      {/* Liste des modules */}
      {filteredModules.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun module trouvé
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun module disponible pour votre abonnement'}
            </p>
          </div>
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0"
                    style={{ backgroundColor: module.color || '#2A9D8F' }}
                  >
                    {module.icon || '📦'}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {module.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {module.is_core && (
                          <Badge variant="secondary">Core</Badge>
                        )}
                        <Switch
                          checked={module.is_enabled}
                          onCheckedChange={() => handleToggleModule(module.id, module.is_enabled)}
                          className="data-[state=checked]:bg-[#2A9D8F]"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {module.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Statut */}
                      <Badge
                        variant={module.is_enabled ? 'default' : 'secondary'}
                        className={module.is_enabled ? 'bg-green-500' : 'bg-gray-400'}
                      >
                        {module.is_enabled ? 'Actif' : 'Inactif'}
                      </Badge>

                      {/* Catégorie */}
                      {module.category && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: module.category.color,
                            color: module.category.color,
                          }}
                        >
                          {module.category.name}
                        </Badge>
                      )}

                      {/* Version */}
                      <Badge variant="secondary" className="text-xs">
                        v{module.version}
                      </Badge>

                      {/* Plan requis */}
                      {module.plan_required !== 'gratuit' && (
                        <Badge variant="outline" className="text-xs">
                          {module.plan_required}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Indicateur de transition */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2A9D8F]"></div>
          <span className="text-sm text-gray-600">Filtrage...</span>
        </div>
      )}
    </div>
  );
};
