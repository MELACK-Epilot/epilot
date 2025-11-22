/**
 * Dialog pour afficher les modules disponibles d'un groupe scolaire
 * Affectation automatique basée sur le plan d'abonnement
 * @module SchoolGroupModulesDialog
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Package, CheckCircle2, Layers, TrendingUp, Search, Rocket, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSchoolGroupModules, useSchoolGroupCategories } from '../../hooks/useSchoolGroupModules';
import type { SchoolGroup } from '../../types/dashboard.types';

interface SchoolGroupModulesDialogProps {
  schoolGroup: SchoolGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

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

  return (
    <Badge variant="outline" className={`${colors[plan] || colors.gratuit} font-medium text-xs px-2 py-0.5 h-5`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
};

/**
 * Dialog des modules d'un groupe scolaire - Version Améliorée
 */
export const SchoolGroupModulesDialog = ({
  schoolGroup,
  isOpen,
  onClose,
  onUpgrade,
}: SchoolGroupModulesDialogProps) => {
  const navigate = useNavigate();
  const { data: modulesData, isLoading: modulesLoading } = useSchoolGroupModules(schoolGroup?.id);
  const { data: categoriesData, isLoading: categoriesLoading } = useSchoolGroupCategories(schoolGroup?.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    if (!modulesData?.availableModules) return {};
    
    const grouped: Record<string, any[]> = {};
    
    modulesData.availableModules.forEach((module) => {
      // Filter by search
      if (searchQuery && !module.name.toLowerCase().includes(searchQuery.toLowerCase()) && !module.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      const categoryName = module.category?.name || 'Autres';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(module);
    });
    
    return grouped;
  }, [modulesData, searchQuery]);

  const handleLaunchModule = (slug: string) => {
    onClose();
    navigate(`/dashboard/modules/${slug}`);
  };

  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Fallback si onUpgrade n'est pas fourni
      navigate('/dashboard/plans');
    }
  };

  if (!schoolGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header with Gradient */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#1D3557] to-[#2A9D8F] text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Package className="h-6 w-6" />
                Catalogue des Ressources
              </DialogTitle>
              <div className="flex items-center gap-3 text-sm text-blue-100">
                <span className="font-medium bg-white/10 px-2 py-1 rounded">{schoolGroup.name}</span>
                <span className="text-white/60">•</span>
                <div className="flex items-center gap-2">
                  <span>Plan Actif :</span>
                  <Badge className="bg-white text-[#1D3557] hover:bg-white/90 border-0">
                    {schoolGroup.plan.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
          <Tabs defaultValue="modules" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 pb-0 bg-white border-b border-gray-100 flex items-center justify-between gap-4">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="modules" className="gap-2">
                  <Package className="h-4 w-4" />
                  Modules ({modulesData?.totalModules || 0})
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2">
                  <Layers className="h-4 w-4" />
                  Catégories ({categoriesData?.totalCategories || 0})
                </TabsTrigger>
              </TabsList>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-9 h-9 bg-gray-50 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tab: Modules Grouped by Category */}
            <TabsContent value="modules" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {modulesLoading ? (
                     <div className="space-y-4">
                       {[1, 2, 3].map((i) => (
                         <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
                       ))}
                     </div>
                  ) : Object.keys(modulesByCategory).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(modulesByCategory).map(([category, modules]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
                            <Layers className="h-4 w-4" />
                            {category}
                            <Badge variant="secondary" className="ml-2 text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                              {modules.length}
                            </Badge>
                          </h3>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {modules.map((module, index) => (
                              <motion.div
                                key={module.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-[#2A9D8F] hover:shadow-md transition-all duration-200 relative overflow-hidden"
                              >
                                {/* Hover highlight */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2A9D8F] opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-4">
                                  {/* Icon */}
                                  <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                                    style={{
                                      backgroundColor: module.category?.color
                                        ? `${module.category.color}15`
                                        : '#F3F4F6',
                                    }}
                                  >
                                    <Package
                                      className="h-6 w-6"
                                      style={{
                                        color: module.category?.color || '#6B7280',
                                      }}
                                    />
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900 text-base">{module.name}</h4>
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1 mb-1.5">{module.description}</p>
                                    <div className="flex items-center gap-3">
                                      <PlanBadge plan={(module as any).required_plan || 'gratuit'} />
                                      <span className="text-xs text-gray-400">v{module.version}</span>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {/* <Button variant="ghost" size="sm" className="text-gray-500">
                                      <Info className="h-4 w-4" />
                                    </Button> */}
                                    <Button 
                                      onClick={() => handleLaunchModule(module.slug)}
                                      className="bg-[#2A9D8F] hover:bg-[#238276] text-white shadow-sm gap-2"
                                      size="sm"
                                    >
                                      <Rocket className="h-4 w-4" />
                                      Lancer
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Aucun module trouvé</h3>
                      <p className="text-gray-500">Essayez de modifier votre recherche</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Catégories */}
            <TabsContent value="categories" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoriesLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
                    ))
                  ) : (
                    categoriesData?.categories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#2A9D8F] hover:shadow-md transition-all cursor-default group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                            style={{
                              backgroundColor: category.color ? `${category.color}15` : '#F3F4F6',
                            }}
                          >
                            <Layers
                              className="h-6 w-6"
                              style={{
                                color: category.color || '#6B7280',
                              }}
                            />
                          </div>
                          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">
                            {category.availableModulesCount} modules
                          </Badge>
                        </div>
                        
                        <h4 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-[#2A9D8F] transition-colors">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                          {category.description}
                        </p>

                        {/* Mini module pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {category.availableModules?.slice(0, 3).map((m: any) => (
                            <span 
                              key={m.id} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100"
                            >
                              {m.name}
                            </span>
                          ))}
                          {(category.availableModules?.length || 0) > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-100">
                              +{(category.availableModules?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-900">Besoin de plus de puissance ?</h4>
                <p className="text-xs text-purple-700">Débloquez des modules avancés avec nos plans supérieurs</p>
              </div>
            </div>
            <Button 
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              onClick={handleUpgrade}
            >
              Voir les offres
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
