/**
 * Types TypeScript pour le module Inscriptions
 * Basés sur la structure réelle de la table inscriptions
 */

// ============================================================================
// TYPE PRINCIPAL : Inscription
// ============================================================================

export interface Inscription {
  // Identifiants
  id: string;
  school_id: string;
  inscription_number: string;
  
  // Année académique
  academic_year: string;
  
  // ========================================================================
  // 1. INFORMATIONS ÉLÈVE
  // ========================================================================
  student_first_name: string;
  student_last_name: string;
  student_postnom?: string;
  student_date_of_birth: string;
  student_place_of_birth?: string;
  student_gender: 'M' | 'F';
  student_photo?: string;
  student_nationality?: string;
  student_national_id?: string;
  student_phone?: string;
  student_email?: string;
  
  // ========================================================================
  // 2. INFORMATIONS SCOLAIRES
  // ========================================================================
  requested_class_id?: string;
  requested_level: string;
  serie?: string;
  filiere?: string;
  option_specialite?: string;
  type_inscription?: 'nouvelle' | 'reinscription' | 'transfert';
  ancienne_ecole?: string;
  moyenne_admission?: number;
  numero_dossier_papier?: string;
  
  // Statut scolaire
  est_redoublant: boolean;
  est_affecte: boolean;
  numero_affectation?: string;
  
  // ========================================================================
  // 3. INFORMATIONS PARENTS / TUTEURS
  // ========================================================================
  // Parent 1 (Père)
  parent1_first_name?: string;
  parent1_last_name?: string;
  parent1_phone: string;
  parent1_email?: string;
  parent1_profession?: string;
  parent1_address?: string;
  
  // Parent 2 (Mère)
  parent2_first_name?: string;
  parent2_last_name?: string;
  parent2_phone?: string;
  parent2_email?: string;
  parent2_profession?: string;
  parent2_address?: string;
  
  // Tuteur (si différent)
  tuteur_first_name?: string;
  tuteur_last_name?: string;
  tuteur_phone?: string;
  tuteur_address?: string;
  tuteur_relation?: string;
  
  // Adresse commune
  address?: string;
  city?: string;
  region?: string;
  
  // ========================================================================
  // 4. INFORMATIONS FINANCIÈRES
  // ========================================================================
  frais_inscription: number;
  frais_scolarite: number;
  frais_cantine?: number;
  frais_transport?: number;
  mode_paiement?: 'Espèces' | 'Mobile Money' | 'Virement bancaire' | 'Chèque';
  montant_paye?: number;
  solde_restant?: number;
  reference_paiement?: string;
  date_paiement?: string;
  
  // Aides sociales
  a_aide_sociale: boolean;
  est_pensionnaire: boolean;
  a_bourse: boolean;
  
  // ========================================================================
  // 5. DOCUMENTS
  // ========================================================================
  documents: string | Document[];
  acte_naissance_url?: string;
  photo_identite_url?: string;
  certificat_transfert_url?: string;
  releve_notes_url?: string;
  carnet_vaccination_url?: string;
  
  // ========================================================================
  // 6. GESTION INTERNE
  // ========================================================================
  status: 'en_attente' | 'validee' | 'refusee' | 'brouillon';
  workflow_step: 'soumission' | 'validation' | 'refus' | 'brouillon';
  internal_notes?: string;
  observations?: string;
  rejection_reason?: string;
  agent_inscription_id?: string;
  
  // Dates
  submitted_at?: string;
  validated_at?: string;
  validated_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPES POUR LES DOCUMENTS
// ============================================================================

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  uploadedAt?: string;
}

// ============================================================================
// TYPES POUR LES FORMULAIRES
// ============================================================================

// Étape 1 : Informations générales
export interface InscriptionStep1Data {
  student_photo?: File | string;
  student_first_name: string;
  student_last_name: string;
  student_postnom?: string;
  student_gender: 'M' | 'F';
  student_date_of_birth: string;
  student_place_of_birth?: string;
  student_nationality?: string;
  student_national_id?: string;
  student_phone?: string;
  student_email?: string;
  address?: string;
  city?: string;
  region?: string;
}

// Étape 2 : Parents / Tuteurs
export interface InscriptionStep2Data {
  // Père
  parent1_first_name?: string;
  parent1_last_name?: string;
  parent1_phone: string;
  parent1_email?: string;
  parent1_profession?: string;
  parent1_address?: string;
  
  // Mère
  parent2_first_name?: string;
  parent2_last_name?: string;
  parent2_phone?: string;
  parent2_email?: string;
  parent2_profession?: string;
  parent2_address?: string;
  
  // Tuteur
  tuteur_first_name?: string;
  tuteur_last_name?: string;
  tuteur_phone?: string;
  tuteur_address?: string;
  tuteur_relation?: string;
}

// Étape 3 : Informations scolaires
export interface InscriptionStep3Data {
  academic_year: string;
  requested_level: string;
  requested_class_id?: string;
  serie?: string;
  filiere?: string;
  option_specialite?: string;
  type_inscription: 'nouvelle' | 'reinscription' | 'transfert';
  ancienne_ecole?: string;
  moyenne_admission?: number;
  numero_dossier_papier?: string;
  est_redoublant: boolean;
  est_affecte: boolean;
  numero_affectation?: string;
}

// Étape 4 : Informations financières
export interface InscriptionStep4Data {
  frais_inscription: number;
  frais_scolarite: number;
  frais_cantine?: number;
  frais_transport?: number;
  mode_paiement?: 'Espèces' | 'Mobile Money' | 'Virement bancaire' | 'Chèque';
  montant_paye?: number;
  reference_paiement?: string;
  date_paiement?: string;
  a_aide_sociale: boolean;
  est_pensionnaire: boolean;
  a_bourse: boolean;
}

// Étape 5 : Documents
export interface InscriptionStep5Data {
  acte_naissance?: File | string;
  photo_identite?: File | string;
  certificat_transfert?: File | string;
  releve_notes?: File | string;
  carnet_vaccination?: File | string;
}

// Étape 6 : Validation
export interface InscriptionStep6Data {
  observations?: string;
  internal_notes?: string;
}

// Données complètes du formulaire
export interface InscriptionFormData extends 
  InscriptionStep1Data,
  InscriptionStep2Data,
  InscriptionStep3Data,
  InscriptionStep4Data,
  InscriptionStep5Data,
  InscriptionStep6Data {
  school_id: string;
}

// ============================================================================
// TYPES POUR LES STATISTIQUES
// ============================================================================

export interface InscriptionStats {
  total: number;
  en_attente: number;
  validees: number;
  refusees: number;
  brouillons?: number;
  nouvelles?: number;
  reinscriptions?: number;
  transferts?: number;
  revenus_potentiels?: number;
  revenus_percus?: number;
  soldes_restants?: number;
}

export interface InscriptionStatsByLevel {
  niveau: string;
  total: number;
  en_attente: number;
  validees: number;
  refusees: number;
  revenus_potentiels: number;
  revenus_percus: number;
  soldes_restants: number;
}

export interface InscriptionStatsByYear {
  academic_year: string;
  total: number;
  en_attente: number;
  validees: number;
  refusees: number;
  nouvelles: number;
  reinscriptions: number;
  transferts: number;
  revenus_percus: number;
}

// ============================================================================
// TYPES POUR LES FILTRES
// ============================================================================

export interface InscriptionFilters {
  niveau?: string;
  classe?: string;
  status?: string;
  academic_year?: string;
  type_inscription?: string;
  search?: string;
  date_debut?: string;
  date_fin?: string;
}

// ============================================================================
// TYPES POUR LES ACTIONS
// ============================================================================

export interface ValidateInscriptionParams {
  inscriptionId: string;
  agentId: string;
  observations?: string;
}

export interface RejectInscriptionParams {
  inscriptionId: string;
  agentId: string;
  motif: string;
}

export interface UpdatePaiementParams {
  inscriptionId: string;
  montant_paye: number;
  mode_paiement: string;
  reference: string;
  date_paiement: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const NIVEAUX_ENSEIGNEMENT = [
  { value: 'MATERNELLE', label: 'Maternelle', icon: '🧸' },
  { value: 'PRIMAIRE', label: 'Primaire', icon: '📚' },
  { value: 'COLLEGE', label: 'Collège', icon: '🎒' },
  { value: 'LYCEE_GENERAL', label: 'Lycée Général', icon: '🎓' },
  { value: 'LYCEE_TECHNIQUE', label: 'Lycée Technique', icon: '⚙️' },
  { value: 'PROFESSIONNEL', label: 'Enseignement Professionnel', icon: '🔧' },
  { value: 'SUPERIEUR', label: 'Enseignement Supérieur', icon: '🏛️' },
] as const;

export const CLASSES_PAR_NIVEAU: Record<string, string[]> = {
  MATERNELLE: ['Petite Section', 'Moyenne Section', 'Grande Section'],
  PRIMAIRE: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  COLLEGE: ['6ème', '5ème', '4ème', '3ème'],
  LYCEE_GENERAL: ['2nde', '1ère', 'Terminale'],
  LYCEE_TECHNIQUE: ['2nde Tech', '1ère Tech', 'Terminale Tech'],
  PROFESSIONNEL: ['CAP 1', 'CAP 2', 'BEP 1', 'BEP 2'],
  SUPERIEUR: ['L1', 'L2', 'L3', 'M1', 'M2'],
};

export const FILIERES_PAR_NIVEAU: Record<string, string[]> = {
  LYCEE_GENERAL: ['Scientifique', 'Littéraire', 'Sciences Économiques'],
  LYCEE_TECHNIQUE: ['Électrotechnique', 'Mécanique', 'Informatique', 'Bâtiment'],
  PROFESSIONNEL: ['Coiffure', 'Couture', 'Menuiserie', 'Plomberie', 'Électricité'],
  SUPERIEUR: ['Sciences', 'Lettres', 'Droit', 'Économie', 'Médecine', 'Ingénierie'],
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'warning' },
  validee: { label: 'Validée', color: 'success' },
  refusee: { label: 'Refusée', color: 'danger' },
  brouillon: { label: 'Brouillon', color: 'default' },
};

export const TYPE_INSCRIPTION_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle inscription',
  reinscription: 'Réinscription',
  transfert: 'Transfert',
};

export const MODES_PAIEMENT = [
  'Espèces',
  'Mobile Money',
  'Virement bancaire',
  'Chèque',
] as const;

// ============================================================================
// TYPES POUR LES RÉPONSES API
// ============================================================================

export interface InscriptionsResponse {
  data: Inscription[];
  count: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface InscriptionResponse {
  data: Inscription;
}

export interface InscriptionStatsResponse {
  data: InscriptionStats;
}
