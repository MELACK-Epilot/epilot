/**
 * Composant d'upload d'avatar avec drag & drop
 * Compression automatique en WebP
 * @module AvatarUpload
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AvatarUploadProps {
  value?: string;
  onChange: (file: File | null, preview: string | null) => void;
  disabled?: boolean;
  firstName?: string;
  lastName?: string;
}

export const AvatarUpload = ({ 
  value, 
  onChange, 
  disabled = false,
  firstName = '',
  lastName = ''
}: AvatarUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer les initiales
  const getInitials = () => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || 'U';
  };

  // Compresser l'image en WebP
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Taille maximale 400x400
          const maxSize = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], `avatar_${Date.now()}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/webp',
            0.85 // Qualité 85%
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  // Gérer le fichier sélectionné
  const handleFile = useCallback(async (file: File) => {
    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      setIsCompressing(true);
      
      // Compresser l'image
      const compressedFile = await compressImage(file);
      
      // Créer preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);
      onChange(compressedFile, previewUrl);
      
      toast.success('Photo de profil ajoutée', {
        description: `Taille: ${(compressedFile.size / 1024).toFixed(0)}KB`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setIsCompressing(false);
    }
  }, [compressImage, onChange]);

  // Gérer le drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  // Gérer le clic sur input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // Supprimer la photo
  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div
        className={`relative w-32 h-32 mx-auto rounded-full border-4 transition-all duration-300 ${
          isDragging 
            ? 'border-[#2A9D8F] border-dashed scale-105' 
            : 'border-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {isCompressing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
            <Loader2 className="h-8 w-8 text-[#2A9D8F] animate-spin" />
          </div>
        ) : preview ? (
          <>
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full rounded-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                aria-label="Supprimer la photo"
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-full text-white">
            <div className="text-3xl font-bold mb-1">{getInitials()}</div>
            {!disabled && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                aria-hidden="true"
              >
                <Camera className="h-8 w-8" />
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        aria-label="Sélectionner une photo de profil"
      />

      {!disabled && (
        <div className="text-center space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {preview ? 'Changer la photo' : 'Ajouter une photo'}
          </Button>
          <p className="text-xs text-gray-500">
            JPG, PNG ou WebP • Max 5MB
          </p>
        </div>
      )}
    </div>
  );
};
