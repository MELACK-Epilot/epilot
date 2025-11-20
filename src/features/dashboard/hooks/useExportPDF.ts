/**
 * Hook pour exporter les groupes scolaires en PDF
 * Utilise jsPDF pour générer des rapports imprimables
 * @module useExportPDF
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SchoolGroup } from '../types/dashboard.types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExportPDFOptions {
  title?: string;
  includeStats?: boolean;
  filters?: string;
}

export const useExportPDF = () => {
  return useMutation({
    mutationFn: async ({ 
      data, 
      options = {} 
    }: { 
      data: SchoolGroup[]; 
      options?: ExportPDFOptions 
    }) => {
      const { title = 'Groupes Scolaires', includeStats = true, filters } = options;

      // Créer le document PDF
      const doc = new jsPDF('landscape');
      
      // En-tête
      doc.setFontSize(18);
      doc.setTextColor(29, 53, 87); // Couleur E-Pilot
      doc.text(title, 14, 20);
      
      // Date et filtres
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
      if (filters) {
        doc.text(`Filtres: ${filters}`, 14, 34);
      }

      // Statistiques (si demandé)
      if (includeStats) {
        const stats = {
          total: data.length,
          actifs: data.filter(g => g.status === 'active').length,
          inactifs: data.filter(g => g.status === 'inactive').length,
          suspendus: data.filter(g => g.status === 'suspended').length,
        };

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const yPos = filters ? 42 : 36;
        doc.text(`Total: ${stats.total} | Actifs: ${stats.actifs} | Inactifs: ${stats.inactifs} | Suspendus: ${stats.suspendus}`, 14, yPos);
      }

      // Tableau des données
      const tableData = data.map(group => [
        group.code,
        group.name,
        group.region,
        group.city,
        group.adminName || 'Non assigné',
        group.plan || 'Gratuit',
        group.schoolCount || 0,
        group.status === 'active' ? 'Actif' : group.status === 'inactive' ? 'Inactif' : 'Suspendu',
      ]);

      (doc as any).autoTable({
        startY: includeStats ? (filters ? 48 : 42) : (filters ? 40 : 34),
        head: [['Code', 'Nom', 'Région', 'Ville', 'Administrateur', 'Plan', 'Écoles', 'Statut']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [29, 53, 87], // Couleur E-Pilot
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [249, 249, 249],
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Code
          1: { cellWidth: 50 }, // Nom
          2: { cellWidth: 35 }, // Région
          3: { cellWidth: 35 }, // Ville
          4: { cellWidth: 45 }, // Admin
          5: { cellWidth: 25 }, // Plan
          6: { cellWidth: 20, halign: 'center' }, // Écoles
          7: { cellWidth: 25 }, // Statut
        },
      });

      // Pied de page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} sur ${pageCount} - E-Pilot Congo`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Télécharger le PDF
      const filename = `groupes_scolaires_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      return { filename, count: data.length };
    },
    onSuccess: (result) => {
      toast.success('✅ Export PDF réussi', {
        description: `${result.count} groupe(s) exporté(s) dans ${result.filename}`,
      });
    },
    onError: (error) => {
      console.error('Erreur export PDF:', error);
      toast.error('❌ Erreur lors de l\'export PDF', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
