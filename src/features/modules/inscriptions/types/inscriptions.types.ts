/**
 * Types TypeScript pour le module Inscriptions
 * @module InscriptionsTypes
 */

/**
 * Statut d'une inscription (valeurs BDD Supabase)
 */
export type InscriptionStatus = 
  | 'pending'       // En attente de traitement
  | 'validated'     // Validée et acceptée
  | 'rejected'      // Refusée
  | 'enrolled';     // Inscrit(e) définitivement

/**
 * Étape du workflow
 */
export type WorkflowStep = 
  | 'soumission'      // Formulaire soumis
  | 'verification'    // Vérification documents
  | 'validation'      // Validation direction
  | 'finalisation';   // Finalisation

// Types simplifiés - Profil élève détaillé retiré pour l'instant

/**
 * Inscription SIMPLIFIÉE - Version minimale
 * Le profil détaillé de l'élève sera géré plus tard dans un module dédié
 */
export interface Inscription {
  id: string;
  
  // Référence
  schoolId: string;
  academicYear: string;
  inscriptionNumber: string;
  
  // Élève (MINIMUM)
  studentFirstName: string;
  studentLastName: string;
  studentDateOfBirth?: string;
  studentPlaceOfBirth?: string;
  studentGender?: 'M' | 'F';
  studentPhoto?: string;
  
  // Classe demandée
  requestedLevel: string;  // Ex: "6EME", "CM2", "TLE A"
  requestedClassId?: string;
  
  // Informations complémentaires
  serie?: string;
  typeInscription?: 'nouvelle' | 'reinscription' | 'transfert';
  filiere?: string;
  optionSpecialite?: string;
  ancienneEcole?: string;
  estRedoublant?: boolean;
  estAffecte?: boolean;
  numeroAffectation?: string;
  aAideSociale?: boolean;
  estPensionnaire?: boolean;
  aBourse?: boolean;
  
  // Contact élève
  studentPhone?: string;
  studentEmail?: string;
  studentNationality?: string;
  studentPostnom?: string;
  
  // Paiement
  montantPaye?: number;
  modePaiement?: string;
  
  // Frais
  fraisInscription?: number;
  fraisScolarite?: number;
  fraisCantine?: number;
  fraisTransport?: number;
  
  // Parents
  parent1?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    profession?: string;
    address?: string;
  };
  parent2?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    profession?: string;
    address?: string;
  };
  
  // Adresse
  address?: string;
  city?: string;
  region?: string;
  
  // Documents
  documents?: string[];
  
  // Établissement d'origine
  etablissementOrigine?: string;
  
  // Statut & Workflow
  status: InscriptionStatus;
  
  // Notes internes (optionnel)
  notes?: string;
  rejectionReason?: string;
  
  // Métadonnées
  submittedAt?: string; // Date de soumission (optionnel, peut être égal à createdAt)
  validatedAt?: string;
  validatedBy?: string;
  assignedClassId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Données pour créer une inscription SIMPLIFIÉE
 */
export interface CreateInscriptionInput {
  schoolId: string;
  academicYear: string;
  
  // Élève (MINIMUM)
  studentFirstName: string;
  studentLastName: string;
  
  // Classe demandée
  requestedLevel: string;
  requestedClassId?: string;
  
  // Notes (optionnel)
  internalNotes?: string;
}

/**
 * Statistiques des inscriptions
 */
export interface InscriptionStats {
  total: number;
  enAttente: number;
  enCours: number;
  validees: number;
  refusees: number;
  annulees: number;
  
  // Par mois (12 derniers mois)
  byMonth: {
    month: string;
    count: number;
  }[];
  
  // Par classe
  byLevel: {
    level: string;
    count: number;
  }[];
  
  // Taux de validation
  validationRate: number;
}

/**
 * Filtres pour la liste des inscriptions
 */
export interface InscriptionFilters {
  query?: string;
  status?: InscriptionStatus;
  academicYear?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
}
