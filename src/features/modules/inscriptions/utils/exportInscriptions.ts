/**
 * Utilitaires d'export des inscriptions
 * Formats supportés : CSV, Excel, PDF
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Inscription } from '../types/inscriptions.types';

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return date;
  }
};

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '0 FCFA';
  return new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'en_attente': 'En attente',
    'validee': 'Validée',
    'refusee': 'Refusée',
    'brouillon': 'Brouillon',
    'pending': 'En attente',
    'validated': 'Validée',
    'rejected': 'Refusée',
    'enrolled': 'Inscrit(e)',
  };
  return labels[status] || status;
};

// ============================================================================
// EXPORT CSV
// ============================================================================

export const exportToCSV = (inscriptions: Inscription[], filename: string = 'inscriptions') => {
  // Headers
  const headers = [
    'N° Inscription',
    'Nom',
    'Prénom',
    'Date de naissance',
    'Sexe',
    'Niveau demandé',
    'Type',
    'Année académique',
    'Statut',
    'Frais inscription',
    'Frais scolarité',
    'Frais cantine',
    'Frais transport',
    'Total frais',
    'Montant payé',
    'Solde restant',
    'Parent 1 - Nom',
    'Parent 1 - Téléphone',
    'Parent 2 - Nom',
    'Parent 2 - Téléphone',
    'Téléphone élève',
    'Email élève',
    'Adresse',
    'Ville',
    'Date création',
  ];

  // Rows
  const rows = inscriptions.map(inscription => {
    const totalFrais = (inscription.fraisInscription || 0) + 
                       (inscription.fraisScolarite || 0) + 
                       (inscription.fraisCantine || 0) + 
                       (inscription.fraisTransport || 0);
    const soldeRestant = totalFrais - (inscription.montantPaye || 0);

    return [
      inscription.inscriptionNumber || '-',
      inscription.studentLastName || '-',
      inscription.studentFirstName || '-',
      formatDate(inscription.studentDateOfBirth),
      inscription.studentGender === 'M' ? 'Masculin' : inscription.studentGender === 'F' ? 'Féminin' : '-',
      inscription.requestedLevel || '-',
      inscription.typeInscription || 'Nouvelle',
      inscription.academicYear || '-',
      getStatusLabel(inscription.status),
      inscription.fraisInscription || 0,
      inscription.fraisScolarite || 0,
      inscription.fraisCantine || 0,
      inscription.fraisTransport || 0,
      totalFrais,
      inscription.montantPaye || 0,
      soldeRestant,
      inscription.parent1 ? `${inscription.parent1.firstName} ${inscription.parent1.lastName}` : '-',
      inscription.parent1?.phone || '-',
      inscription.parent2 ? `${inscription.parent2.firstName} ${inscription.parent2.lastName}` : '-',
      inscription.parent2?.phone || '-',
      inscription.studentPhone || '-',
      inscription.studentEmail || '-',
      inscription.address || '-',
      inscription.city || '-',
      formatDate(inscription.createdAt),
    ];
  });

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// EXPORT EXCEL
// ============================================================================

export const exportToExcel = async (inscriptions: Inscription[], filename: string = 'inscriptions') => {
  // Dynamically import xlsx
  const XLSX = await import('xlsx');

  // Prepare data
  const data = inscriptions.map(inscription => {
    const totalFrais = (inscription.fraisInscription || 0) + 
                       (inscription.fraisScolarite || 0) + 
                       (inscription.fraisCantine || 0) + 
                       (inscription.fraisTransport || 0);
    const soldeRestant = totalFrais - (inscription.montantPaye || 0);

    return {
      'N° Inscription': inscription.inscriptionNumber || '-',
      'Nom': inscription.studentLastName || '-',
      'Prénom': inscription.studentFirstName || '-',
      'Date de naissance': formatDate(inscription.studentDateOfBirth),
      'Sexe': inscription.studentGender === 'M' ? 'Masculin' : inscription.studentGender === 'F' ? 'Féminin' : '-',
      'Niveau demandé': inscription.requestedLevel || '-',
      'Type': inscription.typeInscription || 'Nouvelle',
      'Année académique': inscription.academicYear || '-',
      'Statut': getStatusLabel(inscription.status),
      'Frais inscription': inscription.fraisInscription || 0,
      'Frais scolarité': inscription.fraisScolarite || 0,
      'Frais cantine': inscription.fraisCantine || 0,
      'Frais transport': inscription.fraisTransport || 0,
      'Total frais': totalFrais,
      'Montant payé': inscription.montantPaye || 0,
      'Solde restant': soldeRestant,
      'Parent 1 - Nom': inscription.parent1 ? `${inscription.parent1.firstName} ${inscription.parent1.lastName}` : '-',
      'Parent 1 - Téléphone': inscription.parent1?.phone || '-',
      'Parent 2 - Nom': inscription.parent2 ? `${inscription.parent2.firstName} ${inscription.parent2.lastName}` : '-',
      'Parent 2 - Téléphone': inscription.parent2?.phone || '-',
      'Téléphone élève': inscription.studentPhone || '-',
      'Email élève': inscription.studentEmail || '-',
      'Adresse': inscription.address || '-',
      'Ville': inscription.city || '-',
      'Date création': formatDate(inscription.createdAt),
    };
  });

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(Math.max(key.length, 10), maxWidth)
  }));
  ws['!cols'] = colWidths;

  // Download
  XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
};

// ============================================================================
// EXPORT PDF
// ============================================================================

export const exportToPDF = async (inscriptions: Inscription[], filename: string = 'inscriptions') => {
  // Dynamically import jspdf and jspdf-autotable
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Liste des Inscriptions', 14, 15);

  // Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date d'export : ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 22);
  doc.text(`Total : ${inscriptions.length} inscription(s)`, 14, 27);

  // Table
  const tableData = inscriptions.map(inscription => {
    const totalFrais = (inscription.fraisInscription || 0) + 
                       (inscription.fraisScolarite || 0) + 
                       (inscription.fraisCantine || 0) + 
                       (inscription.fraisTransport || 0);
    const soldeRestant = totalFrais - (inscription.montantPaye || 0);

    return [
      inscription.inscriptionNumber || '-',
      `${inscription.studentFirstName} ${inscription.studentLastName}`,
      inscription.studentGender === 'M' ? 'M' : inscription.studentGender === 'F' ? 'F' : '-',
      inscription.requestedLevel || '-',
      inscription.typeInscription || 'Nouvelle',
      getStatusLabel(inscription.status),
      formatCurrency(totalFrais),
      formatCurrency(soldeRestant),
      formatDate(inscription.createdAt),
    ];
  });

  (doc as any).autoTable({
    startY: 32,
    head: [[
      'N°',
      'Élève',
      'Sexe',
      'Niveau',
      'Type',
      'Statut',
      'Total frais',
      'Solde',
      'Date',
    ]],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [42, 157, 143], // #2A9D8F
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 32, left: 14, right: 14 },
  });

  // Save
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
};

// ============================================================================
// EXPORT MULTI-FORMAT
// ============================================================================

export const exportInscriptions = async (
  inscriptions: Inscription[],
  format: 'csv' | 'excel' | 'pdf',
  filename: string = 'inscriptions'
) => {
  if (inscriptions.length === 0) {
    throw new Error('Aucune inscription à exporter');
  }

  switch (format) {
    case 'csv':
      exportToCSV(inscriptions, filename);
      break;
    case 'excel':
      await exportToExcel(inscriptions, filename);
      break;
    case 'pdf':
      await exportToPDF(inscriptions, filename);
      break;
    default:
      throw new Error(`Format non supporté : ${format}`);
  }
};
