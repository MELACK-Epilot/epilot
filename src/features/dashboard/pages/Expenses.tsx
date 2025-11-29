/**
 * PAGE DÉPENSES MODERNE - SUPER ADMIN E-PILOT
 * Gestion complète avec analyse par catégorie et données réelles
 * @module Expenses
 */

import { useState } from 'react';
import { Plus, Download, DollarSign, CheckCircle2, Clock, XCircle, PieChart as PieChartIcon, BarChart3, Eye, Trash2, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceBreadcrumb, FinancePageHeader } from '../components/finance';
import { ModernDataTable } from '../components/shared/ModernDataTable';
import { ChartCard } from '../components/shared/ChartCard';
import { useExpenses, useExpenseStats, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpensesByCategory, useExpensesMonthly, useExpensesRealtime } from '../hooks/useExpenses';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { CreateExpenseModal, ExportModal, SuccessModal, ExpenseDetailsModal, DeleteConfirmModal, ApproveConfirmModal } from '../components/expenses/ExpenseModals';
import { BulkExpenseActions } from '../components/expenses/BulkExpenseActions';
import { exportExpensesCSV, exportExpensesExcel, exportExpensesPDF, printExpenses } from '@/utils/expenseExport';

// Catégories avec couleurs et emojis
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

export const Expenses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // États modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  
  // États sélection multiple
  const [selectedExpenses, setSelectedExpenses] = useState<any[]>([]);

  // Activer le temps réel pour les mises à jour automatiques
  useExpensesRealtime();

  // Hooks pour données réelles (dynamiques)
  const { data: expenses, refetch } = useExpenses({
    query: searchQuery,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: stats } = useExpenseStats();
  const { data: categoryData } = useExpensesByCategory();
  const { data: monthlyData } = useExpensesMonthly();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Préparer données graphique
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

  // Handlers
  const handleCreateExpense = async (data: any) => {
    try {
      await createExpense.mutateAsync({
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        date: data.date,
        paymentMethod: data.payment_method,
        status: 'pending',
        schoolGroupId: null,
      });
      setSuccessMessage({
        title: 'Dépense créée',
        message: 'La dépense a été créée avec succès !',
      });
      setShowSuccessModal(true);
      refetch();
    } catch (error) {
      console.error('Erreur création:', error);
      alert('Erreur lors de la création de la dépense');
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // Utiliser les dépenses sélectionnées si disponibles, sinon toutes
    const data = selectedExpenses.length > 0 ? selectedExpenses : (expenses || []);
    
    if (format === 'csv') exportExpensesCSV(data);
    if (format === 'excel') exportExpensesExcel(data);
    if (format === 'pdf') exportExpensesPDF(data);
    
    setSuccessMessage({
      title: 'Export réussi',
      message: `${data.length} dépense(s) exportée(s) au format ${format.toUpperCase()} !`,
    });
    setShowSuccessModal(true);
  };

  const handleDelete = (expense: any) => {
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      // Si c'est une suppression groupée
      if (expenseToDelete.id === 'bulk') {
        await confirmBulkDelete();
      } else {
        // Suppression simple
        await deleteExpense.mutateAsync(expenseToDelete.id);
        setSuccessMessage({
          title: 'Dépense supprimée',
          message: 'La dépense a été supprimée avec succès !',
        });
        setShowSuccessModal(true);
        refetch();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleViewDetails = (expense: any) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  // Handlers actions groupées
  const handleBulkApprove = () => {
    setShowApproveConfirm(true);
  };

  const confirmBulkApprove = async () => {
    try {
      // Approuver toutes les dépenses sélectionnées
      for (const expense of selectedExpenses) {
        await updateExpense.mutateAsync({
          id: expense.id,
          status: 'paid',
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          paymentMethod: expense.payment_method,
        });
      }
      setSuccessMessage({
        title: 'Dépenses approuvées',
        message: `${selectedExpenses.length} dépense(s) approuvée(s) avec succès !`,
      });
      setShowSuccessModal(true);
      setSelectedExpenses([]);
      refetch();
    } catch (error) {
      console.error('Erreur approbation:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleBulkExport = () => {
    setShowExportModal(true);
  };

  const handleBulkPrint = () => {
    printExpenses(selectedExpenses);
    setSuccessMessage({
      title: 'Impression lancée',
      message: `${selectedExpenses.length} dépense(s) envoyée(s) à l'imprimante !`,
    });
    setShowSuccessModal(true);
  };

  const handleBulkDelete = () => {
    // Ouvrir modal de confirmation pour suppression groupée
    if (selectedExpenses.length > 0) {
      // Utiliser le premier élément pour le modal (on pourrait créer un modal spécifique)
      setExpenseToDelete({ 
        id: 'bulk', 
        description: `${selectedExpenses.length} dépense(s) sélectionnée(s)`,
        amount: selectedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        reference: 'Suppression groupée'
      });
      setShowDeleteConfirm(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      for (const expense of selectedExpenses) {
        await deleteExpense.mutateAsync(expense.id);
      }
      setSuccessMessage({
        title: 'Dépenses supprimées',
        message: `${selectedExpenses.length} dépense(s) supprimée(s) avec succès !`,
      });
      setShowSuccessModal(true);
      setSelectedExpenses([]);
      refetch();
    } catch (error) {
      console.error('Erreur suppression bulk:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Colonnes tableau
  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedExpenses.length === expenses?.length && expenses?.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedExpenses(expenses || []);
            } else {
              setSelectedExpenses([]);
            }
          }}
          className="rounded border-gray-300 cursor-pointer"
        />
      ),
      render: (e: any) => (
        <input
          type="checkbox"
          checked={selectedExpenses.some(exp => exp.id === e.id)}
          onChange={(ev) => {
            if (ev.target.checked) {
              setSelectedExpenses([...selectedExpenses, e]);
            } else {
              setSelectedExpenses(selectedExpenses.filter(exp => exp.id !== e.id));
            }
          }}
          onClick={(ev) => ev.stopPropagation()}
          className="rounded border-gray-300 cursor-pointer"
        />
      )
    },
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
    {
      key: 'actions',
      label: 'Actions',
      render: (e: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetails(e)}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(e)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
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
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Dépense
            </Button>
          </div>
        }
      />

      {/* KPIs Améliorés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Dépenses */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stats?.count || 0} dépenses</span>
          </div>
          <p className="text-white/80 text-sm mb-1">Total Dépenses</p>
          <p className="text-2xl font-bold">{((stats?.total || 0) / 1000).toFixed(0)}K</p>
          <p className="text-white/70 text-xs mt-1">FCFA</p>
        </div>

        {/* Mois en cours avec tendance */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-white/20 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            {monthlyData && monthlyData.length > 1 && (
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${parseFloat(monthlyData[monthlyData.length-1]?.growth_rate || 0) > 0 ? 'bg-red-500/30' : 'bg-green-500/30'}`}>
                {parseFloat(monthlyData[monthlyData.length-1]?.growth_rate || 0) > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(parseFloat(monthlyData[monthlyData.length-1]?.growth_rate || 0)).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="text-white/80 text-sm mb-1">Mois en cours</p>
          <p className="text-2xl font-bold">{((stats?.thisMonth || 0) / 1000).toFixed(0)}K</p>
          <p className="text-white/70 text-xs mt-1">FCFA</p>
        </div>

        {/* En attente */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-white/20 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            {(stats?.pendingCount || 0) > 0 && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" /> À traiter
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm mb-1">En attente</p>
          <p className="text-2xl font-bold">{stats?.pendingCount || 0}</p>
          <p className="text-white/70 text-xs mt-1">{((stats?.pending || 0) / 1000).toFixed(0)}K FCFA</p>
        </div>

        {/* Payées */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-white/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-white/80 text-sm mb-1">Payées</p>
          <p className="text-2xl font-bold">{stats?.paidCount || 0}</p>
          <p className="text-white/70 text-xs mt-1">{((stats?.paid || 0) / 1000).toFixed(0)}K FCFA</p>
        </div>

        {/* Taux de paiement */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-white/20 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${(stats?.paymentRate || 0) >= 80 ? 'bg-green-500/30' : (stats?.paymentRate || 0) >= 50 ? 'bg-yellow-500/30' : 'bg-red-500/30'}`}>
              {(stats?.paymentRate || 0) >= 80 ? 'Excellent' : (stats?.paymentRate || 0) >= 50 ? 'Moyen' : 'Faible'}
            </span>
          </div>
          <p className="text-white/80 text-sm mb-1">Taux de paiement</p>
          <p className="text-2xl font-bold">{(stats?.paymentRate || 0).toFixed(0)}%</p>
          <p className="text-white/70 text-xs mt-1">des dépenses</p>
        </div>
      </div>

      {/* Alertes Intelligentes */}
      {((stats?.pendingCount || 0) > 3 || (stats?.pending || 0) > 100000) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Attention : Dépenses en attente</p>
            <p className="text-sm text-amber-700">
              Vous avez {stats?.pendingCount || 0} dépense(s) en attente pour un total de {((stats?.pending || 0) / 1000).toFixed(0)}K FCFA. 
              Pensez à les valider pour maintenir une bonne gestion financière.
            </p>
          </div>
        </div>
      )}

      {/* Top Catégories */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-violet-600" />
          Répartition par Catégorie
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(categoryData || []).slice(0, 7).map((cat: any) => (
            <div key={cat.category} className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="text-2xl mb-1">{CATEGORIES[cat.category as keyof typeof CATEGORIES]?.icon || '📋'}</div>
              <p className="text-xs text-gray-500 truncate">{cat.category_label}</p>
              <p className="font-bold text-gray-900">{((cat.total_amount || 0) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-400">{parseFloat(cat.percentage_of_total || 0).toFixed(0)}%</p>
            </div>
          ))}
        </div>
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
          icon={PieChartIcon}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
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
            </PieChart>
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
        onExport={() => setShowExportModal(true)}
        emptyMessage="Aucune dépense trouvée"
      />

      {/* Barre d'actions groupées */}
      <BulkExpenseActions
        selectedCount={selectedExpenses.length}
        onApprove={handleBulkApprove}
        onExport={handleBulkExport}
        onPrint={handleBulkPrint}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedExpenses([])}
      />

      {/* Modals */}
      <CreateExpenseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateExpense}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        count={expenses?.length || 0}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
      />

      <ExpenseDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        expense={selectedExpense}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        expense={expenseToDelete}
      />

      <ApproveConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={confirmBulkApprove}
        count={selectedExpenses.length}
      />
    </div>
  );
};

export default Expenses;