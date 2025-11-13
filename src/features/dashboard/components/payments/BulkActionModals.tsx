/**
 * MODALS MODERNES POUR ACTIONS BULK
 * Popups élégants pour toutes les actions groupées
 * @module BulkActionModals
 */

import { X, CheckCircle2, RefreshCw, Download, Mail, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

// =====================================================
// MODAL DE CONFIRMATION
// =====================================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'warning' | 'danger';
  icon?: any;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  icon: Icon = AlertCircle,
}: ConfirmModalProps) => {
  const colors = {
    success: {
      bg: 'from-green-600 to-green-700',
      icon: 'bg-green-100 text-green-600',
      button: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
    },
    warning: {
      bg: 'from-orange-600 to-orange-700',
      icon: 'bg-orange-100 text-orange-600',
      button: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
    },
    danger: {
      bg: 'from-red-600 to-red-700',
      icon: 'bg-red-100 text-red-600',
      button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
    },
  };

  const config = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${config.bg} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${config.icon} rounded-xl`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 text-lg">{message}</p>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 ${config.button} text-white`}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// =====================================================
// MODAL D'EXPORT
// =====================================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  count: number;
}

export const ExportModal = ({ isOpen, onClose, onExport, count }: ExportModalProps) => {
  const formats = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Format tableur compatible Excel',
      icon: FileText,
      color: 'from-blue-600 to-blue-700',
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Fichier .xlsx avec mise en forme',
      icon: FileText,
      color: 'from-green-600 to-green-700',
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Document PDF imprimable',
      icon: FileText,
      color: 'from-red-600 to-red-700',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Exporter les paiements</h3>
                      <p className="text-white/80 text-sm mt-1">
                        {count} paiement{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                {formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => {
                        onExport(format.id as any);
                        onClose();
                      }}
                      className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border border-gray-200 transition-all hover:shadow-md group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-gradient-to-r ${format.color} rounded-lg text-white group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-gray-900">{format.name}</h4>
                          <p className="text-sm text-gray-600">{format.description}</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// =====================================================
// MODAL DE SUCCÈS
// =====================================================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: any;
}

export const SuccessModal = ({
  isOpen,
  onClose,
  title,
  message,
  icon: Icon = CheckCircle2,
}: SuccessModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 text-lg">{message}</p>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0">
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
