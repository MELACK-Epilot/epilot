/**
 * Composant panier de ressources avec gestion des items
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Upload,
  FileText,
  X,
  Printer,
  Send,
} from 'lucide-react';
import type { CartItem, UploadedFile } from './resource-request.types';

interface ResourceCartProps {
  cart: CartItem[];
  uploadedFiles: UploadedFile[];
  generalNotes: string;
  isSending: boolean;
  calculateTotal: () => number;
  formatPrice: (price: number) => string;
  onUpdateQuantity: (resourceId: string, quantity: number) => void;
  onUpdateUnitPrice: (resourceId: string, price: number) => void;
  onUpdateJustification: (resourceId: string, justification: string) => void;
  onRemoveFromCart: (resourceId: string) => void;
  onSetGeneralNotes: (notes: string) => void;
  onFileUpload: () => void;
  onRemoveFile: (fileId: string) => void;
  onPrint: () => void;
  onSubmit: () => void;
}

export const ResourceCart = ({
  cart,
  uploadedFiles,
  generalNotes,
  isSending,
  calculateTotal,
  formatPrice,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onUpdateJustification,
  onRemoveFromCart,
  onSetGeneralNotes,
  onFileUpload,
  onRemoveFile,
  onPrint,
  onSubmit,
}: ResourceCartProps) => {
  return (
    <div className="space-y-4">
      <div className="sticky top-0">
        {/* En-tête panier */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Panier
            </h3>
            <Badge className="bg-green-500">{cart.length}</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Total estimé: <span className="font-bold text-green-600">{formatPrice(calculateTotal())}</span>
          </p>
        </div>

        {/* Contenu panier */}
        <div className="border rounded-lg max-h-64 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Panier vide</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item.resource.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {item.resource.name}
                      </p>
                      <p className="text-xs font-bold text-green-600">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(item.resource.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quantité */}
                  <div className="space-y-2">
                    <Label className="text-xs">Quantité</Label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.resource.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.resource.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center h-8"
                        min="1"
                      />
                      <button
                        onClick={() => onUpdateQuantity(item.resource.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Prix unitaire */}
                  <div className="space-y-1">
                    <Label className="text-xs">Prix unitaire (FCFA)</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateUnitPrice(item.resource.id, parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                      step="100"
                      placeholder="0"
                    />
                  </div>

                  {/* Justification */}
                  <Textarea
                    placeholder="Justification (optionnel)..."
                    value={item.justification}
                    onChange={(e) => onUpdateJustification(item.resource.id, e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes générales */}
        <div className="space-y-2 mb-4">
          <Label className="text-sm">Notes générales</Label>
          <Textarea
            placeholder="Ajoutez des informations complémentaires..."
            value={generalNotes}
            onChange={(e) => onSetGeneralNotes(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        {/* Fichiers joints */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Documents (optionnel)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFileUpload}
              className="gap-2 h-8"
            >
              <Upload className="h-3 w-3" />
              Ajouter
            </Button>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="space-y-1">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={onPrint}
            variant="outline"
            className="w-full gap-2"
            disabled={cart.length === 0}
          >
            <Printer className="h-4 w-4" />
            Imprimer l'état
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSending || cart.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 gap-2"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Soumettre l'état
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
