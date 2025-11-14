/**
 * Interface Moderne pour les Modules du Proviseur
 * Design moderne avec animations simples et élégantes
 * @module MyModulesProviseurModern
 */

import { useState, useMemo, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Grid3x3, 
  List, 
  Settings,
  Star,
  Eye,
  Calendar,
  ChevronRight,
  Activity,
  Award,
  ArrowUpRight,
  Filter,
  MoreVertical,
  TrendingUp,
  School,
  BarChart3,
  Clock,
  MessageSquare,
  ClipboardList,
  Scale,
  FileText,
  TrendingUp as ChartUp,
  GraduationCap,
  Users,
  UserCheck,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/store/auth.store';
import { useProviseurModules, type ProviseurModule } from '@/hooks/useProviseurModules';

/**
 * Interface pour un module enrichi pour l'affichage
 */
interface ModuleEnrichi extends Omit<ProviseurModule, 'module_name' | 'module_slug' | 'module_description' | 'module_icon' | 'module_color'> {
  name: string;
  slug: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  isNew?: boolean;
  isPopular?: boolean;
}

/**
 * Interface pour les KPI
 */
interface KPIData {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  gradient: string;
}

export const MyModulesProviseurModern = () => {
  const { user } = useAuth();
  const { modules, stats, categories, isLoading, error, accessModule } = useProviseurModules();
  
  // États pour l'interface
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');

  /**
   * Modules enrichis avec métadonnées
   */
  const modulesEnrichis = useMemo((): ModuleEnrichi[] => {
    return modules.map(module => {
      const assignedDate = new Date(module.assigned_at);
      const isNew = Date.now() - assignedDate.getTime() < 7 * 24 * 60 * 60 * 1000;
      const isPopular = module.access_count > 20;

      return {
        id: module.id,
        name: module.module_name,
        slug: module.module_slug,
        category_name: module.category_name,
        access_count: module.access_count,
        assigned_at: module.assigned_at,
        description: module.module_description || getModuleDescription(module.module_slug),
        icon: module.module_icon || getModuleIcon(module.module_slug),
        color: module.category_color || getCategoryColor(module.category_name),
        isNew,
        isPopular,
      };
    });
  }, [modules]);

  /**
   * KPI Data
   */
  const kpiData = useMemo((): KPIData[] => {
    const totalModules = modulesEnrichis.length;
    const modulesUtilises = modulesEnrichis.filter(m => m.access_count > 0).length;
    const categoriesActives = categories.length;
    const totalViews = modulesEnrichis.reduce((sum, m) => sum + m.access_count, 0);

    return [
      {
        title: 'Modules Totaux',
        value: totalModules,
        change: '+2 ce mois',
        trend: 'up',
        icon: <Package className="w-6 h-6" />,
        color: 'text-blue-100',
        bgColor: 'bg-blue-500/20',
        gradient: 'from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]'
      },
      {
        title: 'Modules Actifs',
        value: modulesUtilises,
        change: `${Math.round((modulesUtilises / totalModules) * 100)}% d'usage`,
        trend: 'up',
        icon: <Activity className="w-6 h-6" />,
        color: 'text-emerald-100',
        bgColor: 'bg-emerald-500/20',
        gradient: 'from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]'
      },
      {
        title: 'Catégories',
        value: categoriesActives,
        change: 'Bien organisé',
        trend: 'neutral',
        icon: <Grid3x3 className="w-6 h-6" />,
        color: 'text-purple-100',
        bgColor: 'bg-purple-500/20',
        gradient: 'from-[#8B5CF6] via-[#A78BFA] to-[#7C3AED]'
      },
      {
        title: 'Vues Totales',
        value: totalViews,
        change: '+12% cette semaine',
        trend: 'up',
        icon: <Eye className="w-6 h-6" />,
        color: 'text-orange-100',
        bgColor: 'bg-orange-500/20',
        gradient: 'from-[#F59E0B] via-[#FBBF24] to-[#D97706]'
      }
    ];
  }, [modulesEnrichis, categories]);

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
    // Mettre à jour le compteur d'accès
    accessModule(module.id);
  }, [accessModule]);

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de vos modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 max-w-md mx-auto shadow-lg border-0">
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 mb-6">
              Impossible de charger vos modules. Veuillez réessayer.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Actualiser la page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Moderne */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Modules</h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <span>Bonjour {user?.firstName}</span>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                    Proviseur
                  </Badge>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-gray-50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards - Style Dashboard École */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, index) => {
            const isPositive = kpi.trend === 'up';
            const trendValue = kpi.trend === 'up' ? '+12.5' : kpi.trend === 'down' ? '-5.2' : '0';
            
            return (
              <div
                key={kpi.title}
                className={`group relative overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] text-left border border-white/10 cursor-pointer w-full h-full min-h-[180px] flex flex-col`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'slideInUp 0.5s ease-out forwards'
                }}
              >
                {/* Cercles décoratifs animés */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
                
                {/* Contenu */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${kpi.bgColor} backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`h-7 w-7 ${kpi.color} flex items-center justify-center`}>
                        {kpi.icon}
                      </div>
                    </div>
                    {kpi.trend !== 'neutral' && (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg">
                        {isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5 text-white/90" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-white/90 rotate-45" />
                        )}
                        <span className="text-xs font-bold text-white/90">
                          {trendValue}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">{kpi.title}</p>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="text-4xl font-extrabold text-white drop-shadow-lg leading-none">
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles Modernes */}
        <Card className="border-0 shadow-lg mb-8 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Rechercher un module ou une catégorie..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.modules_count})
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <option value="name">Alphabétique</option>
                  <option value="recent">Plus récents</option>
                  <option value="popular">Plus populaires</option>
                </select>

                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0 hover:bg-blue-50 transition-colors"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0 hover:bg-blue-50 transition-colors"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules Cards Modernes */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modulesFiltres.map((module, index) => (
              <Card 
                key={module.id}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white overflow-hidden"
                onClick={() => handleModuleClick(module)}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                <CardHeader className="pb-4 relative">
                  <div className="flex items-start justify-between">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      style={{ 
                        backgroundColor: `${module.color}15`,
                        border: `2px solid ${module.color}30`
                      }}
                    >
                      {module.icon || '📦'}
                    </div>
                    <div className="flex flex-col gap-2">
                      {module.isNew && (
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1 shadow-md animate-pulse">
                          <Star className="w-3 h-3 mr-1" />
                          Nouveau
                        </Badge>
                      )}
                      {module.isPopular && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1 shadow-md">
                          <Award className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                      {module.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {module.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className="text-xs font-medium hover:bg-gray-50 transition-colors"
                      style={{ 
                        borderColor: module.color, 
                        color: module.color,
                        backgroundColor: `${module.color}08`
                      }}
                    >
                      {module.category_name}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs font-medium">{module.access_count}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">
                          {new Date(module.assigned_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {modulesFiltres.map((module, index) => (
              <Card 
                key={module.id}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden"
                onClick={() => handleModuleClick(module)}
                style={{ 
                  animationDelay: `${index * 30}ms`,
                  animation: 'slideInLeft 0.5s ease-out forwards'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      style={{ 
                        backgroundColor: `${module.color}15`,
                        border: `2px solid ${module.color}30`
                      }}
                    >
                      {module.icon || '📦'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
                          {module.name}
                        </h3>
                        <div className="flex gap-2 ml-4">
                          {module.isNew && (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs animate-pulse">
                              Nouveau
                            </Badge>
                          )}
                          {module.isPopular && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Top
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-1">
                        {module.description}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <Badge 
                          variant="outline"
                          className="font-medium"
                          style={{ 
                            borderColor: module.color, 
                            color: module.color,
                            backgroundColor: `${module.color}08`
                          }}
                        >
                          {module.category_name}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">{module.access_count} vues</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(module.assigned_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-2 transition-all duration-200 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* État vide moderne */}
        {modulesFiltres.length === 0 && (
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Aucun module trouvé
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Aucun module ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Styles CSS pour les animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}} />
    </div>
  );
};

/**
 * Fonctions utilitaires
 */
function getModuleDescription(slug: string): string {
  const descriptions: Record<string, string> = {
    'gestion-classes': 'Gérez efficacement vos classes et élèves avec des outils modernes',
    'notes-evaluations': 'Système complet de notes et évaluations pédagogiques',
    'emplois-du-temps': 'Planning intelligent et gestion des horaires scolaires',
    'communication-notifications': 'Communication fluide avec les équipes éducatives',
    'suivi-absences': 'Suivi précis et automatisé des absences élèves',
    'discipline-sanctions': 'Gestion moderne de la discipline et des sanctions',
    'bulletins-scolaires': 'Création et édition de bulletins scolaires personnalisés',
    'rapports-pedagogiques': 'Rapports détaillés et analyses pédagogiques',
    'admission-eleves': 'Processus d\'admission et d\'inscription des élèves',
    'gestion-inscriptions': 'Gestion complète des inscriptions scolaires',
    'suivi-eleves': 'Suivi personnalisé du parcours de chaque élève',
    'gestion-utilisateurs': 'Administration des utilisateurs et permissions',
    'rapports-automatiques': 'Génération automatique de rapports personnalisés'
  };
  
  return descriptions[slug] || 'Module de gestion scolaire moderne et intuitif';
}

function getModuleIcon(slug: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    'gestion-classes': <School className="w-full h-full" />,
    'notes-evaluations': <BarChart3 className="w-full h-full" />,
    'emplois-du-temps': <Clock className="w-full h-full" />,
    'communication-notifications': <MessageSquare className="w-full h-full" />,
    'suivi-absences': <ClipboardList className="w-full h-full" />,
    'discipline-sanctions': <Scale className="w-full h-full" />,
    'bulletins-scolaires': <FileText className="w-full h-full" />,
    'rapports-pedagogiques': <ChartUp className="w-full h-full" />,
    'admission-eleves': <GraduationCap className="w-full h-full" />,
    'gestion-inscriptions': <Users className="w-full h-full" />,
    'suivi-eleves': <UserCheck className="w-full h-full" />,
    'gestion-utilisateurs': <Settings className="w-full h-full" />,
    'rapports-automatiques': <Bot className="w-full h-full" />
  };
  
  return icons[slug] || <Package className="w-full h-full" />;
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
  
  return colors[categoryName] || '#3B82F6';
}
