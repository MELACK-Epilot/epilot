/**
 * Dialog de suppression sécurisée d'un plan
 * Affiche les dépendances et propose archivage ou suppression
 * @module PlanDeletionDialog
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Archive,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  useCheckPlanDependencies,
  useDeletePlanSafely,
  useArchivePlan,
} from '../../hooks/usePlanDeletion';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanDeletionDialogProps {
  plan: PlanWithContent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlanDeletionDialog = ({
  plan,
  isOpen,
  onClose,
}: PlanDeletionDialogProps) => {
  const [reason, setReason] = useState('');
  const [confirmForce, setConfirmForce] = useState(false);

  const { data: dependencies, isLoading: loadingDeps } = useCheckPlanDependencies(plan?.id);
  const deletePlan = useDeletePlanSafely();
  const archivePlan = useArchivePlan();

  const hasActiveSubscriptions = dependencies?.some(
    (dep) => dep.dependencyType === 'active_subscriptions' && dep.count > 0
  );

  const hasDependencies = dependencies?.some((dep) => dep.count > 0) ?? false;

  const handleArchive = async () => {
    if (!plan) return;

    await archivePlan.mutateAsync({
      planId: plan.id,
      reason: reason || undefined,
    });

    onClose();
    setReason('');
  };

  const handleDelete = async (force: boolean = false) => {
    if (!plan) return;

    await deletePlan.mutateAsync({
      planId: plan.id,
      force,
      reason: reason || undefined,
    });

    onClose();
    setReason('');
    setConfirmForce(false);
  };

  const getDependencyIcon = (canDelete: boolean, count: number) => {
    if (count === 0) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (!canDelete) return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertCircle className="h-4 w-4 text-orange-600" />;
  };

  const getActionButtons = () => {
    const isLoading = deletePlan.isPending || archivePlan.isPending;

    // 1. Si abonnements actifs → Archiver ou Forcer
    if (hasActiveSubscriptions) {
      return (
        <>
          {/* Archiver (recommandé) */}
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={isLoading}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {archivePlan.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archiver (recommandé)
          </Button>

          {/* Forcer la suppression */}
          {!confirmForce ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmForce(true)}
              disabled={isLoading}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Forcer la suppression
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => handleDelete(true)}
              disabled={isLoading}
              className="bg-red-700 hover:bg-red-800"
            >
              {deletePlan.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Confirmer la suppression forcée
            </Button>
          )}
        </>
      );
    }

    // 2. Si pas d'abonnements actifs mais des dépendances → Supprimer ou Archiver
    if (hasDependencies) {
      return (
        <>
          {/* Archiver */}
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={isLoading}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {archivePlan.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archiver
          </Button>

          {/* Supprimer définitivement */}
          <Button
            variant="destructive"
            onClick={() => handleDelete(false)}
            disabled={isLoading}
          >
            {deletePlan.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer définitivement
          </Button>
        </>
      );
    }

    // 3. Si aucune dépendance → Supprimer ou Archiver
    return (
      <>
        {/* Archiver */}
        <Button
          variant="outline"
          onClick={handleArchive}
          disabled={isLoading}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          {archivePlan.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Archive className="h-4 w-4 mr-2" />
          )}
          Archiver
        </Button>

        {/* Supprimer définitivement */}
        <Button
          variant="destructive"
          onClick={() => handleDelete(false)}
          disabled={isLoading}
        >
          {deletePlan.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Supprimer définitivement
        </Button>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            Supprimer le plan "{plan?.name}"
          </DialogTitle>
          <DialogDescription>
            Choisissez le type de suppression selon vos besoins
          </DialogDescription>
        </DialogHeader>

        {/* Vérification des dépendances */}
        <div className="space-y-4">
          {loadingDeps ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Liste des dépendances */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Dépendances détectées :</Label>
                {dependencies?.map((dep, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border"
                  >
                    {getDependencyIcon(dep.canDelete, dep.count)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {dep.dependencyType === 'active_subscriptions' && 'Abonnements actifs'}
                          {dep.dependencyType === 'plan_modules' && 'Modules assignés'}
                          {dep.dependencyType === 'plan_categories' && 'Catégories assignées'}
                          {dep.dependencyType === 'inactive_subscriptions' && 'Historique'}
                        </span>
                        <Badge variant={dep.count === 0 ? 'outline' : 'default'}>
                          {dep.count}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{dep.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alertes contextuelles */}
              {hasActiveSubscriptions && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Abonnements actifs détectés :</strong> L'archivage est recommandé.
                    La suppression forcée annulera les abonnements actifs.
                  </AlertDescription>
                </Alert>
              )}

              {hasDependencies && !hasActiveSubscriptions && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Dépendances détectées :</strong> Les modules et catégories seront supprimés en cascade.
                    L'archivage permet de les conserver.
                  </AlertDescription>
                </Alert>
              )}

              {!hasDependencies && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Aucune dépendance :</strong> Ce plan peut être supprimé ou archivé sans risque.
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmation force */}
              {hasActiveSubscriptions && confirmForce && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Confirmation requise :</strong> Vous êtes sur le point de forcer la
                    suppression. Les abonnements actifs seront annulés automatiquement.
                    Cette action est IRRÉVERSIBLE.
                  </AlertDescription>
                </Alert>
              )}

              {/* Raison */}
              <div className="space-y-2">
                <Label htmlFor="reason">Raison {hasActiveSubscriptions ? '' : '(optionnel)'}</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    hasActiveSubscriptions
                      ? "Ex: Migration vers nouveau plan, Plan obsolète..."
                      : "Ex: Plan jamais utilisé, Test..."
                  }
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={deletePlan.isPending || archivePlan.isPending}>
            Annuler
          </Button>

          {getActionButtons()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDeletionDialog;
