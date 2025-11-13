/**
 * EXPORT & IMPRESSION PAIEMENTS - NIVEAU PROFESSIONNEL
 * Export CSV, Excel, PDF + Impression factures
 * @module paymentExport
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// =====================================================
// 1. EXPORT CSV
// =====================================================

export const exportPaymentsCSV = (payments: any[]) => {
  const headers = [
    'Numéro Facture',
    'Groupe Scolaire',
    'Montant',
    'Devise',
    'Méthode',
    'Statut',
    'Date Paiement',
    'Date Échéance',
    'Créé le',
  ];

  const rows = payments.map(p => [
    p.invoice_number || 'N/A',
    p.school_group_name || 'N/A',
    p.amount || 0,
    p.currency || 'FCFA',
    p.payment_method || 'N/A',
    p.detailed_status || p.status || 'N/A',
    p.paid_at ? format(new Date(p.paid_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A',
    p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy', { locale: fr }) : 'N/A',
    p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `paiements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
};

// =====================================================
// 2. EXPORT EXCEL
// =====================================================

export const exportPaymentsExcel = async (payments: any[]) => {
  const XLSX = await import('xlsx');
  
  const data = payments.map(p => ({
    'Numéro Facture': p.invoice_number || 'N/A',
    'Groupe Scolaire': p.school_group_name || 'N/A',
    'Montant': p.amount || 0,
    'Devise': p.currency || 'FCFA',
    'Méthode': p.payment_method || 'N/A',
    'Statut': p.detailed_status || p.status || 'N/A',
    'Date Paiement': p.paid_at ? format(new Date(p.paid_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A',
    'Date Échéance': p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy', { locale: fr }) : 'N/A',
    'Créé le': p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Paiements');

  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 20 }, // Numéro Facture
    { wch: 30 }, // Groupe Scolaire
    { wch: 15 }, // Montant
    { wch: 10 }, // Devise
    { wch: 20 }, // Méthode
    { wch: 15 }, // Statut
    { wch: 15 }, // Date Paiement
    { wch: 15 }, // Date Échéance
    { wch: 20 }, // Créé le
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `paiements_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// =====================================================
// 3. EXPORT PDF - LISTE DES PAIEMENTS
// =====================================================

export const exportPaymentsPDF = (payments: any[]) => {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(42, 157, 143); // Turquoise E-Pilot
  doc.text('E-PILOT CONGO', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Liste des Paiements', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 105, 37, { align: 'center' });

  // Statistiques
  const total = payments.length;
  const completed = payments.filter(p => p.status === 'completed').length;
  const pending = payments.filter(p => p.status === 'pending').length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  doc.setFontSize(10);
  doc.text(`Total: ${total} paiements | Complétés: ${completed} | En attente: ${pending} | Montant total: ${totalAmount.toLocaleString()} FCFA`, 14, 45);

  // Tableau
  const tableData = payments.map(p => [
    p.invoice_number || 'N/A',
    p.school_group_name || 'N/A',
    `${(p.amount || 0).toLocaleString()} ${p.currency || 'FCFA'}`,
    p.payment_method || 'N/A',
    getStatusLabel(p.detailed_status || p.status),
    p.paid_at ? format(new Date(p.paid_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A',
  ]);

  (doc as any).autoTable({
    startY: 50,
    head: [['Facture', 'Groupe', 'Montant', 'Méthode', 'Statut', 'Date']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [42, 157, 143], // Turquoise
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
    },
  });

  doc.save(`paiements_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// =====================================================
// 4. IMPRESSION FACTURE INDIVIDUELLE
// =====================================================

export const printInvoice = (payment: any) => {
  const doc = new jsPDF();

  // En-tête avec logo
  doc.setFillColor(42, 157, 143); // Turquoise
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('E-PILOT CONGO', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Plateforme de Gestion Scolaire', 105, 28, { align: 'center' });
  doc.text('Kinshasa, République Démocratique du Congo', 105, 35, { align: 'center' });

  // Numéro de facture
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(`FACTURE ${payment.invoice_number || 'N/A'}`, 105, 55, { align: 'center' });

  // Informations client
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À :', 14, 70);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(payment.school_group_name || 'N/A', 14, 78);
  doc.text(payment.school_group_address || 'Adresse non renseignée', 14, 84);
  doc.text(`${payment.school_group_city || ''}, ${payment.school_group_region || ''}`, 14, 90);
  doc.text(`Tél: ${payment.school_group_phone || 'N/A'}`, 14, 96);

  // Informations facture
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS :', 140, 70);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${payment.paid_at ? format(new Date(payment.paid_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}`, 140, 78);
  doc.text(`Échéance: ${payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}`, 140, 84);
  doc.text(`Statut: ${getStatusLabel(payment.detailed_status || payment.status)}`, 140, 90);
  doc.text(`Méthode: ${payment.payment_method || 'N/A'}`, 140, 96);

  // Tableau des services
  const tableData = [[
    payment.plan_name || 'Abonnement E-Pilot',
    '1',
    `${(payment.amount || 0).toLocaleString()} FCFA`,
    `${(payment.amount || 0).toLocaleString()} FCFA`,
  ]];

  (doc as any).autoTable({
    startY: 110,
    head: [['Description', 'Quantité', 'Prix Unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [42, 157, 143],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 11,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(130, finalY, 66, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TOTAL À PAYER:', 135, finalY + 7);
  doc.text(`${(payment.amount || 0).toLocaleString()} FCFA`, 191, finalY + 7, { align: 'right' });

  // Statut du paiement
  if (payment.status === 'completed') {
    doc.setFillColor(42, 157, 143);
    doc.setTextColor(255, 255, 255);
    doc.rect(14, finalY + 20, 60, 10, 'F');
    doc.setFontSize(12);
    doc.text('✓ PAYÉ', 44, finalY + 27, { align: 'center' });
  } else if (payment.status === 'pending') {
    doc.setFillColor(233, 196, 106);
    doc.setTextColor(0, 0, 0);
    doc.rect(14, finalY + 20, 60, 10, 'F');
    doc.setFontSize(12);
    doc.text('⏰ EN ATTENTE', 44, finalY + 27, { align: 'center' });
  }

  // Notes
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Notes:', 14, finalY + 45);
  doc.text(payment.notes || 'Merci pour votre confiance. E-Pilot Congo.', 14, finalY + 50);

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('E-Pilot Congo - Plateforme de Gestion Scolaire', 105, 280, { align: 'center' });
  doc.text('contact@e-pilot.cd | +243 XXX XXX XXX', 105, 285, { align: 'center' });

  // Ouvrir dans un nouvel onglet pour impression
  window.open(doc.output('bloburl'), '_blank');
};

// =====================================================
// 5. GÉNÉRATION REÇU PDF
// =====================================================

export const generateReceipt = (payment: any) => {
  const doc = new jsPDF();

  // En-tête
  doc.setFillColor(42, 157, 143);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('REÇU DE PAIEMENT', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(payment.receipt_number || `REC-${payment.invoice_number}`, 105, 28, { align: 'center' });

  // Informations
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  doc.text('Reçu de:', 14, 50);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.school_group_name || 'N/A', 14, 57);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Montant:', 14, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${(payment.amount || 0).toLocaleString()} FCFA`, 14, 78);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Date: ${payment.paid_at ? format(new Date(payment.paid_at), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}`, 14, 90);
  doc.text(`Méthode: ${payment.payment_method || 'N/A'}`, 14, 97);
  doc.text(`Facture: ${payment.invoice_number || 'N/A'}`, 14, 104);

  // Cachet "PAYÉ"
  doc.setFillColor(42, 157, 143);
  doc.circle(170, 70, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYÉ', 170, 72, { align: 'center' });

  // Signature
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature autorisée:', 14, 250);
  doc.line(14, 255, 80, 255);
  doc.text('E-Pilot Congo', 14, 262);

  doc.save(`recu_${payment.invoice_number || 'paiement'}.pdf`);
};

// =====================================================
// HELPERS
// =====================================================

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    completed: 'Complété',
    pending: 'En attente',
    overdue: 'En retard',
    failed: 'Échoué',
    refunded: 'Remboursé',
  };
  return labels[status] || status;
};
