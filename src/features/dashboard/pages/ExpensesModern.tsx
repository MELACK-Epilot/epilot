/**
 * PAGE DÉPENSES MODERNE - NIVEAU MONDIAL
 * Gestion complète avec analyse par catégorie
 * @module ExpensesModern
 */

import { useState } from 'react';
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, Receipt, CheckCircle2, Clock, XCircle, PieChart, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceBreadcrumb, FinancePageHeader, ModernStatCardData } from '../components/finance';
import { ModernDataTable } from '../components/shared/ModernDataTable';
import { ChartCard } from '../components/shared/ChartCard';
import { useExpenses, useExpenseStats } from '../hooks/useExpenses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// Catégories avec couleurs
const CATEGORIES = {
  salaires: { label: 'Salaires', color: '#2A9D8F', icon: '👥' },
  fournitures: { label: 'Fournitures', color: '#E9C46A', icon: '📦' },
  infrastructure: { label: 'Infrastructure', color: '#457B9D', icon: '🏗️' },
  utilities: { label: 'Services publics', color: '#F4A261', icon: '⚡' },
  transport: { label: 'Transport', color: '#E76F51', icon: '🚗' },
  marketing: { label: 'Marketing', color: '#EC4899', icon: '📢' },
  formation: { label: 'Formation', color: '#8B5CF6', icon: '🎓' },
  autres: { label: 'Autres', color: '#6B7280', icon: '📋' },
};

export const ExpensesModern = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Hooks
  const { data: expenses, refetch } = useExpenses({
    query: searchQuery,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: stats } = useExpenseStats();

  // Données par catégorie
  const { data: categoryData } = useQuery({
    queryKey: ['expenses-by-category'],
    queryFn: async () => {
      // @ts-expect-error - Vue expenses_by_category
      const { data, error } = await supabase
        .from('expenses_by_category')
        .select('*');

      if (error) {
        console.warn('Erreur récupération catégories:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Données mensuelles
  const { data: monthlyData } = useQuery({
    queryKey: ['expenses-monthly'],
    queryFn: async () => {
      // @ts-expect-error - Vue expenses_monthly
      const { data, error } = await supabase
        .from('expenses_monthly')
        .select('*')
        .order('month', { ascending: false })
        .limit(6);

      if (error) {
        console.warn('Erreur récupération mensuel:', error);
        return [];
      }

      return (data || []).reverse();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Préparer données graphique mensuel
  const chartData = (monthlyData || []).map((stat: any) => ({
    month: stat.month_label,
    montant: stat.paid_amount || 0,
    nombre: stat.paid_count || 0,
  }));

  // Préparer données pie chart
  const pieData = (categoryData || []).map((cat: any) => ({
    name: cat.category_label,
    value: cat.total_amount,
    color: cat.category_color,
  }));

  // Badge statut
  const getStatusBadge = (status: string) => {
    const badges: Record<string, any> = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      paid: { label: 'Payé', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    const config = badges[status] || badges.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Badge catégorie
  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES[category as keyof typeof CATEGORIES];
    if (!cat) return <Badge>{category}</Badge>;
    return (
      <Badge style={{ backgroundColor: cat.color + '20', color: cat.color }} className="border-0">
        <span className="mr-1">{cat.icon}</span>
        {cat.label}
      </Badge>
    );
  };

  // KPIs
  const statsData: ModernStatCardData[] = [
    { 
      title: "Total Dépenses", 
      value: `${((stats?.total || 0) / 1000).toFixed(0)}K`, 
      subtitle: "FCFA", 
      icon: DollarSign, 
      color: 'blue',
      trend: stats?.count ? { value: stats.count, label: 'dépenses' } : undefined
    },
    { 
      title: "Mois en cours", 
      value: `${((stats?.thisMonth || 0) / 1000).toFixed(0)}K`, 
      subtitle: "FCFA", 
      icon: TrendingUp, 
      color: 'green'
    },
    { 
      title: "En attente", 
      value: stats?.pendingCount || 0, 
      subtitle: `${((stats?.pending || 0) / 1000).toFixed(0)}K FCFA`, 
      icon: Clock, 
      color: 'gold'
    },
    { 
      title: "Payées", 
      value: stats?.paidCount || 0, 
      subtitle: `${((stats?.paid || 0) / 1000).toFixed(0)}K FCFA`, 
      icon: CheckCircle2, 
      color: 'green'
    },
    { 
      title: "Taux de paiement", 
      value: `${(stats?.paymentRate || 0).toFixed(0)}%`, 
      subtitle: "des dépenses", 
      icon: Receipt, 
      color: 'purple'
    },
  ];

  // Colonnes tableau
  const columns = [
    { 
      key: 'reference', 
      label: 'Référence', 
      sortable: true,
      render: (e: any) => (
        <div className="font-mono text-sm">{e.reference}</div>
      )
    },
    { 
      key: 'category', 
      label: 'Catégorie', 
      sortable: true,
      render: (e: any) => getCategoryBadge(e.category)
    },
    { 
      key: 'description', 
      label: 'Description', 
      sortable: true,
      render: (e: any) => (
        <div className="max-w-xs truncate">{e.description || 'N/A'}</div>
      )
    },
    { 
      key: 'amount', 
      label: 'Montant', 
      sortable: true,
      render: (e: any) => (
        <div className="font-semibold">{(e.amount || 0).toLocaleString()} FCFA</div>
      )
    },
    { 
      key: 'status', 
      label: 'Statut', 
      sortable: true,
      render: (e: any) => getStatusBadge(e.status)
    },
    { 
      key: 'date', 
      label: 'Date', 
      sortable: true,
      render: (e: any) => format(new Date(e.date), 'dd MMM yyyy', { locale: fr })
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <FinanceBreadcrumb currentPage="Dépenses" />

      {/* Header */}
      <FinancePageHeader
        title="Dépenses"
        description="Gestion et suivi des dépenses par catégorie"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Dépense
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            blue: 'from-blue-600 to-blue-700',
            green: 'from-green-600 to-green-700',
            gold: 'from-yellow-600 to-yellow-700',
            purple: 'from-purple-600 to-purple-700',
          };
          return (
            <div key={index} className={`bg-gradient-to-br ${colors[stat.color]} rounded-xl p-6 text-white shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-white/70 text-sm mt-1">{stat.subtitle}</p>
                {stat.trend && (
                  <p className="text-white/60 text-xs mt-2">
                    {stat.trend.value} {stat.trend.label}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <ChartCard
          title="Évolution des Dépenses"
          subtitle="6 derniers mois"
          icon={BarChart3}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="montant"
                stroke="#2A9D8F"
                strokeWidth={3}
                name="Montant (FCFA)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Par catégorie */}
        <ChartCard
          title="Dépenses par Catégorie"
          subtitle="Répartition"
          icon={PieChart}
        >
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${((entry.value / (stats?.total || 1)) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 flex-wrap">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <SelectItem key={key} value={key}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <ModernDataTable
        data={expenses || []}
        columns={columns}
        searchable
        searchPlaceholder="Rechercher une dépense..."
        exportable
        onExport={() => console.log('Export')}
        emptyMessage="Aucune dépense trouvée"
      />
    </div>
  );
};

export default ExpensesModern;
