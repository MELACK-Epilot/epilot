/**
 * Dialog de confirmation pour les conflits de profils
 * @module assign-profile/components/ConflictAlertDialog
 */

import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { UserWithProfile } from '../types';

interface ConflictAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingUsers: UserWithProfile[];
  targetProfileName: string;
  targetProfileCode: string;
  onConfirm: () => void;
  isSaving: boolean;
}

export const ConflictAlertDialog = ({
  isOpen,
  onOpenChange,
  conflictingUsers,
  targetProfileName,
  targetProfileCode,
  onConfirm,
  isSaving,
}: ConflictAlertDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Modification de profils existants
          </AlertDialogTitle>
          <AlertDialogDescription>
            {conflictingUsers.length} utilisateur(s) ont déjà un profil assigné.
            Cette action va remplacer leur profil actuel par{' '}
            <span className="font-bold text-gray-900">{targetProfileName}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 border rounded-lg bg-gray-50 max-h-[200px] overflow-auto">
          <div className="p-3 space-y-2">
            {conflictingUsers.slice(0, 10).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 bg-white rounded border text-sm"
              >
                <span className="font-medium truncate">
                  {user.firstName} {user.lastName}
                </span>
                <div className="flex items-center gap-1 text-xs shrink-0">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    {user.currentProfileCode}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <Badge className="bg-blue-100 text-blue-700">
                    {targetProfileCode}
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
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirmer ({conflictingUsers.length})
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
