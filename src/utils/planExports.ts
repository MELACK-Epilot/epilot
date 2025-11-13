/**
 * Utilitaires d'export avancés pour les plans
 * Export Excel, PDF, CSV avec données complètes
 * @module planExports
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportPlanData {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingPeriod: string;
  maxSchools: number;
  maxStudents: number;
  maxStaff: number;
  maxStorage: number;
  supportLevel: string;
  customBranding: boolean;
  apiAccess: boolean;
  isPopular: boolean;
  activeSubscriptions?: number;
  monthlyRevenue?: number;
  churnRate?: number;
  categories?: Array<{ name: string }>;
  modules?: Array<{ name: string; is_premium: boolean }>;
}

/**
 * Export des plans en Excel avec formatage avancé
 */
export const exportPlansToExcel = (plans: ExportPlanData[], includeAnalytics: boolean = false) => {
  const workbook = XLSX.utils.book_new();

  // Feuille 1 : Informations générales
  const generalData = plans.map(plan => ({
    'Nom': plan.name,
    'Type': plan.slug,
    'Prix': plan.price,
    'Devise': plan.currency,
    'Période': plan.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel',
    'Écoles max': plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools,
    'Élèves max': plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents,
    'Personnel max': plan.maxStaff === -1 ? 'Illimité' : plan.maxStaff,
    'Stockage (GB)': plan.maxStorage,
    'Support': plan.supportLevel,
    'Branding': plan.customBranding ? 'Oui' : 'Non',
    'API': plan.apiAccess ? 'Oui' : 'Non',
    'Populaire': plan.isPopular ? 'Oui' : 'Non',
  }));

  const generalSheet = XLSX.utils.json_to_sheet(generalData);
  XLSX.utils.book_append_sheet(workbook, generalSheet, 'Plans');

  // Feuille 2 : Analytics (si demandé)
  if (includeAnalytics) {
    const analyticsData = plans
      .filter(plan => plan.activeSubscriptions !== undefined)
      .map(plan => ({
        'Plan': plan.name,
        'Abonnements actifs': plan.activeSubscriptions || 0,
        'Revenus mensuels (FCFA)': plan.monthlyRevenue || 0,
        'Taux de churn (%)': plan.churnRate || 0,
        'ARPU (FCFA)': plan.activeSubscriptions && plan.monthlyRevenue 
          ? Math.round(plan.monthlyRevenue / plan.activeSubscriptions)
          : 0,
      }));

    if (analyticsData.length > 0) {
      const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
      XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
    }
  }

  // Feuille 3 : Modules par plan
  const modulesData: any[] = [];
  plans.forEach(plan => {
    if (plan.modules && plan.modules.length > 0) {
      plan.modules.forEach(module => {
        modulesData.push({
          'Plan': plan.name,
          'Module': module.name,
          'Type': module.is_premium ? 'Premium' : 'Standard',
        });
      });
    }
  });

  if (modulesData.length > 0) {
    const modulesSheet = XLSX.utils.json_to_sheet(modulesData);
    XLSX.utils.book_append_sheet(workbook, modulesSheet, 'Modules');
  }

  // Feuille 4 : Catégories par plan
  const categoriesData: any[] = [];
  plans.forEach(plan => {
    if (plan.categories && plan.categories.length > 0) {
      plan.categories.forEach(category => {
        categoriesData.push({
          'Plan': plan.name,
          'Catégorie': category.name,
        });
      });
    }
  });

  if (categoriesData.length > 0) {
    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Catégories');
  }

  // Télécharger le fichier
  const fileName = `plans_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export des plans en PDF avec design professionnel
 */
export const exportPlansToPDF = (plans: ExportPlanData[], includeAnalytics: boolean = false) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(29, 53, 87); // #1D3557
  doc.text('Plans & Tarification', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: 'center' });

  // Tableau des plans
  const tableData = plans.map(plan => [
    plan.name,
    `${plan.price.toLocaleString()} ${plan.currency}`,
    plan.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel',
    plan.maxSchools === -1 ? '∞' : plan.maxSchools.toString(),
    plan.maxStudents === -1 ? '∞' : plan.maxStudents.toLocaleString(),
    plan.supportLevel,
    plan.customBranding ? '✓' : '✗',
    plan.apiAccess ? '✓' : '✗',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Plan', 'Prix', 'Période', 'Écoles', 'Élèves', 'Support', 'Branding', 'API']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [29, 53, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Analytics (si demandé)
  if (includeAnalytics) {
    const analyticsPlans = plans.filter(p => p.activeSubscriptions !== undefined);
    
    if (analyticsPlans.length > 0) {
      doc.addPage();
      
      doc.setFontSize(16);
      doc.setTextColor(29, 53, 87);
      doc.text('Analytics des Plans', 14, 20);

      const analyticsData = analyticsPlans.map(plan => [
        plan.name,
        (plan.activeSubscriptions || 0).toString(),
        `${(plan.monthlyRevenue || 0).toLocaleString()} FCFA`,
        `${(plan.churnRate || 0).toFixed(1)}%`,
        plan.activeSubscriptions && plan.monthlyRevenue
          ? `${Math.round(plan.monthlyRevenue / plan.activeSubscriptions).toLocaleString()} FCFA`
          : '0 FCFA',
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Plan', 'Abonnements', 'MRR', 'Churn', 'ARPU']],
        body: analyticsData,
        theme: 'grid',
        headStyles: {
          fillColor: [42, 157, 143],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
      });
    }
  }

  // Modules et catégories
  const plansWithContent = plans.filter(p => 
    (p.modules && p.modules.length > 0) || (p.categories && p.categories.length > 0)
  );

  if (plansWithContent.length > 0) {
    doc.addPage();
    
    doc.setFontSize(16);
    doc.setTextColor(29, 53, 87);
    doc.text('Modules & Catégories', 14, 20);

    let currentY = 30;

    plansWithContent.forEach(plan => {
      // Vérifier si on a besoin d'une nouvelle page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(42, 157, 143);
      doc.text(plan.name, 14, currentY);
      currentY += 8;

      // Catégories
      if (plan.categories && plan.categories.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Catégories:', 14, currentY);
        currentY += 6;

        doc.setFontSize(9);
        plan.categories.forEach(cat => {
          doc.text(`• ${cat.name}`, 20, currentY);
          currentY += 5;
        });
        currentY += 3;
      }

      // Modules
      if (plan.modules && plan.modules.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Modules:', 14, currentY);
        currentY += 6;

        doc.setFontSize(9);
        plan.modules.forEach(mod => {
          const badge = mod.is_premium ? ' [Premium]' : '';
          doc.text(`• ${mod.name}${badge}`, 20, currentY);
          currentY += 5;
        });
        currentY += 5;
      }
    });
  }

  // Pied de page sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Télécharger le PDF
  const fileName = `plans_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Export des plans en CSV simple
 */
export const exportPlansToCSV = (plans: ExportPlanData[]) => {
  const headers = [
    'Nom',
    'Type',
    'Prix',
    'Devise',
    'Période',
    'Écoles max',
    'Élèves max',
    'Personnel max',
    'Stockage (GB)',
    'Support',
    'Branding',
    'API',
    'Populaire',
    'Abonnements actifs',
    'Revenus mensuels',
    'Taux de churn',
  ];

  const rows = plans.map(plan => [
    plan.name,
    plan.slug,
    plan.price,
    plan.currency,
    plan.billingPeriod,
    plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools,
    plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents,
    plan.maxStaff === -1 ? 'Illimité' : plan.maxStaff,
    plan.maxStorage,
    plan.supportLevel,
    plan.customBranding ? 'Oui' : 'Non',
    plan.apiAccess ? 'Oui' : 'Non',
    plan.isPopular ? 'Oui' : 'Non',
    plan.activeSubscriptions || '',
    plan.monthlyRevenue || '',
    plan.churnRate || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Télécharger le CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `plans_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
