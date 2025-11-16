/**
 * Modal de création de demande de ressources
 * Formulaire multi-étapes avec ajout d'items dynamique
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface School {
  id: string;
  name: string;
}

interface RequestItem {
  id: string;
  resource_name: string;
  resource_category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  justification?: string;
}

interface CreateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  schools: School[];
}

const CATEGORIES = [
  'Fournitures scolaires',
  'Matériel informatique',
  'Mobilier',
  'Équipement sportif',
  'Livres et manuels',
  'Matériel pédagogique',
  'Entretien',
  'Autre',
];

const UNITS = ['Unité', 'Boîte', 'Paquet', 'Lot', 'Carton', 'Pièce'];

export const CreateRequestModal = ({
  open,
  onOpenChange,
  onSubmit,
  schools,
}: CreateRequestModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    school_id: '',
  });
  const [items, setItems] = useState<RequestItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<RequestItem>>({
    resource_name: '',
    resource_category: CATEGORIES[0],
    quantity: 1,
    unit: UNITS[0],
    unit_price: 0,
    justification: '',
  });

  const addItem = () => {
    if (!currentItem.resource_name || !currentItem.quantity || !currentItem.unit_price) {
      return;
    }

    const newItem: RequestItem = {
      id: Date.now().toString(),
      resource_name: currentItem.resource_name!,
      resource_category: currentItem.resource_category!,
      quantity: currentItem.quantity!,
      unit: currentItem.unit!,
      unit_price: currentItem.unit_price!,
      justification: currentItem.justification,
    };

    setItems([...items, newItem]);
    setCurrentItem({
      resource_name: '',
      resource_category: CATEGORIES[0],
      quantity: 1,
      unit: UNITS[0],
      unit_price: 0,
      justification: '',
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleSubmit = async () => {
    if (!formData.title || !formData.school_id || items.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        items: items.map(({ id, ...item }) => item),
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'normal',
        school_id: '',
      });
      setItems([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-purple-600" />
            Nouvelle Demande de Ressources
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informations générales</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre de la demande *</Label>
                <Input
                  placeholder="Ex: Fournitures pour la rentrée"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>École *</Label>
                <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une école" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Décrivez le contexte de cette demande..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Basse</SelectItem>
                  <SelectItem value="normal">🔵 Normale</SelectItem>
                  <SelectItem value="high">🟠 Haute</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ajout d'items */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Ajouter des ressources</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de la ressource *</Label>
                <Input
                  placeholder="Ex: Cahiers 96 pages"
                  value={currentItem.resource_name}
                  onChange={(e) => setCurrentItem({ ...currentItem, resource_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select 
                  value={currentItem.resource_category} 
                  onValueChange={(value) => setCurrentItem({ ...currentItem, resource_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantité *</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Unité</Label>
                <Select 
                  value={currentItem.unit} 
                  onValueChange={(value) => setCurrentItem({ ...currentItem, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prix unitaire (FCFA) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={currentItem.unit_price}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Total</Label>
                <Input
                  value={`${((currentItem.quantity || 0) * (currentItem.unit_price || 0)).toLocaleString()} FCFA`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea
                placeholder="Pourquoi cette ressource est-elle nécessaire ?"
                value={currentItem.justification}
                onChange={(e) => setCurrentItem({ ...currentItem, justification: e.target.value })}
                rows={2}
              />
            </div>

            <Button
              onClick={addItem}
              variant="outline"
              className="w-full border-dashed border-2"
              disabled={!currentItem.resource_name || !currentItem.quantity || !currentItem.unit_price}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter cette ressource
            </Button>
          </div>

          {/* Liste des items */}
          {items.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Ressources ajoutées ({items.length})</h3>
                <Badge variant="outline" className="text-lg">
                  Total: {totalAmount.toLocaleString()} FCFA
                </Badge>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.resource_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × {item.unit_price.toLocaleString()} FCFA = {(item.quantity * item.unit_price).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-gray-500">{item.resource_category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.school_id || items.length === 0 || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Création...' : 'Créer la demande'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
