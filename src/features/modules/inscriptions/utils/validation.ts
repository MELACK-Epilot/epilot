/**
 * Schémas de validation Zod pour le formulaire d'inscription
 * Basés sur la structure réelle de la table inscriptions
 */

import { z } from 'zod';

// ============================================================================
// VALIDATEURS PERSONNALISÉS
// ============================================================================

// Téléphone Congo (+242)
const phoneRegex = /^\+242\s?\d{2}\s?\d{3}\s?\d{4}$/;
export const phoneSchema = z
  .string()
  .regex(phoneRegex, 'Format: +242 06 123 4567')
  .or(z.string().length(0));

// Email Congo (.cg ou .com) - Optionnel
export const emailSchema = z
  .string()
  .optional()
  .refine((email) => {
    if (!email || email.length === 0) return true; // Vide = OK
    // Vérifier format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    // Vérifier extension
    return email.endsWith('.cg') || email.endsWith('.com');
  }, {
    message: 'Email invalide ou doit se terminer par .cg ou .com',
  });

// Date de naissance (âge entre 3 et 30 ans)
export const dateOfBirthSchema = z
  .string()
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 3 && age <= 30;
  }, 'Âge doit être entre 3 et 30 ans');

// ============================================================================
// ÉTAPE 1 : INFORMATIONS GÉNÉRALES
// ============================================================================

export const step1Schema = z.object({
  // Photo (optionnel)
  student_photo: z.any().optional(),
  
  // Nom complet (obligatoire)
  student_first_name: z
    .string()
    .min(1, 'Prénom requis')
    .max(100, 'Prénom trop long'),
  
  student_last_name: z
    .string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long'),
  
  student_postnom: z
    .string()
    .max(100, 'Post-nom trop long')
    .optional(),
  
  // Sexe (obligatoire)
  student_gender: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Sélectionnez le sexe (Masculin ou Féminin)' }),
  }),
  
  // Date de naissance (obligatoire)
  student_date_of_birth: z.string().min(1, 'Date de naissance requise'),
  
  // Lieu de naissance (optionnel)
  student_place_of_birth: z
    .string()
    .max(200, 'Lieu de naissance trop long')
    .optional(),
  
  // Nationalité (par défaut Congolaise)
  student_nationality: z
    .string()
    .max(100, 'Nationalité trop longue')
    .default('Congolaise'),
  
  // Identifiant national (optionnel)
  student_national_id: z
    .string()
    .max(50, 'Identifiant trop long')
    .optional(),
  
  // Adresse complète
  address: z
    .string()
    .min(5, 'Adresse requise')
    .max(500, 'Adresse trop longue')
    .optional(),
  
  city: z
    .string()
    .max(100, 'Ville trop longue')
    .optional(),
  
  region: z
    .string()
    .max(100, 'Région trop longue')
    .optional(),
  
  // Contact élève (optionnel)
  student_phone: phoneSchema.optional(),
  student_email: emailSchema.optional(),
});

export type Step1FormData = z.infer<typeof step1Schema>;

// ============================================================================
// ÉTAPE 2 : PARENTS / TUTEURS
// ============================================================================

export const step2Schema = z.object({
  // PÈRE (obligatoire)
  parent1_first_name: z
    .string()
    .min(2, 'Prénom du père requis')
    .max(100, 'Prénom trop long')
    .optional(),
  
  parent1_last_name: z
    .string()
    .min(2, 'Nom du père requis')
    .max(100, 'Nom trop long')
    .optional(),
  
  parent1_phone: z
    .string()
    .regex(phoneRegex, 'Format: +242 06 123 4567'),
  
  parent1_email: emailSchema.optional(),
  
  parent1_profession: z
    .string()
    .max(100, 'Profession trop longue')
    .optional(),
  
  parent1_address: z
    .string()
    .max(500, 'Adresse trop longue')
    .optional(),
  
  // MÈRE (obligatoire)
  parent2_first_name: z
    .string()
    .min(2, 'Prénom de la mère requis')
    .max(100, 'Prénom trop long')
    .optional(),
  
  parent2_last_name: z
    .string()
    .min(2, 'Nom de la mère requis')
    .max(100, 'Nom trop long')
    .optional(),
  
  parent2_phone: z
    .string()
    .regex(phoneRegex, 'Format: +242 06 123 4567')
    .optional(),
  
  parent2_email: emailSchema.optional(),
  
  parent2_profession: z
    .string()
    .max(100, 'Profession trop longue')
    .optional(),
  
  parent2_address: z
    .string()
    .max(500, 'Adresse trop longue')
    .optional(),
  
  // TUTEUR (optionnel si différent des parents)
  tuteur_first_name: z
    .string()
    .max(100, 'Prénom trop long')
    .optional(),
  
  tuteur_last_name: z
    .string()
    .max(100, 'Nom trop long')
    .optional(),
  
  tuteur_phone: phoneSchema.optional(),
  
  tuteur_address: z
    .string()
    .max(500, 'Adresse trop longue')
    .optional(),
  
  tuteur_relation: z
    .string()
    .max(100, 'Lien de parenté trop long')
    .optional(),
});

export type Step2FormData = z.infer<typeof step2Schema>;

// ============================================================================
// ÉTAPE 3 : INFORMATIONS SCOLAIRES
// ============================================================================

export const step3Schema = z.object({
  // Année académique (obligatoire)
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Format: 2024-2025'),
  
  // Type d'école (optionnel)
  type_ecole: z
    .string()
    .optional(),
  
  // Niveau (obligatoire)
  requested_level: z
    .string()
    .min(1, 'Niveau requis'),
  
  // Classe (optionnel, peut être ID ou nom)
  requested_class_id: z
    .string()
    .optional(),
  
  // Série (optionnel)
  serie: z
    .string()
    .max(50, 'Série trop longue')
    .optional(),
  
  // Filière (optionnel)
  filiere: z
    .string()
    .max(100, 'Filière trop longue')
    .optional(),
  
  // Option / Spécialité (optionnel)
  option_specialite: z
    .string()
    .max(100, 'Option trop longue')
    .optional(),
  
  // Type d'inscription (obligatoire)
  type_inscription: z.enum(['nouvelle', 'reinscription', 'transfert'], {
    errorMap: () => ({ message: 'Sélectionnez le type d\'inscription' }),
  }),
  
  // Ancienne école (si transfert)
  ancienne_ecole: z
    .string()
    .max(200, 'Nom d\'école trop long')
    .optional(),
  
  // Moyenne d'admission (optionnel)
  moyenne_admission: z
    .number()
    .min(0, 'Moyenne invalide')
    .max(20, 'Moyenne max: 20')
    .optional()
    .or(z.string().transform((val) => (val ? parseFloat(val) : undefined))),
  
  // Numéro dossier papier (optionnel)
  numero_dossier_papier: z
    .string()
    .max(50, 'Numéro trop long')
    .optional(),
  
  // Statut scolaire
  est_redoublant: z.boolean().default(false),
  est_affecte: z.boolean().default(false),
  numero_affectation: z
    .string()
    .max(50, 'Numéro trop long')
    .optional(),
});

export type Step3FormData = z.infer<typeof step3Schema>;

// ============================================================================
// ÉTAPE 4 : INFORMATIONS FINANCIÈRES
// ============================================================================

export const step4Schema = z.object({
  // Frais (obligatoires)
  frais_inscription: z
    .number()
    .min(0, 'Montant invalide')
    .or(z.string().transform((val) => parseFloat(val) || 0)),
  
  frais_scolarite: z
    .number()
    .min(0, 'Montant invalide')
    .or(z.string().transform((val) => parseFloat(val) || 0)),
  
  frais_cantine: z
    .number()
    .min(0, 'Montant invalide')
    .optional()
    .or(z.string().transform((val) => (val ? parseFloat(val) : undefined))),
  
  frais_transport: z
    .number()
    .min(0, 'Montant invalide')
    .optional()
    .or(z.string().transform((val) => (val ? parseFloat(val) : undefined))),
  
  // Paiement
  mode_paiement: z
    .enum(['Espèces', 'Mobile Money', 'Virement bancaire', 'Chèque'])
    .optional(),
  
  montant_paye: z
    .number()
    .min(0, 'Montant invalide')
    .optional()
    .or(z.string().transform((val) => (val ? parseFloat(val) : 0))),
  
  reference_paiement: z
    .string()
    .max(100, 'Référence trop longue')
    .optional(),
  
  date_paiement: z
    .string()
    .optional(),
  
  // Aides sociales
  a_aide_sociale: z.boolean().default(false),
  est_pensionnaire: z.boolean().default(false),
  a_bourse: z.boolean().default(false),
});

export type Step4FormData = z.infer<typeof step4Schema>;

// ============================================================================
// ÉTAPE 5 : DOCUMENTS
// ============================================================================

export const step5Schema = z.object({
  acte_naissance: z.any().optional(),
  photo_identite: z.any().optional(),
  certificat_transfert: z.any().optional(),
  releve_notes: z.any().optional(),
  carnet_vaccination: z.any().optional(),
});

export type Step5FormData = z.infer<typeof step5Schema>;

// ============================================================================
// ÉTAPE 6 : VALIDATION
// ============================================================================

export const step6Schema = z.object({
  observations: z
    .string()
    .max(1000, 'Observations trop longues')
    .optional(),
  
  internal_notes: z
    .string()
    .max(1000, 'Notes trop longues')
    .optional(),
});

export type Step6FormData = z.infer<typeof step6Schema>;

// ============================================================================
// SCHÉMA COMPLET
// ============================================================================

export const inscriptionFormSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape,
  ...step6Schema.shape,
  school_id: z.string().uuid('ID école invalide'),
});

export type InscriptionFormData = z.infer<typeof inscriptionFormSchema>;

// ============================================================================
// VALIDATION PAR ÉTAPE
// ============================================================================

export const validateStep = (step: number, data: any) => {
  switch (step) {
    case 1:
      return step1Schema.safeParse(data);
    case 2:
      return step2Schema.safeParse(data);
    case 3:
      return step3Schema.safeParse(data);
    case 4:
      return step4Schema.safeParse(data);
    case 5:
      return step5Schema.safeParse(data);
    case 6:
      return step6Schema.safeParse(data);
    default:
      return { success: false, error: { errors: [] } };
  }
};
