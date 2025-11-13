/**
 * Utilitaires d'export avancés (Excel, CSV, PDF)
 * @module advancedExport
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Export Excel avec styles
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Données') => {
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Largeur des colonnes
  const cols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
  ws['!cols'] = cols;
  
  // Créer le workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Télécharger
  XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export CSV
export const exportToCSV = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
};

// Export PDF avec logo et styles
export const exportToPDF = (
  data: any[],
  columns: Array<{ header: string; dataKey: string }>,
  title: string,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    logo?: string;
    footer?: string;
  }
) => {
  const doc = new jsPDF({
    orientation: options?.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header avec logo
  if (options?.logo) {
    doc.addImage(options.logo, 'PNG', 15, 10, 30, 30);
  }

  // Titre
  doc.setFontSize(20);
  doc.setTextColor(42, 157, 143); // Couleur principale
  doc.text(title, options?.logo ? 50 : 15, 25);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 15, 35);

  // Table
  autoTable(doc, {
    startY: 45,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '-')),
    theme: 'grid',
    headStyles: {
      fillColor: [42, 157, 143],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      options?.footer || 'Document confidentiel',
      15,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Télécharger
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export paiements
export const exportPayments = (payments: any[], format: 'excel' | 'csv' | 'pdf' = 'excel') => {
  const data = payments.map(p => ({
    'Référence': p.reference,
    'Payeur': p.payerName,
    'Email': p.payerEmail,
    'Montant': `${p.amount.toLocaleString()} FCFA`,
    'Méthode': p.paymentMethod,
    'Statut': p.status,
    'Date': p.paymentDate ? format(new Date(p.paymentDate), 'dd/MM/yyyy') : '-',
    'École': p.schoolName || '-',
  }));

  if (format === 'excel') {
    exportToExcel(data, 'paiements', 'Paiements');
  } else if (format === 'csv') {
    exportToCSV(data, 'paiements');
  } else {
    const columns = [
      { header: 'Référence', dataKey: 'Référence' },
      { header: 'Payeur', dataKey: 'Payeur' },
      { header: 'Montant', dataKey: 'Montant' },
      { header: 'Statut', dataKey: 'Statut' },
      { header: 'Date', dataKey: 'Date' },
    ];
    exportToPDF(data, columns, 'Liste des Paiements', 'paiements', {
      orientation: 'landscape',
      footer: 'Document confidentiel - E-Pilot',
    });
  }
};

// Export dépenses
export const exportExpenses = (expenses: any[], format: 'excel' | 'csv' | 'pdf' = 'excel') => {
  const data = expenses.map(e => ({
    'Date': e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '-',
    'Catégorie': e.category,
    'Description': e.description,
    'Montant': `${e.amount.toLocaleString()} FCFA`,
    'Méthode': e.paymentMethod,
    'Statut': e.status,
    'Demandeur': e.requestedBy || '-',
  }));

  if (format === 'excel') {
    exportToExcel(data, 'depenses', 'Dépenses');
  } else if (format === 'csv') {
    exportToCSV(data, 'depenses');
  } else {
    const columns = [
      { header: 'Date', dataKey: 'Date' },
      { header: 'Catégorie', dataKey: 'Catégorie' },
      { header: 'Description', dataKey: 'Description' },
      { header: 'Montant', dataKey: 'Montant' },
      { header: 'Statut', dataKey: 'Statut' },
    ];
    exportToPDF(data, columns, 'Liste des Dépenses', 'depenses', {
      orientation: 'landscape',
      footer: 'Document confidentiel - E-Pilot',
    });
  }
};

// Export budgets
export const exportBudgets = (budgets: any[], format: 'excel' | 'csv' | 'pdf' = 'excel') => {
  const data = budgets.map(b => ({
    'Catégorie': b.categoryLabel,
    'Budget': `${b.budget.toLocaleString()} FCFA`,
    'Dépensé': `${b.spent.toLocaleString()} FCFA`,
    'Restant': `${Math.max(0, b.budget - b.spent).toLocaleString()} FCFA`,
    'Utilisation': `${b.percentage.toFixed(1)}%`,
    'Statut': b.percentage >= 100 ? 'Dépassé' : b.percentage >= 80 ? 'Alerte' : 'OK',
  }));

  if (format === 'excel') {
    exportToExcel(data, 'budgets', 'Budgets');
  } else if (format === 'csv') {
    exportToCSV(data, 'budgets');
  } else {
    const columns = [
      { header: 'Catégorie', dataKey: 'Catégorie' },
      { header: 'Budget', dataKey: 'Budget' },
      { header: 'Dépensé', dataKey: 'Dépensé' },
      { header: 'Restant', dataKey: 'Restant' },
      { header: 'Utilisation', dataKey: 'Utilisation' },
      { header: 'Statut', dataKey: 'Statut' },
    ];
    exportToPDF(data, columns, 'État des Budgets', 'budgets', {
      footer: 'Document confidentiel - E-Pilot',
    });
  }
};
