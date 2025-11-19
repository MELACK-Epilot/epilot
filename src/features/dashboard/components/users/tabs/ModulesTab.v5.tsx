/**
 * Onglet Modules Disponibles - VERSION 5 OPTIMISÉE
 * ✅ Virtualisation (react-window)
 * ✅ Debounce optimisé
 * ✅ Optimistic updates
 * ✅ Pagination infinie
 * ✅ Performance maximale pour 2000+ users
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Filter, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useSchoolGroupModulesPaginated, flattenInfiniteQueryData } from '../../../hooks/useSchoolGroupModulesPaginated';

// Composant virtualisé
import { VirtualizedInfiniteModuleList } from '../VirtualizedModuleList';

interface ModulesTabProps {
  user: any;
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
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false
  });

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

  // Pagination infinie avec React Query
  const {
    data: modulesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useSchoolGroupModulesPaginated({
    schoolGroupId: user?.schoolGroupId,
    pageSize: 50,
    search: debouncedSearch,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter
  });

  // Mutation optimiste
  const assignMutation = useAssignModulesOptimistic();

  // Flatten pages
  const allModules = useMemo(() => {
    return flattenInfiniteQueryData(modulesData);
  }, [modulesData]);

  // Filtrer modules non assignés
  const availableModules = useMemo(() => {
    return allModules.filter(m => !assignedModuleIds.has(m.id));
  }, [allModules, assignedModuleIds]);

  // Catégories uniques
  const categories = useMemo(() => {
    const uniqueCategories = new Map();
    allModules.forEach(module => {
      if (module.category_id && !uniqueCategories.has(module.category_id)) {
        uniqueCategories.set(module.category_id, {
          id: module.category_id,
          name: module.category_name,
          icon: module.category_icon,
          color: module.category_color
        });
      }
    });
    return Array.from(uniqueCategories.values());
  }, [allModules]);

  // Toggle module selection
  const handleToggleModule = useCallback((moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  }, []);

  // Toggle permission
  const togglePermission = useCallback((key: keyof typeof permissions) => {
    setPermissions(prev => {
      const newPerms = { ...prev, [key]: !prev[key] };
      
      // Validation: canDelete nécessite canWrite
      if (key === 'canWrite' && !newPerms.canWrite) {
        newPerms.canDelete = false;
      }
      if (key === 'canDelete' && newPerms.canDelete && !newPerms.canWrite) {
        newPerms.canWrite = true;
      }
      
      return newPerms;
    });
  }, []);

  // Assigner modules
  const handleAssign = useCallback(async () => {
    if (selectedModules.length === 0) return;

    assignMutation.mutate(
      {
        userId: user.id,
        moduleIds: selectedModules,
        permissions
      },
      {
        onSuccess: () => {
          setSelectedModules([]);
          onAssignSuccess();
        }
      }
    );
  }, [selectedModules, user.id, permissions, assignMutation, onAssignSuccess]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
      </div>
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          💡 Sélectionnez des modules et définissez leurs permissions. Scroll infini activé!
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
            {Array.isArray(categories) && categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions */}
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <h4 className="font-semibold text-xs text-gray-900 mb-2">
          🔒 Permissions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canRead"
                    checked={permissions.canRead}
                    disabled
                  />
                  <Label htmlFor="canRead" className="text-sm cursor-not-allowed opacity-70">
                    📖
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Lecture</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canWrite"
                    checked={permissions.canWrite}
                    onCheckedChange={() => togglePermission('canWrite')}
                  />
                  <Label htmlFor="canWrite" className="text-sm cursor-pointer">
                    ✏️
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Modification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canDelete"
                    checked={permissions.canDelete}
                    disabled={!permissions.canWrite}
                    onCheckedChange={() => togglePermission('canDelete')}
                  />
                  <Label 
                    htmlFor="canDelete" 
                    className={`text-sm ${permissions.canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                  >
                    🗑️
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Suppression</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canExport"
                    checked={permissions.canExport}
                    onCheckedChange={() => togglePermission('canExport')}
                  />
                  <Label htmlFor="canExport" className="text-sm cursor-pointer">
                    📥
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Export</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>

      {/* Liste virtualisée avec infinite scroll */}
      <VirtualizedInfiniteModuleList
        modules={availableModules}
        selectedModules={selectedModules}
        onToggleModule={handleToggleModule}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        height={500}
        itemHeight={90}
      />

      {/* Bouton Assigner (sticky) */}
      {selectedModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t pt-3 -mx-4 px-4 pb-4"
        >
          <Button
            onClick={handleAssign}
            disabled={assignMutation.isPending}
            className="w-full bg-[#2A9D8F] hover:bg-[#238276] text-white"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assignation en cours...
              </>
            ) : (
              <>
                Assigner {selectedModules.length} module(s)
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
