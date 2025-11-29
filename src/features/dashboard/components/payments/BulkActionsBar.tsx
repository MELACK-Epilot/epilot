/**
 * Barre d'actions groupées pour les paiements
 * @module BulkActionsBar
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RefreshCw, Download, X, Mail, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onValidate?: () => void;
  onRefund?: () => void;
  onExport?: () => void;
  onSendEmail?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const BulkActionsBar = ({
  selectedCount,
  onValidate,
  onRefund,
  onExport,
  onSendEmail,
  onDelete,
  onClear,
  isLoading = false,
}: BulkActionsBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 flex items-center gap-3 max-w-fit">
            {/* Compteur */}
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </Badge>
              {onClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onValidate && (
                <Button
                  size="sm"
                  onClick={onValidate}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              )}

              {onRefund && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefund}
                  disabled={isLoading}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rembourser
                </Button>
              )}

              {onSendEmail && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSendEmail}
                  disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer Email
                </Button>
              )}

              {onExport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExport}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
