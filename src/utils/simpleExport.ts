/**
 * Utilitaires d'export simplifiés et fonctionnels
 * @module simpleExport
 */

import { format } from 'date-fns';

// Export CSV simple et fonctionnel
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Créer les headers
  const headers = Object.keys(data[0]);
  
  // Créer le contenu CSV
  const csvContent = [
    headers.join(','), // Headers
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Créer et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export JSON simple (en attendant Excel)
export const exportToJSON = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export paiements simplifié
export const exportPayments = (payments: any[], format: 'csv' | 'json' = 'csv') => {
  if (!payments || payments.length === 0) {
    alert('Aucun paiement à exporter');
    return;
  }

  const data = payments.map(p => ({
    'Référence': p.invoice_number || p.reference || 'N/A',
    'Payeur': p.subscription?.school_group_name || p.payerName || 'N/A',
    'Email': p.payerEmail || 'N/A',
    'Montant': `${(p.amount || 0).toLocaleString()} ${p.currency || 'FCFA'}`,
    'Méthode': p.payment_method || p.paymentMethod || 'N/A',
    'Statut': p.status || 'N/A',
    'Date': p.paid_at ? format(new Date(p.paid_at), 'dd/MM/yyyy') : 
            p.paymentDate ? format(new Date(p.paymentDate), 'dd/MM/yyyy') : 'N/A',
    'École': p.subscription?.school_group_name || p.schoolName || 'N/A',
  }));

  if (format === 'csv') {
    exportToCSV(data, 'paiements');
  } else {
    exportToJSON(data, 'paiements');
  }
};

// Export dépenses simplifié
export const exportExpenses = (expenses: any[], format: 'csv' | 'json' = 'csv') => {
  if (!expenses || expenses.length === 0) {
    alert('Aucune dépense à exporter');
    return;
  }

  const data = expenses.map(e => ({
    'Date': e.date ? format(new Date(e.date), 'dd/MM/yyyy') : 'N/A',
    'Référence': e.reference || 'N/A',
    'Catégorie': e.category || 'N/A',
    'Description': e.description || 'N/A',
    'Montant': `${(e.amount || 0).toLocaleString()} FCFA`,
    'Méthode': e.paymentMethod || 'N/A',
    'Statut': e.status || 'N/A',
    'Demandeur': e.requestedBy || 'N/A',
  }));

  if (format === 'csv') {
    exportToCSV(data, 'depenses');
  } else {
    exportToJSON(data, 'depenses');
  }
};

// Export budgets simplifié
export const exportBudgets = (budgets: any[], format: 'csv' | 'json' = 'csv') => {
  if (!budgets || budgets.length === 0) {
    alert('Aucun budget à exporter');
    return;
  }

  const data = budgets.map(b => ({
    'Catégorie': b.categoryLabel || b.category || 'N/A',
    'Budget': `${(b.budget || 0).toLocaleString()} FCFA`,
    'Dépensé': `${(b.spent || 0).toLocaleString()} FCFA`,
    'Restant': `${Math.max(0, (b.budget || 0) - (b.spent || 0)).toLocaleString()} FCFA`,
    'Utilisation': `${(b.percentage || 0).toFixed(1)}%`,
    'Statut': (b.percentage || 0) >= 100 ? 'Dépassé' : 
              (b.percentage || 0) >= 80 ? 'Alerte' : 'OK',
  }));

  if (format === 'csv') {
    exportToCSV(data, 'budgets');
  } else {
    exportToJSON(data, 'budgets');
  }
};
