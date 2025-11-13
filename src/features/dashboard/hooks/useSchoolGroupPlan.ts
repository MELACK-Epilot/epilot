/**
 * Hook pour récupérer le plan d'abonnement d'un groupe scolaire
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SchoolGroupPlan {
  id: string;
  school_group_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'expired';
  start_date: string;
  end_date: string | null;
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    billing_period: 'monthly' | 'yearly';
    max_schools: number;
    max_users: number;
    features: string[];
  };
}

export const useSchoolGroupPlan = (schoolGroupId: string | undefined) => {
  return useQuery({
    queryKey: ['school-group-plan', schoolGroupId],
    queryFn: async (): Promise<SchoolGroupPlan | null> => {
      if (!schoolGroupId) throw new Error('School Group ID requis');

      const { data, error } = await supabase
        .from('school_group_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Erreur récupération plan:', error);
        return null;
      }

      return data;
    },
    enabled: !!schoolGroupId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
