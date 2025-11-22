import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { getRoleBadgeClass } from '@/lib/colors';
import type { User } from '../../types/dashboard.types';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  confirmDelete: () => void;
  isDeleting: boolean;
}

export const DeleteUserDialog = ({
  open,
  onOpenChange,
  selectedUser,
  confirmDelete,
  isDeleting
}: DeleteUserDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription>
            Cette action va supprimer définitivement l'utilisateur. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        {selectedUser && (
          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <UserAvatar
                firstName={selectedUser.firstName}
                lastName={selectedUser.lastName}
                avatar={selectedUser.avatar}
                size="lg"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <Badge className={getRoleBadgeClass(selectedUser.role)} size="sm">
                  {selectedUser.role === 'super_admin' ? 'Super Admin' : 
                   selectedUser.role === 'admin_groupe' ? 'Admin Groupe' : 
                   selectedUser.role}
                </Badge>
              </div>
            </div>
            
            {/* Avertissement spécifique pour Admin Groupe */}
            {selectedUser.role === 'admin_groupe' && (
              <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <p className="text-sm text-orange-900 font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  🚨 SUPPRESSION D'UN ADMIN DE GROUPE
                </p>
                <ul className="text-sm text-orange-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Toutes les écoles de son groupe seront orphelines</li>
                  <li>Tous les utilisateurs du groupe perdront leur admin</li>
                  <li>Les données du groupe resteront mais sans gestionnaire</li>
                  <li>Cette action nécessite une extrême prudence</li>
                </ul>
              </div>
            )}
            
            {/* Avertissement pour utilisateurs d'école */}
            {selectedUser.role !== 'super_admin' && selectedUser.role !== 'admin_groupe' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  ℹ️ Suppression d'un utilisateur d'école
                </p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Ses modules assignés seront retirés</li>
                  <li>Son profil d'accès sera supprimé</li>
                  <li>Ses données personnelles seront effacées</li>
                </ul>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ ATTENTION : Cette action est irréversible !
              </p>
              <p className="text-sm text-red-700 mt-1">
                L'utilisateur et toutes ses données seront définitivement supprimés de la base de données.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
