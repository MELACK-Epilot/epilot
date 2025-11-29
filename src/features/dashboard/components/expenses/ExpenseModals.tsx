/**
 * MODALS MODERNES POUR DÉPENSES
 * Création, édition, détails, export
 * @module ExpenseModals
 */

import React from 'react';
import { X, Plus, Download, CheckCircle2, AlertCircle, FileText, Clock, CheckCircle, Calendar, Building2, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Catégories
const CATEGORIES = {
  salaires: { label: 'Salaires', color: '#2A9D8F', icon: '👥' },
  fournitures: { label: 'Fournitures', color: '#E9C46A', icon: '📦' },
  infrastructure: { label: 'Infrastructure', color: '#457B9D', icon: '🏗️' },
  utilities: { label: 'Services publics', color: '#F4A261', icon: '⚡' },
  transport: { label: 'Transport', color: '#E76F51', icon: '🚗' },
  marketing: { label: 'Marketing', color: '#EC4899', icon: '📢' },
  formation: { label: 'Formation', color: '#8B5CF6', icon: '🎓' },
  autres: { label: 'Autres', color: '#6B7280', icon: '📋' },
};

// =====================================================
// MODAL CRÉATION DÉPENSE
// =====================================================

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

export const CreateExpenseModal = ({ isOpen, onClose, onCreate }: CreateExpenseModalProps) => {
  const [formData, setFormData] = React.useState({
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'cash',
  });

  const handleSubmit = () => {
    if (!formData.amount || !formData.category || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onCreate(formData);
    onClose();
  };

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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Nouvelle Dépense</h3>
                      <p className="text-white/80 text-sm mt-1">Enregistrer une nouvelle dépense</p>
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
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Montant (FCFA) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Ex: 50000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                          <SelectItem key={key} value={key}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Méthode de paiement *</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="check">Chèque</SelectItem>
                        <SelectItem value="card">Carte bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez la dépense..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la dépense
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
// MODAL EXPORT
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
                      <h3 className="text-xl font-bold">Exporter les dépenses</h3>
                      <p className="text-white/80 text-sm mt-1">
                        {count} dépense{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}
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
// MODAL SUCCÈS
// =====================================================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const SuccessModal = ({ isOpen, onClose, title, message }: SuccessModalProps) => {
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
                      <CheckCircle2 className="w-6 h-6" />
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

// =====================================================
// MODAL CONFIRMATION SUPPRESSION
// =====================================================

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expense: any;
}

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, expense }: DeleteConfirmModalProps) => {
  if (!expense) return null;

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
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Confirmer la suppression</h3>
                      <p className="text-white/80 text-sm mt-1">Cette action est irréversible</p>
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
              <div className="p-6">
                <p className="text-gray-700 text-lg mb-4">
                  Êtes-vous sûr de vouloir supprimer cette dépense ?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Référence :</span>
                    <span className="font-semibold">{expense.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant :</span>
                    <span className="font-semibold text-red-600">
                      {(expense.amount || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description :</span>
                    <span className="font-semibold truncate max-w-[200px]">
                      {expense.description}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Supprimer
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
// MODAL CONFIRMATION APPROBATION
// =====================================================

interface ApproveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export const ApproveConfirmModal = ({ isOpen, onClose, onConfirm, count }: ApproveConfirmModalProps) => {
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
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Approuver les dépenses</h3>
                      <p className="text-white/80 text-sm mt-1">{count} dépense{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}</p>
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
              <div className="p-6">
                <p className="text-gray-700 text-lg">
                  Confirmer l'approbation de {count} dépense{count > 1 ? 's' : ''} ?
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Les dépenses seront marquées comme "Payées"
                </p>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approuver
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
// MODAL DÉTAILS DÉPENSE
// =====================================================

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  onEdit?: (expense: any) => void;
  onApprove?: (expense: any) => void;
  onDelete?: (expense: any) => void;
}

export const ExpenseDetailsModal = ({ 
  isOpen, 
  onClose, 
  expense,
  onEdit,
  onApprove,
  onDelete 
}: ExpenseDetailsModalProps) => {
  if (!expense) return null;

  const cat = CATEGORIES[expense.category as keyof typeof CATEGORIES];
  
  // Configuration des statuts
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    pending: { 
      label: 'En attente', 
      color: 'text-amber-700', 
      bgColor: 'bg-amber-50 border-amber-200',
      icon: <Clock className="w-4 h-4" />
    },
    paid: { 
      label: 'Payé', 
      color: 'text-emerald-700', 
      bgColor: 'bg-emerald-50 border-emerald-200',
      icon: <CheckCircle className="w-4 h-4" />
    },
    cancelled: { 
      label: 'Annulé', 
      color: 'text-red-700', 
      bgColor: 'bg-red-50 border-red-200',
      icon: <X className="w-4 h-4" />
    },
  };

  const status = statusConfig[expense.status] || statusConfig.pending;

  // Configuration des méthodes de paiement
  const paymentMethods: Record<string, { label: string; icon: string }> = {
    cash: { label: 'Espèces', icon: '💵' },
    bank_transfer: { label: 'Virement bancaire', icon: '🏦' },
    mobile_money: { label: 'Mobile Money', icon: '📱' },
    check: { label: 'Chèque', icon: '📝' },
    card: { label: 'Carte bancaire', icon: '💳' },
  };

  const paymentMethod = paymentMethods[expense.payment_method] || { label: expense.payment_method || 'Non spécifié', icon: '💰' };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
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
              {/* Header compact */}
              <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 p-5">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  {/* Icône catégorie */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: cat?.color + '30' || '#6B728020' }}
                  >
                    {cat?.icon || '📋'}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                      {expense.reference || 'Dépense'}
                    </p>
                    <h3 className="text-white text-lg font-semibold mt-0.5 line-clamp-1">
                      {expense.description || 'Sans description'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Montant principal */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Montant</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {(expense.amount || 0).toLocaleString('fr-FR')}
                      <span className="text-lg font-medium text-slate-500 ml-1">FCFA</span>
                    </p>
                  </div>
                  
                  {/* Badge statut */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${status.bgColor} ${status.color}`}>
                    {status.icon}
                    <span className="font-medium text-sm">{status.label}</span>
                  </div>
                </div>
              </div>

              {/* Détails en grille */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Catégorie */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Catégorie</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat?.icon || '📋'}</span>
                      <span className="font-medium text-slate-800">{cat?.label || expense.category}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">
                        {format(new Date(expense.date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>

                  {/* Méthode de paiement */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Paiement</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{paymentMethod.icon}</span>
                      <span className="font-medium text-slate-800">{paymentMethod.label}</span>
                    </div>
                  </div>

                  {/* Groupe scolaire */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Groupe</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800 truncate">
                        {expense.school_group?.name || 'Non assigné'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description complète */}
                {expense.description && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Description</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{expense.description}</p>
                  </div>
                )}

                {/* Métadonnées */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Créé le {format(new Date(expense.created_at || expense.date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                  {expense.updated_at && expense.updated_at !== expense.created_at && (
                    <span>Modifié le {format(new Date(expense.updated_at), 'dd/MM/yyyy', { locale: fr })}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 pt-0 flex gap-3">
                {expense.status === 'pending' && onApprove && (
                  <Button
                    onClick={() => onApprove(expense)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                )}
                
                {onEdit && (
                  <Button
                    onClick={() => onEdit(expense)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}

                {!onEdit && !onApprove && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                )}

                {onDelete && (
                  <Button
                    onClick={() => onDelete(expense)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
