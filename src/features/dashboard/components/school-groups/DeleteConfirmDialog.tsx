/**
 * Boîte de dialogue professionnelle pour confirmer la suppression d'un groupe scolaire
 */

import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { SchoolGroup } from '../../types/dashboard.types';

interface DeleteConfirmDialogProps {
  group: SchoolGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog = ({
  group,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) => {
  if (!group) return null;

  const hasData = group.schoolCount > 0 || group.studentCount > 0 || group.staffCount > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl">
                Supprimer le groupe scolaire ?
              </AlertDialogTitle>
            </div>
          </div>
          
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-4">
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                <p className="font-semibold text-gray-900 mb-1">{group.name}</p>
                <p className="text-sm text-gray-600">Code : {group.code}</p>
                <p className="text-sm text-gray-600">Région : {group.region}</p>
              </div>

              {hasData && (
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex gap-2 mb-2">
                    <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 mb-2">
                        Attention : Données associées
                      </p>
                      <ul className="space-y-1 text-sm text-amber-800">
                        {group.schoolCount > 0 && (
                          <li>• {group.schoolCount} école(s)</li>
                        )}
                        {group.studentCount > 0 && (
                          <li>• {group.studentCount} élève(s)</li>
                        )}
                        {group.staffCount > 0 && (
                          <li>• {group.staffCount} membre(s) du personnel</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Cette action est <span className="font-bold">irréversible</span>
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Toutes les données associées seront définitivement supprimées de la base de données.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
