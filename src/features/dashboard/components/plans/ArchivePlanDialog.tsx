/**
 * Dialog moderne pour archiver un plan actif
 * @module ArchivePlanDialog
 */

import { useState } from 'react';
import { Archive, AlertCircle, CheckCircle2, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArchivePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  planName: string;
  planPrice: number;
  planCurrency: string;
  hasActiveSubscriptions: boolean;
  activeSubscriptionsCount?: number;
  subscriptionNames?: string[];
}

export const ArchivePlanDialog = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planPrice,
  planCurrency,
  hasActiveSubscriptions,
  activeSubscriptionsCount = 0,
  subscriptionNames = [],
}: ArchivePlanDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
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
              {/* Header avec gradient orange */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white relative overflow-hidden">
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
                    <Archive className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Archiver le Plan</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Désactiver temporairement ce plan
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
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl" />
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-orange-500/20 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                        <Archive className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-3 text-lg">
                          📋 Plan à Archiver
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Nom du plan</span>
                            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-md">
                              {planName}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Tarification</span>
                            <span className="font-bold text-orange-600 text-lg">
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

                {/* Vérification des abonnements actifs */}
                {hasActiveSubscriptions ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border-2 border-red-200 shadow-md"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900 text-lg">
                          ⚠️ Archivage Bloqué
                        </h4>
                        <p className="text-xs text-red-700 mt-1">
                          Des groupes sont actuellement abonnés
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-semibold mb-2">
                        {activeSubscriptionsCount} groupe(s) scolaire(s) abonné(s) :
                      </p>
                      <ul className="space-y-1">
                        {subscriptionNames.slice(0, 3).map((name, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            {name}
                          </li>
                        ))}
                        {activeSubscriptionsCount > 3 && (
                          <li className="text-xs text-red-600 italic">
                            ... et {activeSubscriptionsCount - 3} autre(s)
                          </li>
                        )}
                      </ul>
                      <p className="text-xs text-red-600 mt-3 font-medium">
                        → Veuillez d'abord désactiver ou changer leurs abonnements.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Conséquences de l'archivage */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 rounded-xl p-5 border-2 border-blue-200 shadow-md"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-lg">
                          <Info className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 text-lg">
                            📌 Que va-t-il se passer ?
                          </h4>
                          <p className="text-xs text-blue-700 mt-1">
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
                          <div className="mt-0.5 p-1 bg-blue-100 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Plan désactivé</p>
                            <p className="text-xs text-gray-600">Le plan ne sera plus visible dans la liste active</p>
                          </div>
                        </motion.li>
                        <motion.li
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-start gap-3 p-2 bg-white/60 rounded-lg"
                        >
                          <div className="mt-0.5 p-1 bg-blue-100 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Nouvelles souscriptions bloquées</p>
                            <p className="text-xs text-gray-600">Les groupes ne pourront plus s'abonner</p>
                          </div>
                        </motion.li>
                        <motion.li
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-start gap-3 p-2 bg-white/60 rounded-lg"
                        >
                          <div className="mt-0.5 p-1 bg-blue-100 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Données conservées</p>
                            <p className="text-xs text-gray-600">Toutes les configurations sont préservées</p>
                          </div>
                        </motion.li>
                      </ul>
                    </motion.div>

                    {/* Note de restauration */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-700">
                        <span className="font-semibold">Action réversible :</span> Vous pourrez restaurer ce plan à tout moment depuis "Plans Archivés".
                      </p>
                    </motion.div>
                  </>
                )}
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
                  disabled={isLoading || hasActiveSubscriptions}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Archivage...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver le Plan
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

export default ArchivePlanDialog;
