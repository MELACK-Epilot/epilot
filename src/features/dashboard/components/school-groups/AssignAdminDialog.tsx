/**
 * Dialog pour assigner un administrateur à un groupe scolaire
 * Architecture Option B : users.school_group_id → school_groups.id
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useAssignAdminToGroup } from '../../hooks/useAssignAdminToGroup';
import type { SchoolGroup } from '../../types/dashboard.types';
import { toast } from 'sonner';

interface AssignAdminDialogProps {
  group: SchoolGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignAdminDialog = ({ group, isOpen, onClose }: AssignAdminDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Récupérer les utilisateurs disponibles (sans groupe assigné)
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    status: 'active',
    page: 1,
    pageSize: 100,
  });

  // Hook pour assigner l'admin
  const assignAdmin = useAssignAdminToGroup();

  // Filtrer les utilisateurs disponibles
  const availableUsers = useMemo(() => {
    if (!usersData?.users) return [];

    return usersData.users.filter((user) => {
      // Exclure les super_admin
      if (user.role === 'super_admin') return false;

      // Exclure les utilisateurs déjà assignés à un autre groupe
      if (user.schoolGroupId && user.schoolGroupId !== group?.id) return false;

      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      }

      return true;
    });
  }, [usersData?.users, searchQuery, group?.id]);

  const handleAssign = async () => {
    if (!selectedUserId || !group) return;

    try {
      const result = await assignAdmin.mutateAsync({
        userId: selectedUserId,
        schoolGroupId: group.id,
      });

      toast.success('Administrateur assigné', {
        description: result.message,
      });

      onClose();
      setSelectedUserId('');
      setSearchQuery('');
    } catch (error: any) {
      toast.error('Erreur d\'assignation', {
        description: error.message || 'Impossible d\'assigner l\'administrateur',
      });
    }
  };

  const selectedUser = useMemo(() => {
    return availableUsers.find((u) => u.id === selectedUserId);
  }, [availableUsers, selectedUserId]);

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#2A9D8F]" />
            Assigner un administrateur
          </DialogTitle>
          <DialogDescription>
            Groupe : <strong>{group.name}</strong> ({group.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Administrateur actuel */}
          {group.adminName && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Administrateur actuel :</strong> {group.adminName} ({group.adminEmail})
              </AlertDescription>
            </Alert>
          )}

          {/* Recherche */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher un utilisateur</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Nom, prénom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sélection utilisateur */}
          <div className="space-y-2">
            <Label htmlFor="user-select">Sélectionner un utilisateur</Label>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2A9D8F]" />
              </div>
            ) : availableUsers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchQuery
                    ? 'Aucun utilisateur trouvé avec ces critères'
                    : 'Aucun utilisateur disponible. Créez d\'abord un utilisateur avec le rôle "Administrateur de Groupe".'}
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un utilisateur..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white text-xs font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Prévisualisation */}
          {selectedUser && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> sera assigné comme administrateur du groupe <strong>{group.name}</strong>.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assignAdmin.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || assignAdmin.isPending}
            className="bg-[#2A9D8F] hover:bg-[#238276]"
          >
            {assignAdmin.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assignation...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Assigner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
