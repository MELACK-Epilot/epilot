/**
 * Export Abonnements - Utilitaires d'export avancés
 * Export CSV, Excel (.xlsx) et PDF
 * @module exportSubscriptions
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Subscription {
  id: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  planName: string;
  status: string;
  amount: number;
  currency: string;
  billingPeriod: string;
  startDate: string;
  endDate: string;
  paymentStatus: string;
  schoolsCount?: number;
  usersCount?: number;
  autoRenew: boolean;
  [key: string]: any; // Pour accepter d'autres propriétés
}

/**
 * Formater les données pour l'export
 */
const formatSubscriptionForExport = (sub: Subscription) => ({
  'Groupe Scolaire': sub.schoolGroupName,
  'Code': sub.schoolGroupCode,
  'Plan': sub.planName,
  'Statut': getStatusLabel(sub.status),
  'Montant': `${sub.amount.toLocaleString()} ${sub.currency}`,
  'Période': sub.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel',
  'Date Début': format(new Date(sub.startDate), 'dd/MM/yyyy'),
  'Date Fin': format(new Date(sub.endDate), 'dd/MM/yyyy'),
  'Paiement': getPaymentStatusLabel(sub.paymentStatus),
  'Écoles': sub.schoolsCount,
  'Utilisateurs': sub.usersCount,
  'Renouvellement Auto': sub.autoRenew ? 'Oui' : 'Non',
});

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Actif',
    expired: 'Expiré',
    cancelled: 'Annulé',
    pending: 'En attente',
    suspended: 'Suspendu',
  };
  return labels[status] || status;
};

const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    paid: 'Payé',
    pending: 'En attente',
    overdue: 'En retard',
    failed: 'Échoué',
  };
  return labels[status] || status;
};

/**
 * Export CSV
 */
export const exportToCSV = (subscriptions: Subscription[], filename?: string) => {
  const data = subscriptions.map(formatSubscriptionForExport);
  
  // Convertir en CSV
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(';'))
  ].join('\n');

  // Télécharger
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || `abonnements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Export Excel (.xlsx)
 */
export const exportToExcel = (subscriptions: Subscription[], filename?: string) => {
  const data = subscriptions.map(formatSubscriptionForExport);

  // Créer workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Abonnements');

  // Ajuster largeur des colonnes
  const maxWidth = 20;
  const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
  ws['!cols'] = wscols;

  // Télécharger
  XLSX.writeFile(wb, filename || `abonnements_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

/**
 * Export PDF
 */
export const exportToPDF = (subscriptions: Subscription[], filename?: string) => {
  const doc = new jsPDF('landscape');

  // En-tête
  doc.setFontSize(18);
  doc.setTextColor(42, 157, 143); // Turquoise E-PILOT
  doc.text('E-PILOT - Abonnements', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 22);
  doc.text(`Total: ${subscriptions.length} abonnement(s)`, 14, 27);

  // Préparer les données du tableau
  const tableData = subscriptions.map(sub => [
    sub.schoolGroupName,
    sub.planName,
    getStatusLabel(sub.status),
    `${sub.amount.toLocaleString()} ${sub.currency}`,
    format(new Date(sub.endDate), 'dd/MM/yyyy'),
    getPaymentStatusLabel(sub.paymentStatus),
    (sub.schoolsCount || 0).toString(),
  ]);

  // Générer le tableau
  autoTable(doc, {
    startY: 32,
    head: [['Groupe', 'Plan', 'Statut', 'Montant', 'Échéance', 'Paiement', 'Écoles']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [42, 157, 143], // Turquoise
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Groupe
      1: { cellWidth: 30 }, // Plan
      2: { cellWidth: 25 }, // Statut
      3: { cellWidth: 35 }, // Montant
      4: { cellWidth: 25 }, // Échéance
      5: { cellWidth: 25 }, // Paiement
      6: { cellWidth: 15, halign: 'center' }, // Écoles
    },
    margin: { top: 32, left: 14, right: 14 },
  });

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Télécharger
  doc.save(filename || `abonnements_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

/**
 * Export avec sélection du format
 */
export const exportSubscriptions = (
  subscriptions: Subscription[],
  format: 'csv' | 'excel' | 'pdf',
  filename?: string
) => {
  if (!subscriptions || subscriptions.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  switch (format) {
    case 'csv':
      exportToCSV(subscriptions, filename);
      break;
    case 'excel':
      exportToExcel(subscriptions, filename);
      break;
    case 'pdf':
      exportToPDF(subscriptions, filename);
      break;
    default:
      throw new Error(`Format non supporté: ${format}`);
  }
};
