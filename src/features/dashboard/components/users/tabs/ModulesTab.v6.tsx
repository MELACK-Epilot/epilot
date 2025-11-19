/**
 * Onglet Modules Disponibles - VERSION 6 CONFORME LOGIQUE MÉTIER
 * ✅ Profil d'accès automatique (pas de sélection manuelle)
 * ✅ Permissions héritées du profil
 * ✅ Modules limités au plan d'abonnement
 * ✅ Virtualisation + Pagination infinie
 * ⚠️ LOGIQUE MÉTIER E-PILOT RESPECTÉE
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Filter, Info, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks optimisés
import { useOptimizedSearch } from '../../../hooks/useOptimizedSearch';
import { useAssignModulesOptimistic } from '../../../hooks/useAssignModulesOptimistic';
import { useUserAccessProfile, getCategoryPermissions } from '../../../hooks/useUserAccessProfile';
import { useSchoolGroupPlanModules } from '../../../hooks/useSchoolGroupPlanModules';

// Composant virtualisé
import { VirtualizedInfiniteModuleList } from '../VirtualizedModuleList';

interface ModulesTabProps {
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

export const ModulesTab = ({
  user,
  assignedModuleIds,
  onAssignSuccess
}: ModulesTabProps) => {
  // State
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // ✅ LOGIQUE MÉTIER: Récupérer le profil d'accès de l'utilisateur
  const { data: accessProfile, isLoading: loadingProfile } = useUserAccessProfile(user.id);

  // ✅ LOGIQUE MÉTIER: Récupérer les modules du plan d'abonnement
  const { data: planModules, isLoading: loadingModules } = useSchoolGroupPlanModules(user.schoolGroupId);

  // Recherche optimisée avec debounce
  const { 
    searchValue, 
    debouncedSearch, 
    handleSearch,
    isSearching 
  } = useOptimizedSearch('', {
    delay: 300,
    minLength: 0
  });

  // Mutation optimiste
  const assignMutation = useAssignModulesOptimistic();

  // Filtrer modules disponibles (non assignés + dans le plan)
  const availableModules = useMemo(() => {
    if (!planModules) return [];

    let filtered = planModules.filter((m: any) => !assignedModuleIds.has(m.id));

    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((m: any) => m.category_id === categoryFilter);
    }

    // Filtre par recherche
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter((m: any) => 
        m.name?.toLowerCase().includes(search) ||
        m.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [planModules, assignedModuleIds, categoryFilter, debouncedSearch]);

  // Catégories uniques
  const categories = useMemo(() => {
    if (!planModules) return [];

    const uniqueCategories = new Map();
    planModules.forEach((module: any) => {
      if (module.categories && !uniqueCategories.has(module.categories.id)) {
        uniqueCategories.set(module.categories.id, {
          id: module.categories.id,
          name: module.categories.name,
          icon: module.categories.icon,
          color: module.categories.color,
          code: module.categories.code
        });
      }
    });
    return Array.from(uniqueCategories.values());
  }, [planModules]);

  // Toggle module selection
  const handleToggleModule = useCallback((moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  }, []);

  // ✅ LOGIQUE MÉTIER: Assigner avec profil hérité
  const handleAssign = useCallback(async () => {
    if (selectedModules.length === 0) return;

    // Récupérer les catégories des modules sélectionnés
    const modulesToAssign = availableModules.filter((m: any) => 
      selectedModules.includes(m.id)
    );

    // Grouper par catégorie pour appliquer les bonnes permissions
    const assignmentsByCategory = modulesToAssign.reduce((acc: any, module: any) => {
      const categoryCode = module.categories?.code || 'pedagogie';
      if (!acc[categoryCode]) {
        acc[categoryCode] = [];
      }
      acc[categoryCode].push(module.id);
      return acc;
    }, {});

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
        moduleIds: moduleIds as string[],
        permissions
      });
    }

    setSelectedModules([]);
    onAssignSuccess();
  }, [selectedModules, availableModules, user.id, accessProfile, assignMutation, onAssignSuccess]);

  // Loading state
  if (loadingProfile || loadingModules) {
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

  // Pas de modules dans le plan
  if (!planModules || planModules.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          ℹ️ Aucun module disponible dans le plan d'abonnement de ce groupe.
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
        <Package className="h-5 w-5 text-[#2A9D8F]" />
        <h3 className="text-lg font-bold text-gray-900">
          Modules disponibles
        </h3>
        <Badge variant="outline">{availableModules.length}</Badge>
        {isSearching && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        )}
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
            <div className="mt-2 text-xs text-gray-500">
              <strong>Scope:</strong> {accessProfile.permissions.scope}
            </div>
          </div>
        </div>
      </Card>

      {/* Info Plan */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          💡 Seuls les modules du plan d'abonnement sont affichés. Sélectionnez et assignez!
        </p>
      </div>

      {/* Recherche + Filtre */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un module..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 text-sm">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste virtualisée */}
      <div className="border rounded-lg overflow-hidden">
        <VirtualizedInfiniteModuleList
          modules={availableModules}
          selectedModules={selectedModules}
          onToggleModule={handleToggleModule}
          height={400}
          itemHeight={90}
        />
      </div>

      {/* Actions */}
      {selectedModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t pt-3 flex items-center justify-between"
        >
          <div className="text-sm text-gray-600">
            <strong>{selectedModules.length}</strong> module(s) sélectionné(s)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedModules([])}
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
