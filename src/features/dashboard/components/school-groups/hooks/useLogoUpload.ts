/**
 * Hook personnalisé pour gérer l'upload et la prévisualisation du logo
 */

import { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreateSchoolGroupFormValues, UpdateSchoolGroupFormValues } from '../utils/formSchemas';

interface UseLogoUploadProps {
  form: UseFormReturn<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>;
  setLogoPreview: (preview: string | null) => void;
  maxSizeMB?: number;
}

export const useLogoUpload = ({ form, setLogoPreview, maxSizeMB = 2 }: UseLogoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Gérer l'upload d'un fichier
   */
  const handleFileUpload = useCallback((file: File) => {
    // Vérifier la taille
    const maxSize = maxSizeMB * 1024 * 1024; // MB en bytes
    if (file.size > maxSize) {
      alert(`Le fichier est trop volumineux. Taille maximale : ${maxSizeMB}MB`);
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    // Lire le fichier et créer la prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      form.setValue('logo', base64String);
    };
    reader.readAsDataURL(file);
  }, [form, maxSizeMB]);

  /**
   * Gérer le changement d'input file
   */
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  /**
   * Gérer le drag & drop
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  /**
   * Supprimer le logo
   */
  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    form.setValue('logo', '');
  }, [form]);

  return {
    isDragging,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeLogo,
  };
};
