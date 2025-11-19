/**
 * Onglet Catégories - VERSION 6 CONFORME LOGIQUE MÉTIER
 * ✅ Profil d'accès automatique
 * ✅ Permissions héritées du profil
 * ✅ Catégories limitées au plan d'abonnement
 * ✅ Assignation par catégorie (tous les modules de la catégorie)
 * ⚠️ LOGIQUE MÉTIER E-PILOT RESPECTÉE
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FolderTree, Loader2, AlertCircle, Shield, Info, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Hooks optimisés
import { useUserAccessProfile, getCategoryPermissions } from '../../../hooks/useUserAccessProfile';
import { useSchoolGroupCategories } from '../../../hooks/useSchoolGroupModules';
import { useAssignModulesOptimistic } from '../../../hooks/useAssignModulesOptimistic';

interface CategoriesTabProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    schoolGroupId: string;
  };
  assignedModuleIds: Set<string>;
  onAssignSuccess: () => void;
}

export const CategoriesTab = ({
  user,
  assignedModuleIds,
  onAssignSuccess
}: CategoriesTabProps) => {
  // State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // ✅ LOGIQUE MÉTIER: Récupérer le profil d'accès de l'utilisateur
  const { data: accessProfile, isLoading: loadingProfile } = useUserAccessProfile(user.id);

  // ✅ LOGIQUE MÉTIER: Récupérer les catégories du plan d'abonnement
  const { data: categoriesData, isLoading: loadingCategories } = useSchoolGroupCategories(user.schoolGroupId);

  // Mutation optimiste
  const assignMutation = useAssignModulesOptimistic();

  // Extraire les catégories avec leurs modules
  const categories = useMemo(() => {
    if (!categoriesData || categoriesData.error) return [];
    return categoriesData.categories || [];
  }, [categoriesData]);

  // Filtrer catégories disponibles (avec au moins 1 module non assigné)
  const availableCategories = useMemo(() => {
    return categories.filter((cat: any) => {
      const categoryModules = cat.modules || [];
      const unassignedModules = categoryModules.filter((m: any) => !assignedModuleIds.has(m.id));
      return unassignedModules.length > 0;
    });
  }, [categories, assignedModuleIds]);

  // Toggle category selection
  const handleToggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  // ✅ LOGIQUE MÉTIER: Assigner tous les modules des catégories sélectionnées
  const handleAssign = useCallback(async () => {
    if (selectedCategories.length === 0) return;

    // Récupérer tous les modules des catégories sélectionnées
    const modulesToAssign: string[] = [];
    
    selectedCategories.forEach(categoryId => {
      const category = categories.find((c: any) => c.id === categoryId);
      if (category && category.modules) {
        category.modules.forEach((module: any) => {
          // Ajouter seulement les modules non assignés
          if (!assignedModuleIds.has(module.id)) {
            modulesToAssign.push(module.id);
          }
        });
      }
    });

    if (modulesToAssign.length === 0) {
      return;
    }

    // Grouper par catégorie pour appliquer les bonnes permissions
    const assignmentsByCategory: Record<string, string[]> = {};
    
    modulesToAssign.forEach(moduleId => {
      // Trouver la catégorie du module
      for (const category of categories) {
        const module = category.modules?.find((m: any) => m.id === moduleId);
        if (module) {
          const categoryCode = category.slug || 'pedagogie';
          if (!assignmentsByCategory[categoryCode]) {
            assignmentsByCategory[categoryCode] = [];
          }
          assignmentsByCategory[categoryCode].push(moduleId);
          break;
        }
      }
    });

    // Assigner avec les permissions du profil pour chaque catégorie
    for (const [categoryCode, moduleIds] of Object.entries(assignmentsByCategory)) {
      const categoryPerms = getCategoryPermissions(accessProfile, categoryCode);
      
      // Convertir au format attendu par la mutation
      const permissions = {
        canRead: categoryPerms.read,
        canWrite: categoryPerms.write,
        canDelete: categoryPerms.delete,
        canExport: categoryPerms.export
      };

      await assignMutation.mutateAsync({
        userId: user.id,
        moduleIds,
        permissions
      });
    }

    setSelectedCategories([]);
    onAssignSuccess();
  }, [selectedCategories, categories, assignedModuleIds, user.id, accessProfile, assignMutation, onAssignSuccess]);

  // Loading state
  if (loadingProfile || loadingCategories) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
        <span className="ml-2 text-sm text-gray-600">Chargement...</span>
      </div>
    );
  }

  // Pas de profil (admin)
  if (!accessProfile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ⚠️ Cet utilisateur n'a pas de profil d'accès. Les admins ne peuvent pas se voir assigner de modules.
        </AlertDescription>
      </Alert>
    );
  }

  // Erreur chargement catégories
  if (categoriesData?.error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {categoriesData.message || 'Erreur lors du chargement des catégories'}
        </AlertDescription>
      </Alert>
    );
  }

  // Pas de catégories disponibles
  if (availableCategories.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          ℹ️ Toutes les catégories ont déjà été assignées à cet utilisateur.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <FolderTree className="h-5 w-5 text-[#2A9D8F]" />
        <h3 className="text-lg font-bold text-gray-900">
          Catégories disponibles
        </h3>
        <Badge variant="outline">{availableCategories.length}</Badge>
      </div>

      {/* Info Profil */}
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-xs text-gray-900 mb-1">
              🔒 Profil d'Accès: {accessProfile.name_fr}
            </h4>
            <p className="text-xs text-gray-600">
              Les permissions seront appliquées automatiquement selon ce profil.
            </p>
          </div>
        </div>
      </Card>

      {/* Info Assignation par Catégorie */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          💡 En sélectionnant une catégorie, <strong>tous les modules</strong> de cette catégorie seront assignés automatiquement.
        </p>
      </div>

      {/* Liste des catégories */}
      <div className="space-y-3">
        {availableCategories.map((category: any) => {
          const isSelected = selectedCategories.includes(category.id);
          const categoryModules = category.modules || [];
          const unassignedModules = categoryModules.filter((m: any) => !assignedModuleIds.has(m.id));
          const assignedCount = categoryModules.length - unassignedModules.length;

          return (
            <Card
              key={category.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#2A9D8F] bg-[#2A9D8F]/5 shadow-md'
                  : 'hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleToggleCategory(category.id)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <Checkbox
                  id={`category-${category.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggleCategory(category.id)}
                  className="mt-1"
                />

                {/* Icône */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-semibold text-gray-900 cursor-pointer"
                  >
                    {category.name}
                  </Label>
                  
                  {category.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {category.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Package className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700">
                        <strong>{unassignedModules.length}</strong> modules disponibles
                      </span>
                    </div>
                    
                    {assignedCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {assignedCount} déjà assignés
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      {selectedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t pt-3 flex items-center justify-between"
        >
          <div className="text-sm text-gray-600">
            <strong>{selectedCategories.length}</strong> catégorie(s) sélectionnée(s)
            <br />
            <span className="text-xs text-gray-500">
              {selectedCategories.reduce((total, catId) => {
                const cat = categories.find((c: any) => c.id === catId);
                const unassigned = cat?.modules?.filter((m: any) => !assignedModuleIds.has(m.id)) || [];
                return total + unassigned.length;
              }, 0)} modules seront assignés
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategories([])}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={assignMutation.isPending}
              className="bg-[#2A9D8F] hover:bg-[#238276]"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assignation...
                </>
              ) : (
                <>Assigner</>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
