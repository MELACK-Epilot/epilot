/**
 * Utilitaires pour l'export de rapports
 * PDF, Excel, CSV
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DashboardKPIs, SchoolLevel } from '../hooks/useDirectorDashboard';

type ReportType = 'global' | 'academic' | 'financial' | 'personnel' | 'students';
type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

interface ReportData {
  type: ReportType;
  period: ReportPeriod;
  globalKPIs: DashboardKPIs;
  schoolLevels: SchoolLevel[];
}

/**
 * Génère et télécharge un rapport PDF
 */
export const generatePDF = (data: ReportData) => {
  const doc = new jsPDF();
  
  const reportTitles = {
    global: 'Rapport Global',
    academic: 'Rapport Académique',
    financial: 'Rapport Financier',
    personnel: 'Rapport Personnel',
    students: 'Rapport Élèves',
  };

  const periodNames = {
    week: 'Hebdomadaire',
    month: 'Mensuel',
    quarter: 'Trimestriel',
    year: 'Annuel',
  };

  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(42, 157, 143); // Couleur E-Pilot
  doc.text(reportTitles[data.type], 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Période: ${periodNames[data.period]}`, 20, 30);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 37);
  
  // Ligne de séparation
  doc.setDrawColor(42, 157, 143);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  let yPos = 50;

  // Contenu selon le type
  if (data.type === 'global') {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Vue d\'Ensemble', 20, yPos);
    yPos += 10;

    const globalData = [
      ['Élèves', data.globalKPIs.totalStudents.toString()],
      ['Classes', data.globalKPIs.totalClasses.toString()],
      ['Enseignants', data.globalKPIs.totalTeachers.toString()],
      ['Taux de Réussite', `${data.globalKPIs.averageSuccessRate}%`],
      ['Revenus', `${data.globalKPIs.totalRevenue.toLocaleString()} FCFA`],
      ['Croissance', `+${data.globalKPIs.monthlyGrowth}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: globalData,
      theme: 'grid',
      headStyles: { fillColor: [42, 157, 143] },
    });
  }

  if (data.type === 'academic') {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Performances Académiques', 20, yPos);
    yPos += 10;

    const academicData = [
      ['Taux de Réussite Global', `${data.globalKPIs.averageSuccessRate}%`],
      ['Nombre de Niveaux', data.schoolLevels.length.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: academicData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }, // Vert
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text('Détails par Niveau', 20, yPos);
    yPos += 5;

    const levelsData = data.schoolLevels.map(level => [
      level.name,
      level.students_count.toString(),
      level.classes_count.toString(),
      `${level.success_rate}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Niveau', 'Élèves', 'Classes', 'Taux Réussite']],
      body: levelsData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
    });
  }

  if (data.type === 'financial') {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Situation Financière', 20, yPos);
    yPos += 10;

    const financialData = [
      ['Revenus Totaux', `${data.globalKPIs.totalRevenue.toLocaleString()} FCFA`],
      ['Croissance Mensuelle', `+${data.globalKPIs.monthlyGrowth}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: financialData,
      theme: 'grid',
      headStyles: { fillColor: [234, 179, 8] }, // Jaune
    });
  }

  if (data.type === 'personnel') {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Effectifs Personnel', 20, yPos);
    yPos += 10;

    const personnelData = [
      ['Total Enseignants', data.globalKPIs.totalTeachers.toString()],
      ['Ratio Élèves/Prof', `${Math.round(data.globalKPIs.totalStudents / data.globalKPIs.totalTeachers)}:1`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: personnelData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] }, // Violet
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text('Répartition par Niveau', 20, yPos);
    yPos += 5;

    const levelsData = data.schoolLevels.map(level => [
      level.name,
      level.teachers_count.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Niveau', 'Enseignants']],
      body: levelsData,
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
    });
  }

  if (data.type === 'students') {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Effectifs Élèves', 20, yPos);
    yPos += 10;

    const studentsData = [
      ['Total Élèves', data.globalKPIs.totalStudents.toString()],
      ['Moyenne par Classe', Math.round(data.globalKPIs.totalStudents / data.globalKPIs.totalClasses).toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: studentsData,
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] }, // Teal
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text('Répartition par Niveau', 20, yPos);
    yPos += 5;

    const levelsData = data.schoolLevels.map(level => [
      level.name,
      level.students_count.toString(),
      level.classes_count.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Niveau', 'Élèves', 'Classes']],
      body: levelsData,
      theme: 'striped',
      headStyles: { fillColor: [20, 184, 166] },
    });
  }

  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Télécharger
  const fileName = `rapport-${data.type}-${data.period}-${Date.now()}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

/**
 * Génère et télécharge un rapport Excel
 */
export const generateExcel = (data: ReportData) => {
  const reportTitles = {
    global: 'Rapport Global',
    academic: 'Rapport Académique',
    financial: 'Rapport Financier',
    personnel: 'Rapport Personnel',
    students: 'Rapport Élèves',
  };

  const periodNames = {
    week: 'Hebdomadaire',
    month: 'Mensuel',
    quarter: 'Trimestriel',
    year: 'Annuel',
  };

  // Créer un nouveau classeur
  const wb = XLSX.utils.book_new();

  // Feuille 1: Résumé
  const summaryData = [
    ['Rapport', reportTitles[data.type]],
    ['Période', periodNames[data.period]],
    ['Date de génération', new Date().toLocaleDateString('fr-FR')],
    [''],
    ['Indicateurs Globaux', ''],
    ['Élèves', data.globalKPIs.totalStudents],
    ['Classes', data.globalKPIs.totalClasses],
    ['Enseignants', data.globalKPIs.totalTeachers],
    ['Taux de Réussite', `${data.globalKPIs.averageSuccessRate}%`],
    ['Revenus', `${data.globalKPIs.totalRevenue} FCFA`],
    ['Croissance', `${data.globalKPIs.monthlyGrowth}%`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  // Feuille 2: Détails par niveau
  const levelsData = [
    ['Niveau', 'Élèves', 'Classes', 'Enseignants', 'Taux Réussite'],
    ...data.schoolLevels.map(level => [
      level.name,
      level.students_count,
      level.classes_count,
      level.teachers_count,
      `${level.success_rate}%`,
    ]),
  ];

  const wsLevels = XLSX.utils.aoa_to_sheet(levelsData);
  XLSX.utils.book_append_sheet(wb, wsLevels, 'Niveaux');

  // Télécharger
  const fileName = `rapport-${data.type}-${data.period}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return fileName;
};

/**
 * Génère et télécharge un rapport CSV
 */
export const generateCSV = (data: ReportData) => {
  const csvData = [
    ['Indicateur', 'Valeur'],
    ['Type de rapport', data.type],
    ['Période', data.period],
    ['Date', new Date().toLocaleDateString('fr-FR')],
    [''],
    ['Élèves', data.globalKPIs.totalStudents],
    ['Classes', data.globalKPIs.totalClasses],
    ['Enseignants', data.globalKPIs.totalTeachers],
    ['Taux de Réussite', `${data.globalKPIs.averageSuccessRate}%`],
    ['Revenus', `${data.globalKPIs.totalRevenue} FCFA`],
    ['Croissance', `${data.globalKPIs.monthlyGrowth}%`],
    [''],
    ['Niveau', 'Élèves', 'Classes', 'Enseignants', 'Taux Réussite'],
    ...data.schoolLevels.map(level => [
      level.name,
      level.students_count,
      level.classes_count,
      level.teachers_count,
      `${level.success_rate}%`,
    ]),
  ];

  const csv = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `rapport-${data.type}-${data.period}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return `rapport-${data.type}-${data.period}-${Date.now()}.csv`;
};
