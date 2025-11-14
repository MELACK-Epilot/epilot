/**
 * Interface Légère pour les Modules du Proviseur
 * Design minimaliste, ultra-rapide, légère comme une feuille sèche
 * @module MyModulesProviseurLight
 */

import { useState, useMemo, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Grid3x3, 
  List, 
  TrendingUp,
  Settings,
  Star,
  Eye,
  Calendar,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/store/auth.store';
import { useAssignmentSimple } from '@/hooks/useAssignmentSimple';

/**
 * Interface pour un module enrichi
 */
interface ModuleEnrichi {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  access_count: number;
  assigned_at: string;
  description?: string;
  icon?: string;
  color?: string;
  isNew?: boolean;
  isPopular?: boolean;
}

/**
 * Interface pour les statistiques
 */
interface StatsProviseur {
  totalModules: number;
  modulesUtilises: number;
  categoriesActives: number;
  modulePopulaire: string;
}

export const MyModulesProviseurLight = () => {
  const { user } = useAuth();
  const { users, isLoading, error } = useAssignmentSimple();
  
  // États pour l'interface
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');

  /**
   * Données du proviseur
   */
  const proviseurData = useMemo(() => {
    return users.find(u => u.id === user?.id);
  }, [users, user?.id]);

  /**
   * Modules enrichis avec métadonnées
   */
  const modulesEnrichis = useMemo((): ModuleEnrichi[] => {
    if (!proviseurData?.assignedModules) return [];

    return proviseurData.assignedModules.map(module => {
      const assignedDate = new Date(module.assigned_at);
      const isNew = Date.now() - assignedDate.getTime() < 7 * 24 * 60 * 60 * 1000;
      const accessCount = (module as any).access_count || 0;
      const isPopular = accessCount > 10;

      return {
        id: module.id,
        name: module.module_name,
        slug: module.module_slug,
        category_name: module.category_name,
        access_count: accessCount,
        assigned_at: module.assigned_at,
        description: getModuleDescription(module.module_slug),
        icon: getModuleIcon(module.module_slug),
        color: getCategoryColor(module.category_name),
        isNew,
        isPopular,
      };
    });
  }, [proviseurData?.assignedModules]);

  /**
   * Catégories avec compteurs
   */
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { name: string; count: number; color: string }>();
    
    modulesEnrichis.forEach(module => {
      const existing = categoryMap.get(module.category_name);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(module.category_name, {
          name: module.category_name,
          count: 1,
          color: module.color || '#2A9D8F'
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
  }, [modulesEnrichis]);

  /**
   * Modules filtrés
   */
  const modulesFiltres = useMemo(() => {
    let filtered = modulesEnrichis;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category_name === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.category_name.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
        case 'popular':
          return b.access_count - a.access_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [modulesEnrichis, selectedCategory, searchQuery, sortBy]);

  /**
   * Statistiques calculées
   */
  const stats = useMemo((): StatsProviseur => {
    const totalModules = modulesEnrichis.length;
    const modulesUtilises = modulesEnrichis.filter(m => m.access_count > 0).length;
    const categoriesActives = categories.length;
    
    const modulePopulaire = modulesEnrichis.length > 0 
      ? modulesEnrichis.reduce((prev, current) => 
          prev.access_count > current.access_count ? prev : current
        ).name
      : 'Aucun module';

    return {
      totalModules,
      modulesUtilises,
      categoriesActives,
      modulePopulaire,
    };
  }, [modulesEnrichis, categories]);

  /**
   * Gestion de la recherche
   */
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  /**
   * Accès à un module
   */
  const handleModuleClick = useCallback((module: ModuleEnrichi) => {
    console.log(`🚀 Accès au module: ${module.name}`);
  }, []);

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-6 max-w-md mx-auto shadow-sm">
          <CardContent className="text-center">
            <Package className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 mb-4">
              Impossible de charger vos modules.
            </p>
            <Button onClick={() => window.location.reload()} size="sm">
              Actualiser
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Simple */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mes Modules</h1>
                <p className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                {stats.totalModules} modules
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistiques Simples */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-semibold text-blue-600">{stats.totalModules}</p>
                </div>
                <Package className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisés</p>
                  <p className="text-2xl font-semibold text-green-600">{stats.modulesUtilises}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Catégories</p>
                  <p className="text-2xl font-semibold text-purple-600">{stats.categoriesActives}</p>
                </div>
                <Grid3x3 className="w-6 h-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Populaire</p>
                  <p className="text-sm font-medium text-orange-600 truncate">{stats.modulePopulaire}</p>
                </div>
                <Star className="w-6 h-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contrôles Simples */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un module..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Alphabétique</option>
                  <option value="recent">Plus récents</option>
                  <option value="popular">Plus populaires</option>
                </select>

                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modulesFiltres.map((module) => (
              <Card 
                key={module.id}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 shadow-sm"
                onClick={() => handleModuleClick(module)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      {module.icon || '📦'}
                    </div>
                    <div className="flex gap-1">
                      {module.isNew && (
                        <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                          Nouveau
                        </Badge>
                      )}
                      {module.isPopular && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
                          <Star className="w-3 h-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <h3 className="font-semibold text-base mb-2 line-clamp-2">
                    {module.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {module.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: module.color, color: module.color }}
                    >
                      {module.category_name}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{module.access_count}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(module.assigned_at).toLocaleDateString()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {modulesFiltres.map((module) => (
              <Card 
                key={module.id}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 shadow-sm"
                onClick={() => handleModuleClick(module)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      {module.icon || '📦'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {module.name}
                        </h3>
                        <div className="flex gap-1 ml-2">
                          {module.isNew && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Nouveau
                            </Badge>
                          )}
                          {module.isPopular && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Top
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                        {module.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <Badge 
                          variant="outline"
                          style={{ borderColor: module.color, color: module.color }}
                        >
                          {module.category_name}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-4 h-4" />
                          <span>{module.access_count} vues</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(module.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* État vide */}
        {modulesFiltres.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun module trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Fonctions utilitaires
 */
function getModuleDescription(slug: string): string {
  const descriptions: Record<string, string> = {
    'gestion-classes': 'Gérez vos classes et élèves',
    'notes-evaluations': 'Notes et évaluations',
    'emplois-du-temps': 'Planning et horaires',
    'communication-notifications': 'Communication équipes',
    'suivi-absences': 'Suivi des absences',
    'discipline-sanctions': 'Gestion discipline',
    'bulletins-scolaires': 'Bulletins scolaires',
    'rapports-pedagogiques': 'Rapports pédagogiques',
    'admission-eleves': 'Admissions élèves',
    'gestion-inscriptions': 'Inscriptions scolaires',
    'suivi-eleves': 'Suivi des élèves',
    'gestion-utilisateurs': 'Gestion utilisateurs',
    'rapports-automatiques': 'Rapports automatisés'
  };
  
  return descriptions[slug] || 'Module de gestion scolaire';
}

function getModuleIcon(slug: string): string {
  const icons: Record<string, string> = {
    'gestion-classes': '🏫',
    'notes-evaluations': '📊',
    'emplois-du-temps': '📅',
    'communication-notifications': '💬',
    'suivi-absences': '📋',
    'discipline-sanctions': '⚖️',
    'bulletins-scolaires': '📄',
    'rapports-pedagogiques': '📈',
    'admission-eleves': '🎓',
    'gestion-inscriptions': '📝',
    'suivi-eleves': '👥',
    'gestion-utilisateurs': '👤',
    'rapports-automatiques': '🤖'
  };
  
  return icons[slug] || '📦';
}

function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    'Pédagogie & Évaluations': '#3B82F6',
    'Scolarité & Admissions': '#10B981',
    'Vie Scolaire & Discipline': '#F59E0B',
    'Sécurité & Accès': '#EF4444',
    'Documents & Rapports': '#8B5CF6',
    'Communication': '#06B6D4',
    'Finances & Comptabilité': '#84CC16',
    'Ressources Humaines': '#F97316',
    'Services & Infrastructures': '#6366F1'
  };
  
  return colors[categoryName] || '#2A9D8F';
}
