/**
 * Liste détaillée des revenus par plan
 * Affiche le nom du plan, le nombre d'abonnements et le revenu mensuel
 */

interface PlanRevenueListProps {
  planData: Array<{
    planId: string;
    planName: string;
    planSlug: string;
    subscriptionCount: number;
    revenue: number;
    percentage: number;
  }>;
}

export const PlanRevenueList = ({ planData }: PlanRevenueListProps) => {
  // Calculer le total des revenus et des abonnements
  const totalRevenue = planData.reduce((sum, plan) => sum + plan.revenue, 0);
  const totalSubscriptions = planData.reduce((sum, plan) => sum + plan.subscriptionCount, 0);

  return (
    <div className="mt-6 space-y-3">
      {planData.map((plan) => {
        const percentage = totalRevenue > 0 ? (plan.revenue / totalRevenue) * 100 : 0;
        
        return (
          <div 
            key={plan.planId} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: 
                      plan.planSlug === 'institutionnel' ? '#E9C46A' :
                      plan.planSlug === 'pro' ? '#1D3557' :
                      plan.planSlug === 'gratuit' ? '#6B7280' :
                      '#2A9D8F' // Premium
                  }}
                />
                <span className="font-medium text-gray-900">{plan.planName}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {plan.subscriptionCount} abonnement{plan.subscriptionCount > 1 ? 's' : ''} ({percentage.toFixed(0)}%)
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {plan.revenue.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500">
                {percentage.toFixed(1)}% du total
              </p>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#2A9D8F]/10 to-[#1D8A7E]/10 rounded-lg border-2 border-[#2A9D8F]/20 mt-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Revenu Total</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalSubscriptions} abonnement{totalSubscriptions > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#2A9D8F]">
            {totalRevenue.toLocaleString()} FCFA
          </p>
          <p className="text-xs text-gray-600">
            {totalSubscriptions} Abonnements
          </p>
        </div>
      </div>
    </div>
  );
};
