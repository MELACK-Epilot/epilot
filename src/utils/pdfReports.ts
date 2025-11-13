/**
 * Générateur de rapports PDF financiers
 * Utilise jsPDF et jspdf-autotable
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GroupFinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalOverdue: number;
  globalRecoveryRate: number;
  totalSchools: number;
}

interface SchoolSummary {
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
}

const formatCurrency = (amount: number): string => {
  return `${(amount / 1000000).toFixed(2)}M FCFA`;
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Génère un rapport financier mensuel en PDF
 */
export const generateMonthlyReport = (
  groupName: string,
  stats: GroupFinancialStats,
  schools: SchoolSummary[]
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(29, 53, 87); // #1D3557
  doc.text('RAPPORT FINANCIER MENSUEL', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(groupName, pageWidth / 2, 28, { align: 'center' });
  doc.text(
    `Généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`,
    pageWidth / 2,
    35,
    { align: 'center' }
  );

  // Ligne de séparation
  doc.setDrawColor(42, 157, 143); // #2A9D8F
  doc.setLineWidth(0.5);
  doc.line(20, 40, pageWidth - 20, 40);

  // Section 1 : Indicateurs Clés
  doc.setFontSize(16);
  doc.setTextColor(29, 53, 87);
  doc.text('📊 Indicateurs Clés', 20, 50);

  autoTable(doc, {
    startY: 55,
    head: [['Indicateur', 'Valeur', 'Évolution']],
    body: [
      ['Revenus Totaux', formatCurrency(stats.totalRevenue), '-'],
      ['Dépenses Totales', formatCurrency(stats.totalExpenses), '-'],
      ['Solde Net', formatCurrency(stats.netProfit), '-'],
      ['Marge Bénéficiaire', formatPercentage(stats.profitMargin), '-'],
      ['Retards de Paiement', formatCurrency(stats.totalOverdue), '-'],
      ['Taux de Recouvrement', formatPercentage(stats.globalRecoveryRate), '-'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [42, 157, 143], // #2A9D8F
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Section 2 : Détails par École
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(29, 53, 87);
  doc.text(`🏫 Détails par École (${stats.totalSchools} écoles)`, 20, 20);

  autoTable(doc, {
    startY: 25,
    head: [['École', 'Revenus', 'Dépenses', 'Solde', 'Marge', 'Retards', 'Taux Recouv.']],
    body: schools.map((school) => {
      const margin = school.totalRevenue > 0
        ? ((school.netProfit / school.totalRevenue) * 100)
        : 0;

      return [
        school.schoolName,
        formatCurrency(school.totalRevenue),
        formatCurrency(school.totalExpenses),
        formatCurrency(school.netProfit),
        formatPercentage(margin),
        formatCurrency(school.overdueAmount),
        formatPercentage(school.recoveryRate),
      ];
    }),
    theme: 'striped',
    headStyles: {
      fillColor: [42, 157, 143],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    didParseCell: (data) => {
      // Colorer le solde en vert/rouge
      if (data.column.index === 3 && data.section === 'body') {
        const value = schools[data.row.index].netProfit;
        if (value >= 0) {
          data.cell.styles.textColor = [42, 157, 143]; // Vert
        } else {
          data.cell.styles.textColor = [230, 57, 70]; // Rouge
        }
      }
    },
  });

  // Ligne TOTAL
  const totalRevenue = schools.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalExpenses = schools.reduce((sum, s) => sum + s.totalExpenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalOverdue = schools.reduce((sum, s) => sum + s.overdueAmount, 0);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    body: [[
      'TOTAL',
      formatCurrency(totalRevenue),
      formatCurrency(totalExpenses),
      formatCurrency(totalProfit),
      formatPercentage(totalMargin),
      formatCurrency(totalOverdue),
      formatPercentage(stats.globalRecoveryRate),
    ]],
    theme: 'plain',
    styles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold',
      textColor: [29, 53, 87],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });

  // Section 3 : Recommandations
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(29, 53, 87);
  doc.text('💡 Recommandations', 20, 20);

  let yPos = 30;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  // Recommandation 1 : Retards
  if (stats.totalOverdue > stats.totalRevenue * 0.15) {
    doc.setTextColor(230, 57, 70);
    doc.text('⚠️ URGENT : Retards de paiement élevés', 20, yPos);
    yPos += 7;
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Les retards (${formatCurrency(stats.totalOverdue)}) représentent plus de 15% des revenus.`,
      25,
      yPos
    );
    yPos += 5;
    doc.text('Actions recommandées :', 25, yPos);
    yPos += 5;
    doc.text('• Relancer les 20 plus gros débiteurs', 30, yPos);
    yPos += 5;
    doc.text('• Mettre en place des plans de paiement', 30, yPos);
    yPos += 5;
    doc.text('• Suspendre les services non essentiels pour les retards > 3 mois', 30, yPos);
    yPos += 10;
  }

  // Recommandation 2 : Marge
  if (stats.profitMargin < 15) {
    doc.setTextColor(255, 165, 0);
    doc.text('⚠️ Marge bénéficiaire faible', 20, yPos);
    yPos += 7;
    doc.setTextColor(60, 60, 60);
    doc.text(`Marge actuelle : ${formatPercentage(stats.profitMargin)} (objectif : 15%)`, 25, yPos);
    yPos += 5;
    doc.text('Actions recommandées :', 25, yPos);
    yPos += 5;
    doc.text('• Analyser les dépenses non essentielles', 30, yPos);
    yPos += 5;
    doc.text('• Réviser les frais de scolarité (+5% acceptable)', 30, yPos);
    yPos += 5;
    doc.text('• Négocier avec les fournisseurs', 30, yPos);
    yPos += 10;
  }

  // Recommandation 3 : Recouvrement
  if (stats.globalRecoveryRate < 80) {
    doc.setTextColor(255, 165, 0);
    doc.text('⚠️ Taux de recouvrement à améliorer', 20, yPos);
    yPos += 7;
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Taux actuel : ${formatPercentage(stats.globalRecoveryRate)} (objectif : 80%)`,
      25,
      yPos
    );
    yPos += 5;
    doc.text('Actions recommandées :', 25, yPos);
    yPos += 5;
    doc.text('• Intensifier les relances téléphoniques', 30, yPos);
    yPos += 5;
    doc.text('• Proposer des facilités de paiement', 30, yPos);
    yPos += 5;
    doc.text('• Rencontrer les familles en difficulté', 30, yPos);
  }

  // Pied de page sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount} - e-pilot © ${new Date().getFullYear()}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Sauvegarder
  const fileName = `rapport-financier-${format(new Date(), 'yyyy-MM')}.pdf`;
  doc.save(fileName);
};

/**
 * Génère un rapport d'alertes en PDF
 */
export const generateAlertsReport = (
  groupName: string,
  alerts: any[]
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(230, 57, 70);
  doc.text('🚨 RAPPORT D\'ALERTES FINANCIÈRES', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(groupName, pageWidth / 2, 28, { align: 'center' });
  doc.text(
    `Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`,
    pageWidth / 2,
    35,
    { align: 'center' }
  );

  // Alertes
  autoTable(doc, {
    startY: 45,
    head: [['Type', 'Titre', 'Message', 'Sévérité']],
    body: alerts.map((alert) => [
      alert.alertType === 'critical' ? '🔴 Critique' : '🟠 Warning',
      alert.title,
      alert.message,
      `${alert.severity}/5`,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [230, 57, 70],
      textColor: [255, 255, 255],
    },
  });

  doc.save(`alertes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
