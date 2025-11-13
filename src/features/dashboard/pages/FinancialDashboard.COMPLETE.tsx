/**
 * Dashboard Financier - Vue d'ensemble financière complète - VERSION MODULAIRE
 * KPIs, graphiques et statistiques détaillées
 * @module FinancialDashboard
 */

import { useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialStats, useRevenueByPeriod, usePlanRevenue } from '../hooks/useFinancialStats';
import { usePaymentStats } from '../hooks/usePayments';
import { FinancialStatsCards, FinancialCharts, FinancialDetails } from '../components/finances';

export const FinancialDashboard = () => {
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const { data: stats, isLoading: statsLoading } = useFinancialStats();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueByPeriod(period);
  const { data: planRevenue, isLoading: planLoading } = usePlanRevenue();
  const { data: paymentStats } = usePaymentStats();

  // Couleurs pour les graphiques
  const COLORS = ['#2A9D8F', '#1D3557', '#E9C46A', '#E63946', '#457B9D', '#F77F00'];

  const handleViewOverdue = () => {
    // TODO: Naviguer vers la page paiements avec filtre en retard
    console.log('View overdue payments');
  };

  const handleExport = () => {
    // TODO: Exporter le rapport financier
    console.log('Export financial report');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financier</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble des performances financières</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="yearly">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards Glassmorphism */}
      <FinancialStatsCards
        stats={stats}
        paymentStats={paymentStats}
        isLoading={statsLoading}
      />

      {/* Graphiques */}
      <FinancialCharts
        revenueData={revenueData || []}
        planData={planRevenue || []}
        isLoading={revenueLoading || planLoading}
      />

      {/* Détails Financiers */}
      <FinancialDetails
        stats={stats}
        isLoading={statsLoading}
        onViewOverdue={handleViewOverdue}
      />

      {/* Tableau des plans */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
          Performance par Plan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abonnements</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {planLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : planRevenue && planRevenue.length > 0 ? (
                planRevenue.map((plan, index) => (
                  <tr key={plan.planId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-900">{plan.planName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.subscriptionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {plan.revenue.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-[#2A9D8F]" />
                        <span className="text-sm text-[#2A9D8F]">+0%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucune donnée disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
