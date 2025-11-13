/**
 * Dashboard Financier - Vue d'ensemble financière complète - VERSION MODULAIRE
 * KPIs, graphiques et statistiques détaillées
 * @module FinancialDashboard
 */

import { useState } from 'react';
import { Download, TrendingUp, Home, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialStats, useRevenueByPeriod, usePlanRevenue } from '../hooks/useFinancialStats';
import { usePaymentStats } from '../hooks/usePayments';
import { FinancialStatsCards, FinancialCharts, FinancialDetails } from '../components/finances';
import { exportFinancialDashboard } from '@/utils/exportUtils';

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
    exportFinancialDashboard(stats, planRevenue || []);
  };

  const isLoading = statsLoading || revenueLoading || planLoading;
  const hasError = !stats && !statsLoading;

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-4"
      >
        <Home className="w-4 h-4" />
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-gray-900">Dashboard Financier</span>
      </motion.nav>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financier</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble des performances financières en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
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
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={!stats}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6 border-[#E63946]/20 bg-[#E63946]/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#E63946] mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Erreur de chargement</h3>
                <p className="text-sm text-gray-600 mt-1">Impossible de charger les données financières. Veuillez réessayer.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards Glassmorphism */}
      {!hasError && (
        <FinancialStatsCards
          stats={stats || null}
          paymentStats={paymentStats ? {
            completed: paymentStats.completed || 0,
            pending: paymentStats.pending || 0
          } : null}
          isLoading={isLoading}
        />
      )}

      {/* Graphiques */}
      {!hasError && (
        <FinancialCharts
          revenueData={revenueData || []}
          planData={planRevenue || []}
          isLoading={isLoading}
        />
      )}

      {/* Détails Financiers */}
      {!hasError && (
        <FinancialDetails
          stats={stats ?? null}
          isLoading={isLoading}
          onViewOverdue={handleViewOverdue}
        />
      )}
    </div>
  );
};

export default FinancialDashboard;
