/**
 * Utilitaires pour l'export Excel/CSV
 * Export des données financières en format Excel/CSV
 * 
 * @module excelExports
 * @description Fournit des fonctions pour exporter les données financières
 * en format CSV compatible Excel avec encodage UTF-8 BOM
 * 
 * @example
 * import { exportSchoolsToExcel } from '@/utils/excelExports';
 * 
 * exportSchoolsToExcel(schools, 'Mon Groupe Scolaire');
 */

interface SchoolFinancialData {
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
  profitMargin?: number;
  totalStudents?: number;
}

interface LevelFinancialData {
  level: string;
  nombreEleves: number;
  nombreClasses: number;
  revenusTotal: number;
  depensesTotal: number;
  revenusParEleve: number;
  tauxRecouvrement: number;
  montantRetards: number;
}

/**
 * Convertit un tableau de données en CSV
 */
const convertToCSV = (data: any[], headers: string[]): string => {
  const rows = [headers.join(',')];
  
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      // Échapper les virgules et guillemets
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    rows.push(values.join(','));
  });
  
  return rows.join('\n');
};

/**
 * Télécharge un fichier CSV
 */
const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporte les données financières des écoles en Excel/CSV
 * 
 * @param {SchoolFinancialData[]} schools - Liste des écoles avec leurs données financières
 * @param {string} groupName - Nom du groupe scolaire (défaut: 'Groupe')
 * 
 * @returns {void} Télécharge automatiquement le fichier CSV
 * 
 * @example
 * const schools = [
 *   { schoolName: 'École A', totalRevenue: 1000000, ... }
 * ];
 * exportSchoolsToExcel(schools, 'Groupe Excellence');
 * // Télécharge: finances_Groupe_Excellence_2025-11-06.csv
 */
export const exportSchoolsToExcel = (schools: SchoolFinancialData[], groupName: string = 'Groupe') => {
  const data = schools.map(school => ({
    'École': school.schoolName,
    'Revenus (FCFA)': school.totalRevenue.toFixed(2),
    'Dépenses (FCFA)': school.totalExpenses.toFixed(2),
    'Profit Net (FCFA)': school.netProfit.toFixed(2),
    'Marge (%)': school.profitMargin ? school.profitMargin.toFixed(2) : 'N/A',
    'Retards (FCFA)': school.overdueAmount.toFixed(2),
    'Taux Recouvrement (%)': school.recoveryRate.toFixed(2),
    'Élèves': school.totalStudents || 'N/A',
  }));

  const headers = ['École', 'Revenus (FCFA)', 'Dépenses (FCFA)', 'Profit Net (FCFA)', 'Marge (%)', 'Retards (FCFA)', 'Taux Recouvrement (%)', 'Élèves'];
  const csv = convertToCSV(data, headers);
  const filename = `finances_${groupName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csv, filename);
};

/**
 * Exporte les données financières d'une école en Excel/CSV
 */
export const exportSchoolDetailsToExcel = (
  schoolName: string,
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    overdueAmount: number;
    recoveryRate: number;
  },
  levels?: LevelFinancialData[]
) => {
  // Données globales de l'école
  const schoolData = [{
    'Métrique': 'Revenus Totaux',
    'Valeur (FCFA)': stats.totalRevenue.toFixed(2),
  }, {
    'Métrique': 'Dépenses Totales',
    'Valeur (FCFA)': stats.totalExpenses.toFixed(2),
  }, {
    'Métrique': 'Profit Net',
    'Valeur (FCFA)': stats.netProfit.toFixed(2),
  }, {
    'Métrique': 'Retards',
    'Valeur (FCFA)': stats.overdueAmount.toFixed(2),
  }, {
    'Métrique': 'Taux Recouvrement',
    'Valeur (%)': stats.recoveryRate.toFixed(2),
  }];

  let csvContent = `Rapport Financier - ${schoolName}\n`;
  csvContent += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
  csvContent += `=== DONNÉES GLOBALES ===\n`;
  csvContent += convertToCSV(schoolData, ['Métrique', 'Valeur (FCFA)', 'Valeur (%)']);

  // Données par niveau si disponibles
  if (levels && levels.length > 0) {
    const levelData = levels.map(level => ({
      'Niveau': level.level,
      'Élèves': level.nombreEleves,
      'Classes': level.nombreClasses,
      'Revenus (FCFA)': level.revenusTotal.toFixed(2),
      'Dépenses (FCFA)': level.depensesTotal.toFixed(2),
      'Rev/Élève (FCFA)': level.revenusParEleve.toFixed(2),
      'Recouvrement (%)': level.tauxRecouvrement.toFixed(2),
      'Retards (FCFA)': level.montantRetards.toFixed(2),
    }));

    csvContent += `\n\n=== DONNÉES PAR NIVEAU ===\n`;
    csvContent += convertToCSV(levelData, ['Niveau', 'Élèves', 'Classes', 'Revenus (FCFA)', 'Dépenses (FCFA)', 'Rev/Élève (FCFA)', 'Recouvrement (%)', 'Retards (FCFA)']);
  }

  const filename = `finances_${schoolName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Exporte les données de comparaison N vs N-1 en Excel/CSV
 */
export const exportComparisonToExcel = (
  currentStats: any,
  previousStats: any,
  groupName: string = 'Groupe'
) => {
  const data = [{
    'Métrique': 'Revenus Totaux',
    'Année N (FCFA)': currentStats.totalRevenue.toFixed(2),
    'Année N-1 (FCFA)': previousStats.totalRevenue.toFixed(2),
    'Évolution (%)': (((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100).toFixed(2),
  }, {
    'Métrique': 'Dépenses Totales',
    'Année N (FCFA)': currentStats.totalExpenses.toFixed(2),
    'Année N-1 (FCFA)': previousStats.totalExpenses.toFixed(2),
    'Évolution (%)': (((currentStats.totalExpenses - previousStats.totalExpenses) / previousStats.totalExpenses) * 100).toFixed(2),
  }, {
    'Métrique': 'Profit Net',
    'Année N (FCFA)': (currentStats.totalRevenue - currentStats.totalExpenses).toFixed(2),
    'Année N-1 (FCFA)': (previousStats.totalRevenue - previousStats.totalExpenses).toFixed(2),
    'Évolution (%)': (((currentStats.totalRevenue - currentStats.totalExpenses - (previousStats.totalRevenue - previousStats.totalExpenses)) / (previousStats.totalRevenue - previousStats.totalExpenses)) * 100).toFixed(2),
  }, {
    'Métrique': 'Marge Bénéficiaire',
    'Année N (%)': currentStats.profitMargin.toFixed(2),
    'Année N-1 (%)': previousStats.profitMargin.toFixed(2),
    'Évolution (pts)': (currentStats.profitMargin - previousStats.profitMargin).toFixed(2),
  }];

  const headers = ['Métrique', 'Année N (FCFA)', 'Année N-1 (FCFA)', 'Évolution (%)', 'Année N (%)', 'Année N-1 (%)', 'Évolution (pts)'];
  const csv = convertToCSV(data, headers);
  const filename = `comparaison_${groupName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csv, filename);
};
