/**
 * Dialog moderne pour restaurer un plan archivé
 * @module RestorePlanDialog
 */

import { useState } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RestorePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  planName: string;
  planPrice: number;
  planCurrency: string;
}

export const RestorePlanDialog = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planPrice,
  planCurrency,
}: RestorePlanDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
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
              {/* Header avec gradient */}
              <div className="bg-gradient-to-br from-[#2A9D8F] to-[#1D8A7E] p-6 text-white relative overflow-hidden">
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
                    <RotateCcw className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Restaurer le Plan</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Réactiver ce plan d'abonnement
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu avec scroll */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Carte du plan avec animation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/10 to-[#1D8A7E]/10 rounded-xl" />
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-[#2A9D8F]/20 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-[#2A9D8F] to-[#1D8A7E] rounded-xl shadow-lg">
                        <RotateCcw className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-3 text-lg">
                          📋 Informations du Plan
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Nom du plan</span>
                            <Badge className="bg-gradient-to-r from-[#2A9D8F] to-[#1D8A7E] text-white border-0 shadow-md">
                              {planName}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Tarification</span>
                            <span className="font-bold text-[#2A9D8F] text-lg">
                              {planPrice === 0 ? (
                                <span className="text-green-600">Gratuit</span>
                              ) : (
                                `${planPrice.toLocaleString()} ${planCurrency}`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Avantages de la restauration */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-green-200 shadow-md"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 text-lg">
                        ✨ Que va-t-il se passer ?
                      </h4>
                      <p className="text-xs text-green-700 mt-1">
                        Voici les changements qui seront appliqués
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    <motion.li
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start gap-3 p-2 bg-white/60 rounded-lg"
                    >
                      <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Réactivation immédiate</p>
                        <p className="text-xs text-gray-600">Le plan sera actif dès maintenant</p>
                      </div>
                    </motion.li>
                    <motion.li
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-start gap-3 p-2 bg-white/60 rounded-lg"
                    >
                      <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Visible dans les plans actifs</p>
                        <p className="text-xs text-gray-600">Apparaîtra dans la liste principale</p>
                      </div>
                    </motion.li>
                    <motion.li
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-start gap-3 p-2 bg-white/60 rounded-lg"
                    >
                      <div className="mt-0.5 p-1 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Disponible pour souscription</p>
                        <p className="text-xs text-gray-600">Les groupes scolaires pourront s'abonner</p>
                      </div>
                    </motion.li>
                  </ul>
                </motion.div>

                {/* Note informative */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Action réversible :</span> Vous pourrez archiver ce plan à nouveau si nécessaire.
                  </p>
                </motion.div>
              </div>

              {/* Actions - Fixe en bas */}
              <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t bg-gray-50 pt-4">
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
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#1D8A7E] hover:from-[#1D8A7E] hover:to-[#2A9D8F] text-white"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Restauration...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurer le Plan
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

export default RestorePlanDialog;
