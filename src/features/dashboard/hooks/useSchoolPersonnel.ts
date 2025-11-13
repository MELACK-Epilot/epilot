/**
 * Hook pour récupérer le personnel d'une école depuis la base de données
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PersonnelMember {
  id: string;
  userId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  fonction: string;
  department: string | null;
  hireDate: string | null;
  status: 'active' | 'inactive' | 'suspended';
  photoUrl: string | null;
}

export interface PersonnelStats {
  totalPersonnel: number;
  totalEnseignants: number;
  totalAdministratif: number;
  totalSupport: number;
  directeur: PersonnelMember | null;
  personnel: PersonnelMember[];
}

export const useSchoolPersonnel = (schoolId: string) => {
  return useQuery<PersonnelStats>({
    queryKey: ['school-personnel', schoolId],
    queryFn: async (): Promise<PersonnelStats> => {
      if (!schoolId) {
        throw new Error('schoolId manquant');
      }

      // Récupérer tous les utilisateurs de l'école
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('role', { ascending: true });

      if (error) {
        console.error('Erreur récupération personnel:', error);
        throw error;
      }

      // Transformer les données
      const personnel: PersonnelMember[] = (users || []).map((user) => ({
        id: user.id,
        userId: user.id,
        schoolId: user.school_id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        phone: user.phone,
        role: user.role,
        fonction: user.fonction || user.role,
        department: user.department,
        hireDate: user.hire_date,
        status: user.status,
        photoUrl: user.photo_url,
      }));

      // Trouver le directeur
      const directeur = personnel.find(
        (p) => p.role === 'directeur' || p.role === 'proviseur'
      ) || null;

      // Compter par catégorie
      const totalEnseignants = personnel.filter(
        (p) => p.role === 'enseignant' || p.role === 'teacher'
      ).length;

      const totalAdministratif = personnel.filter(
        (p) => p.role === 'admin_staff' || p.role === 'comptable' || p.role === 'secretaire'
      ).length;

      const totalSupport = personnel.filter(
        (p) => p.role === 'cpe' || p.role === 'surveillant' || p.role === 'support_staff'
      ).length;

      return {
        totalPersonnel: personnel.length,
        totalEnseignants,
        totalAdministratif,
        totalSupport,
        directeur,
        personnel,
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
