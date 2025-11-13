/**
 * BARRE D'ACTIONS GROUPÉES POUR DÉPENSES
 * Actions bulk modernes avec animations
 * @module BulkExpenseActions
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Download, Printer, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkExpenseActionsProps {
  selectedCount: number;
  onApprove?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const BulkExpenseActions = ({
  selectedCount,
  onApprove,
  onExport,
  onPrint,
  onDelete,
  onClear,
  isLoading = false,
}: BulkExpenseActionsProps) => {
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
              {onApprove && (
                <Button
                  size="sm"
                  onClick={onApprove}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              )}

              {onExport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExport}
                  disabled={isLoading}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              )}

              {onPrint && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrint}
                  disabled={isLoading}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
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
