/**
 * Hook personnalisé pour gérer la logique du formulaire de groupe scolaire
 */

import { useEffect, useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { useCreateSchoolGroup, useUpdateSchoolGroup, useSchoolGroups } from '@/features/dashboard/hooks/useSchoolGroups';
import type { SchoolGroup } from '@/features/dashboard/types/dashboard.types';
import {
  createSchoolGroupSchema,
  updateSchoolGroupSchema,
  defaultCreateValues,
  type CreateSchoolGroupFormValues,
  type UpdateSchoolGroupFormValues,
} from '../utils/formSchemas';

interface UseSchoolGroupFormProps {
  mode: 'create' | 'edit';
  schoolGroup?: SchoolGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setLogoPreview: (preview: string | null) => void;
}

/**
 * Génère un code unique pour un groupe scolaire
 * Format: E-PILOT-XXX (ex: E-PILOT-001, E-PILOT-002, etc.)
 */
const generateUniqueCode = (existingGroups: any[] = []): string => {
  // Extraire tous les codes existants
  const existingCodes = existingGroups
    .map(group => group.code)
    .filter(code => code && code.startsWith('E-PILOT-'));

  // Trouver le numéro le plus élevé
  let maxNumber = 0;
  existingCodes.forEach(code => {
    const match = code.match(/E-PILOT-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  // Générer le nouveau code
  const nextNumber = maxNumber + 1;
  return `E-PILOT-${nextNumber.toString().padStart(3, '0')}`;
};

export const useSchoolGroupForm = ({
  mode,
  schoolGroup,
  open,
  onOpenChange,
  setLogoPreview,
}: UseSchoolGroupFormProps) => {
  const [isPending, startTransition] = useTransition();
  const createSchoolGroup = useCreateSchoolGroup();
  const updateSchoolGroup = useUpdateSchoolGroup();
  
  // Récupérer tous les groupes pour générer un code unique
  const { data: allGroups = [] } = useSchoolGroups();

  // Générer le code unique une seule fois
  const generatedCode = useMemo(() => {
    if (mode === 'create') {
      return generateUniqueCode(allGroups);
    }
    return '';
  }, [mode, allGroups.length]); // Utiliser .length au lieu de allGroups pour éviter la boucle

  // Valeurs par défaut mémorisées
  const defaultValues = useMemo(() => {
    if (mode === 'create') {
      return {
        ...defaultCreateValues,
        code: generatedCode,
      };
    }
    return {
      name: schoolGroup?.name || '',
      code: schoolGroup?.code || '',
      region: schoolGroup?.region || '',
      city: schoolGroup?.city || '',
      address: schoolGroup?.address || '',
      phone: schoolGroup?.phone || '',
      website: schoolGroup?.website || '',
      foundedYear: schoolGroup?.foundedYear || undefined,
      description: schoolGroup?.description || '',
      logo: schoolGroup?.logo || '',
      plan: schoolGroup?.plan || 'gratuit',
      schoolCount: schoolGroup?.schoolCount || 0,
      studentCount: schoolGroup?.studentCount || 0,
      status: schoolGroup?.status || 'active',
    };
  }, [mode, schoolGroup, generatedCode]);

  // Initialiser le formulaire avec le type approprié selon le mode
  const form = useForm({
    resolver: zodResolver(mode === 'create' ? createSchoolGroupSchema : updateSchoolGroupSchema),
    defaultValues,
    mode: 'onChange',
  }) as ReturnType<typeof useForm<CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues>>;

  // Réinitialiser le formulaire quand le dialog s'ouvre/ferme
  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      setLogoPreview(null);
      return;
    }

    if (mode === 'edit' && schoolGroup) {
      console.log('📝 Mode édition - Chargement des données:', schoolGroup);
      form.reset(defaultValues);
      if (schoolGroup.logo) {
        setLogoPreview(schoolGroup.logo);
      }
    } else if (mode === 'create') {
      console.log('➕ Mode création - Formulaire vide');
      console.log('🔢 Code généré automatiquement:', generatedCode);
      
      form.reset(defaultValues);
      setLogoPreview(null);
    }
  }, [schoolGroup, mode, open, form, defaultValues, setLogoPreview, generatedCode]);

  // Calculer l'âge du groupe
  const foundedYear = form.watch('foundedYear');
  const yearsOfExistence = foundedYear ? new Date().getFullYear() - foundedYear : 0;

  // Gérer la soumission du formulaire
  const onSubmit = async (values: CreateSchoolGroupFormValues | UpdateSchoolGroupFormValues) => {
    console.log('🚀 Soumission du formulaire:', { mode, values });

    startTransition(async () => {
      try {
        if (mode === 'create') {
          console.log('➕ Création d\'un nouveau groupe scolaire...');
          const result = await createSchoolGroup.mutateAsync(values as CreateSchoolGroupFormValues);
          console.log('✅ Groupe créé:', result);
          
          toast({
            title: '✅ Groupe créé',
            description: `Le groupe "${values.name}" a été créé avec succès.`,
            variant: 'default',
          });
        } else if (mode === 'edit' && schoolGroup?.id) {
          console.log('✏️ Mise à jour du groupe scolaire...');
          const result = await updateSchoolGroup.mutateAsync({
            id: schoolGroup.id,
            ...(values as UpdateSchoolGroupFormValues),
          });
          console.log('✅ Groupe mis à jour:', result);
          
          toast({
            title: '✅ Groupe mis à jour',
            description: `Le groupe "${values.name}" a été mis à jour avec succès.`,
            variant: 'default',
          });
        }

        onOpenChange(false);
        form.reset();
      } catch (error: any) {
        console.error('❌ Erreur lors de la soumission:', error);
        toast({
          title: '❌ Erreur',
          description: error.message || 'Une erreur est survenue lors de la sauvegarde.',
          variant: 'destructive',
        });
      }
    });
  };

  const isLoading = createSchoolGroup.isPending || updateSchoolGroup.isPending || isPending;

  return {
    form,
    onSubmit,
    isLoading,
    yearsOfExistence,
  };
};
