/**
 * Sheet 4 ONGLETS - VERSION 5 ULTRA-OPTIMISÉE
 * ✅ Pagination infinie
 * ✅ Virtualisation
 * ✅ Optimistic updates
 * ✅ Performance maximale 2000+ users
 * @module UserModulesDialog.v5
 */

import { useState } from 'react';
import { 
  BarChart3,
  Package, 
  FolderTree,
  CheckCircle2, 
  X
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Hooks optimisés
import { useUserAssignedModules } from '../../hooks/useUserAssignedModules';
import { useUserModuleStatsOptimized } from '../../hooks/useSchoolGroupModulesPaginated';

import { useRemoveModuleOptimistic, useUpdatePermissionsOptimistic } from '../../hooks/useAssignModulesOptimistic';

// Onglets
import { StatsTab } from './tabs/StatsTab';
import { ModulesTab as ModulesTabV6 } from './tabs/ModulesTab.v6';
import { CategoriesTab as CategoriesTabV6 } from './tabs/CategoriesTab.v6';
import { AssignedTab } from './tabs/AssignedTab';

interface UserModulesDialogProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
    schoolGroupId?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const UserModulesDialog = ({ user, isOpen, onClose }: UserModulesDialogProps) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'modules' | 'categories' | 'assigned'>('stats');

  // ⚠️ HOOKS TOUJOURS EN PREMIER (Rules of Hooks)
  // Data fetching optimisé (avec optional chaining pour user)
  const { data: assignedModules, isLoading: loadingAssigned, refetch: refetchAssigned } = useUserAssignedModules(user?.id);
  const { data: moduleStats, isLoading: loadingStats } = useUserModuleStatsOptimized(user?.id);
  
  // Mutations optimistes
  const removeMutation = useRemoveModuleOptimistic();
  const updatePermissionsMutation = useUpdatePermissionsOptimistic();

  // ⚠️ Guard APRÈS les hooks
  if (!user) return null;

  // Handler success
  const handleAssignSuccess = () => {
    refetchAssigned();
    setActiveTab('assigned');
  };
  
  // Handlers pour AssignedTab
  const handleRemoveModule = async (moduleId: string) => {
    await removeMutation.mutateAsync({
      userId: user.id,
      moduleId
    });
  };

  const handleUpdatePermissions = async (moduleId: string, permissions: any) => {
    await updatePermissionsMutation.mutateAsync({
      userId: user.id,
      moduleId,
      permissions
    });
  };

  // Assigned module IDs
  const assignedModuleIds = new Set(assignedModules?.map((m: any) => m.module_id) || []);

  // Counts
  const assignedCount = assignedModules?.length || 0;
  const totalCount = (moduleStats as any)?.total_modules || 0;
  const availableCount = totalCount - assignedCount;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[700px] lg:max-w-[850px] p-0 flex flex-col"
      >
        {/* Header Sticky */}
        <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Avatar + Infos */}
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white font-bold text-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-bold text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-center px-3 py-1 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-[#2A9D8F]">{assignedCount}</div>
                <div className="text-xs text-gray-600">Assignés</div>
              </div>
              <div className="text-center px-3 py-1 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{availableCount}</div>
                <div className="text-xs text-gray-600">Disponibles</div>
              </div>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value: any) => setActiveTab(value)} 
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* TabsList */}
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-3 flex-shrink-0">
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="modules" className="text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-1" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">
              <FolderTree className="h-4 w-4 mr-1" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs sm:text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Assignés
            </TabsTrigger>
          </TabsList>

          {/* Content avec scroll */}
          <div className="flex-1 overflow-hidden">
            {/* Onglet Stats */}
            <TabsContent value="stats" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <StatsTab
                    moduleStats={moduleStats}
                    loadingStats={loadingStats}
                    assignedCount={assignedCount}
                    availableCount={availableCount}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Onglet Modules (V6 conforme logique métier) */}
            <TabsContent value="modules" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <ModulesTabV6
                    user={user}
                    assignedModuleIds={assignedModuleIds}
                    onAssignSuccess={handleAssignSuccess}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            {/* Onglet Catégories (V6 conforme logique métier) */}
            <TabsContent value="categories" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <CategoriesTabV6
                    user={user}
                    assignedModuleIds={assignedModuleIds}
                    onAssignSuccess={handleAssignSuccess}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Onglet Assignés */}
            <TabsContent value="assigned" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <AssignedTab
                    modules={assignedModules || []}
                    isLoading={loadingAssigned}
                    onRemove={handleRemoveModule}
                    onUpdatePermissions={handleUpdatePermissions}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
