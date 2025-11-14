/**
 * Système de validation de données avec Zod
 * @module Validation
 */

import { z } from 'zod';

/**
 * Schémas de validation pour les entités principales
 */

// Utilisateur
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email('Email invalide'),
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().regex(/^[0-9]{9,15}$/, 'Numéro de téléphone invalide').optional(),
  role: z.enum(['super_admin', 'admin_groupe', 'proviseur', 'directeur', 'enseignant', 'secretaire', 'cpe', 'comptable']),
  school_id: z.string().uuid().optional(),
  school_group_id: z.string().uuid().optional(),
  is_sandbox: z.boolean().optional(),
});

// École
export const schoolSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères'),
  school_group_id: z.string().uuid('ID de groupe scolaire invalide'),
  type: z.enum(['maternelle', 'primaire', 'college', 'lycee']),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  is_sandbox: z.boolean().optional(),
});

// Groupe scolaire
export const schoolGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  is_sandbox: z.boolean().optional(),
});

// Élève
export const studentSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format: YYYY-MM-DD)'),
  gender: z.enum(['M', 'F']),
  school_id: z.string().uuid('ID d\'école invalide'),
  school_group_id: z.string().uuid('ID de groupe scolaire invalide'),
  level: z.string().min(2, 'Le niveau est requis'),
  class_id: z.string().uuid().optional(),
  parent_name: z.string().min(3, 'Le nom du parent doit contenir au moins 3 caractères'),
  parent_phone: z.string().regex(/^[0-9]{9,15}$/, 'Numéro de téléphone invalide'),
  parent_email: z.string().email('Email invalide').optional(),
  is_sandbox: z.boolean().optional(),
});

// Inscription
export const inscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  student_name: z.string().min(3, 'Le nom de l\'élève est requis'),
  student_first_name: z.string().min(2, 'Le prénom est requis'),
  student_last_name: z.string().min(2, 'Le nom est requis'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  gender: z.enum(['M', 'F']),
  level: z.string().min(2, 'Le niveau est requis'),
  school_id: z.string().uuid('ID d\'école invalide'),
  school_group_id: z.string().uuid('ID de groupe scolaire invalide'),
  parent_name: z.string().min(3, 'Le nom du parent est requis'),
  parent_phone: z.string().regex(/^[0-9]{9,15}$/, 'Numéro de téléphone invalide'),
  parent_email: z.string().email('Email invalide').optional(),
  status: z.enum(['en_attente', 'en_cours', 'validee', 'refusee']),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Année académique invalide (format: 2024-2025)'),
  registration_date: z.string().optional(),
  is_sandbox: z.boolean().optional(),
});

// Module
export const moduleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  category_id: z.string().uuid('ID de catégorie invalide'),
  icon: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']),
  order: z.number().int().min(0).optional(),
});

// Catégorie
export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

/**
 * Types TypeScript générés depuis les schémas
 */
export type User = z.infer<typeof userSchema>;
export type School = z.infer<typeof schoolSchema>;
export type SchoolGroup = z.infer<typeof schoolGroupSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Inscription = z.infer<typeof inscriptionSchema>;
export type Module = z.infer<typeof moduleSchema>;
export type Category = z.infer<typeof categorySchema>;

/**
 * Fonction de validation générique
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Fonction de validation async (safe parse)
 */
export async function validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<{
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}> {
  const result = await schema.safeParseAsync(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Formater les erreurs de validation pour l'affichage
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formatted[path] = error.message;
  });
  
  return formatted;
}

/**
 * Validators spécifiques
 */
export const validators = {
  email: (email: string) => z.string().email().safeParse(email).success,
  
  phone: (phone: string) => z.string().regex(/^[0-9]{9,15}$/).safeParse(phone).success,
  
  uuid: (id: string) => z.string().uuid().safeParse(id).success,
  
  date: (date: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date).success,
  
  academicYear: (year: string) => z.string().regex(/^\d{4}-\d{4}$/).safeParse(year).success,
  
  slug: (slug: string) => z.string().min(3).regex(/^[a-z0-9-]+$/).safeParse(slug).success,
};

/**
 * Sanitizers
 */
export const sanitizers = {
  /**
   * Nettoyer une chaîne de caractères
   */
  string: (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
  },
  
  /**
   * Générer un slug depuis un nom
   */
  slug: (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par -
      .replace(/^-+|-+$/g, ''); // Enlever les - au début et à la fin
  },
  
  /**
   * Formater un numéro de téléphone
   */
  phone: (phone: string): string => {
    return phone.replace(/\D/g, ''); // Garder uniquement les chiffres
  },
  
  /**
   * Formater un email
   */
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },
};
