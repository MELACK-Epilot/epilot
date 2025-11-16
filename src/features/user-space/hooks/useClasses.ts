import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Class {
  id: string;
  name: string;
  level: string;
  school_id: string;
  teacher_id: string | null;
  room: string | null;
  capacity: number;
  student_count: number;
  schedule: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Relations
  teacher?: {
    first_name: string;
    last_name: string;
  };
  school?: {
    name: string;
  };
}

export const useClasses = (schoolId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer toutes les classes
  const { data: classes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['classes', schoolId || user?.school_id],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          teacher:users!classes_teacher_id_fkey(first_name, last_name),
          school:schools(name)
        `)
        .order('level')
        .order('name');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (user?.school_id) {
        query = query.eq('school_id', user.school_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrichir avec des statistiques
      const enrichedClasses = await Promise.all(
        (data || []).map(async (classData) => {
          // Récupérer les statistiques de la classe
          const { data: stats } = await supabase
            .rpc('get_class_statistics', { class_id: classData.id });

          return {
            ...classData,
            average: stats?.average || 0,
            attendance: stats?.attendance || 0,
            subjects: stats?.subjects_count || 0,
          };
        })
      );

      return enrichedClasses as Class[];
    },
    enabled: !!(schoolId || user?.school_id),
    staleTime: 1000 * 60 * 5,
  });

  // Créer une nouvelle classe
  const createClassMutation = useMutation({
    mutationFn: async (newClass: Partial<Class>) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([newClass])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Classe créée !',
        description: 'La nouvelle classe a été ajoutée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la classe.',
        variant: 'destructive',
      });
    },
  });

  // Mettre à jour une classe
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Class> & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Classe mise à jour !',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la classe.',
        variant: 'destructive',
      });
    },
  });

  // Supprimer une classe
  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Classe supprimée',
        description: 'La classe a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la classe.',
        variant: 'destructive',
      });
    },
  });

  // Statistiques des classes
  const stats = {
    total: classes.length,
    totalStudents: classes.reduce((acc, c) => acc + c.student_count, 0),
    totalCapacity: classes.reduce((acc, c) => acc + c.capacity, 0),
    averageAttendance: classes.length > 0
      ? Math.round(classes.reduce((acc, c) => acc + (c.attendance || 0), 0) / classes.length)
      : 0,
    averageGrade: classes.length > 0
      ? (classes.reduce((acc, c) => acc + (c.average || 0), 0) / classes.length).toFixed(1)
      : '0.0',
    byLevel: classes.reduce((acc, classData) => {
      acc[classData.level] = (acc[classData.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    classes,
    isLoading,
    error,
    refetch,
    stats,
    createClass: createClassMutation.mutate,
    updateClass: updateClassMutation.mutate,
    deleteClass: deleteClassMutation.mutate,
    isCreating: createClassMutation.isPending,
    isUpdating: updateClassMutation.isPending,
    isDeleting: deleteClassMutation.isPending,
  };
};
