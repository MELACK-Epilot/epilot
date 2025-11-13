/**
 * Hook personnalisé pour l'export de données Finances
 * Supporte CSV, PDF et Excel
 */

import { useCallback } from 'react';

export const useFinanceExport = () => {
  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (!data || data.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    // Récupérer les en-têtes
    const headers = Object.keys(data[0]);
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Échapper les virgules et guillemets
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const exportToPDF = useCallback((data: any[], filename: string) => {
    // TODO: Implémenter avec jsPDF
    console.log('Export PDF à implémenter', data, filename);
  }, []);

  const exportToExcel = useCallback((data: any[], filename: string) => {
    // TODO: Implémenter avec xlsx
    console.log('Export Excel à implémenter', data, filename);
  }, []);

  return { 
    exportToCSV, 
    exportToPDF, 
    exportToExcel 
  };
};
