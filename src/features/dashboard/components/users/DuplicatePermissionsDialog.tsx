/**
 * Dialog pour dupliquer les permissions d'un utilisateur vers un autre
 */

import { useState, useEffect } from 'react';
import { Copy, Users, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DuplicatePermissionsDialogProps {
  sourceUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  targetUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    assignedModulesCount?: number;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export const DuplicatePermissionsDialog = ({
  sourceUser,
  targetUsers,
  isOpen,
  onClose,
}: DuplicatePermissionsDialogProps) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceModules, setSourceModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  const loadSourceModules = async () => {
    if (!sourceUser) return;

    setLoadingModules(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', sourceUser.id);

      if (error) throw error;
      setSourceModules(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des modules');
    } finally {
      setLoadingModules(false);
    }
  };

  // Charger les modules quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && sourceUser) {
      loadSourceModules();
    }
  }, [isOpen, sourceUser]);

  const handleDuplicate = async () => {
    if (!selectedTargetId || !sourceUser) return;

    setIsLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Non authentifié');

      // Préparer les données pour la duplication
      const duplicateData = sourceModules.map((module) => ({
        user_id: selectedTargetId,
        module_id: module.module_id,
        module_name: module.module_name,
        module_slug: module.module_slug,
        category_id: module.category_id,
        category_name: module.category_name,
        assignment_type: module.assignment_type,
        can_read: module.can_read,
        can_write: module.can_write,
        can_delete: module.can_delete,
        can_export: module.can_export,
        assigned_by: currentUser.user.id,
        assigned_at: new Date().toISOString(),
      }));

      // Insérer avec upsert
      const { error } = await (supabase as any)
        .from('user_module_permissions')
        .upsert(duplicateData, {
          onConflict: 'user_id,module_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;

      const targetUser = targetUsers.find((u) => u.id === selectedTargetId);
      toast.success(
        `${sourceModules.length} module(s) dupliqué(s) vers ${targetUser?.firstName} ${targetUser?.lastName}`
      );
      onClose();
    } catch (error: any) {
      toast.error('Erreur lors de la duplication', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin_groupe: 'Admin Groupe',
      proviseur: 'Proviseur',
      directeur: 'Directeur',
      enseignant: 'Enseignant',
      cpe: 'CPE',
      comptable: 'Comptable',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin_groupe: 'bg-blue-100 text-blue-700 border-blue-200',
      proviseur: 'bg-green-100 text-green-700 border-green-200',
      directeur: 'bg-green-100 text-green-700 border-green-200',
      enseignant: 'bg-orange-100 text-orange-700 border-orange-200',
      cpe: 'bg-purple-100 text-purple-700 border-purple-200',
      comptable: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (!sourceUser) return null;

  // Filtrer les utilisateurs cibles (exclure l'utilisateur source)
  const availableTargets = targetUsers.filter((u) => u.id !== sourceUser.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Copy className="h-6 w-6 text-[#2A9D8F]" />
              Dupliquer les permissions
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Utilisateur source */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">Copier depuis :</p>
          <div className="flex items-center gap-3">
            {(sourceUser as any).photoUrl || (sourceUser as any).avatar ? (
              <img
                src={(sourceUser as any).photoUrl || (sourceUser as any).avatar}
                alt={`${sourceUser.firstName} ${sourceUser.lastName}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6e] text-white flex items-center justify-center text-lg font-bold shadow-md">
                {sourceUser.firstName[0]}{sourceUser.lastName[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">
                {sourceUser.firstName} {sourceUser.lastName}
              </p>
              <Badge variant="outline" className={getRoleBadgeColor(sourceUser.role)}>
                {getRoleLabel(sourceUser.role)}
              </Badge>
            </div>
          </div>

          {loadingModules ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des modules...
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-blue-600 text-white">
                {sourceModules.length} module(s)
              </Badge>
              <span className="text-sm text-gray-600">à dupliquer</span>
            </div>
          )}
        </div>

        {/* Sélection utilisateur cible */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sélectionnez l'utilisateur cible :
          </p>

          {availableTargets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun utilisateur disponible</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableTargets.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedTargetId(user.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTargetId === user.id
                      ? 'border-[#2A9D8F] bg-gradient-to-r from-teal-50 to-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(user as any).photoUrl || (user as any).avatar ? (
                        <img
                          src={(user as any).photoUrl || (user as any).avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center text-sm font-bold">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      {user.assignedModulesCount !== undefined && (
                        <Badge variant="secondary">
                          {user.assignedModulesCount} module(s)
                        </Badge>
                      )}
                      {selectedTargetId === user.id && (
                        <CheckCircle2 className="h-5 w-5 text-[#2A9D8F]" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!selectedTargetId || isLoading || sourceModules.length === 0}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6e] hover:from-[#238276] hover:to-[#165e54] text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Duplication...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer ({sourceModules.length} modules)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
