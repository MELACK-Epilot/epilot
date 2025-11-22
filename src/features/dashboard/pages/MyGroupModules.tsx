/**
 * Page "Mes Modules" pour Admin de Groupe - VERSION AMÉLIORÉE
 * Design moderne inspiré de la page Utilisateurs
 * @module MyGroupModules
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Layers,
  TrendingUp,
  AlertCircle,
  Loader2,
  Home,
  ChevronRight,
  Search,
  Grid3x3,
  List,
  Filter,
  X,
  CheckCircle2,
  Building2,
  GraduationCap,
  Rocket,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUserGroup } from '../hooks/useCurrentUserGroup';
import { useSchoolGroupModules, useSchoolGroupCategories } from '../hooks/useSchoolGroupModules';
import { SchoolGroupModulesDialog } from '../components/school-groups/SchoolGroupModulesDialog';
import { PlanUpgradeRequestDialog } from '../components/plans/PlanUpgradeRequestDialog';
import { ModuleDetailsDialog } from '../components/modules/ModuleDetailsDialog';
import type { ModuleWithCategory } from '../hooks/useSchoolGroupModules';

/**
 * Badge de plan avec couleur
 */
const PlanBadge = ({ plan }: { plan: string }) => {
  const colors: Record<string, string> = {
    gratuit: 'bg-gray-100 text-gray-700 border-gray-300',
    premium: 'bg-blue-100 text-blue-700 border-blue-300',
    pro: 'bg-purple-100 text-purple-700 border-purple-300',
    institutionnel: 'bg-amber-100 text-amber-700 border-amber-300',
  };

  const labels: Record<string, string> = {
    gratuit: 'Gratuit',
    premium: 'Premium',
    pro: 'Pro',
    institutionnel: 'Institutionnel',
  };

  return (
    <Badge variant="outline" className={`${colors[plan] || colors.gratuit} font-medium text-sm`}>
      {labels[plan] || plan}
    </Badge>
  );
};

/**
 * Stats Card avec animation
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  badge,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: any;
  gradient: string;
  badge?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className={`p-6 bg-gradient-to-br ${gradient} border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group`}>
        {/* Cercle décoratif */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="h-6 w-6 text-white" />
            </div>
            {badge && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {badge}
              </Badge>
            )}
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          <p className="text-sm text-white/80">{title}</p>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Module Card pour vue grille
 */
const ModuleCard = ({ 
  module, 
  index, 
  onDetails,
  onLaunch 
}: { 
  module: ModuleWithCategory; 
  index: number; 
  onDetails: () => void;
  onLaunch: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group h-full"
    >
      <Card className="p-5 hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-[#2A9D8F] bg-white h-full flex flex-col relative overflow-hidden">
        {/* Background hover effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header avec icône */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300"
              style={{
                backgroundColor: module.category?.color ? `${module.category.color}20` : '#E5E7EB',
              }}
            >
              <Package
                className="h-7 w-7"
                style={{
                  color: module.category?.color || '#6B7280',
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 truncate text-lg">{module.name}</h4>
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              </div>
              <Badge variant="outline" className="bg-white/80 backdrop-blur text-xs border-gray-200">
                {module.category?.name || 'Sans catégorie'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-1">{module.description}</p>

          {/* Actions Footer */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDetails}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Info className="h-4 w-4 mr-2" />
              Détails
            </Button>
            <Button 
              size="sm" 
              onClick={onLaunch}
              className="bg-[#2A9D8F] hover:bg-[#238276] text-white shadow-sm group-hover:shadow-md transition-all"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Lancer
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Module Row pour vue liste
 */
const ModuleRow = ({ 
  module, 
  index, 
  onDetails,
  onLaunch 
}: { 
  module: ModuleWithCategory; 
  index: number; 
  onDetails: () => void;
  onLaunch: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group"
    >
      <Card className="p-4 hover:shadow-md transition-all duration-200 border-gray-200 hover:border-[#2A9D8F] bg-white">
        <div className="flex items-center gap-4">
          {/* Icône */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
              backgroundColor: module.category?.color ? `${module.category.color}20` : '#E5E7EB',
            }}
          >
            <Package
              className="h-5 w-5"
              style={{
                color: module.category?.color || '#6B7280',
              }}
            />
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{module.name}</h4>
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
            <p className="text-sm text-gray-600 line-clamp-1">{module.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <PlanBadge plan={(module as any).required_plan || 'gratuit'} />
            <div className="h-8 w-px bg-gray-200 mx-2" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDetails}
              className="text-gray-500 hover:text-gray-900"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={onLaunch}
              className="bg-[#2A9D8F] hover:bg-[#238276] text-white"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Lancer
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Page principale - Mes Modules (VERSION AMÉLIORÉE)
 */
export const MyGroupModules = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<ModuleWithCategory | null>(null);

  // Récupérer le groupe de l'utilisateur connecté
  const { data: currentGroup, isLoading: groupLoading, error: groupError } = useCurrentUserGroup();

  // Récupérer les modules et catégories disponibles
  const { data: modulesData, isLoading: modulesLoading } = useSchoolGroupModules(currentGroup?.id);
  const { data: categoriesData, isLoading: categoriesLoading } = useSchoolGroupCategories(currentGroup?.id);

  const isLoading = groupLoading || modulesLoading || categoriesLoading;

  // Récupérer le plan dynamique depuis modulesData
  const dynamicPlan = (modulesData?.schoolGroup as any)?.school_group_subscriptions?.[0]?.subscription_plans?.slug || currentGroup?.plan;

  // Filtrer les modules
  const filteredModules = useMemo(() => {
    if (!modulesData?.availableModules) return [];

    let filtered = modulesData.availableModules;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (module) =>
          module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((module) => module.category?.id === categoryFilter);
    }

    return filtered;
  }, [modulesData, searchQuery, categoryFilter]);

  const handleLaunchModule = (module: ModuleWithCategory) => {
    // Navigation vers le module (convention de nommage standard)
    navigate(`/dashboard/modules/${module.slug}`);
  };

  // Gestion des erreurs
  if (groupError) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Erreur de chargement</h3>
                <p className="text-sm text-red-700">
                  {groupError instanceof Error ? groupError.message : 'Impossible de charger vos informations'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Mes Modules</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1D3557] mb-2">
            Modules & Catégories Disponibles
          </h1>
          <p className="text-gray-600">
            Découvrez les modules pédagogiques accessibles avec votre plan d'abonnement
          </p>
        </div>
      </div>

      {/* Loading State - Groupe uniquement */}
      {groupLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-[#2A9D8F] animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Chargement de vos informations...</p>
          </div>
        </div>
      )}

      {/* Content - Afficher progressivement */}
      {!groupLoading && currentGroup && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modulesLoading ? (
              <Card className="p-6 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </Card>
            ) : (
              <StatsCard
                title="Modules Disponibles"
                value={modulesData?.totalModules || 0}
                icon={Package}
                gradient="from-[#2A9D8F] to-[#1d7a6f]"
                badge="Actifs"
                delay={0.1}
              />
            )}
            {categoriesLoading ? (
              <Card className="p-6 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </Card>
            ) : (
              <StatsCard
                title="Catégories Métiers"
                value={categoriesData?.totalCategories || 0}
                icon={Layers}
                gradient="from-purple-600 to-purple-700"
                badge="Métiers"
                delay={0.2}
              />
            )}
            <StatsCard
              title="Écoles du Réseau"
              value={currentGroup.schoolCount}
              icon={Building2}
              gradient="from-[#1D3557] to-[#0d1f3d]"
              badge="Réseau"
              delay={0.3}
            />
            <StatsCard
              title="Élèves Inscrits"
              value={currentGroup.studentCount.toLocaleString()}
              icon={GraduationCap}
              gradient="from-[#E9C46A] to-[#d4a849]"
              badge="Total"
              delay={0.4}
            />
          </div>

          {/* Quick Actions Dock - "Opérations Fréquentes" (DYNAMIQUE) */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Accès Rapide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Logique de sélection dynamique des modules favoris */}
              {(() => {
                // 1. Définir les modules prioritaires à afficher s'ils sont disponibles
                const prioritySlugs = ['gestion-inscriptions', 'finances', 'users', 'personnel'];
                
                // 2. Trouver les modules correspondants dans la liste des modules disponibles
                const quickAccessModules = prioritySlugs
                  .map(slug => modulesData?.availableModules?.find(m => m.slug === slug))
                  .filter(Boolean) as ModuleWithCategory[];

                // 3. Si on a moins de 4 modules, compléter avec d'autres modules disponibles
                if (quickAccessModules.length < 4 && modulesData?.availableModules) {
                  const otherModules = modulesData.availableModules
                    .filter(m => !prioritySlugs.includes(m.slug))
                    .slice(0, 4 - quickAccessModules.length);
                  quickAccessModules.push(...otherModules);
                }

                // 4. Si aucun module n'est disponible (cas rare), afficher un message ou vide
                if (quickAccessModules.length === 0) {
                  return (
                    <div className="col-span-4 text-center text-sm text-gray-400 py-2">
                      Aucun module disponible pour l'accès rapide
                    </div>
                  );
                }

                // 5. Afficher les modules
                return quickAccessModules.map((module) => (
                  <Button
                    key={module.id}
                    variant="ghost"
                    className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                    onClick={() => handleLaunchModule(module)}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: module.category?.color ? `${module.category.color}15` : '#F3F4F6',
                      }}
                    >
                      <Package 
                        className="h-5 w-5" 
                        style={{
                          color: module.category?.color || '#6B7280',
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate w-full text-center">
                      {module.name}
                    </span>
                  </Button>
                ));
              })()}
            </div>
          </div>

          {/* Info Card Groupe */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {currentGroup.logo ? (
                  <img
                    src={currentGroup.logo}
                    alt={currentGroup.name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {currentGroup.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {currentGroup.name}
                  </h2>
                  <p className="text-sm text-gray-600 mb-2">
                    Code : {currentGroup.code} • {currentGroup.region}, {currentGroup.city}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 font-medium">Plan actuel :</span>
                    <PlanBadge plan={dynamicPlan} />
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsUpgradeDialogOpen(true)}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Mettre à niveau
              </Button>
            </div>
          </Card>

          {/* Filtres et Vue */}
          <div className="flex items-center justify-between gap-4">
            {/* Recherche */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtre Catégorie */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categoriesData?.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle Vue */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Bouton Voir Tout */}
            <Button onClick={() => setIsDialogOpen(true)} className="bg-[#2A9D8F] hover:bg-[#238276] text-white">
              <Package className="h-4 w-4 mr-2" />
              Voir tous les détails
            </Button>
          </div>

          {/* Résultats */}
          <div>
            {modulesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-[#2A9D8F] animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Chargement des modules...</p>
                </div>
              </div>
            ) : (modulesData as any)?.error ? (
              // Afficher un message d'erreur clair
              <Card className="p-8 border-amber-200 bg-amber-50">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {(modulesData as any).error === 'NO_ACTIVE_SUBSCRIPTION' 
                      ? 'Aucun abonnement actif'
                      : 'Aucun module disponible'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {(modulesData as any).message}
                  </p>
                  
                  {(modulesData as any).error === 'NO_ACTIVE_SUBSCRIPTION' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">
                        Pour accéder aux modules, vous devez avoir un abonnement actif.
                      </p>
                      <Button
                        onClick={() => setIsUpgradeDialogOpen(true)}
                        className="bg-[#2A9D8F] hover:bg-[#238276] text-white"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Souscrire à un plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">
                        Le plan actuel n'a pas encore de modules assignés. Contactez le Super Admin pour configurer votre plan.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => window.location.reload()}
                          variant="outline"
                        >
                          Actualiser
                        </Button>
                        <Button
                          onClick={() => setIsUpgradeDialogOpen(true)}
                          className="bg-[#2A9D8F] hover:bg-[#238276] text-white"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Changer de plan
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé{filteredModules.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Vue Grille */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredModules.map((module, index) => (
                        <ModuleCard 
                          key={module.id} 
                          module={module} 
                          index={index} 
                          onDetails={() => setSelectedModule(module)}
                          onLaunch={() => handleLaunchModule(module)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Vue Liste */}
                {viewMode === 'list' && (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredModules.map((module, index) => (
                        <ModuleRow 
                          key={module.id} 
                          module={module} 
                          index={index} 
                          onDetails={() => setSelectedModule(module)}
                          onLaunch={() => handleLaunchModule(module)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}

            {/* Aucun résultat */}
            {filteredModules.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun module trouvé</h3>
                <p className="text-gray-600 mb-4">
                  Essayez de modifier vos critères de recherche
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>

          {/* Dialog Modules & Catégories */}
          <SchoolGroupModulesDialog
            schoolGroup={currentGroup ? {
              id: currentGroup.id,
              name: currentGroup.name,
              code: currentGroup.code,
              plan: currentGroup.plan,
              status: currentGroup.status,
              logo: currentGroup.logo,
              region: currentGroup.region,
              city: currentGroup.city,
              adminName: '',
              adminEmail: '',
              adminId: '',
              schoolCount: currentGroup.schoolCount,
              studentCount: currentGroup.studentCount,
              staffCount: currentGroup.staffCount,
              createdAt: '',
              updatedAt: '',
            } : null}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onUpgrade={() => setIsUpgradeDialogOpen(true)}
          />

          {/* Nouveau Dialog Détails Module */}
          <ModuleDetailsDialog
            module={selectedModule}
            schoolGroupId={currentGroup.id}
            isOpen={!!selectedModule}
            onClose={() => setSelectedModule(null)}
          />

          {/* Dialog Demande d'upgrade */}
          {currentGroup && (
            <PlanUpgradeRequestDialog
              currentPlan={{
                id: currentGroup.id,
                name: dynamicPlan.charAt(0).toUpperCase() + dynamicPlan.slice(1),
                slug: dynamicPlan,
                price: 50000, // Prix par défaut, sera récupéré depuis la BDD
              }}
              isOpen={isUpgradeDialogOpen}
              onClose={() => setIsUpgradeDialogOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MyGroupModules;
