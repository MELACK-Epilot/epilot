/**
 * Schémas de validation Zod pour les données financières
 * Prévention SQL Injection, XSS, et validation données
 * @module financial.schemas
 */

import { z } from 'zod';

/**
 * Validation montant financier
 * - Positif uniquement
 * - Max 1 milliard FCFA
 * - 2 décimales max
 */
export const AmountSchema = z.number()
  .positive('Le montant doit être positif')
  .max(1000000000, 'Le montant ne peut pas dépasser 1 milliard FCFA')
  .refine(
    (val) => Number.isFinite(val) && Math.abs(val * 100 - Math.round(val * 100)) < Number.EPSILON,
    'Le montant ne peut avoir que 2 décimales maximum'
  );

/**
 * Validation UUID
 */
export const UUIDSchema = z.string().uuid('ID invalide');

/**
 * Validation date
 */
export const DateSchema = z.string()
  .datetime('Date invalide')
  .or(z.date());

/**
 * Validation pourcentage
 */
export const PercentageSchema = z.number()
  .min(0, 'Le pourcentage ne peut pas être négatif')
  .max(100, 'Le pourcentage ne peut pas dépasser 100');

/**
 * Validation nom école
 */
export const SchoolNameSchema = z.string()
  .min(3, 'Le nom doit contenir au moins 3 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .regex(/^[a-zA-ZÀ-ÿ0-9\s\-']+$/, 'Le nom contient des caractères invalides');

/**
 * Validation période (mois)
 */
export const PeriodSchema = z.number()
  .int('La période doit être un nombre entier')
  .min(1, 'La période doit être au moins 1 mois')
  .max(24, 'La période ne peut pas dépasser 24 mois');

/**
 * Schéma paiement
 */
export const PaymentSchema = z.object({
  id: UUIDSchema.optional(),
  studentId: UUIDSchema,
  schoolId: UUIDSchema,
  amount: AmountSchema,
  paymentDate: DateSchema,
  status: z.enum(['paid', 'pending', 'overdue', 'cancelled']),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_money', 'check']).optional(),
  reference: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schéma dépense
 */
export const ExpenseSchema = z.object({
  id: UUIDSchema.optional(),
  schoolId: UUIDSchema,
  amount: AmountSchema,
  expenseDate: DateSchema,
  category: z.enum([
    'salaries',
    'utilities',
    'supplies',
    'maintenance',
    'transport',
    'marketing',
    'other'
  ]),
  description: z.string().min(3).max(200),
  reference: z.string().max(50).optional(),
  approvedBy: UUIDSchema.optional(),
});

/**
 * Schéma recherche école
 */
export const SchoolSearchSchema = z.object({
  query: z.string()
    .min(1, 'La recherche doit contenir au moins 1 caractère')
    .max(100, 'La recherche ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-']+$/, 'La recherche contient des caractères invalides'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Schéma export données
 */
export const ExportSchema = z.object({
  schoolIds: z.array(UUIDSchema).min(1, 'Au moins une école doit être sélectionnée'),
  format: z.enum(['pdf', 'excel', 'csv']),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  includeDetails: z.boolean().default(false),
});

/**
 * Schéma comparaison périodes
 */
export const ComparisonSchema = z.object({
  schoolId: UUIDSchema.optional(),
  currentPeriodStart: DateSchema,
  currentPeriodEnd: DateSchema,
  previousPeriodStart: DateSchema,
  previousPeriodEnd: DateSchema,
}).refine(
  (data) => new Date(data.currentPeriodEnd) > new Date(data.currentPeriodStart),
  'La date de fin doit être après la date de début'
).refine(
  (data) => new Date(data.previousPeriodEnd) > new Date(data.previousPeriodStart),
  'La date de fin de la période précédente doit être après la date de début'
);

/**
 * Schéma alerte financière
 */
export const FinancialAlertSchema = z.object({
  id: UUIDSchema.optional(),
  schoolId: UUIDSchema.optional(),
  type: z.enum(['overdue_payments', 'low_revenue', 'high_expenses', 'low_margin']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(10).max(500),
  threshold: AmountSchema.optional(),
  resolved: z.boolean().default(false),
  resolvedAt: DateSchema.optional(),
  resolvedBy: UUIDSchema.optional(),
});

/**
 * Fonction helper pour valider et sanitizer
 */
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation échouée: ${errors}`);
    }
    throw error;
  }
}

/**
 * Middleware Express pour validation
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedData = validateAndSanitize(schema, req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation échouée',
        message: error instanceof Error ? error.message : 'Données invalides',
      });
    }
  };
}

/**
 * Exemples d'utilisation
 * 
 * @example
 * // Dans une route Express
 * app.post('/api/payments', validateRequest(PaymentSchema), async (req, res) => {
 *   const payment = req.validatedData; // Type-safe et validé
 *   // ...
 * });
 * 
 * @example
 * // Validation manuelle
 * try {
 *   const validPayment = validateAndSanitize(PaymentSchema, userInput);
 *   await savePayment(validPayment);
 * } catch (error) {
 *   console.error('Validation error:', error.message);
 * }
 */
