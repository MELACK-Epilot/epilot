/**
 * Dialog pour afficher les modules disponibles d'un groupe scolaire
 * Affectation automatique basée sur le plan d'abonnement
 * @module SchoolGroupModulesDialog
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Package, CheckCircle2, Layers, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchoolGroupModules, useSchoolGroupCategories } from '../../hooks/useSchoolGroupModules';
import type { SchoolGroup } from '../../types/dashboard.types';

interface SchoolGroupModulesDialogProps {
  schoolGroup: SchoolGroup | null;
  isOpen: boolean;
  onClose: () => void;
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
    <Badge variant="outline" className={`${colors[plan] || colors.gratuit} font-medium`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
};

/**
 * Dialog des modules d'un groupe scolaire
 */
export const SchoolGroupModulesDialog = ({
  schoolGroup,
  isOpen,
  onClose,
}: SchoolGroupModulesDialogProps) => {
  const navigate = useNavigate();
  const { data: modulesData, isLoading: modulesLoading } = useSchoolGroupModules(schoolGroup?.id);
  const { data: categoriesData, isLoading: categoriesLoading } = useSchoolGroupCategories(schoolGroup?.id);

  if (!schoolGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-[#1D3557] mb-2">
                Modules & Catégories
              </DialogTitle>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">{schoolGroup.name}</span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-2">
                  <span>Plan :</span>
                  <PlanBadge plan={schoolGroup.plan} />
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Info Badge */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">
              Affectation automatique par plan
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Les modules sont automatiquement disponibles selon le plan d'abonnement du groupe.
              Pour accéder à plus de modules, mettez à niveau le plan.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="modules" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Modules ({modulesData?.totalModules || 0})
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Catégories ({categoriesData?.totalCategories || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Modules */}
          <TabsContent value="modules" className="flex-1 overflow-y-auto mt-4">
            {modulesLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {modulesData?.availableModules.map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#2A9D8F] hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Icône */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: module.category?.color
                              ? `${module.category.color}20`
                              : '#E5E7EB',
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
                          <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <Badge variant="outline" className="bg-gray-50">
                              {module.category?.name || 'Sans catégorie'}
                            </Badge>
                            <PlanBadge plan={(module as any).required_plan || 'gratuit'} />
                            <span className="text-gray-500">v{module.version}</span>
                          </div>
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Disponible
                      </div>
                    </div>
                  </motion.div>
                ))}

                {modulesData?.availableModules.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun module disponible</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab: Catégories */}
          <TabsContent value="categories" className="flex-1 overflow-y-auto mt-4">
            {categoriesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {categoriesData?.categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#2A9D8F] hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icône */}
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: category.color ? `${category.color}20` : '#E5E7EB',
                        }}
                      >
                        <Layers
                          className="h-6 w-6"
                          style={{
                            color: category.color || '#6B7280',
                          }}
                        />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg">{category.name}</h4>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-300"
                          >
                            {category.availableModulesCount} / {category.totalModulesCount} modules
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>

                        {/* Modules de la catégorie */}
                        {category.availableModules && category.availableModules.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {category.availableModules.slice(0, 5).map((module: any) => (
                              <Badge
                                key={module.id}
                                variant="outline"
                                className="bg-gray-50 text-gray-700"
                              >
                                {module.name}
                              </Badge>
                            ))}
                            {category.availableModules.length > 5 && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                +{category.availableModules.length - 5} autres
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {categoriesData?.categories.length === 0 && (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune catégorie disponible</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer avec upgrade */}
        <div className="border-t pt-4 mt-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Besoin de plus de modules ?
                  </p>
                  <p className="text-xs text-gray-600">
                    Mettez à niveau votre plan pour débloquer tous les modules
                  </p>
                </div>
              </div>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  onClose();
                  navigate('/dashboard/plans');
                }}
              >
                Mettre à niveau
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
