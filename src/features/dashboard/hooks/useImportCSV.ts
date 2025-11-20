/**
 * Hook pour importer des groupes scolaires depuis un fichier CSV
 * Permet la création en masse avec validation
 * @module useImportCSV
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useCreateSchoolGroup, schoolGroupKeys, type CreateSchoolGroupInput } from './useSchoolGroups';

interface CSVRow {
  name: string;
  code: string;
  region: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  foundedYear?: string;
  description?: string;
  plan?: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: any }>;
  total: number;
}

export const useImportCSV = () => {
  const queryClient = useQueryClient();
  const createSchoolGroup = useCreateSchoolGroup();

  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      return new Promise((resolve, reject) => {
        Papa.parse<CSVRow>(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const importResult: ImportResult = {
              success: 0,
              errors: [],
              total: results.data.length,
            };

            // Valider et importer chaque ligne
            for (let i = 0; i < results.data.length; i++) {
              const row = results.data[i];
              const rowNumber = i + 2; // +2 car ligne 1 = header, index commence à 0

              try {
                // Validation des champs obligatoires
                if (!row.name || !row.code || !row.region || !row.city) {
                  throw new Error('Champs obligatoires manquants (name, code, region, city)');
                }

                // Validation du code (format E-PILOT-XXX)
                if (!/^E-PILOT-\d{3}$/.test(row.code)) {
                  throw new Error('Code invalide (format attendu: E-PILOT-XXX)');
                }

                // Validation du plan
                const validPlans = ['gratuit', 'premium', 'pro', 'institutionnel'];
                const plan = (row.plan?.toLowerCase() || 'gratuit') as any;
                if (!validPlans.includes(plan)) {
                  throw new Error(`Plan invalide (valeurs autorisées: ${validPlans.join(', ')})`);
                }

                // Validation de l'année de fondation
                let foundedYear: number | undefined;
                if (row.foundedYear) {
                  foundedYear = parseInt(row.foundedYear);
                  if (isNaN(foundedYear) || foundedYear < 1900 || foundedYear > new Date().getFullYear()) {
                    throw new Error('Année de fondation invalide');
                  }
                }

                // Préparer les données
                const groupData: CreateSchoolGroupInput = {
                  name: row.name.trim(),
                  code: row.code.trim().toUpperCase(),
                  region: row.region.trim(),
                  city: row.city.trim(),
                  address: row.address?.trim(),
                  phone: row.phone?.trim(),
                  website: row.website?.trim(),
                  foundedYear,
                  description: row.description?.trim(),
                  plan,
                };

                // Créer le groupe
                await createSchoolGroup.mutateAsync(groupData);
                importResult.success++;

              } catch (error) {
                importResult.errors.push({
                  row: rowNumber,
                  error: error instanceof Error ? error.message : 'Erreur inconnue',
                  data: row,
                });
              }
            }

            resolve(importResult);
          },
          error: (error) => {
            reject(new Error(`Erreur de parsing CSV: ${error.message}`));
          },
        });
      });
    },
    onSuccess: (result) => {
      // Invalider le cache pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schoolGroupKeys.stats() });

      // Toast de résultat
      if (result.errors.length === 0) {
        toast.success('✅ Import réussi', {
          description: `${result.success} groupe(s) importé(s) avec succès`,
        });
      } else {
        toast.warning('⚠️ Import partiel', {
          description: `${result.success} réussis, ${result.errors.length} erreurs`,
        });
      }
    },
    onError: (error) => {
      console.error('Erreur import CSV:', error);
      toast.error('❌ Erreur lors de l\'import', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

/**
 * Hook pour télécharger un template CSV
 */
export const useDownloadCSVTemplate = () => {
  return () => {
    const template = `name,code,region,city,address,phone,website,foundedYear,description,plan
Groupe Exemple,E-PILOT-999,Brazzaville,Brazzaville,123 Rue Exemple,+242 06 123 4567,https://exemple.cg,2020,Description du groupe,gratuit`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_groupes_scolaires.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('✅ Template téléchargé', {
      description: 'Remplissez le fichier et importez-le',
    });
  };
};
