/**
 * Page Mes Modules - Admin Groupe FINAL
 * Version ultra-simple sans erreurs TypeScript
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, AlertCircle, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export const MyModulesAdminGroupFinal = () => {
  const { user } = useAuth();
  
  const [modules, setModules] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    enabledModules: 0,
    disabledModules: 0,
    totalCategories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les données
  const loadData = async () => {
    if (!user?.schoolGroupId) {
      setError('Groupe scolaire non trouvé');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 [Admin Groupe Final] Chargement pour groupe:', user.schoolGroupId);

      // Requête SQL directe simplifiée
      const { data: rawData, error: queryError } = await supabase
        .rpc('get_admin_group_modules', { group_id: user.schoolGroupId });

      if (queryError) {
        // Fallback : requête manuelle
        console.log('📋 Fallback vers requête manuelle');
        
        const { data: groupModules, error: modulesError } = await supabase
          .from('group_module_configs')
          .select(`
            is_enabled,
            modules (
              id,
              name,
              slug,
              description,
              category_id,
              icon,
              color,
              version,
              status,
              is_core,
              business_categories (
                id,
                name,
                slug,
                icon,
                color
              )
            )
          `)
          .eq('school_group_id', user.schoolGroupId);

        if (modulesError) {
          throw modulesError;
        }

        // Traitement des données
        const modulesList = (groupModules || [])
          .filter((item: any) => item.modules && item.modules.status === 'active')
          .map((item: any) => ({
            id: item.modules.id,
            name: item.modules.name,
            slug: item.modules.slug,
            description: item.modules.description,
            category_id: item.modules.category_id,
            icon: item.modules.icon || '📦',
            color: item.modules.color || '#2A9D8F',
            version: item.modules.version || '1.0.0',
            status: item.modules.status,
            is_core: item.modules.is_core || false,
            is_enabled: item.is_enabled,
            category: item.modules.business_categories ? {
              id: item.modules.business_categories.id,
              name: item.modules.business_categories.name,
              slug: item.modules.business_categories.slug,
              icon: item.modules.business_categories.icon || '📂',
              color: item.modules.business_categories.color || '#6B7280',
            } : null,
          }));

        console.log('✅ Modules traités:', modulesList.length);

        // Calculer les stats
        const totalModules = modulesList.length;
        const enabledModules = modulesList.filter((m: any) => m.is_enabled).length;
        const disabledModules = totalModules - enabledModules;
        
        // Compter les catégories uniques
        const uniqueCategories = new Set();
        modulesList.forEach((m: any) => {
          if (m.category) {
            uniqueCategories.add(m.category.id);
          }
        });

        setModules(modulesList);
        setStats({
          totalModules,
          enabledModules,
          disabledModules,
          totalCategories: uniqueCategories.size,
        });

      } else {
        // Utiliser les données de la fonction
        setModules(rawData || []);
      }

    } catch (err: any) {
      console.error('❌ Erreur chargement:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle module
  const handleToggleModule = async (moduleId: string, currentStatus: boolean) => {
    if (!user?.schoolGroupId) return;

    try {
      const { error } = await supabase
        .from('group_module_configs')
        .update({ is_enabled: !currentStatus })
        .eq('school_group_id', user.schoolGroupId)
        .eq('module_id', moduleId);

      if (error) throw error;

      // Recharger les données
      await loadData();
      
      toast.success(
        !currentStatus ? 'Module activé avec succès' : 'Module désactivé avec succès'
      );
    } catch (error: any) {
      console.error('Erreur toggle module:', error);
      toast.error('Erreur lors de la modification du module');
    }
  };

  // Filtrage des modules
  const filteredModules = modules.filter((module: any) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchName = module.name?.toLowerCase().includes(searchLower);
      const matchDesc = module.description?.toLowerCase().includes(searchLower);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  // Charger au montage
  useEffect(() => {
    loadData();
  }, [user?.schoolGroupId]);

  // Loading state
  if (isLoading) {
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
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadData}>Réessayer</Button>
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
              Groupe : {user?.schoolGroupName || 'Groupe Scolaire'}
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-700">
              Plan : Pro
            </Badge>
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
              <p className="text-2xl font-bold">{stats.totalModules}</p>
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
              <p className="text-2xl font-bold">{stats.totalCategories}</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Modules Actifs */}
        <Card className="p-4 bg-gradient-to-br from-[#10B981] to-[#059669] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Modules Actifs</p>
              <p className="text-2xl font-bold">{stats.enabledModules}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">
                  {stats.totalModules > 0 ? Math.round((stats.enabledModules / stats.totalModules) * 100) : 0}%
                </span>
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
              <p className="text-2xl font-bold">{stats.disabledModules}</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <EyeOff className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recherche */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={loadData} variant="outline">
            Actualiser
          </Button>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé{filteredModules.length > 1 ? 's' : ''}
        </div>
      </Card>

      {/* Liste des modules */}
      {filteredModules.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {modules.length === 0 ? 'Aucun module disponible' : 'Aucun module trouvé'}
            </h3>
            <p className="text-gray-600 mb-4">
              {modules.length === 0 
                ? 'Vérifiez que votre groupe a un abonnement avec des modules assignés'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
            <Button onClick={loadData}>
              Actualiser
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module: any, index: number) => (
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
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
