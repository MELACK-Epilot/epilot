/**
 * Dialog pour assigner des modules à un utilisateur
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, Check } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import { useModules, useCategories } from '../hooks/useAvailableModules';
import { useUserModules } from '../hooks/useUserModules';
import { useAssignModule, useUnassignModule } from '../hooks/useAssignModule';
import type { User } from '@/types';

interface ModuleAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export const ModuleAssignDialog = ({
  open,
  onOpenChange,
  user,
}: ModuleAssignDialogProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Data
  const { data: allModules, isLoading: modulesLoading } = useModules();
  const { data: categories } = useCategories();
  const { data: userModules } = useUserModules(user.id);

  // Mutations
  const assignModule = useAssignModule();
  const unassignModule = useUnassignModule();

  // Modules assignés (IDs)
  const assignedModuleIds = useMemo(() => {
    return new Set(userModules?.map(um => um.module_id) || []);
  }, [userModules]);

  // Filtrer modules
  const filteredModules = useMemo(() => {
    if (!allModules) return [];

    return allModules.filter(module => {
      // Filtre recherche
      const matchSearch = search === '' || 
        module.name.toLowerCase().includes(search.toLowerCase()) ||
        module.description?.toLowerCase().includes(search.toLowerCase());

      // Filtre catégorie
      const matchCategory = selectedCategory === 'all' || 
        module.category_id === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [allModules, search, selectedCategory]);

  // Stats
  const stats = useMemo(() => {
    const total = allModules?.length || 0;
    const assigned = assignedModuleIds.size;
    const available = total - assigned;

    return { total, assigned, available };
  }, [allModules, assignedModuleIds]);

  // Handler toggle
  const handleToggle = async (moduleId: string, shouldAssign: boolean) => {
    if (shouldAssign) {
      await assignModule.mutateAsync({ userId: user.id, moduleId });
    } else {
      await unassignModule.mutateAsync({ userId: user.id, moduleId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Assigner des Modules
          </DialogTitle>
          <DialogDescription>
            Gérer les modules de <span className="font-semibold">{user.firstName} {user.lastName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#2A9D8F]">{stats.assigned}</div>
            <div className="text-sm text-gray-500">Assignés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.available}</div>
            <div className="text-sm text-gray-500">Disponibles</div>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtres par catégorie */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">
              Tous ({allModules?.length || 0})
            </TabsTrigger>
            {categories?.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name} ({allModules?.filter(m => m.category_id === category.id).length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4">
            {modulesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucun module trouvé
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredModules.map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    isAssigned={assignedModuleIds.has(module.id)}
                    onToggle={handleToggle}
                    disabled={assignModule.isPending || unassignModule.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {stats.assigned} module{stats.assigned > 1 ? 's' : ''} assigné{stats.assigned > 1 ? 's' : ''}
          </div>
          <Button onClick={() => onOpenChange(false)}>
            <Check className="h-4 w-4 mr-2" />
            Terminer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
