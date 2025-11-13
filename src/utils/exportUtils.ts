/**
 * Utilitaires d'export pour tous les onglets Finances
 * Formats supportés : CSV, Excel (future), PDF (future)
 * @module exportUtils
 */

import { format } from 'date-fns';
import type { Plan, Subscription, Payment } from '@/features/dashboard/types/dashboard.types';

/**
 * Fonction générique pour télécharger un fichier CSV
 */
const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM pour Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convertir un tableau de données en CSV
 */
const arrayToCSV = (data: any[][]): string => {
  return data.map(row => 
    row.map(cell => {
      // Échapper les virgules et guillemets
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
};

/**
 * Export Plans d'abonnement
 */
export const exportPlans = (plans: Plan[]) => {
  if (!plans || plans.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const csvData = [
    ['PLANS D\'ABONNEMENT - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [''],
    ['Plan', 'Prix (FCFA)', 'Abonnements', 'Écoles max', 'Élèves max', 'Personnel max', 'Statut'],
    ...plans.map(plan => [
      plan.name,
      plan.price.toLocaleString(),
      plan.subscriptionCount || 0,
      plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools,
      plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents,
      plan.maxStaff === -1 ? 'Illimité' : plan.maxStaff,
      plan.status === 'active' ? 'Actif' : 'Inactif'
    ])
  ];

  const csvContent = arrayToCSV(csvData);
  const filename = `plans-abonnement-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Export Abonnements
 */
export const exportSubscriptions = (subscriptions: Subscription[]) => {
  if (!subscriptions || subscriptions.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const csvData = [
    ['ABONNEMENTS - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [''],
    ['Groupe Scolaire', 'Plan', 'Statut', 'Montant (FCFA)', 'Date début', 'Date fin', 'Statut paiement'],
    ...subscriptions.map(sub => [
      sub.schoolGroupName || 'N/A',
      sub.planName || 'N/A',
      sub.status === 'active' ? 'Actif' : 
      sub.status === 'expired' ? 'Expiré' : 
      sub.status === 'cancelled' ? 'Annulé' : 'En attente',
      sub.amount.toLocaleString(),
      format(new Date(sub.startDate), 'dd/MM/yyyy'),
      format(new Date(sub.endDate), 'dd/MM/yyyy'),
      sub.paymentStatus === 'paid' ? 'Payé' : 
      sub.paymentStatus === 'overdue' ? 'En retard' : 'En attente'
    ])
  ];

  const csvContent = arrayToCSV(csvData);
  const filename = `abonnements-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Export Paiements
 */
export const exportPayments = (payments: Payment[]) => {
  if (!payments || payments.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const csvData = [
    ['PAIEMENTS - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [''],
    ['Référence', 'Groupe Scolaire', 'Montant (FCFA)', 'Statut', 'Date paiement', 'Méthode', 'Devise'],
    ...payments.map(payment => [
      payment.reference,
      payment.schoolGroupName || 'N/A',
      payment.amount.toLocaleString(),
      payment.status === 'completed' ? 'Complété' : 
      payment.status === 'pending' ? 'En attente' : 
      payment.status === 'failed' ? 'Échoué' : 'Remboursé',
      payment.paidAt ? format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm') : 'N/A',
      payment.paymentMethod || 'N/A',
      payment.currency || 'FCFA'
    ])
  ];

  const csvContent = arrayToCSV(csvData);
  const filename = `paiements-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Export Dépenses
 */
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  reference: string;
  status: string;
  paymentMethod: string;
}

export const exportExpenses = (expenses: Expense[]) => {
  if (!expenses || expenses.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const categoryLabels: Record<string, string> = {
    salaires: 'Salaires & Charges',
    fournitures: 'Fournitures Scolaires',
    infrastructure: 'Infrastructure & Maintenance',
    utilities: 'Eau, Électricité, Internet',
    transport: 'Transport',
    marketing: 'Marketing & Communication',
    formation: 'Formation du Personnel',
    autres: 'Autres Dépenses'
  };

  const csvData = [
    ['DÉPENSES - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [''],
    ['Référence', 'Catégorie', 'Description', 'Montant (FCFA)', 'Date', 'Statut', 'Méthode paiement'],
    ...expenses.map(expense => [
      expense.reference,
      categoryLabels[expense.category] || expense.category,
      expense.description,
      expense.amount.toLocaleString(),
      format(new Date(expense.date), 'dd/MM/yyyy'),
      expense.status === 'paid' ? 'Payé' : 
      expense.status === 'pending' ? 'En attente' : 'Annulé',
      expense.paymentMethod
    ])
  ];

  const csvContent = arrayToCSV(csvData);
  const filename = `depenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Export Vue d'ensemble (Dashboard Financier)
 * Déjà implémenté dans FinancialDashboard.tsx
 */
export const exportFinancialDashboard = (stats: any, planRevenue: any[]) => {
  if (!stats || !planRevenue) {
    alert('Aucune donnée à exporter');
    return;
  }

  const csvData = [
    ['RAPPORT FINANCIER - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [''],
    ['KPIs PRINCIPAUX'],
    ['Taux de Rétention', `${(stats.retentionRate || 0).toFixed(1)}%`],
    ['Taux d\'Attrition', `${(stats.churnRate || 0).toFixed(1)}%`],
    ['Revenu Moyen par Groupe', `${(stats.averageRevenuePerGroup || 0).toLocaleString()} FCFA`],
    ['Valeur Vie Client', `${(stats.lifetimeValue || 0).toLocaleString()} FCFA`],
    [''],
    ['REVENUS'],
    ['Revenus Totaux', `${stats.totalRevenue.toLocaleString()} FCFA`],
    ['Revenus Mensuels', `${stats.monthlyRevenue.toLocaleString()} FCFA`],
    ['Revenus Annuels', `${stats.yearlyRevenue.toLocaleString()} FCFA`],
    [''],
    ['ABONNEMENTS'],
    ['Total', stats.totalSubscriptions],
    ['Actifs', stats.activeSubscriptions],
    ['En attente', stats.pendingSubscriptions],
    ['Expirés', stats.expiredSubscriptions],
    ['Annulés', stats.cancelledSubscriptions],
    [''],
    ['PAIEMENTS EN RETARD'],
    ['Nombre', stats.overduePayments],
    ['Montant', `${stats.overdueAmount.toLocaleString()} FCFA`],
    [''],
    ['PERFORMANCE PAR PLAN'],
    ['Plan', 'Abonnements', 'Revenu (FCFA)', 'Part (%)'],
    ...planRevenue.map(plan => [
      plan.planName,
      plan.subscriptionCount,
      plan.revenue.toLocaleString(),
      plan.percentage.toFixed(1)
    ])
  ];

  const csvContent = arrayToCSV(csvData);
  const filename = `rapport-financier-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};
