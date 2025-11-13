/**
 * Dialog moderne pour confirmer la suppression d'un abonnement
 * Design moderne avec Shadcn/UI et Framer Motion
 * @module DeleteSubscriptionDialog
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  subscription: any;
}

export const DeleteSubscriptionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  subscription,
}: DeleteSubscriptionDialogProps) => {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm(reason);
    setIsDeleting(false);
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setConfirmText('');
    onClose();
  };

  const isConfirmValid = confirmText.toLowerCase() === 'supprimer';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header avec gradient rouge */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
            >
              <AlertTriangle className="w-6 h-6" />
            </motion.div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Supprimer l'abonnement
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-1">
                Cette action est irréversible
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informations de l'abonnement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Vous êtes sur le point de supprimer :
                </p>
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-semibold">{subscription?.schoolGroup?.name}</span>
                  {' - '}
                  <span>{subscription?.plan?.name}</span>
                  {' - '}
                  <span>{subscription?.amount?.toLocaleString()} FCFA</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Raison de suppression */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="reason" className="text-sm font-medium">
              Raison de la suppression (optionnel)
            </Label>
            <Input
              id="reason"
              placeholder="Ex: Annulation demandée par le client..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full"
            />
          </motion.div>

          {/* Confirmation par texte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label htmlFor="confirm" className="text-sm font-medium">
              Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
            </Label>
            <Input
              id="confirm"
              placeholder="SUPPRIMER"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={`w-full ${
                confirmText && !isConfirmValid
                  ? 'border-red-300 focus:border-red-500'
                  : ''
              }`}
            />
            {confirmText && !isConfirmValid && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-600"
              >
                Le texte ne correspond pas
              </motion.p>
            )}
          </motion.div>

          {/* Avertissement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Attention :</span> Cette action supprimera définitivement
              l'abonnement et toutes ses données associées. Cette action ne peut pas être annulée.
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
