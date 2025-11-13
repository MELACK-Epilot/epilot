/**
 * Dialog pour assigner des modules à un utilisateur - VERSION 2
 * Avec vue par catégories et assignation de catégories entières
 * @module UserModulesDialog
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  CheckCircle2, 
  X, 
  Loader2, 
  Shield, 
  Info,
  Grid3x3,
  List,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSchoolGroupModules, useSchoolGroupCategories } from '../../hooks/useSchoolGroupModules';
import { 
  useUserAssignedModules, 
  useAssignMultipleModules,
  useAssignCategory 
} from '../../hooks/useUserAssignedModules';
import { toast } from 'sonner';

interface UserModulesDialogProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolGroupId?: string;
    avatar?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'modules' | 'categories';

export const UserModulesDialog = ({ user, isOpen, onClose }: UserModulesDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false,
  });

  // Modules disponibles selon le plan du groupe
  const { data: modulesData, isLoading: loadingModules } = useSchoolGroupModules(
    user?.schoolGroupId
  );

  // Catégories disponibles
  const { data: categoriesData, isLoading: loadingCategories } = useSchoolGroupCategories(
    user?.schoolGroupId
  );

  // Modules déjà assignés à l'utilisateur
  const { data: assignedModules, isLoading: loadingAssigned } = useUserAssignedModules(user?.id);

  // Mutations
  const assignModulesMutation = useAssignMultipleModules();
  const assignCategoryMutation = useAssignCategory();

  const isLoading = loadingModules || loadingCategories || loadingAssigned;

  // Grouper les modules par catégorie
  const modulesByCategory = useMemo(() => {
    if (!modulesData?.availableModules) return {};
    
    const grouped: Record<string, any[]> = {};
    
    modulesData.availableModules.forEach((module: any) => {
      const categoryId = module.category?.id || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(module);
    });
    
    return grouped;
  }, [modulesData]);

  // Filtrer les modules par recherche
  const filteredModules = useMemo(() => {
    if (!modulesData?.availableModules) return [];
    
    if (!searchQuery) return modulesData.availableModules;
    
    return modulesData.availableModules.filter(
      (module: any) =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (module.category?.name && module.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [modulesData, searchQuery]);

  // Filtrer les catégories par recherche
  const filteredCategories = useMemo(() => {
    if (!categoriesData?.categories) return [];
    
    if (!searchQuery) return categoriesData.categories;
    
    return categoriesData.categories.filter(
      (category: any) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoriesData, searchQuery]);

  const assignedModuleIds = new Set(assignedModules?.map((m) => m.module_id) || []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const selectAllInCategory = (categoryId: string) => {
    const categoryModules = modulesByCategory[categoryId] || [];
    const unassignedModules = categoryModules
      .filter((m: any) => !assignedModuleIds.has(m.id))
      .map((m: any) => m.id);
    
    setSelectedModules((prev) => {
      const newSelection = new Set([...prev, ...unassignedModules]);
      return Array.from(newSelection);
    });
  };

  const deselectAllInCategory = (categoryId: string) => {
    const categoryModules = modulesByCategory[categoryId] || [];
    const categoryModuleIds = new Set(categoryModules.map((m: any) => m.id));
    
    setSelectedModules((prev) => prev.filter((id) => !categoryModuleIds.has(id)));
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const handleAssign = async () => {
    if (!user) return;

    try {
      let totalAssigned = 0;
      let totalFailed = 0;

      // Assigner les catégories sélectionnées
      if (selectedCategories.length > 0) {
        for (const categoryId of selectedCategories) {
          try {
            await assignCategoryMutation.mutateAsync({
              userId: user.id,
              categoryId,
              permissions,
            });
            totalAssigned++;
          } catch (error) {
            totalFailed++;
            console.error('Erreur assignation catégorie:', error);
          }
        }
      }

      // Assigner les modules sélectionnés
      if (selectedModules.length > 0) {
        const result = await assignModulesMutation.mutateAsync({
          userId: user.id,
          moduleIds: selectedModules,
          permissions,
        });
        totalAssigned += result.assigned;
        totalFailed += result.failed;
      }

      if (totalFailed > 0) {
        toast.warning(
          `${totalAssigned} élément(s) assigné(s), ${totalFailed} échec(s)`,
          {
            description: 'Certains éléments n\'ont pas pu être assignés',
          }
        );
      } else {
        toast.success(`${totalAssigned} élément(s) assigné(s) avec succès`, {
          description: `${user.firstName} ${user.lastName} a maintenant accès à ces modules`,
        });
      }

      setSelectedModules([]);
      setSelectedCategories([]);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'affectation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  if (!user) return null;

  const totalSelected = selectedModules.length + selectedCategories.length;
  const unassignedCount = filteredModules.filter((m: any) => !assignedModuleIds.has(m.id)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header avec fonction à droite */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Avatar + Infos à gauche */}
            <div className="flex items-center gap-3">
              {/* Avatar utilisateur */}
              <div className="relative flex-shrink-0">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2A9D8F]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white font-bold text-lg">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* Infos utilisateur */}
              <div>
                <DialogTitle className="text-lg font-bold text-[#1D3557] mb-0.5">
                  Assigner des modules
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Fonction (rôle) en grand et coloré à droite */}
            <div className="flex items-center gap-3">
              <Badge 
                className={
                  user.role === 'super_admin' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold py-1.5 px-3 shadow-lg'
                    : user.role === 'admin_groupe'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold py-1.5 px-3 shadow-lg'
                    : user.role === 'admin_ecole' || user.role === 'proviseur'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-bold py-1.5 px-3 shadow-lg'
                    : user.role === 'enseignant'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-bold py-1.5 px-3 shadow-lg'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-bold py-1.5 px-3 shadow-lg'
                }
              >
                {user.role === 'super_admin' ? '👑 Super Admin' :
                 user.role === 'admin_groupe' ? '🏛️ Admin Groupe' :
                 user.role === 'admin_ecole' ? '🏫 Proviseur' :
                 user.role === 'proviseur' ? '🏫 Proviseur' :
                 user.role === 'enseignant' ? '👨‍🏫 Enseignant' :
                 user.role === 'cpe' ? '📊 CPE' :
                 user.role === 'comptable' ? '💰 Comptable' :
                 user.role}
              </Badge>
              
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info + Permissions en 2 colonnes pour gagner de l'espace */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Info Badge */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-blue-900 font-medium text-xs mb-1">
                  {assignedModules?.length || 0} assigné{(assignedModules?.length || 0) > 1 ? 's' : ''} • {unassignedCount} disponible{unassignedCount > 1 ? 's' : ''}
                </p>
                <p className="text-blue-700 text-xs leading-tight">
                  💡 Assignez une catégorie entière
                </p>
              </div>
            </div>

            {/* Permissions compactes */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <h3 className="font-medium text-gray-900 text-xs">Permissions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="canRead"
                    checked={permissions.canRead}
                    onCheckedChange={(checked) =>
                      setPermissions((p) => ({ ...p, canRead: checked as boolean }))
                    }
                    className="w-3.5 h-3.5"
                  />
                  <Label htmlFor="canRead" className="text-xs cursor-pointer">📖 Lecture</Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="canWrite"
                    checked={permissions.canWrite}
                    onCheckedChange={(checked) =>
                      setPermissions((p) => ({ ...p, canWrite: checked as boolean }))
                    }
                    className="w-3.5 h-3.5"
                  />
                  <Label htmlFor="canWrite" className="text-xs cursor-pointer">✏️ Écriture</Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="canDelete"
                    checked={permissions.canDelete}
                    onCheckedChange={(checked) =>
                      setPermissions((p) => ({ ...p, canDelete: checked as boolean }))
                    }
                    className="w-3.5 h-3.5"
                  />
                  <Label htmlFor="canDelete" className="text-xs cursor-pointer">🗑️ Suppr.</Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="canExport"
                    checked={permissions.canExport}
                    onCheckedChange={(checked) =>
                      setPermissions((p) => ({ ...p, canExport: checked as boolean }))
                    }
                    className="w-3.5 h-3.5"
                  />
                  <Label htmlFor="canExport" className="text-xs cursor-pointer">📥 Export</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et toggle vue */}
        <div className="px-6 py-3 border-b bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="🔍 Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 text-sm"
                aria-label="Rechercher des modules ou catégories"
              />
            </div>
            <div className="flex gap-1 border rounded-lg p-0.5 bg-gray-50">
              <Button
                variant={viewMode === 'categories' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('categories')}
                className="gap-1.5 h-8 px-3 text-xs"
                aria-label="Vue par catégories"
                aria-pressed={viewMode === 'categories'}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
                <span>Catégories</span>
              </Button>
              <Button
                variant={viewMode === 'modules' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('modules')}
                className="gap-1.5 h-8 px-3 text-xs"
                aria-label="Vue par modules"
                aria-pressed={viewMode === 'modules'}
              >
                <List className="w-3.5 h-3.5" />
                <span>Modules</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal avec scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4" role="region" aria-label="Liste des modules et catégories" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
            </div>
          ) : viewMode === 'categories' ? (
            /* VUE PAR CATÉGORIES */
            <div className="space-y-4">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucune catégorie trouvée</p>
                </div>
              ) : (
                filteredCategories.map((category: any, index: number) => {
                  const categoryModules = modulesByCategory[category.id] || [];
                  const isExpanded = expandedCategories.has(category.id);
                  const isCategorySelected = selectedCategories.includes(category.id);
                  const selectedInCategory = categoryModules.filter((m: any) => 
                    selectedModules.includes(m.id)
                  ).length;

                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        borderColor: isCategorySelected ? category.color || '#2A9D8F' : '#e5e7eb'
                      }}
                    >
                      {/* Header de catégorie */}
                      <div 
                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{
                          backgroundColor: isCategorySelected 
                            ? `${category.color || '#2A9D8F'}10` 
                            : 'white'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isCategorySelected}
                            onCheckedChange={() => toggleCategorySelection(category.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5"
                          />
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl shadow-sm"
                            style={{
                              backgroundColor: `${category.color || '#2A9D8F'}20`,
                            }}
                          >
                            {/* Afficher emoji uniquement, pas les noms de composants React */}
                            {category.icon && category.icon.length <= 2 ? category.icon : '📦'}
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => toggleCategory(category.id)}>
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <h4 className="text-base font-semibold text-gray-900">{category.name}</h4>
                              <Badge variant="outline" className="text-xs font-medium">
                                {categoryModules.length} module{categoryModules.length > 1 ? 's' : ''}
                              </Badge>
                              {selectedInCategory > 0 && (
                                <Badge className="bg-green-100 text-green-700 text-xs font-medium">
                                  {selectedInCategory} sélectionné{selectedInCategory > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-1 font-normal">
                              {category.description || 'Aucune description'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isCategorySelected ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllInCategory(category.id);
                                }}
                              >
                                Tout sélectionner
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deselectAllInCategory(category.id);
                                }}
                              >
                                Désélectionner
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleCategory(category.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Modules de la catégorie */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t bg-gray-50"
                          >
                            <div className="p-4 space-y-3">
                              {categoryModules.map((module: any) => {
                                const isAssigned = assignedModuleIds.has(module.id);
                                const isSelected = selectedModules.includes(module.id);

                                return (
                                  <div
                                    key={module.id}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                      isSelected
                                        ? 'border-[#2A9D8F] bg-green-50'
                                        : isAssigned
                                        ? 'border-blue-200 bg-blue-50 opacity-60'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                    onClick={() => !isAssigned && toggleModule(module.id)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        checked={isSelected || isAssigned}
                                        disabled={isAssigned}
                                        onCheckedChange={() => toggleModule(module.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-900 text-base">
                                            {module.name}
                                          </p>
                                          {isAssigned && (
                                            <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-1 mt-0.5">
                                          {module.description}
                                        </p>
                                      </div>
                                      {isAssigned && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                                          Déjà assigné
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            /* VUE PAR MODULES (liste plate) */
            <div className="space-y-3">
              {filteredModules.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun module trouvé</p>
                </div>
              ) : (
                filteredModules.map((module: any, index: number) => {
                  const isAssigned = assignedModuleIds.has(module.id);
                  const isSelected = selectedModules.includes(module.id);

                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md ${
                        isSelected
                          ? 'border-[#2A9D8F] bg-green-50'
                          : isAssigned
                          ? 'border-blue-200 bg-blue-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => !isAssigned && toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isSelected || isAssigned}
                          disabled={isAssigned}
                          onCheckedChange={() => toggleModule(module.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{
                            backgroundColor: module.category?.color
                              ? `${module.category.color}20`
                              : '#E5E7EB',
                          }}
                        >
                          <Package
                            className="h-5 w-5"
                            style={{ color: module.category?.color || '#6B7280' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-gray-900 truncate">{module.name}</h4>
                            {isAssigned && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-1">{module.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="bg-gray-50">
                            {module.category?.name}
                          </Badge>
                          {isAssigned && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              Déjà assigné
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            <p className="font-medium">
              <span className="font-bold text-[#2A9D8F] text-base">{totalSelected}</span> élément{totalSelected > 1 ? 's' : ''} sélectionné{totalSelected > 1 ? 's' : ''}
            </p>
            {selectedCategories.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedCategories.length} catégorie{selectedCategories.length > 1 ? 's' : ''} • {selectedModules.length} module{selectedModules.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={assignModulesMutation.isPending || assignCategoryMutation.isPending}
              className="flex-1 sm:flex-none"
              aria-label="Annuler l'assignation"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                totalSelected === 0 || 
                assignModulesMutation.isPending || 
                assignCategoryMutation.isPending
              }
              className="bg-[#2A9D8F] hover:bg-[#238276] text-white shadow-md hover:shadow-lg transition-all flex-1 sm:flex-none"
              aria-label={`Assigner ${totalSelected} élément${totalSelected > 1 ? 's' : ''}`}
            >
              {assignModulesMutation.isPending || assignCategoryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Affectation en cours...</span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  <span>Assigner {totalSelected > 0 ? `(${totalSelected})` : ''}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
