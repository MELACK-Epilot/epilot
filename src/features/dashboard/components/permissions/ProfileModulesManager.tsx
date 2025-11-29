/**
 * Gestionnaire des modules par profil d'accès
 * Permet au Super Admin de configurer quels modules sont accessibles pour chaque profil
 * 
 * @module ProfileModulesManager
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  Settings2,
  Search,
  Loader2,
  Save,
  Package,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

// Types
import type { AccessProfile } from '../../hooks/useProfilesView';

// ============================================
// TYPES
// ============================================

interface Module {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
}

interface ProfileModule {
  module_id: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface ProfileModulesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AccessProfile | null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour récupérer les modules disponibles selon le plan du groupe
 * Admin Groupe: modules de son plan uniquement
 * Super Admin: tous les modules
 */
const useAvailableModules = (schoolGroupId: string | undefined, isSuperAdmin: boolean) => {
  return useQuery({
    queryKey: ['available-modules-for-profiles', schoolGroupId, isSuperAdmin],
    queryFn: async (): Promise<Module[]> => {
      // Super Admin voit tous les modules
      if (isSuperAdmin) {
        const { data, error } = await supabase
          .from('modules')
          .select(`
            id,
            name,
            slug,
            icon,
            category_id,
            business_categories!inner(name, slug)
          `)
          .eq('status', 'active')
          .order('name');

        if (error) throw error;

        return (data || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          icon: m.icon,
          category_id: m.category_id,
          category_name: m.business_categories?.name || 'Autre',
          category_slug: m.business_categories?.slug || 'other',
        }));
      }

      // Admin Groupe: modules filtrés par plan
      if (!schoolGroupId) return [];

      // Récupérer le plan du groupe
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active')
        .single();

      if (subError || !subscription) {
        console.warn('Pas d\'abonnement actif trouvé');
        return [];
      }

      // Récupérer les modules du plan
      const { data: planModules, error: pmError } = await supabase
        .from('plan_modules')
        .select(`
          module_id,
          modules!inner(
            id,
            name,
            slug,
            icon,
            category_id,
            status,
            business_categories!inner(name, slug)
          )
        `)
        .eq('plan_id', subscription.plan_id);

      if (pmError) throw pmError;

      return (planModules || [])
        .filter((pm: any) => pm.modules?.status === 'active')
        .map((pm: any) => ({
          id: pm.modules.id,
          name: pm.modules.name,
          slug: pm.modules.slug,
          icon: pm.modules.icon,
          category_id: pm.modules.category_id,
          category_name: pm.modules.business_categories?.name || 'Autre',
          category_slug: pm.modules.business_categories?.slug || 'other',
        }));
    },
    enabled: isSuperAdmin || !!schoolGroupId,
    staleTime: 10 * 60 * 1000,
  });
};

const useProfileModules = (profileCode: string | undefined, schoolGroupId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-modules', profileCode, schoolGroupId],
    queryFn: async (): Promise<ProfileModule[]> => {
      if (!profileCode || !schoolGroupId) return [];

      const { data, error } = await supabase
        .from('access_profile_modules')
        .select('module_id, can_read, can_write, can_delete, can_export')
        .eq('access_profile_code', profileCode)
        .eq('school_group_id', schoolGroupId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileCode && !!schoolGroupId,
  });
};

const useSaveProfileModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileCode,
      schoolGroupId,
      modules,
    }: {
      profileCode: string;
      schoolGroupId: string;
      modules: ProfileModule[];
    }) => {
      // Supprimer les anciens (filtré par groupe)
      const { error: deleteError } = await supabase
        .from('access_profile_modules')
        .delete()
        .eq('access_profile_code', profileCode)
        .eq('school_group_id', schoolGroupId);

      if (deleteError) throw deleteError;

      // Insérer les nouveaux
      if (modules.length > 0) {
        const { error: insertError } = await supabase
          .from('access_profile_modules')
          .insert(
            modules.map((m) => ({
              access_profile_code: profileCode,
              school_group_id: schoolGroupId,
              module_id: m.module_id,
              can_read: m.can_read,
              can_write: m.can_write,
              can_delete: m.can_delete,
              can_export: m.can_export,
            }))
          );

        if (insertError) throw insertError;
      }

      // Resync les utilisateurs (le trigger le fait automatiquement)
      return { count: modules.length };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile-modules', variables.profileCode, variables.schoolGroupId] });
      queryClient.invalidateQueries({ queryKey: ['user-modules-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('Modules mis à jour', {
        description: 'Les utilisateurs avec ce profil seront synchronisés automatiquement.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
};

// ============================================
// COMPONENT
// ============================================

export const ProfileModulesManager = ({
  isOpen,
  onClose,
  profile,
}: ProfileModulesManagerProps) => {
  const { user } = useAuth();
  const schoolGroupId = user?.schoolGroupId;
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModules, setSelectedModules] = useState<Map<string, ProfileModule>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Modules disponibles selon le plan du groupe (ou tous pour Super Admin)
  const { data: availableModules = [], isLoading: modulesLoading } = useAvailableModules(
    schoolGroupId,
    isSuperAdmin
  );
  const { data: profileModules = [], isLoading: profileModulesLoading } = useProfileModules(
    profile?.code,
    schoolGroupId
  );
  const saveMutation = useSaveProfileModules();

  const isLoading = modulesLoading || profileModulesLoading;

  // Initialiser la sélection quand les données sont chargées
  useMemo(() => {
    if (isOpen && profileModules.length >= 0 && !isInitialized) {
      const map = new Map<string, ProfileModule>();
      profileModules.forEach((pm) => {
        map.set(pm.module_id, pm);
      });
      setSelectedModules(map);
      setIsInitialized(true);
    }
  }, [isOpen, profileModules, isInitialized]);

  // Reset quand le dialog se ferme
  useMemo(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedModules(new Map());
      setIsInitialized(false);
    }
  }, [isOpen]);

  // Grouper les modules par catégorie
  const modulesByCategory = useMemo(() => {
    const filtered = searchQuery
      ? availableModules.filter(
          (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.category_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : availableModules;

    return filtered.reduce<Record<string, Module[]>>((acc, module) => {
      const key = module.category_name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(module);
      return acc;
    }, {});
  }, [availableModules, searchQuery]);

  // Handlers
  const toggleModule = useCallback((moduleId: string) => {
    setSelectedModules((prev) => {
      const next = new Map(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.set(moduleId, {
          module_id: moduleId,
          can_read: true,
          can_write: false,
          can_delete: false,
          can_export: false,
        });
      }
      return next;
    });
  }, []);

  const togglePermission = useCallback(
    (moduleId: string, permission: keyof Omit<ProfileModule, 'module_id'>) => {
      setSelectedModules((prev) => {
        const next = new Map(prev);
        const current = next.get(moduleId);
        if (current) {
          next.set(moduleId, {
            ...current,
            [permission]: !current[permission],
          });
        }
        return next;
      });
    },
    []
  );

  const selectAllInCategory = useCallback((categoryModules: Module[]) => {
    setSelectedModules((prev) => {
      const next = new Map(prev);
      categoryModules.forEach((m) => {
        if (!next.has(m.id)) {
          next.set(m.id, {
            module_id: m.id,
            can_read: true,
            can_write: false,
            can_delete: false,
            can_export: false,
          });
        }
      });
      return next;
    });
  }, []);

  const deselectAllInCategory = useCallback((categoryModules: Module[]) => {
    setSelectedModules((prev) => {
      const next = new Map(prev);
      categoryModules.forEach((m) => {
        next.delete(m.id);
      });
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!profile?.code || !schoolGroupId) return;

    saveMutation.mutate({
      profileCode: profile.code,
      schoolGroupId,
      modules: Array.from(selectedModules.values()),
    });
  }, [profile?.code, schoolGroupId, selectedModules, saveMutation]);

  // Stats
  const stats = useMemo(
    () => ({
      total: availableModules.length,
      selected: selectedModules.size,
      categories: Object.keys(modulesByCategory).length,
    }),
    [availableModules.length, selectedModules.size, modulesByCategory]
  );

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !saveMutation.isPending && !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings2 className="h-5 w-5 text-[#1D3557]" />
            Modules du profil
          </DialogTitle>
          <DialogDescription>
            Configurez les modules accessibles pour le profil{' '}
            <span className="font-semibold text-gray-900">{profile.name_fr}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search & Stats */}
        <div className="p-4 border-b bg-gray-50/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {stats.selected} / {stats.total} modules
              </Badge>
              <Badge variant="secondary">{stats.categories} catégories</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye className="h-3 w-3" /> Lecture
              <Edit className="h-3 w-3" /> Écriture
              <Trash2 className="h-3 w-3" /> Suppression
              <Download className="h-3 w-3" /> Export
            </div>
          </div>
        </div>

        {/* Modules List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={Object.keys(modulesByCategory)} className="space-y-2">
              {Object.entries(modulesByCategory).map(([categoryName, modules]) => {
                const selectedInCategory = modules.filter((m) => selectedModules.has(m.id)).length;
                const allSelected = selectedInCategory === modules.length;

                return (
                  <AccordionItem
                    key={categoryName}
                    value={categoryName}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{categoryName}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={allSelected ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {selectedInCategory} / {modules.length}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (allSelected) {
                                deselectAllInCategory(modules);
                              } else {
                                selectAllInCategory(modules);
                              }
                            }}
                          >
                            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {modules.map((module) => {
                          const isSelected = selectedModules.has(module.id);
                          const permissions = selectedModules.get(module.id);

                          return (
                            <motion.div
                              key={module.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'bg-blue-50/50 border-blue-200'
                                  : 'bg-white border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleModule(module.id)}
                                />
                                <span className="font-medium text-sm">{module.name}</span>
                              </div>

                              {isSelected && permissions && (
                                <div className="flex items-center gap-1">
                                  <TooltipProvider>
                                    {/* Read */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={permissions.can_read ? 'default' : 'outline'}
                                          className="h-7 w-7 p-0"
                                          onClick={() => togglePermission(module.id, 'can_read')}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Lecture</TooltipContent>
                                    </Tooltip>

                                    {/* Write */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={permissions.can_write ? 'default' : 'outline'}
                                          className="h-7 w-7 p-0"
                                          onClick={() => togglePermission(module.id, 'can_write')}
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Écriture</TooltipContent>
                                    </Tooltip>

                                    {/* Delete */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={permissions.can_delete ? 'destructive' : 'outline'}
                                          className="h-7 w-7 p-0"
                                          onClick={() => togglePermission(module.id, 'can_delete')}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Suppression</TooltipContent>
                                    </Tooltip>

                                    {/* Export */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={permissions.can_export ? 'default' : 'outline'}
                                          className="h-7 w-7 p-0"
                                          onClick={() => togglePermission(module.id, 'can_export')}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Export</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-gray-50/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Les utilisateurs seront synchronisés automatiquement
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-[#1D3557] hover:bg-[#162942] gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModulesManager;
