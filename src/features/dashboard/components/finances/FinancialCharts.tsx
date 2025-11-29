/**
 * Composant Graphiques Financiers
 * Graphiques de revenus et répartition par plan
 */

import { Calendar, CreditCard, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PlanRevenueList } from './PlanRevenueList';

interface RevenueData {
  period: string;
  amount: number;
  count: number;
}

interface PlanData {
  planId: string;
  planName: string;
  planSlug: string;
  subscriptionCount: number;
  revenue: number;
  percentage: number;
  [key: string]: any; // Index signature for Recharts compatibility
}

interface FinancialChartsProps {
  revenueData: RevenueData[];
  planData: PlanData[];
  isLoading: boolean;
}

const COLORS = ['#2A9D8F', '#1D3557', '#E9C46A', '#E63946', '#457B9D', '#F77F00'];

export const FinancialCharts = ({ revenueData, planData, isLoading }: FinancialChartsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Préparer les données pour le Bar Chart (comparaison plans)
  const barChartData = planData.map(plan => ({
    name: plan.planName,
    abonnements: plan.subscriptionCount,
    revenus: plan.revenue / 1000, // En milliers
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Graphique des revenus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2A9D8F]" />
              Évolution des Revenus
            </h3>
            <p className="text-sm text-gray-500 mt-1">Revenus par période</p>
          </div>
          <div className="flex items-center gap-1 text-[#2A9D8F]">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Croissance</span>
          </div>
        </div>
        
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => [`${value.toLocaleString()} FCFA`, 'Revenu']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#2A9D8F" 
                strokeWidth={3}
                dot={{ fill: '#2A9D8F', r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenu"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée disponible</p>
            </div>
          </div>
        )}
        </Card>
      </motion.div>

      {/* Graphique répartition par plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1D3557]" />
              Répartition par Plan
            </h3>
            <p className="text-sm text-gray-500 mt-1">Distribution des revenus</p>
          </div>
        </div>
        
        {planData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const planName = entry.planName || '';
                  const percentage = typeof entry.percentage === 'number' ? entry.percentage : 0;
                  return `${planName} (${percentage.toFixed(0)}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {planData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => `${value.toLocaleString()} FCFA`}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée disponible</p>
            </div>
          </div>
        )}

        {/* Liste détaillée des revenus par plan */}
        {planData.length > 0 && (
          <PlanRevenueList planData={planData} />
        )}
        </Card>
      </motion.div>

      {/* Graphique Bar Chart - Comparaison Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E9C46A]" />
              Comparaison Plans
            </h3>
            <p className="text-sm text-gray-500 mt-1">Abonnements vs Revenus</p>
          </div>
        </div>
        
        {barChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'revenus') return [`${(value * 1000).toLocaleString()} FCFA`, 'Revenus'];
                  return [value, 'Abonnements'];
                }}
              />
              <Legend />
              <Bar 
                dataKey="abonnements" 
                fill="#2A9D8F" 
                name="Abonnements"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="revenus" 
                fill="#E9C46A" 
                name="Revenus (k FCFA)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée disponible</p>
            </div>
          </div>
        )}
        </Card>
      </motion.div>
    </div>
  );
};
