/**
 * Page Finances Dashboard - Vue d'ensemble financière
 * Hub central avec accès rapide aux sections : Plans, Abonnements, Paiements, Dépenses
 * @module FinancesDashboard
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CreditCard, 
  Package, 
  Receipt, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  TrendingDown, 
  Home, 
  ChevronRight, 
  Calendar, 
  AlertTriangle, 
  ChevronDown 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QuickAccessCard } from '../components/QuickAccessCard';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { useAuth } from '@/features/auth/store/auth.store';

export const FinancesDashboard = () => {
  const [period, setPeriod] = useState('30d');
  const { user } = useAuth();
  const { data: financialStats, isLoading: statsLoading } = useFinancialStats();
  
  // Déterminer si l'utilisateur est Super Admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Labels adaptés selon le rôle
  const labels = useMemo(() => {
    if (isSuperAdmin) {
      return {
        title: 'Finances',
        subtitle: 'Vue d\'ensemble de la santé financière de la plateforme',
        mrrLabel: 'MRR',
        mrrDescription: 'FCFA / mois',
      };
    }
    return {
      title: 'Finances',
      subtitle: 'Gestion financière de votre groupe scolaire',
      mrrLabel: 'Budget Mensuel',
      mrrDescription: 'FCFA / mois',
    };
  }, [isSuperAdmin]);

  // Calcul des variations
  const mrrGrowth = useMemo(() => {
    if (!financialStats) return 0;
    return ((financialStats.mrr - (financialStats.yearlyRevenue / 12)) / (financialStats.yearlyRevenue / 12)) * 100;
  }, [financialStats]);

  // Alertes financières
  const financialAlerts = useMemo(() => {
    if (!financialStats) return [];
    const alerts = [];
    
    if ((financialStats.revenueGrowth || 0) < 0) {
      alerts.push({
        type: 'warning',
        message: 'Croissance négative ce mois',
        action: 'Voir détails'
      });
    }
    
    if (mrrGrowth < 0) {
      alerts.push({
        type: 'danger',
        message: 'MRR en baisse par rapport au mois dernier',
        action: 'Analyser'
      });
    }
    
    return alerts;
  }, [financialStats, mrrGrowth]);

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Finances</span>
      </div>

      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#2A9D8F] to-[#1D8A7E] rounded-xl">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            {labels.title}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {labels.subtitle}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Sélecteur de période */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="3m">3 derniers mois</SelectItem>
              <SelectItem value="6m">6 derniers mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>

          {/* Export amélioré */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exporter
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                PDF Rapport
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Globales - KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 : MRR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/20 to-[#1D8A7E]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#2A9D8F]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#2A9D8F] to-[#1D8A7E] rounded-xl shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{labels.mrrLabel}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(financialStats?.mrr || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-xs text-gray-500 mb-3">{labels.mrrDescription}</p>
                <div className="flex items-center gap-1.5">
                  {mrrGrowth >= 0 ? (
                    <>
                      <div className="p-1 bg-[#2A9D8F]/10 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#2A9D8F]" />
                      </div>
                      <span className="text-sm text-[#2A9D8F] font-bold">+{mrrGrowth.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 bg-[#E63946]/10 rounded-md">
                        <ArrowDownRight className="w-3.5 h-3.5 text-[#E63946]" />
                      </div>
                      <span className="text-sm text-[#E63946] font-bold">{mrrGrowth.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-xs text-gray-400 ml-0.5">vs mois dernier</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* KPI 2 : ARR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D3557]/20 to-[#0F1F35]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#1D3557]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#1D3557] to-[#0F1F35] rounded-xl shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">ARR</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(financialStats?.arr || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-xs text-gray-500 mb-3">FCFA / an</p>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-[#1D3557]/10 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5 text-[#1D3557]" />
                  </div>
                  <span className="text-sm text-[#1D3557] font-bold">MRR × 12</span>
                  <span className="text-xs text-gray-400 ml-0.5">projection</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* KPI 3 : Revenus Totaux */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#E9C46A]/20 to-[#D4AF37]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#E9C46A]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#E9C46A] to-[#D4AF37] rounded-xl shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Revenus Totaux</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(financialStats?.totalRevenue || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-xs text-gray-500 mb-3">FCFA cumulés</p>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-[#E9C46A]/10 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5 text-[#E9C46A]" />
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">
                    {(financialStats?.monthlyRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">ce mois</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* KPI 4 : Taux de Croissance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#457B9D]/20 to-[#2A5F7F]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#457B9D]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#457B9D] to-[#2A5F7F] rounded-xl shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Croissance</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(financialStats?.revenueGrowth || 0).toFixed(1)}%`
                  )}
                </p>
                <p className="text-xs text-gray-500 mb-3">revenus mensuels</p>
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 ${(financialStats?.revenueGrowth || 0) >= 0 ? 'bg-[#2A9D8F]/10' : 'bg-[#E63946]/10'} rounded-md`}>
                    {(financialStats?.revenueGrowth || 0) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-[#E63946]" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400">vs mois précédent</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Alertes Financières */}
      {financialAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 border-l-4 border-l-[#E9C46A] bg-[#E9C46A]/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#E9C46A] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  Alertes financières
                  <Badge variant="outline" className="bg-[#E9C46A]/20 text-[#E9C46A] border-[#E9C46A]/30">
                    {financialAlerts.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {financialAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded-lg">
                      <span className="text-gray-700">{alert.message}</span>
                      <Button variant="ghost" size="sm" className="text-[#E9C46A] hover:text-[#D4AF37] hover:bg-[#E9C46A]/10">
                        {alert.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Access - Accès rapide aux sections */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#2A9D8F]" />
          Accès Rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAccessCard
            title="Plans & Tarifs"
            description="Gestion des offres commerciales"
            icon={CreditCard}
            count={4}
            label="plans actifs"
            href="/dashboard/plans"
            gradient="from-[#1D3557] to-[#0F1F35]"
            badge="Catalogue"
            delay={0.6}
          />
          
          <QuickAccessCard
            title="Abonnements"
            description="Suivi des souscriptions"
            icon={Package}
            count={150}
            label="abonnements"
            href="/dashboard/subscriptions"
            gradient="from-[#2A9D8F] to-[#1D8A7E]"
            badge="Actifs"
            delay={0.7}
          />
          
          <QuickAccessCard
            title="Paiements"
            description="Transactions et encaissements"
            icon={Receipt}
            count="45M"
            label="FCFA ce mois"
            href="/dashboard/payments"
            gradient="from-[#E9C46A] to-[#D4AF37]"
            badge="Reçus"
            delay={0.8}
          />
          
          <QuickAccessCard
            title="Dépenses"
            description="Suivi des sorties d'argent"
            icon={TrendingDown}
            count="12M"
            label="FCFA ce mois"
            href="/dashboard/expenses"
            gradient="from-[#E63946] to-[#C72030]"
            badge="Postes"
            delay={0.9}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancesDashboard;
