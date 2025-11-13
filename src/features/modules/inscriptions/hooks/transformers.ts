/**
 * Transformers pour Inscriptions
 * Convertit les données Supabase → Format App
 */

import type { Inscription } from '../types/inscriptions.types';
import type { SupabaseInscription } from './types';

/**
 * Transforme une inscription Supabase en format App
 */
export function transformInscription(data: SupabaseInscription): Inscription {
  return {
    id: data.id,
    schoolId: data.school_id,
    academicYear: data.academic_year,
    inscriptionNumber: data.inscription_number,
    studentFirstName: data.student_first_name,
    studentLastName: data.student_last_name,
    studentDateOfBirth: data.student_date_of_birth,
    studentPlaceOfBirth: data.student_place_of_birth ?? undefined,
    studentGender: data.student_gender,
    studentPhoto: data.student_photo ?? undefined,
    requestedLevel: data.requested_level,
    requestedClassId: data.requested_class_id ?? undefined,
    serie: data.serie ?? undefined,
    typeInscription: data.type_inscription ?? undefined,
    filiere: data.filiere ?? undefined,
    optionSpecialite: data.option_specialite ?? undefined,
    ancienneEcole: data.ancienne_ecole ?? undefined,
    estRedoublant: data.est_redoublant,
    estAffecte: data.est_affecte,
    numeroAffectation: data.numero_affectation ?? undefined,
    etablissementOrigine: data.etablissement_origine ?? undefined,
    studentPhone: data.student_phone ?? undefined,
    studentEmail: data.student_email ?? undefined,
    studentNationality: data.student_nationality ?? undefined,
    studentPostnom: data.student_postnom ?? undefined,
    montantPaye: data.montant_paye ?? undefined,
    modePaiement: data.mode_paiement ?? undefined,
    aAideSociale: data.a_aide_sociale,
    estPensionnaire: data.est_pensionnaire,
    aBourse: data.a_bourse,
    fraisInscription: data.frais_inscription ?? undefined,
    fraisScolarite: data.frais_scolarite ?? undefined,
    fraisCantine: data.frais_cantine ?? undefined,
    fraisTransport: data.frais_transport ?? undefined,
    parent1: {
      firstName: data.parent1_first_name,
      lastName: data.parent1_last_name,
      phone: data.parent1_phone,
      email: data.parent1_email ?? undefined,
      profession: data.parent1_profession ?? undefined,
    },
    parent2: data.parent2_first_name ? {
      firstName: data.parent2_first_name,
      lastName: data.parent2_last_name!,
      phone: data.parent2_phone!,
      email: data.parent2_email ?? undefined,
      profession: data.parent2_profession ?? undefined,
    } : undefined,
    address: data.address ?? undefined,
    city: data.city ?? undefined,
    region: data.region ?? undefined,
    documents: Array.isArray(data.documents) ? (data.documents as string[]) : [],
    status: data.status,
    notes: data.notes ?? undefined,
    rejectionReason: data.rejection_reason ?? undefined,
    validatedAt: data.validated_at ?? undefined,
    validatedBy: data.validated_by ?? undefined,
    assignedClassId: data.assigned_class_id ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
