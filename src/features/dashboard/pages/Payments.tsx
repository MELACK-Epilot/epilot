/**
 * Page Paiements - Historique complet des paiements
 * Gestion des paiements, remboursements et statistiques
 * @module Payments
 */

import { useState } from 'react';
import { Download, Receipt, CheckCircle2, Clock, XCircle, RefreshCw, Eye, Calendar, DollarSign, CreditCard, TrendingUp, Home, ChevronRight, Search, FileText, Printer, Mail } from 'lucide-react';
import { exportPaymentsCSV, exportPaymentsExcel, exportPaymentsPDF, printInvoice, generateReceipt } from '@/utils/paymentExport';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FinanceBreadcrumb, FinancePageHeader, FinanceModernStatsGrid, FinanceSearchBar, ModernStatCardData } from '../components/finance';
import { FINANCE_GRADIENTS } from '../constants/finance.constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayments, usePaymentStats } from '../hooks/usePayments';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PaymentAlerts } from '../components/payments/PaymentAlerts';
import { PaymentFilters } from '../components/payments/PaymentFilters';
import { BulkActionsBar } from '../components/payments/BulkActionsBar';
import { ModernPaymentModal } from '../components/payments/ModernPaymentModal';
import { ConfirmModal, ExportModal, SuccessModal } from '../components/payments/BulkActionModals';
import { ModernDataTable } from '../components/shared/ModernDataTable';
import { ChartCard } from '../components/shared/ChartCard';
import { usePaymentActions } from '../hooks/usePaymentActions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const Payments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [filters, setFilters] = useState<any>({});
  
  // États pour les modals
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  const { data: payments, isLoading, refetch } = usePayments({
    query: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    ...filters,
  });

  const { data: stats } = usePaymentStats();
  const { validatePayment, validateMultiplePayments, refundPayment, generateReceipt, sendPaymentEmail } = usePaymentActions();

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const configs = {
      completed: { color: 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20', icon: CheckCircle2, label: 'Complété' },
      pending: { color: 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20', icon: Clock, label: 'En attente' },
      overdue: { color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20', icon: XCircle, label: 'En retard' },
      failed: { color: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20', icon: XCircle, label: 'Échoué' },
      refunded: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: RefreshCw, label: 'Remboursé' },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Données pour le graphique (depuis la vue SQL)
  const { data: monthlyStats } = useQuery({
    queryKey: ['payment-monthly-stats'],
    queryFn: async () => {
      // @ts-expect-error - Vue payment_monthly_stats créée par les scripts SQL
      const { data, error } = await supabase
        .from('payment_monthly_stats')
        .select('*')
        .order('month', { ascending: false })
        .limit(6);

      if (error) {
        console.warn('Erreur récupération stats mensuelles:', error);
        return [];
      }

      return (data || []).reverse(); // Inverser pour avoir l'ordre chronologique
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = (monthlyStats || []).map((stat: any) => ({
    month: stat.month_label,
    montant: stat.completed_amount || 0,
    nombre: stat.completed_count || 0,
  }));

  // Calculer les alertes (depuis les stats)
  const alerts = [
    { 
      type: 'overdue' as const, 
      count: stats?.overdue || 0,
      amount: stats?.overdueAmount || 0
    },
    { 
      type: 'pending' as const, 
      count: stats?.pending || 0,
      amount: stats?.pendingAmount || 0
    },
    { 
      type: 'failed' as const, 
      count: stats?.failed || 0,
      amount: 0 // Pas de montant pour les échecs
    },
  ];

  // Préparer les stats avec le nouveau design moderne
  const statsData: ModernStatCardData[] = [
    { title: "Total", value: stats?.total || 0, subtitle: "paiements", icon: Receipt, color: 'blue' },
    { title: "Complétés", value: stats?.completed || 0, subtitle: "payés", icon: CheckCircle2, color: 'green', trend: stats?.completed && stats?.total ? { value: Math.round((stats.completed / stats.total) * 100), label: 'du total' } : undefined },
    { title: "En Attente", value: stats?.pending || 0, subtitle: "à traiter", icon: Clock, color: 'gold' },
    { title: "Échoués", value: stats?.failed || 0, subtitle: "erreurs", icon: XCircle, color: 'red' },
    { title: "Revenus", value: `${((stats?.totalAmount || 0) / 1000).toFixed(0)}K`, subtitle: "FCFA", icon: DollarSign, color: 'purple' },
  ];

  // Colonnes pour la table (depuis payments_enriched)
  const columns = [
    { key: 'invoice_number', label: 'Facture', sortable: true },
    { key: 'school_group_name', label: 'Groupe', sortable: true },
    { 
      key: 'amount', 
      label: 'Montant', 
      sortable: true,
      render: (p: any) => `${p.amount.toLocaleString()} ${p.currency}`
    },
    { key: 'payment_method', label: 'Méthode', sortable: true },
    { 
      key: 'detailed_status', 
      label: 'Statut',
      render: (p: any) => getStatusBadge(p.detailed_status || p.status)
    },
    { 
      key: 'paid_at', 
      label: 'Date', 
      sortable: true,
      render: (p: any) => p.paid_at ? format(new Date(p.paid_at), 'dd MMM yyyy', { locale: fr }) : 'N/A'
    },
  ];

  // Actions
  const handleBulkValidate = () => {
    setShowValidateModal(true);
  };

  const confirmValidate = async () => {
    try {
      await validateMultiplePayments(selectedPayments.map(p => p.id));
      setSuccessMessage({
        title: 'Validation réussie',
        message: `${selectedPayments.length} paiement(s) validé(s) avec succès !`,
      });
      setShowSuccessModal(true);
      setSelectedPayments([]);
      refetch();
    } catch (error) {
      console.error('Erreur validation bulk:', error);
    }
  };

  const handleBulkRefund = () => {
    setShowRefundModal(true);
  };

  const confirmRefund = async () => {
    try {
      for (const payment of selectedPayments) {
        await refundPayment({ paymentId: payment.id, reason: 'Remboursement groupé' });
      }
      setSuccessMessage({
        title: 'Remboursement réussi',
        message: `${selectedPayments.length} paiement(s) remboursé(s) avec succès !`,
      });
      setShowSuccessModal(true);
      setSelectedPayments([]);
      refetch();
    } catch (error) {
      console.error('Erreur remboursement bulk:', error);
    }
  };

  const handleBulkExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv') exportPaymentsCSV(selectedPayments);
    if (format === 'excel') exportPaymentsExcel(selectedPayments);
    if (format === 'pdf') exportPaymentsPDF(selectedPayments);
    
    setSuccessMessage({
      title: 'Export réussi',
      message: `${selectedPayments.length} paiement(s) exporté(s) au format ${format.toUpperCase()} !`,
    });
    setShowSuccessModal(true);
  };

  const handleBulkEmail = () => {
    setShowEmailModal(true);
  };

  const confirmEmail = async () => {
    try {
      for (const payment of selectedPayments) {
        await sendPaymentEmail({ paymentId: payment.id, type: 'reminder' });
      }
      setSuccessMessage({
        title: 'Emails envoyés',
        message: `${selectedPayments.length} email(s) de rappel envoyé(s) avec succès !`,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erreur envoi email bulk:', error);
    }
  };

  const handleExportCSV = () => {
    exportPaymentsCSV(payments || []);
  };

  const handleExportExcel = () => {
    exportPaymentsExcel(payments || []);
  };

  const handleExportPDF = () => {
    exportPaymentsPDF(payments || []);
  };

  const handlePrintInvoice = (payment: any) => {
    printInvoice(payment);
  };

  const handleGenerateReceipt = (payment: any) => {
    generateReceipt(payment);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <FinanceBreadcrumb currentPage="Paiements" />

      {/* Header */}
      <FinancePageHeader
        title="Paiements"
        description="Historique complet des transactions"
        actions={
          <div className="flex gap-2">
            <Select onValueChange={(value) => {
              if (value === 'csv') handleExportCSV();
              if (value === 'excel') handleExportExcel();
              if (value === 'pdf') handleExportPDF();
            }}>
              <SelectTrigger className="w-[180px]">
                <Download className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Exporter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Export CSV
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Excel
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Alertes */}
      <PaymentAlerts 
        alerts={alerts}
        onViewDetails={(type) => setStatusFilter(type)}
      />

      {/* Statistiques - Design Moderne avec Glassmorphism */}
      <FinanceModernStatsGrid stats={statsData} columns={5} />

      {/* Graphique Évolution des Paiements */}
      <ChartCard
        title="Évolution des Paiements"
        subtitle="6 derniers mois"
        onExport={() => exportPayments(payments || [], 'excel')}
        onRefresh={refetch}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="montant"
              stroke="#2A9D8F"
              strokeWidth={2}
              name="Montant (FCFA)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="nombre"
              stroke="#1D3557"
              strokeWidth={2}
              name="Nombre"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Filtres Avancés */}
      <PaymentFilters
        filters={filters}
        onFiltersChange={setFilters}
        schools={[]}
      />

      {/* Table Moderne */}
      <ModernDataTable
        data={payments || []}
        columns={columns}
        selectable
        onSelect={setSelectedPayments}
        onRowClick={setSelectedPayment}
        searchable
        searchPlaceholder="Rechercher un paiement..."
        exportable
        onExport={() => exportPayments(payments || [], 'csv')}
        emptyMessage="Aucun paiement trouvé"
      />

      {/* Barre Actions Bulk */}
      <BulkActionsBar
        selectedCount={selectedPayments.length}
        onValidate={handleBulkValidate}
        onRefund={handleBulkRefund}
        onExport={handleBulkExport}
        onSendEmail={handleBulkEmail}
        onClear={() => setSelectedPayments([])}
      />

      {/* Modal Moderne Centré */}
      <ModernPaymentModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onPrintInvoice={() => handlePrintInvoice(selectedPayment)}
        onGenerateReceipt={() => handleGenerateReceipt(selectedPayment)}
        onValidate={() => validateMultiplePayments(selectedPayments.map(p => p.id))}
        onRefund={() => refundPayment({ paymentId: selectedPayment.id })}
        onSendEmail={() => sendPaymentEmail({ paymentId: selectedPayment.id, type: 'reminder' })}
      />

      {/* Modals d'actions bulk */}
      <ConfirmModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onConfirm={confirmValidate}
        title="Valider les paiements"
        message={`Êtes-vous sûr de vouloir valider ${selectedPayments.length} paiement(s) ?`}
        confirmText="Valider"
        type="success"
        icon={CheckCircle2}
      />

      <ConfirmModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onConfirm={confirmRefund}
        title="Rembourser les paiements"
        message={`Êtes-vous sûr de vouloir rembourser ${selectedPayments.length} paiement(s) ?`}
        confirmText="Rembourser"
        type="danger"
        icon={RefreshCw}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={confirmExport}
        count={selectedPayments.length}
      />

      <ConfirmModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={confirmEmail}
        title="Envoyer des emails"
        message={`Envoyer un email de rappel à ${selectedPayments.length} client(s) ?`}
        confirmText="Envoyer"
        type="warning"
        icon={Mail}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
      />
    </div>
  );
};

export default Payments;
