/**
 * Section pour l'upload du logo du groupe scolaire
 */

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Image, Upload, X } from 'lucide-react';

interface LogoSectionProps {
  logoPreview: string | null;
  isDragging: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  removeLogo: () => void;
}

export const LogoSection = ({
  logoPreview,
  isDragging,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  removeLogo,
}: LogoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Image className="h-5 w-5 text-[#1D3557]" />
        <h3 className="text-lg font-semibold text-[#1D3557]">Logo</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo-upload">Logo du groupe</Label>
        <div className="space-y-4">
          {/* Zone de drag & drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${isDragging ? 'border-[#2A9D8F] bg-[#2A9D8F]/5' : 'border-gray-300 hover:border-[#2A9D8F]'}
            `}
          >
            {logoPreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Prévisualisation du logo"
                    className="max-w-[200px] max-h-[200px] rounded-lg shadow-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                    onClick={removeLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Glissez une nouvelle image ou cliquez pour remplacer
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez une image ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF jusqu'à 2MB
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="mt-4 inline-block cursor-pointer px-4 py-2 bg-[#1D3557] text-white rounded-lg hover:bg-[#2A9D8F] transition-colors"
            >
              Choisir une image
            </label>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Logo officiel du groupe scolaire (optionnel)
        </p>
      </div>
    </div>
  );
};
