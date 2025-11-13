/**
 * Étape 5 : Documents à joindre
 * Upload de fichiers vers Supabase Storage
 */

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { InscriptionFormData } from '../../utils/validation';

interface InscriptionStep5Props {
  form: UseFormReturn<InscriptionFormData>;
}

interface FileUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}

const DOCUMENTS = [
  {
    key: 'acte_naissance',
    label: 'Acte de naissance',
    description: 'PDF ou Image (max 5 MB)',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    icon: FileText,
  },
  {
    key: 'photo_identite',
    label: 'Photo d\'identité',
    description: 'Image (max 2 MB)',
    required: true,
    accept: '.jpg,.jpeg,.png',
    icon: Image,
  },
  {
    key: 'certificat_transfert',
    label: 'Certificat de transfert',
    description: 'PDF (si applicable)',
    required: false,
    accept: '.pdf',
    icon: FileText,
  },
  {
    key: 'releve_notes',
    label: 'Relevé de notes',
    description: 'PDF (année précédente)',
    required: false,
    accept: '.pdf',
    icon: FileText,
  },
  {
    key: 'carnet_vaccination',
    label: 'Carnet de vaccination',
    description: 'PDF (maternelle/primaire)',
    required: false,
    accept: '.pdf',
    icon: FileText,
  },
] as const;

export const InscriptionStep5 = ({ form }: InscriptionStep5Props) => {
  const [files, setFiles] = useState<Record<string, FileUploadState>>({});

  // ========================================================================
  // GESTION DES FICHIERS
  // ========================================================================

  const handleFileSelect = (key: string, file: File | null) => {
    if (!file) {
      setFiles((prev) => ({
        ...prev,
        [key]: {
          file: null,
          preview: null,
          uploading: false,
          uploaded: false,
          error: null,
        },
      }));
      form.setValue(key as any, null);
      return;
    }

    // Validation taille
    const maxSize = key === 'photo_identite' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (max ${maxSize / 1024 / 1024} MB)`);
      return;
    }

    // Validation type
    const doc = DOCUMENTS.find((d) => d.key === key);
    const acceptedTypes = doc?.accept.split(',').map((t) => t.trim()) || [];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error(`Type de fichier non accepté. Formats acceptés: ${doc?.accept}`);
      return;
    }

    // Preview pour les images
    let preview: string | null = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setFiles((prev) => ({
      ...prev,
      [key]: {
        file,
        preview,
        uploading: false,
        uploaded: false,
        error: null,
      },
    }));

    form.setValue(key as any, file);
  };

  const handleRemoveFile = (key: string) => {
    const fileState = files[key];
    if (fileState?.preview) {
      URL.revokeObjectURL(fileState.preview);
    }
    handleFileSelect(key, null);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1D3557] mb-2">
          Documents à joindre
        </h3>
        <p className="text-sm text-gray-600">
          Téléchargez les documents requis. Les fichiers seront stockés de manière sécurisée.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENTS.map((doc) => {
          const Icon = doc.icon;
          const fileState = files[doc.key];
          const hasFile = !!fileState?.file;

          return (
            <Card key={doc.key} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`
                      p-2 rounded-lg
                      ${hasFile ? 'bg-green-100' : 'bg-gray-100'}
                    `}>
                      <Icon className={`
                        w-5 h-5
                        ${hasFile ? 'text-green-600' : 'text-gray-600'}
                      `} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {doc.label}
                        {doc.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {doc.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {hasFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(doc.key)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {!hasFile ? (
                  <label className="
                    flex flex-col items-center justify-center
                    border-2 border-dashed border-gray-300 rounded-lg
                    p-6 cursor-pointer hover:border-[#1D3557] hover:bg-gray-50
                    transition-colors
                  ">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 text-center">
                      Cliquez pour sélectionner
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {doc.accept}
                    </span>
                    <input
                      type="file"
                      accept={doc.accept}
                      onChange={(e) => handleFileSelect(doc.key, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    {/* Preview */}
                    {fileState.preview ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={fileState.preview}
                          alt={doc.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileState.file?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(fileState.file?.size || 0 / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Statut */}
                    <div className="flex items-center gap-2 text-sm">
                      {fileState.uploading ? (
                        <>
                          <Progress value={50} className="flex-1 h-2" />
                          <span className="text-gray-600">Upload...</span>
                        </>
                      ) : fileState.uploaded ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Téléchargé</span>
                        </>
                      ) : fileState.error ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600">{fileState.error}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600">Prêt</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-800">
              <p className="font-medium">Informations importantes :</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Les documents marqués d'un astérisque (*) sont obligatoires</li>
                <li>Formats acceptés : PDF, JPG, PNG</li>
                <li>Taille maximale : 5 MB par fichier</li>
                <li>Les fichiers sont stockés de manière sécurisée</li>
                <li>Vous pourrez ajouter d'autres documents plus tard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
