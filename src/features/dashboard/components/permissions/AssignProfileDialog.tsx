/**
 * Dialogue d'assignation de profil aux utilisateurs
 * Optimisé pour gérer 900+ utilisateurs avec virtualisation
 * 
 * ARCHITECTURE:
 * - Chargement de TOUS les utilisateurs du groupe (pas de pagination UI)
 * - Virtualisation pour performance (react-virtual)
 * - Recherche côté client (données déjà chargées)
 * - Assignation en masse via service
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, Loader2, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCurrentUserGroup } from '../../hooks/useCurrentUserGroup';
import type { AccessProfile } from '../../hooks/useProfilesView';

// ============================================
// CONSTANTS
// ============================================

const EXCLUDED_ROLES = ['admin_groupe', 'super_admin'] as const;
const ITEM_HEIGHT = 64; // Hauteur d'un item en pixels

// ============================================
// TYPES
// ============================================

interface SimpleUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar: string | null;
  access_profile_code: string | null;
}

interface UserWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  currentProfileCode: string;
}

interface AssignProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: AccessProfile | null;
}

// ============================================
// HOOK: Charger TOUS les utilisateurs assignables
// ============================================

const useAssignableUsers = (schoolGroupId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['assignable-users', schoolGroupId],
    queryFn: async (): Promise<SimpleUser[]> => {
      if (!schoolGroupId) return [];
      
      // Charger TOUS les utilisateurs du groupe (pas de pagination)
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role, avatar, access_profile_code')
        .eq('school_group_id', schoolGroupId)
        .not('role', 'in', `(${EXCLUDED_ROLES.join(',')})`)
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!schoolGroupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ============================================
// HOOK: Mutation pour assigner en masse
// ============================================

const useAssignProfileMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      profileCode, 
      toAdd, 
      toRemove 
    }: { 
      profileCode: string; 
      toAdd: string[]; 
      toRemove: string[]; 
    }) => {
      const promises = [];
      
      // Assigner le profil
      if (toAdd.length > 0) {
        // Batch par 100 pour éviter les timeouts
        for (let i = 0; i < toAdd.length; i += 100) {
          const batch = toAdd.slice(i, i + 100);
          promises.push(
            supabase
              .from('users')
              .update({ access_profile_code: profileCode })
              .in('id', batch)
          );
        }
      }
      
      // Retirer le profil
      if (toRemove.length > 0) {
        for (let i = 0; i < toRemove.length; i += 100) {
          const batch = toRemove.slice(i, i + 100);
          promises.push(
            supabase
              .from('users')
              .update({ access_profile_code: null })
              .in('id', batch)
          );
        }
      }
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
      
      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-users'] });
      queryClient.invalidateQueries({ queryKey: ['role-stats'] });
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
    },
  });
};

// ============================================
// COMPONENT
// ============================================

export const AssignProfileDialog = ({
  isOpen,
  onClose,
  role
}: AssignProfileDialogProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [initialSelectedUsers, setInitialSelectedUsers] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // State pour la confirmation
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [conflictingUsers, setConflictingUsers] = useState<UserWithProfile[]>([]);

  // Récupérer le groupe scolaire de l'utilisateur connecté
  const { data: currentGroup, isLoading: groupLoading } = useCurrentUserGroup();

  // Charger TOUS les utilisateurs assignables
  const { data: users = [], isLoading: usersLoading } = useAssignableUsers(
    currentGroup?.id,
    isOpen && !!currentGroup?.id
  );
  
  // Mutation pour l'assignation
  const assignMutation = useAssignProfileMutation();
  
  const isLoading = groupLoading || usersLoading;

  // Reset state et initialiser la sélection quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && users.length > 0 && role?.code && !isInitialized) {
      setSearchQuery('');
      // Pré-sélectionner les utilisateurs qui ont déjà ce profil
      const usersWithRole = new Set(
        users
          .filter(u => u.access_profile_code === role.code)
          .map(u => u.id)
      );
      setSelectedUsers(usersWithRole);
      setInitialSelectedUsers(usersWithRole);
      setIsInitialized(true);
    }
  }, [isOpen, users, role, isInitialized]);

  // Cleanup quand le dialog se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUsers(new Set());
      setInitialSelectedUsers(new Set());
      setIsInitialized(false);
      setIsAlertOpen(false);
      setConflictingUsers([]);
    }
  }, [isOpen]);

  // Filtrer les utilisateurs (recherche côté client)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(u => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      return fullName.includes(query) || u.email?.toLowerCase().includes(query);
    });
  }, [users, searchQuery]);

  // Virtualizer pour la liste
  const virtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 10,
  });

  // Handlers
  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  }, [selectedUsers.size, filteredUsers]);

  const executeAssignment = useCallback(async () => {
    if (!role?.code) return;
    setIsAlertOpen(false);

    // Calculer les différences
    const toAdd = [...selectedUsers].filter(id => !initialSelectedUsers.has(id));
    const toRemove = [...initialSelectedUsers].filter(id => !selectedUsers.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      toast.info('Aucune modification');
      onClose();
      return;
    }

    try {
      const result = await assignMutation.mutateAsync({
        profileCode: role.code,
        toAdd,
        toRemove,
      });
      
      toast.success('Mise à jour réussie', {
        description: `${result.added} assigné(s), ${result.removed} retiré(s).`
      });
      
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur assignation:', error);
      toast.error("Erreur lors de l'assignation", { description: message });
    }
  }, [role, selectedUsers, initialSelectedUsers, assignMutation, onClose]);

  const handleCheckConflicts = useCallback(() => {
    if (!role?.code) return;
    
    // Identifier les utilisateurs à ajouter qui ont déjà un autre profil
    const toAddIds = [...selectedUsers].filter(id => !initialSelectedUsers.has(id));
    
    const conflicts: UserWithProfile[] = [];
    toAddIds.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user?.access_profile_code && user.access_profile_code !== role.code) {
        conflicts.push({
          id: user.id,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email,
          currentProfileCode: user.access_profile_code
        });
      }
    });

    if (conflicts.length > 0) {
      setConflictingUsers(conflicts);
      setIsAlertOpen(true);
    } else {
      executeAssignment();
    }
  }, [role, selectedUsers, initialSelectedUsers, users, executeAssignment]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    filtered: filteredUsers.length,
    selected: selectedUsers.size,
    toAdd: [...selectedUsers].filter(id => !initialSelectedUsers.has(id)).length,
    toRemove: [...initialSelectedUsers].filter(id => !selectedUsers.has(id)).length,
  }), [users.length, filteredUsers.length, selectedUsers, initialSelectedUsers]);

  if (!role) return null;

  const isSaving = assignMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-[#1D3557]" />
              Assigner le profil
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les utilisateurs à basculer vers le rôle{' '}
              <span className="font-bold text-gray-900">{role.name_fr}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Search & Stats */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher parmi les utilisateurs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                  onCheckedChange={handleSelectAll}
                  disabled={filteredUsers.length === 0}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none cursor-pointer text-gray-600"
                >
                  Tout sélectionner ({stats.filtered})
                </label>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">{stats.selected} sélectionné(s)</span>
                {stats.toAdd > 0 && (
                  <Badge className="bg-green-100 text-green-700 text-[10px]">+{stats.toAdd}</Badge>
                )}
                {stats.toRemove > 0 && (
                  <Badge className="bg-red-100 text-red-700 text-[10px]">-{stats.toRemove}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Virtualized List */}
          <div 
            ref={parentRef}
            className="flex-1 overflow-auto"
            style={{ minHeight: '300px', maxHeight: '400px' }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Chargement des utilisateurs...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Aucun utilisateur trouvé.</p>
                {users.length > 0 && searchQuery && (
                  <p className="text-xs mt-1">Essayez une autre recherche.</p>
                )}
              </div>
            ) : (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const user = filteredUsers[virtualRow.index];
                  const isSelected = selectedUsers.has(user.id);
                  const fullName = `${user.first_name} ${user.last_name}`;
                  const hasExistingProfile = user.access_profile_code && user.access_profile_code !== role.code;
                  
                  return (
                    <div
                      key={user.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="px-2"
                    >
                      <div 
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 h-[60px] ${
                          isSelected 
                            ? 'bg-blue-50/50 border-blue-200' 
                            : 'border-transparent'
                        }`}
                        onClick={() => handleToggleUser(user.id)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleToggleUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>{user.first_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">
                            {fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="outline" className="text-[10px] text-gray-400 bg-white">
                            {user.role}
                          </Badge>
                          {hasExistingProfile && (
                            <Badge variant="secondary" className="text-[9px] bg-amber-50 text-amber-600">
                              {user.access_profile_code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-400">
                {stats.total} utilisateurs au total
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCheckConflicts} 
                  disabled={isSaving || (stats.toAdd === 0 && stats.toRemove === 0)}
                  className="bg-[#1D3557] hover:bg-[#162942] gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Appliquer les modifications
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog pour les conflits */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Modification de profils existants
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conflictingUsers.length} utilisateur(s) ont déjà un profil assigné.
              Cette action va remplacer leur profil actuel par{' '}
              <span className="font-bold text-gray-900">{role.name_fr}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 border rounded-lg bg-gray-50 max-h-[200px] overflow-auto">
            <div className="p-3 space-y-2">
              {conflictingUsers.slice(0, 10).map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <span className="font-medium truncate">
                    {user.firstName} {user.lastName}
                  </span>
                  <div className="flex items-center gap-1 text-xs shrink-0">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      {user.currentProfileCode}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <Badge className="bg-blue-100 text-blue-700">
                      {role.code}
                    </Badge>
                  </div>
                </div>
              ))}
              {conflictingUsers.length > 10 && (
                <p className="text-xs text-center text-gray-500 py-2">
                  ... et {conflictingUsers.length - 10} autre(s)
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAssignment}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer ({conflictingUsers.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
