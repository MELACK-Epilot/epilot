/**
 * PlanDistributionChart - Graphique de répartition des abonnements par plan
 * Donut chart
 * @module PlanDistributionChart
 */

import { Card } from '@/components/ui/card';
import { Package, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PlanDistributionData } from '../../hooks/usePlanDistribution';

interface PlanDistributionChartProps {
  data?: PlanDistributionData[];
  isLoading?: boolean;
}

export const PlanDistributionChart = ({ data, isLoading }: PlanDistributionChartProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-[300px] bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#2A9D8F]" />
          Répartition par Plan
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      </Card>
    );
  }

  const totalSubscriptions = data.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  // Formater les valeurs
  const formatRevenue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Custom label pour le donut
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#2A9D8F]" />
            Répartition par Plan
          </h3>
          <p className="text-sm text-gray-500">Abonnements actifs</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{totalSubscriptions}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="count"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} abonnements (${props.payload.percentage}%)`,
              props.payload.planName
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => {
              const item = data.find(d => d.planName === entry.payload.planName);
              return `${item?.planName} (${item?.count})`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Détails par plan */}
      <div className="mt-6 pt-6 border-t space-y-3">
        {data.map((plan, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: plan.color }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{plan.planName}</p>
                <p className="text-xs text-gray-500">
                  {plan.count} abonnement{plan.count > 1 ? 's' : ''} ({plan.percentage}%)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatRevenue(plan.revenue)} FCFA
              </p>
              <p className="text-xs text-gray-500">
                {((plan.revenue / totalRevenue) * 100).toFixed(1)}% du total
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé total */}
      <div className="mt-6 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">MRR Total</p>
            <p className="text-xl font-bold text-gray-900">
              {formatRevenue(totalRevenue)} FCFA
            </p>
            <p className="text-xs text-gray-500">Revenu Mensuel Récurrent</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Abonnements</p>
            <p className="text-xl font-bold text-gray-900">{totalSubscriptions}</p>
            <p className="text-xs text-gray-500">Actifs</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
