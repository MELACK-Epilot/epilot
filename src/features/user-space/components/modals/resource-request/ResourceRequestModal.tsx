/**
 * Modal principal d'état des besoins - Version refactorisée
 * Orchestration des composants et de la logique métier
 */

import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { ResourceCatalog } from './ResourceCatalog';
import { ResourceCart } from './ResourceCart';
import { useResourceRequest } from './useResourceRequest';
import type { ResourceRequestModalProps } from './resource-request.types';

export const ResourceRequestModal = ({ isOpen, onClose, schoolName }: ResourceRequestModalProps) => {
  const {
    cart,
    uploadedFiles,
    generalNotes,
    isSending,
    setGeneralNotes,
    addToCart,
    updateQuantity,
    updateJustification,
    updateUnitPrice,
    removeFromCart,
    calculateTotal,
    handleFileUpload,
    removeFile,
    submitRequest,
    resetForm,
  } = useResourceRequest();

  // Formater le prix
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  // Imprimer
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Soumettre
  const handleSubmit = useCallback(() => {
    submitRequest(onClose);
  }, [submitRequest, onClose]);

  // Fermer et réinitialiser
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">État des Besoins</DialogTitle>
              <DialogDescription>
                Établissez l'état des besoins en ressources pour {schoolName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Catalogue de ressources - 2/3 */}
          <div className="lg:col-span-2">
            <ResourceCatalog
              cart={cart}
              onAddToCart={addToCart}
              formatPrice={formatPrice}
            />
          </div>

          {/* Panier - 1/3 */}
          <div>
            <ResourceCart
              cart={cart}
              uploadedFiles={uploadedFiles}
              generalNotes={generalNotes}
              isSending={isSending}
              calculateTotal={calculateTotal}
              formatPrice={formatPrice}
              onUpdateQuantity={updateQuantity}
              onUpdateUnitPrice={updateUnitPrice}
              onUpdateJustification={updateJustification}
              onRemoveFromCart={removeFromCart}
              onSetGeneralNotes={setGeneralNotes}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
              onPrint={handlePrint}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {/* Note informative */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">
              État des besoins
            </p>
            <p className="text-xs text-blue-700">
              Sélectionnez les ressources nécessaires, précisez les quantités et justifications.
              Vous pouvez joindre des documents complémentaires et imprimer l'état avant l'envoi.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
