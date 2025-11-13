/**
 * Hook pour récupérer les détails complets d'une école
 * Logo, couleur, directeur, niveaux, stats par niveau
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolDetails {
  // Identifiants
  id: string;
  schoolGroupId: string;
  code: string;
  name: string;
  
  // Informations générales
  typeEtablissement: 'public' | 'prive' | 'confessionnel' | 'autre';
  niveauEnseignement: string[];
  status: 'active' | 'inactive' | 'suspended' | 'archived';
  
  // Localisation
  address: string | null;
  city: string | null;
  commune: string | null;
  departement: string | null;
  pays: string;
  codePostal: string | null;
  
  // Directeur/Proviseur
  directeurNomComplet: string | null;
  directeurTelephone: string | null;
  directeurEmail: string | null;
  directeurFonction: string;
  
  // Contacts
  telephoneFixe: string | null;
  telephoneMobile: string | null;
  emailInstitutionnel: string | null;
  siteWeb: string | null;
  
  // Statistiques
  nombreElevesActuels: number;
  nombreEnseignants: number;
  nombreClasses: number;
  anneeOuverture: number | null;
  
  // Visuel
  logoUrl: string | null;
  couleurPrincipale: string;
  
  // Autres
  devise: string;
  description: string | null;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

export interface LevelStats {
  level: string;
  nombreEleves: number;
  nombreClasses: number;
  revenusTotal: number;
  depensesTotal: number;
  revenusParEleve: number;
  tauxRecouvrement: number;
  montantRetards: number;
}

// ============================================================================
// HOOK : DÉTAILS COMPLETS ÉCOLE
// ============================================================================

export const useSchoolDetails = (schoolId: string) => {
  return useQuery<SchoolDetails>({
    queryKey: ['school-details', schoolId],
    queryFn: async (): Promise<SchoolDetails> => {
      if (!schoolId) {
        throw new Error('schoolId manquant');
      }

      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (error) {
        console.error('Erreur récupération école:', error);
        throw error;
      }

      if (!data) {
        throw new Error('École non trouvée');
      }

      // Transformer les données (snake_case → camelCase)
      return {
        id: data.id,
        schoolGroupId: data.school_group_id,
        code: data.code,
        name: data.name,
        typeEtablissement: data.type_etablissement,
        niveauEnseignement: data.niveau_enseignement || [],
        status: data.status,
        address: data.address,
        city: data.city,
        commune: data.commune,
        departement: data.departement,
        pays: data.pays || 'Congo',
        codePostal: data.code_postal,
        directeurNomComplet: data.directeur_nom_complet,
        directeurTelephone: data.directeur_telephone,
        directeurEmail: data.directeur_email,
        directeurFonction: data.directeur_fonction || 'Directeur',
        telephoneFixe: data.telephone_fixe,
        telephoneMobile: data.telephone_mobile,
        emailInstitutionnel: data.email_institutionnel,
        siteWeb: data.site_web,
        nombreElevesActuels: data.nombre_eleves_actuels || 0,
        nombreEnseignants: data.nombre_enseignants || 0,
        nombreClasses: data.nombre_classes || 0,
        anneeOuverture: data.annee_ouverture,
        logoUrl: data.logo_url,
        couleurPrincipale: data.couleur_principale || '#1D3557',
        devise: data.devise || 'FCFA',
        description: data.description,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// HOOK : STATS PAR NIVEAU (avec revenus, dépenses, élèves)
// ============================================================================

export const useSchoolLevelStatsComplete = (schoolId: string) => {
  return useQuery<LevelStats[]>({
    queryKey: ['school-level-stats-complete', schoolId],
    queryFn: async (): Promise<LevelStats[]> => {
      if (!schoolId) {
        throw new Error('schoolId manquant');
      }

      // Récupérer les stats financières par niveau
      const { data: financialData, error: financialError } = await supabase
        .from('level_financial_stats')
        .select('*')
        .eq('school_id', schoolId);

      if (financialError) {
        console.error('Erreur stats financières niveau:', financialError);
      }

      // Récupérer les stats d'élèves par niveau depuis la table students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('level')
        .eq('school_id', schoolId);

      if (studentError) {
        console.error('Erreur stats élèves:', studentError);
      }

      // Compter les élèves par niveau
      const studentsByLevel: Record<string, number> = {};
      studentData?.forEach((student) => {
        const level = student.level || 'Non défini';
        studentsByLevel[level] = (studentsByLevel[level] || 0) + 1;
      });

      // Récupérer les classes par niveau
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('level')
        .eq('school_id', schoolId);

      if (classError) {
        console.error('Erreur stats classes:', classError);
      }

      // Compter les classes par niveau
      const classesByLevel: Record<string, number> = {};
      classData?.forEach((classe) => {
        const level = classe.level || 'Non défini';
        classesByLevel[level] = (classesByLevel[level] || 0) + 1;
      });

      // Combiner toutes les données
      const levels = new Set([
        ...Object.keys(studentsByLevel),
        ...(financialData?.map((f) => f.level) || []),
      ]);

      const result: LevelStats[] = Array.from(levels).map((level) => {
        const financial = financialData?.find((f) => f.level === level);
        const nombreEleves = studentsByLevel[level] || 0;
        const nombreClasses = classesByLevel[level] || 0;
        const revenusTotal = financial?.total_revenue || 0;
        const depensesTotal = financial?.total_expenses || 0;
        const montantRetards = financial?.overdue_amount || 0;
        const tauxRecouvrement = financial?.recovery_rate || 0;

        return {
          level,
          nombreEleves,
          nombreClasses,
          revenusTotal,
          depensesTotal,
          revenusParEleve: nombreEleves > 0 ? revenusTotal / nombreEleves : 0,
          tauxRecouvrement,
          montantRetards,
        };
      });

      // Trier par niveau (6ème, 5ème, 4ème, etc.)
      const levelOrder = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];
      result.sort((a, b) => {
        const indexA = levelOrder.indexOf(a.level);
        const indexB = levelOrder.indexOf(b.level);
        if (indexA === -1 && indexB === -1) return a.level.localeCompare(b.level);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      return result;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
};
