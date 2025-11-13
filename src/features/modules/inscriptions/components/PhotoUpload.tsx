/**
 * Composant d'upload de photo pour l'élève
 * Avec preview et compression
 */

import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string | null) => void;
  studentName?: string;
}

export const PhotoUpload = ({ value, onChange, studentName }: PhotoUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5MB');
      return;
    }

    // Créer un preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Initiales pour l'avatar par défaut
  const getInitials = () => {
    if (!studentName) return '?';
    const parts = studentName.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-2">
      <Label>Photo de l'élève (optionnel)</Label>
      
      <div className="flex items-center gap-4">
        {/* Preview ou Avatar par défaut */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            {preview ? (
              <img 
                src={preview} 
                alt="Photo élève" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {getInitials()}
              </div>
            )}
          </div>
          
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="gap-2"
          >
            {preview ? (
              <>
                <Camera className="w-4 h-4" />
                Changer
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Ajouter une photo
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500">
            JPG, PNG ou WebP • Max 5MB
          </p>
        </div>

        {/* Input caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
