import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface School {
  id: string;
  name: string;
  code: string;
  school_group_id: string;
  admin_id: string | null;
  student_count: number;
  staff_count: number;
  classes_count: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export const useSchools = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer toutes les écoles du groupe
  const { data: schools = [], isLoading, error, refetch } = useQuery({
    queryKey: ['schools', user?.school_group_id],
    queryFn: async () => {
      if (!user?.school_group_id) {
        throw new Error('Aucun groupe scolaire associé');
      }

      const { data, error } = await supabase
        .from('schools')
        .select(`
          *,
          school_groups!inner(name, plan)
        `)
        .eq('school_group_id', user.school_group_id)
        .order('name');

      if (error) throw error;

      // Enrichir avec des données calculées
      const enrichedSchools = await Promise.all(
        (data || []).map(async (school) => {
          // Compter les classes
          const { count: classesCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', school.id);

          return {
            ...school,
            classes_count: classesCount || 0,
          };
        })
      );

      return enrichedSchools as School[];
    },
    enabled: !!user?.school_group_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Récupérer une école spécifique
  const useSchool = (schoolId: string) => {
    return useQuery({
      queryKey: ['school', schoolId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();

        if (error) throw error;
        return data as School;
      },
      enabled: !!schoolId,
    });
  };

  // Créer une nouvelle école
  const createSchoolMutation = useMutation({
    mutationFn: async (newSchool: Partial<School>) => {
      const { data, error } = await supabase
        .from('schools')
        .insert([
          {
            ...newSchool,
            school_group_id: user?.school_group_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'École créée !',
        description: 'La nouvelle école a été ajoutée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'école.',
        variant: 'destructive',
      });
    },
  });

  // Mettre à jour une école
  const updateSchoolMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<School> & { id: string }) => {
      const { data, error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'École mise à jour !',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'école.',
        variant: 'destructive',
      });
    },
  });

  // Supprimer une école
  const deleteSchoolMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'École supprimée',
        description: 'L\'école a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'école.',
        variant: 'destructive',
      });
    },
  });

  // Statistiques globales
  const { data: stats } = useQuery({
    queryKey: ['schools-stats', user?.school_group_id],
    queryFn: async () => {
      if (!user?.school_group_id) return null;

      const totalStudents = schools.reduce((acc, school) => acc + school.student_count, 0);
      const totalStaff = schools.reduce((acc, school) => acc + school.staff_count, 0);
      const totalClasses = schools.reduce((acc, school) => acc + school.classes_count, 0);
      const activeSchools = schools.filter(s => s.status === 'active').length;

      return {
        totalSchools: schools.length,
        activeSchools,
        totalStudents,
        totalStaff,
        totalClasses,
      };
    },
    enabled: !!user?.school_group_id && schools.length > 0,
  });

  return {
    schools,
    isLoading,
    error,
    refetch,
    stats,
    useSchool,
    createSchool: createSchoolMutation.mutate,
    updateSchool: updateSchoolMutation.mutate,
    deleteSchool: deleteSchoolMutation.mutate,
    isCreating: createSchoolMutation.isPending,
    isUpdating: updateSchoolMutation.isPending,
    isDeleting: deleteSchoolMutation.isPending,
  };
};
