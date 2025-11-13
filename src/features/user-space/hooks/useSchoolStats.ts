/**
 * Hook pour récupérer les statistiques de l'école du Proviseur/Directeur
 * Filtré par school_id de l'utilisateur connecté
 * 
 * @module useSchoolStats
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';
import { useHasModules } from './useHasModule';

/**
 * Interface pour les informations de l'école
 */
interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
  school_group_id: string;
}

/**
 * Interface pour les statistiques de l'école
 */
interface SchoolStats {
  school: School | null;
  totalStaff: number;
  totalStudents: number;
  totalClasses: number;
  monthlyRevenue: number;
  pendingPayments: number;
  staffByRole: Record<string, number>;
  classesData: Array<{
    id: string;
    name: string;
    level: string;
    current_enrollment: number;
    capacity: number;
  }>;
}

/**
 * Hook pour récupérer les statistiques complètes de l'école
 * Utilisé par le Proviseur/Directeur pour voir les données de SON école uniquement
 */
export const useSchoolStats = () => {
  const { data: user } = useCurrentUser();
  
  // Vérifier quels modules sont assignés
  const modulePermissions = useHasModules([
    'finances',
    'classes', 
    'personnel',
    'eleves'
  ]);

  return useQuery<SchoolStats>({
    queryKey: [
      'school-stats', 
      user?.schoolId,
      modulePermissions.finances,
      modulePermissions.classes,
      modulePermissions.personnel,
      modulePermissions.eleves
    ],
    queryFn: async () => {
      if (!user?.schoolId) {
        console.warn('⚠️ useSchoolStats: Utilisateur sans school_id');
        throw new Error('Proviseur non associé à une école');
      }

      console.log('🔍 Chargement des statistiques pour l\'école:', user.schoolId);
      console.log('📋 Modules assignés:', modulePermissions);

      // 1. Informations de l'école
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, code, address, phone, email, status, school_group_id')
        .eq('id', user.schoolId)
        .single();

      if (schoolError) {
        console.error('❌ Erreur récupération école:', schoolError);
        throw schoolError;
      }

      if (!school) {
        throw new Error('École non trouvée');
      }

      console.log('✅ École trouvée:', school.name);

      // 2. Personnel de l'école (CONDITIONNEL - module personnel)
      let totalStaff = 0;
      let staffByRole: Record<string, number> = {};
      
      if (modulePermissions.personnel) {
        const { data: staff, error: staffError } = await supabase
          .from('users')
          .select('id, role, status')
          .eq('school_id', user.schoolId)
          .eq('status', 'active')
          .in('role', [
            'enseignant',
            'cpe',
            'surveillant',
            'secretaire',
            'comptable',
            'bibliothecaire',
            'gestionnaire_cantine',
            'conseiller_orientation',
            'infirmier'
          ]);

        if (staffError) {
          console.error('❌ Erreur récupération personnel:', staffError);
        }

        totalStaff = staff?.length || 0;
        console.log('👥 Personnel trouvé:', totalStaff);

        // Répartition du personnel par rôle
        staffByRole = staff?.reduce((acc, s) => {
          acc[s.role] = (acc[s.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
      } else {
        console.log('⚠️ Module Personnel non assigné - Données non chargées');
      }

      // 3. Élèves de l'école (CONDITIONNEL - module eleves)
      let totalStudents = 0;
      
      if (modulePermissions.eleves) {
        const { data: students, error: studentsError } = await supabase
          .from('users')
          .select('id')
          .eq('school_id', user.schoolId)
          .eq('role', 'eleve')
          .eq('status', 'active');

        if (studentsError) {
          console.error('❌ Erreur récupération élèves:', studentsError);
        }

        totalStudents = students?.length || 0;
        console.log('🎓 Élèves trouvés:', totalStudents);
      } else {
        console.log('⚠️ Module Élèves non assigné - Données non chargées');
      }

      // 4. Classes de l'école (CONDITIONNEL - module classes)
      let totalClasses = 0;
      let classesData: Array<any> = [];
      
      if (modulePermissions.classes) {
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id, name, level, current_enrollment, capacity')
          .eq('school_id', user.schoolId)
          .eq('status', 'active')
          .order('level', { ascending: true })
          .order('name', { ascending: true });

        if (classesError) {
          console.error('❌ Erreur récupération classes:', classesError);
        }

        totalClasses = classes?.length || 0;
        classesData = classes || [];
        console.log('📚 Classes trouvées:', totalClasses);
      } else {
        console.log('⚠️ Module Classes non assigné - Données non chargées');
      }

      // 5. Finances de l'école (CONDITIONNEL - module finances)
      let monthlyRevenue = 0;
      let pendingPayments = 0;
      
      if (modulePermissions.finances) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: payments, error: paymentsError } = await supabase
          .from('fee_payments')
          .select('amount, status')
          .eq('school_id', user.schoolId)
          .gte('created_at', startOfMonth.toISOString());

        if (paymentsError) {
          console.error('❌ Erreur récupération paiements:', paymentsError);
        }

        // Calcul des revenus du mois (paiements complétés)
        monthlyRevenue = payments
          ?.filter(p => p.status === 'paid' || p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Calcul des paiements en attente
        pendingPayments = payments
          ?.filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        console.log('💰 Revenus du mois:', monthlyRevenue, 'FCFA');
        console.log('⏳ Paiements en attente:', pendingPayments, 'FCFA');
      } else {
        console.log('⚠️ Module Finances non assigné - Données non chargées');
      }

      return {
        school: school as School,
        totalStaff,
        totalStudents,
        totalClasses,
        monthlyRevenue,
        pendingPayments,
        staffByRole,
        classesData
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
    retry: 2,
  });
};

/**
 * Hook pour récupérer uniquement les informations de l'école
 * Version légère sans les statistiques
 */
export const useSchoolInfo = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-info', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) {
        throw new Error('Utilisateur non associé à une école');
      }

      const { data, error } = await supabase
        .from('schools')
        .select('id, name, code, address, phone, email, status, school_group_id')
        .eq('id', user.schoolId)
        .single();

      if (error) throw error;
      return data as School;
    },
    enabled: !!user?.schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer le personnel de l'école
 */
export const useSchoolStaff = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-staff', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) {
        throw new Error('Utilisateur non associé à une école');
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, email, avatar, status, phone')
        .eq('school_id', user.schoolId)
        .in('role', [
          'enseignant',
          'cpe',
          'surveillant',
          'secretaire',
          'comptable',
          'bibliothecaire',
          'gestionnaire_cantine',
          'conseiller_orientation',
          'infirmier'
        ])
        .order('role', { ascending: true })
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.schoolId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook pour récupérer les élèves de l'école
 */
export const useSchoolStudents = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-students', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) {
        throw new Error('Utilisateur non associé à une école');
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, avatar, status, gender, birthdate')
        .eq('school_id', user.schoolId)
        .eq('role', 'eleve')
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.schoolId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook pour récupérer les classes de l'école
 */
export const useSchoolClasses = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-classes', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) {
        throw new Error('Utilisateur non associé à une école');
      }

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          code,
          level,
          current_enrollment,
          capacity,
          academic_year,
          main_teacher_id,
          status
        `)
        .eq('school_id', user.schoolId)
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.schoolId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};
