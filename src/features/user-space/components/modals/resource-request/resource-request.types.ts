/**
 * Types pour le système de demande de ressources
 */

export interface Resource {
  id: string;
  name: string;
  category: string;
  unit: string;
  estimatedPrice?: number;
}

export interface CartItem {
  resource: Resource;
  quantity: number;
  unitPrice: number;
  justification: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ResourceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId?: string; // Optionnel - récupéré dynamiquement depuis la BDD
}
