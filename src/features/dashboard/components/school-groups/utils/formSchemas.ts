/**
 * Schémas de validation Zod pour les formulaires de groupes scolaires
 */

import { z } from 'zod';

/**
 * Schéma pour la création d'un groupe scolaire
 */
export const createSchoolGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  code: z
    .string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(20, 'Le code ne peut pas dépasser 20 caractères')
    .regex(/^[A-Z0-9-]+$/, 'Le code doit contenir uniquement des lettres majuscules, chiffres et tirets'),
  region: z
    .string()
    .min(2, 'La région doit être sélectionnée')
    .max(50, 'La région ne peut pas dépasser 50 caractères'),
  city: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(50, 'La ville ne peut pas dépasser 50 caractères'),
  address: z
    .string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{8,20}$/, 'Numéro de téléphone invalide')
    .optional(),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'L\'URL doit commencer par http:// ou https://'
    }),
  foundedYear: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val || val === '') return undefined;
      const num = typeof val === 'string' ? parseInt(val) : val;
      if (isNaN(num)) return undefined;
      if (num < 1900 || num > new Date().getFullYear()) return undefined;
      return num;
    }),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  logo: z
    .string()
    .optional(),
  plan: z.enum(['gratuit', 'premium', 'pro', 'institutionnel'], {
    errorMap: () => ({ message: 'Plan invalide' }),
  }),
});

/**
 * Schéma pour la mise à jour d'un groupe scolaire
 */
export const updateSchoolGroupSchema = createSchoolGroupSchema.extend({
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
});

/**
 * Types inférés des schémas
 */
export type CreateSchoolGroupFormValues = z.infer<typeof createSchoolGroupSchema>;
export type UpdateSchoolGroupFormValues = z.infer<typeof updateSchoolGroupSchema>;

/**
 * Valeurs par défaut pour le formulaire de création
 */
export const defaultCreateValues: CreateSchoolGroupFormValues = {
  name: '',
  code: '',
  region: '',
  city: '',
  address: '',
  phone: '',
  website: '',
  foundedYear: undefined,
  description: '',
  logo: '',
  plan: 'gratuit',
};
