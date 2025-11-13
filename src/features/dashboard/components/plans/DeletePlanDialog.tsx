/**
 * Dialog moderne pour supprimer définitivement un plan
 * @module DeletePlanDialog
 */

import { useState } from 'react';
import { Trash2, AlertTriangle, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DeletePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  planName: string;
  planPrice: number;
  planCurrency: string;
  hasActiveSubscriptions: boolean;
  activeSubscriptionsCount?: number;
}

export const DeletePlanDialog = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planPrice,
  planCurrency,
  hasActiveSubscriptions,
  activeSubscriptionsCount = 0,
}: DeletePlanDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isConfirmValid = confirmText.toLowerCase() === 'supprimer';

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header avec gradient rouge */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white relative overflow-hidden">
                {/* Cercles décoratifs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                {/* Bouton fermer */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icône et titre */}
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Supprimer le Plan</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Action irréversible et définitive
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu avec scroll */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Avertissement principal */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 mb-2 text-lg">
                        ⚠️ Attention : Suppression Définitive
                      </h3>
                      <p className="text-sm text-red-700 font-medium">
                        Cette action est <span className="font-bold underline">irréversible</span>. 
                        Toutes les données liées à ce plan seront perdues définitivement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informations du plan */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Plan à supprimer
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nom :</span>
                      <Badge variant="outline" className="font-semibold">
                        {planName}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Prix :</span>
                      <span className="font-semibold text-gray-900">
                        {planPrice === 0 ? 'Gratuit' : `${planPrice.toLocaleString()} ${planCurrency}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vérification des abonnements actifs */}
                {hasActiveSubscriptions && (
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-900 mb-1">
                          🚫 Suppression Bloquée
                        </h4>
                        <p className="text-sm text-orange-700">
                          <span className="font-bold">{activeSubscriptionsCount}</span> groupe(s) 
                          scolaire(s) sont actuellement abonnés à ce plan.
                        </p>
                        <p className="text-xs text-orange-600 mt-2">
                          Veuillez d'abord désactiver ou changer leurs abonnements.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conséquences */}
                {!hasActiveSubscriptions && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Conséquences de la suppression :
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Le plan sera <strong>supprimé définitivement</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Toutes les <strong>configurations</strong> seront perdues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Les <strong>modules et catégories</strong> assignés seront supprimés</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>Cette action <strong>ne peut pas être annulée</strong></span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Confirmation par texte */}
                {!hasActiveSubscriptions && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-900 mb-2 block">
                        Pour confirmer, tapez <span className="text-red-600 font-bold">SUPPRIMER</span> :
                      </span>
                      <Input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Tapez SUPPRIMER"
                        className="border-2 border-gray-300 focus:border-red-500"
                        disabled={isLoading}
                      />
                    </label>
                    {confirmText && !isConfirmValid && (
                      <p className="text-xs text-red-600">
                        ⚠️ Veuillez taper exactement "SUPPRIMER" pour confirmer
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions - Fixe en bas */}
              <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t bg-gray-50">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading || !isConfirmValid || hasActiveSubscriptions}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer Définitivement
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeletePlanDialog;
