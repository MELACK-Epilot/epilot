import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  school_group_id: string | null;
  school_id: string | null;
  status: 'active' | 'inactive' | 'suspended';
  avatar: string | null;
  department?: string;
  join_date?: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export const useStaff = (schoolId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tout le personnel
  const { data: staff = [], isLoading, error, refetch } = useQuery({
    queryKey: ['staff', schoolId || user?.school_group_id],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          *,
          schools!left(name),
          school_groups!left(name)
        `)
        .neq('role', 'eleve')
        .neq('role', 'parent')
        .order('first_name');

      // Filtrer par école si spécifié
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (user?.school_group_id) {
        query = query.eq('school_group_id', user.school_group_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StaffMember[];
    },
    enabled: !!(schoolId || user?.school_group_id),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Créer un nouveau membre du personnel
  const createStaffMutation = useMutation({
    mutationFn: async (newStaff: Partial<StaffMember>) => {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStaff.email!,
        password: 'TempPassword123!', // Mot de passe temporaire
        options: {
          data: {
            first_name: newStaff.first_name,
            last_name: newStaff.last_name,
          },
        },
      });

      if (authError) throw authError;

      // 2. Créer l'entrée dans la table users
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user!.id,
            ...newStaff,
            school_group_id: user?.school_group_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Membre ajouté !',
        description: 'Le nouveau membre du personnel a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le membre.',
        variant: 'destructive',
      });
    },
  });

  // Mettre à jour un membre du personnel
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StaffMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Membre mis à jour !',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le membre.',
        variant: 'destructive',
      });
    },
  });

  // Supprimer un membre du personnel
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Membre supprimé',
        description: 'Le membre du personnel a été supprimé.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le membre.',
        variant: 'destructive',
      });
    },
  });

  // Statistiques du personnel
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    inactive: staff.filter(s => s.status === 'inactive').length,
    onLeave: staff.filter(s => s.status === 'suspended').length,
    byRole: staff.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    staff,
    isLoading,
    error,
    refetch,
    stats,
    createStaff: createStaffMutation.mutate,
    updateStaff: updateStaffMutation.mutate,
    deleteStaff: deleteStaffMutation.mutate,
    isCreating: createStaffMutation.isPending,
    isUpdating: updateStaffMutation.isPending,
    isDeleting: deleteStaffMutation.isPending,
  };
};
