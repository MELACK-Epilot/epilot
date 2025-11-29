/**
 * Hook pour les KPIs avancés du Hub Abonnements
 * Calcule MRR, ARR, taux de renouvellement, expirations
 * @module useSubscriptionHubKPIs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubscriptionHubKPIs {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalActive: number;
  totalInactive: number;
  totalPending: number;
  totalTrial: number;
  totalSuspended: number;
  renewalRate: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  overduePayments: number;
  overdueAmount: number;
  averageSubscriptionValue: number;
  totalRevenue: number;
}

export const useSubscriptionHubKPIs = () => {
  return useQuery({
    queryKey: ['subscription-hub-kpis'],
    queryFn: async (): Promise<SubscriptionHubKPIs> => {
      try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        // 1. Récupérer tous les abonnements avec leurs plans et groupes
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            subscription_plans!inner (
              id,
              name,
              billing_period,
              price
            ),
            school_groups (
              id,
              name
            )
          `);

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          throw error;
        }

        console.log('📊 Total abonnements récupérés:', subscriptions?.length || 0);

        // 2. Calculer les KPIs
        let mrr = 0;
        let totalActive = 0;
        let totalInactive = 0;
        let totalPending = 0;
        let totalTrial = 0;
        let totalSuspended = 0;
        let expiringIn30Days = 0;
        let expiringIn60Days = 0;
        let expiringIn90Days = 0;
        let overduePayments = 0;
        let overdueAmount = 0;
        let totalRevenue = 0;

        (subscriptions || []).forEach((sub: any) => {
          const endDate = new Date(sub.end_date);
          const amount = sub.amount || 0;
          const planPrice = sub.subscription_plans?.price || 0;

          // Compter par statut
          switch (sub.status) {
            case 'active':
              totalActive++;
              // Calculer MRR basé sur le prix du plan
              const monthlyAmount = sub.subscription_plans?.billing_period === 'monthly' 
                ? planPrice 
                : sub.subscription_plans?.billing_period === 'yearly' 
                  ? planPrice / 12 
                  : 0;
              
              mrr += monthlyAmount;
              totalRevenue += planPrice;
              
              console.log('💰 Abonnement actif:', {
                groupe: sub.school_groups?.name,
                plan: sub.subscription_plans?.name,
                prix: planPrice,
                periode: sub.subscription_plans?.billing_period,
                mrrContribution: monthlyAmount
              });
              break;
            case 'expired':
            case 'cancelled':
              totalInactive++;
              break;
            case 'pending':
              totalPending++;
              break;
            case 'trial':
              totalTrial++;
              break;
            case 'suspended':
              totalSuspended++;
              break;
          }

          // Compter les expirations (seulement pour les abonnements actifs)
          if (sub.status === 'active' && sub.end_date) {
            const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
              expiringIn30Days++;
              console.log('⏰ Expire dans 30j:', sub.school_groups?.name, 'dans', daysUntilExpiry, 'jours');
            } else if (daysUntilExpiry > 30 && daysUntilExpiry <= 60) {
              expiringIn60Days++;
              console.log('⏰ Expire dans 60j:', sub.school_groups?.name, 'dans', daysUntilExpiry, 'jours');
            } else if (daysUntilExpiry > 60 && daysUntilExpiry <= 90) {
              expiringIn90Days++;
              console.log('⏰ Expire dans 90j:', sub.school_groups?.name, 'dans', daysUntilExpiry, 'jours');
            }
          }

          // Compter les paiements en retard
          if (sub.payment_status === 'overdue' || sub.payment_status === 'pending') {
            overduePayments++;
            overdueAmount += planPrice;
            console.log('⚠️ Paiement en retard:', sub.school_groups?.name, planPrice, 'FCFA');
          }
        });

        console.log('📈 Résumé KPIs:', {
          totalAbonnements: subscriptions?.length,
          actifs: totalActive,
          inactifs: totalInactive,
          mrrCalcule: mrr,
          arrCalcule: mrr * 12,
          expirant30j: expiringIn30Days,
          expirant60j: expiringIn60Days,
          expirant90j: expiringIn90Days,
          paiementsRetard: overduePayments
        });

        // 3. Calculer ARR (Annual Recurring Revenue)
        const arr = mrr * 12;

        // 4. Calculer le taux de renouvellement réel
        // Formule correcte: (Actifs / Total) * 100
        const totalSubscriptions = subscriptions?.length || 0;
        const renewalRate = totalSubscriptions > 0 
          ? (totalActive / totalSubscriptions) * 100 
          : 100; // 100% si aucun abonnement (éviter 0%)

        // 5. Calculer la valeur moyenne d'un abonnement
        const averageSubscriptionValue = totalActive > 0 
          ? totalRevenue / totalActive 
          : 0;

        return {
          mrr: Math.round(mrr),
          arr: Math.round(arr),
          totalActive,
          totalInactive,
          totalPending,
          totalTrial,
          totalSuspended,
          renewalRate: Math.round(renewalRate * 10) / 10,
          expiringIn30Days,
          expiringIn60Days,
          expiringIn90Days,
          overduePayments,
          overdueAmount: Math.round(overdueAmount),
          averageSubscriptionValue: Math.round(averageSubscriptionValue),
          totalRevenue: Math.round(totalRevenue),
        };
      } catch (error) {
        console.error('Erreur lors du calcul des KPIs Hub:', error);
        return {
          mrr: 0,
          arr: 0,
          totalActive: 0,
          totalInactive: 0,
          totalPending: 0,
          totalTrial: 0,
          totalSuspended: 0,
          renewalRate: 0,
          expiringIn30Days: 0,
          expiringIn60Days: 0,
          expiringIn90Days: 0,
          overduePayments: 0,
          overdueAmount: 0,
          averageSubscriptionValue: 0,
          totalRevenue: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
