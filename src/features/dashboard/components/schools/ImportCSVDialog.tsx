/**
 * Dialog d'import CSV pour les écoles
 */

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { parseCSV, type ImportedSchool } from '@/lib/export-utils';
import { useCreateSchool } from '../../hooks/useSchools-simple';
import { toast } from 'sonner';

interface ImportCSVDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schoolGroupId: string;
}

export function ImportCSVDialog({ isOpen, onClose, schoolGroupId }: ImportCSVDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [schools, setSchools] = useState<ImportedSchool[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const createSchool = useCreateSchool();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Format invalide', {
        description: 'Veuillez sélectionner un fichier CSV',
      });
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setSuccess(false);

    try {
      const parsedSchools = await parseCSV(selectedFile);
      setSchools(parsedSchools);
      toast.success(`${parsedSchools.length} école(s) détectée(s)`);
    } catch (error) {
      toast.error('Erreur de parsing', {
        description: (error as Error).message,
      });
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (schools.length === 0) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);
    const importErrors: string[] = [];

    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      
      try {
        await createSchool.mutateAsync({
          ...school,
          school_group_id: schoolGroupId,
          admin_id: null,
          student_count: 0,
          staff_count: 0,
        } as any);
        
        setProgress(((i + 1) / schools.length) * 100);
      } catch (error) {
        importErrors.push(`${school.name}: ${(error as Error).message}`);
      }
    }

    setImporting(false);
    setErrors(importErrors);

    if (importErrors.length === 0) {
      setSuccess(true);
      toast.success('Import réussi', {
        description: `${schools.length} école(s) importée(s) avec succès`,
      });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      toast.error('Import partiel', {
        description: `${schools.length - importErrors.length}/${schools.length} école(s) importée(s)`,
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setSchools([]);
    setProgress(0);
    setErrors([]);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des écoles (CSV)</DialogTitle>
          <DialogDescription>
            Importez plusieurs écoles à partir d'un fichier CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de téléchargement */}
          {!file && !success && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#2A9D8F] transition-colors">
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-[#2A9D8F]/10 rounded-full">
                  <Upload className="w-8 h-8 text-[#2A9D8F]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Cliquez pour sélectionner un fichier CSV
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Format : Nom, Code, Statut, Département, Ville, etc.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Fichier sélectionné */}
          {file && !success && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-[#2A9D8F]" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {schools.length} école(s) à importer
                    </p>
                  </div>
                </div>
                {!importing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setSchools([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Aperçu */}
              {schools.length > 0 && !importing && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Aperçu :</p>
                  <div className="space-y-1">
                    {schools.slice(0, 3).map((school, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        • {school.name} ({school.code}) - {school.city || 'Ville non spécifiée'}
                      </div>
                    ))}
                    {schools.length > 3 && (
                      <div className="text-xs text-gray-500">
                        ... et {schools.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progression */}
              {importing && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-gray-600">
                    Import en cours... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Succès */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Import réussi ! {schools.length} école(s) importée(s) avec succès.
              </AlertDescription>
            </Alert>
          )}

          {/* Erreurs */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Erreurs d'import :</p>
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Template CSV */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm font-medium mb-1">Format CSV attendu :</p>
              <code className="text-xs bg-gray-100 p-2 rounded block mt-2">
                Nom,Code,Statut,Département,Ville,Commune,Code Postal,Adresse,Téléphone,Email
              </code>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              {success ? 'Fermer' : 'Annuler'}
            </Button>
            {file && !success && (
              <Button
                onClick={handleImport}
                disabled={importing || schools.length === 0}
                className="bg-[#2A9D8F] hover:bg-[#1D8A7E]"
              >
                {importing ? 'Import en cours...' : `Importer ${schools.length} école(s)`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
