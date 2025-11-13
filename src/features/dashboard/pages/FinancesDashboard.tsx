/**
 * Page Finances Dashboard - Vue d'ensemble financière CORRIGÉE
 * Hub central avec VRAIES données et design cohérent
 * @module FinancesDashboard
 */

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  Package, 
  Receipt, 
  DollarSign, 
  Download, 
  TrendingDown, 
  Calendar, 
  AlertTriangle, 
  ChevronDown,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FinanceBreadcrumb, FinancePageHeader, FinanceModernStatsGrid, ModernStatCardData, RevenueChart, PlanDistributionChart } from '../components/finance';
import { FinancialMetricsGrid } from '../components/finance/FinancialMetricsGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QuickAccessCard } from '../components/QuickAccessCard';
import { useRealFinancialStats } from '../hooks/useRealFinancialStats';
import { useFinancialKPIs } from '../hooks/useFinancialKPIs';
import { useRevenueChart } from '../hooks/useRevenueChart';
import { usePlanDistribution } from '../hooks/usePlanDistribution';
import { useAuth } from '@/features/auth/store/auth.store';

export const FinancesDashboard = () => {
  const [period, setPeriod] = useState('30d');
  const { user } = useAuth();
  const { data: stats } = useRealFinancialStats();
  const { data: kpis, isLoading: kpisLoading } = useFinancialKPIs(period);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueChart(12);
  const { data: planDistribution, isLoading: planLoading } = usePlanDistribution();
  
  // Déterminer si l'utilisateur est Super Admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Labels adaptés selon le rôle
  const labels = useMemo(() => {
    if (isSuperAdmin) {
      return {
        title: 'Finances',
        subtitle: 'Vue d\'ensemble de la santé financière de la plateforme',
      };
    }
    return {
      title: 'Finances',
      subtitle: 'Gestion financière de votre groupe scolaire',
    };
  }, [isSuperAdmin]);

  // Alertes financières
  const financialAlerts = useMemo(() => {
    if (!stats) return [];
    const alerts = [];
    
    if ((stats.revenueGrowth || 0) < 0) {
      alerts.push({
        type: 'warning',
        message: 'Revenus en baisse ce mois',
        action: 'Voir détails'
      });
    }
    
    if ((stats.activeSubscriptions || 0) === 0) {
      alerts.push({
        type: 'danger',
        message: 'Aucun abonnement actif',
        action: 'Analyser'
      });
    }
    
    return alerts;
  }, [stats]);

  // Préparer les stats avec le nouveau design moderne
  const statsData: ModernStatCardData[] = [
    {
      title: "Total Groupes",
      value: stats?.activeGroups || 0,
      subtitle: "groupes actifs",
      icon: Users,
      color: 'blue',
    },
    {
      title: "Abonnements",
      value: stats?.activeSubscriptions || 0,
      subtitle: "abonnements actifs",
      icon: Package,
      color: 'green',
    },
    {
      title: "Plans",
      value: stats?.activePlans || 0,
      subtitle: "plans disponibles",
      icon: CreditCard,
      color: 'purple',
    },
    {
      title: "Revenus",
      value: `${((stats?.monthlyRevenue || 0) / 1000).toFixed(0)}K`,
      subtitle: "FCFA ce mois",
      icon: DollarSign,
      color: 'gold',
      trend: stats?.revenueGrowth ? { value: Math.round(stats.revenueGrowth), label: 'vs mois dernier' } : undefined,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb - VERSION REFACTORISÉE */}
      <FinanceBreadcrumb currentPage="Finances" />
      

      {/* Header avec actions */}
      <FinancePageHeader
        title={labels.title}
        description={labels.subtitle}
        icon={<TrendingUp className="w-7 h-7 text-white" />}
        actions={
          <>
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
          </>
        }
      />

      {/* Stats Globales - Design Moderne */}
      <FinanceModernStatsGrid stats={statsData} columns={4} />

      {/* KPIs Avancés */}
      <FinancialMetricsGrid kpis={kpis} isLoading={kpisLoading} />

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} isLoading={revenueLoading} />
        <PlanDistributionChart data={planDistribution} isLoading={planLoading} />
      </div>

      {/* Alertes Financières */}
      {financialAlerts.length > 0 && (
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
            count={stats?.activePlans || 0}
            label="plans actifs"
            href="/dashboard/plans"
            gradient="from-[#1D3557] to-[#0F1F35]"
            badge="Catalogue"
            delay={0}
          />
          
          <QuickAccessCard
            title="Abonnements"
            description="Suivi des souscriptions"
            icon={Package}
            count={stats?.activeSubscriptions || 0}
            label="abonnements"
            href="/dashboard/subscriptions"
            gradient="from-[#2A9D8F] to-[#1D8A7E]"
            badge="Actifs"
            delay={0}
          />
          
          <QuickAccessCard
            title="Paiements"
            description="Transactions et encaissements"
            icon={Receipt}
            count={`${((stats?.monthlyRevenue || 0) / 1000000).toFixed(1)}M`}
            label="FCFA ce mois"
            href="/dashboard/payments"
            gradient="from-[#E9C46A] to-[#D4AF37]"
            badge="Reçus"
            delay={0}
          />
          
          <QuickAccessCard
            title="Dépenses"
            description="Suivi des sorties d'argent"
            icon={TrendingDown}
            count="0"
            label="FCFA ce mois"
            href="/dashboard/expenses"
            gradient="from-[#E63946] to-[#C72030]"
            badge="Postes"
            delay={0}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancesDashboard;
