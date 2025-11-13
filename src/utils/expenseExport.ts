/**
 * FONCTIONS D'EXPORT POUR DÉPENSES
 * CSV, Excel, PDF
 * @module expenseExport
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// =====================================================
// EXPORT CSV
// =====================================================

export const exportExpensesCSV = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) {
    alert('Aucune dépense à exporter');
    return;
  }

  // Préparer les données
  const csvData = expenses.map(expense => ({
    'Référence': expense.reference,
    'Date': new Date(expense.date).toLocaleDateString('fr-FR'),
    'Catégorie': expense.category_label || expense.category,
    'Description': expense.description,
    'Montant': expense.amount,
    'Statut': expense.status === 'paid' ? 'Payé' : expense.status === 'pending' ? 'En attente' : 'Annulé',
    'Méthode': expense.payment_method || 'N/A',
  }));

  // Convertir en CSV
  const headers = Object.keys(csvData[0]);
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
  ].join('\n');

  // Télécharger
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `depenses_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// =====================================================
// EXPORT EXCEL
// =====================================================

export const exportExpensesExcel = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) {
    alert('Aucune dépense à exporter');
    return;
  }

  // Préparer les données
  const excelData = expenses.map(expense => ({
    'Référence': expense.reference,
    'Date': new Date(expense.date).toLocaleDateString('fr-FR'),
    'Catégorie': expense.category_label || expense.category,
    'Description': expense.description,
    'Montant (FCFA)': expense.amount,
    'Statut': expense.status === 'paid' ? 'Payé' : expense.status === 'pending' ? 'En attente' : 'Annulé',
    'Méthode de paiement': expense.payment_method || 'N/A',
    'Groupe': expense.school_group_name || 'N/A',
  }));

  // Créer workbook
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');

  // Ajuster largeur colonnes
  const colWidths = [
    { wch: 20 }, // Référence
    { wch: 12 }, // Date
    { wch: 20 }, // Catégorie
    { wch: 40 }, // Description
    { wch: 15 }, // Montant
    { wch: 12 }, // Statut
    { wch: 18 }, // Méthode
    { wch: 25 }, // Groupe
  ];
  ws['!cols'] = colWidths;

  // Télécharger
  XLSX.writeFile(wb, `depenses_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// =====================================================
// EXPORT PDF
// =====================================================

export const exportExpensesPDF = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) {
    alert('Aucune dépense à exporter');
    return;
  }

  const doc = new jsPDF();

  // Titre
  doc.setFontSize(18);
  doc.setTextColor(42, 157, 143);
  doc.text('RAPPORT DES DÉPENSES', 14, 20);

  // Date du rapport
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 28);

  // Statistiques
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const paidCount = expenses.filter(e => e.status === 'paid').length;
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Total dépenses: ${expenses.length}`, 14, 38);
  doc.text(`Montant total: ${totalAmount.toLocaleString()} FCFA`, 14, 44);
  doc.text(`Payées: ${paidCount} | En attente: ${pendingCount}`, 14, 50);

  // Tableau
  const tableData = expenses.map(expense => [
    expense.reference,
    new Date(expense.date).toLocaleDateString('fr-FR'),
    expense.category_label || expense.category,
    expense.description?.substring(0, 30) + (expense.description?.length > 30 ? '...' : ''),
    `${expense.amount.toLocaleString()} FCFA`,
    expense.status === 'paid' ? 'Payé' : expense.status === 'pending' ? 'En attente' : 'Annulé',
  ]);

  autoTable(doc, {
    startY: 58,
    head: [['Référence', 'Date', 'Catégorie', 'Description', 'Montant', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [42, 157, 143],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 22 },
      2: { cellWidth: 25 },
      3: { cellWidth: 45 },
      4: { cellWidth: 28 },
      5: { cellWidth: 22 },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Télécharger
  doc.save(`depenses_${new Date().toISOString().split('T')[0]}.pdf`);
};

// =====================================================
// IMPRESSION
// =====================================================

export const printExpenses = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) {
    alert('Aucune dépense à imprimer');
    return;
  }

  // Créer HTML pour impression
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour imprimer');
    return;
  }

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const paidCount = expenses.filter(e => e.status === 'paid').length;
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport des Dépenses</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2A9D8F;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2A9D8F;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #2A9D8F;
        }
        .stat-card h3 {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #666;
        }
        .stat-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #2A9D8F;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #2A9D8F;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
          background: #f8f9fa;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-paid {
          background: #d4edda;
          color: #155724;
        }
        .badge-pending {
          background: #fff3cd;
          color: #856404;
        }
        .badge-cancelled {
          background: #f8d7da;
          color: #721c24;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 RAPPORT DES DÉPENSES</h1>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <h3>Total Dépenses</h3>
          <p>${expenses.length}</p>
        </div>
        <div class="stat-card">
          <h3>Montant Total</h3>
          <p>${totalAmount.toLocaleString()} FCFA</p>
        </div>
        <div class="stat-card">
          <h3>Payées / En attente</h3>
          <p>${paidCount} / ${pendingCount}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Date</th>
            <th>Catégorie</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(expense => `
            <tr>
              <td><strong>${expense.reference}</strong></td>
              <td>${new Date(expense.date).toLocaleDateString('fr-FR')}</td>
              <td>${expense.category_label || expense.category}</td>
              <td>${expense.description?.substring(0, 40)}${expense.description?.length > 40 ? '...' : ''}</td>
              <td><strong>${expense.amount.toLocaleString()} FCFA</strong></td>
              <td>
                <span class="badge badge-${expense.status}">
                  ${expense.status === 'paid' ? 'Payé' : expense.status === 'pending' ? 'En attente' : 'Annulé'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>E-Pilot Congo - Système de Gestion Scolaire</p>
        <p>Document généré automatiquement - ${new Date().toLocaleString('fr-FR')}</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 100);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
