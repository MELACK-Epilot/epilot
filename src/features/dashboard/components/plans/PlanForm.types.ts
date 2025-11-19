/**
 * Types et schéma de validation pour le formulaire de plan
 * @module PlanForm.types
 */

import { z } from 'zod';

// Schéma de validation Zod
export const planFormSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères').regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  planType: z.enum(['gratuit', 'premium', 'pro', 'institutionnel'] as const, {
    errorMap: () => ({ message: 'Sélectionnez un type de plan valide' }),
  }),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  currency: z.enum(['FCFA', 'EUR', 'USD']).default('FCFA'),
  billingPeriod: z.enum(['monthly', 'quarterly', 'biannual', 'yearly']),
  maxSchools: z.number().min(-1, 'Valeur invalide (-1 pour illimité)'),
  maxStudents: z.number().min(-1, 'Valeur invalide (-1 pour illimité)'),
  maxStaff: z.number().min(-1, 'Valeur invalide (-1 pour illimité)'),
  maxStorage: z.number().min(1, 'Le stockage doit être au moins 1 GB'),
  supportLevel: z.enum(['email', 'priority', '24/7']),
  customBranding: z.boolean().default(false),
  apiAccess: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  discount: z.number().min(0).max(100).optional(),
  trialDays: z.number().min(0).max(90).optional(),
  features: z.string().min(1, 'Ajoutez au moins une fonctionnalité'),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

export interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: any;
  mode: 'create' | 'edit';
}

export interface PlanFormTabProps {
  form: any;
  mode: 'create' | 'edit';
}

export interface PlanFormModulesTabProps extends PlanFormTabProps {
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  selectedModuleIds: string[];
  setSelectedModuleIds: (ids: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  validSelectedModules: string[];
}
