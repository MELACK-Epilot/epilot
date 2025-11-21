/**
 * Composant Export Dashboard
 * Permet d'exporter les données du dashboard en PDF ou Excel
 */

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardStats {
  totalSchoolGroups?: number;
  activeUsers?: number;
  estimatedMRR?: number;
  criticalSubscriptions?: number;
  trends: {
    schoolGroups?: number;
    users?: number;
    mrr?: number;
    subscriptions?: number;
  };
}

interface AIInsight {
  type: string;
  title: string;
  description: string;
  trend?: number;
  color: string;
}

interface ExportButtonProps {
  stats?: DashboardStats;
  insights?: AIInsight[];
}

export const ExportButton = ({ stats, insights }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!stats) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header avec logo et titre
      doc.setFontSize(24);
      doc.setTextColor(29, 53, 87); // #1D3557
      doc.text('Dashboard E-Pilot', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Super Admin - Vue d\'ensemble', 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 14, 35);
      
      // Ligne de séparation
      doc.setDrawColor(42, 157, 143); // #2A9D8F
      doc.setLineWidth(0.5);
      doc.line(14, 40, 196, 40);
      
      // Section KPI
      doc.setFontSize(16);
      doc.setTextColor(29, 53, 87);
      doc.text('📊 Indicateurs Clés de Performance', 14, 50);
      
      autoTable(doc, {
        startY: 55,
        head: [['Indicateur', 'Valeur', 'Tendance', 'Évolution']],
        body: [
          [
            'Groupes Scolaires',
            (stats.totalSchoolGroups || 0).toString(),
            `${stats.trends.schoolGroups || 0}%`,
            stats.trends.schoolGroups && stats.trends.schoolGroups >= 0 ? '↑' : '↓'
          ],
          [
            'Utilisateurs Actifs',
            (stats.activeUsers || 0).toLocaleString(),
            `${stats.trends.users || 0}%`,
            stats.trends.users && stats.trends.users >= 0 ? '↑' : '↓'
          ],
          [
            'MRR Estimé',
            `${((stats.estimatedMRR || 0) / 1000000).toFixed(2)}M FCFA`,
            `${stats.trends.mrr || 0}%`,
            stats.trends.mrr && stats.trends.mrr >= 0 ? '↑' : '↓'
          ],
          [
            'Abonnements Critiques',
            (stats.criticalSubscriptions || 0).toString(),
            `${stats.trends.subscriptions || 0}%`,
            stats.trends.subscriptions && stats.trends.subscriptions >= 0 ? '↑' : '↓'
          ],
        ],
        headStyles: {
          fillColor: [42, 157, 143], // #2A9D8F
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
      });
      
      // Section Insights IA (si disponibles)
      if (insights && insights.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        
        doc.setFontSize(16);
        doc.setTextColor(29, 53, 87);
        doc.text('🤖 Insights & Recommandations IA', 14, finalY);
        
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Type', 'Titre', 'Description']],
          body: insights.slice(0, 6).map(insight => [
            insight.type === 'alert' ? '⚠️ Alerte' : '💡 Insight',
            insight.title,
            insight.description.substring(0, 80) + (insight.description.length > 80 ? '...' : ''),
          ]),
          headStyles: {
            fillColor: [233, 196, 106], // #E9C46A
            textColor: [29, 53, 87],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [252, 250, 245],
          },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
        });
      }
      
      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `E-Pilot Congo-Brazzaville | Page ${i} sur ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Télécharger
      const fileName = `dashboard-super-admin-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('✅ Export PDF réussi', {
        description: `Le fichier ${fileName} a été téléchargé`,
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('❌ Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!stats) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    try {
      // Créer workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: KPI
      const kpiData = [
        ['📊 INDICATEURS CLÉS DE PERFORMANCE'],
        [''],
        ['Indicateur', 'Valeur', 'Tendance (%)', 'Évolution'],
        ['Groupes Scolaires', stats.totalSchoolGroups || 0, stats.trends.schoolGroups || 0, stats.trends.schoolGroups && stats.trends.schoolGroups >= 0 ? '↑' : '↓'],
        ['Utilisateurs Actifs', stats.activeUsers || 0, stats.trends.users || 0, stats.trends.users && stats.trends.users >= 0 ? '↑' : '↓'],
        ['MRR Estimé (FCFA)', stats.estimatedMRR || 0, stats.trends.mrr || 0, stats.trends.mrr && stats.trends.mrr >= 0 ? '↑' : '↓'],
        ['Abonnements Critiques', stats.criticalSubscriptions || 0, stats.trends.subscriptions || 0, stats.trends.subscriptions && stats.trends.subscriptions >= 0 ? '↑' : '↓'],
        [''],
        ['Généré le', new Date().toLocaleString('fr-FR')],
      ];
      const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
      
      // Largeur des colonnes
      wsKPI['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
      ];
      
      XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI');
      
      // Sheet 2: Insights IA
      if (insights && insights.length > 0) {
        const insightsData = [
          ['🤖 INSIGHTS & RECOMMANDATIONS IA'],
          [''],
          ['Type', 'Titre', 'Description', 'Tendance (%)'],
          ...insights.map(i => [
            i.type === 'alert' ? 'Alerte' : 'Insight',
            i.title,
            i.description,
            i.trend || 0
          ]),
        ];
        const wsInsights = XLSX.utils.aoa_to_sheet(insightsData);
        
        wsInsights['!cols'] = [
          { wch: 12 },
          { wch: 30 },
          { wch: 60 },
          { wch: 12 },
        ];
        
        XLSX.utils.book_append_sheet(wb, wsInsights, 'Insights IA');
      }
      
      // Sheet 3: Métadonnées
      const metaData = [
        ['📋 MÉTADONNÉES DU RAPPORT'],
        [''],
        ['Rapport', 'Dashboard Super Admin E-Pilot'],
        ['Date de génération', new Date().toLocaleString('fr-FR')],
        ['Période', 'Temps réel'],
        ['Plateforme', 'E-Pilot Congo-Brazzaville'],
        ['Type', 'Export automatique'],
        ['Format', 'Microsoft Excel (.xlsx)'],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet(metaData);
      
      wsMeta['!cols'] = [
        { wch: 25 },
        { wch: 40 },
      ];
      
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Métadonnées');
      
      // Télécharger
      const fileName = `dashboard-super-admin-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('✅ Export Excel réussi', {
        description: `Le fichier ${fileName} a été téléchargé`,
      });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('❌ Erreur lors de l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={isExporting || !stats}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Exporter
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handleExportPDF} 
          className="gap-2 cursor-pointer"
          disabled={isExporting}
        >
          <FileText className="w-4 h-4" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportExcel} 
          className="gap-2 cursor-pointer"
          disabled={isExporting}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exporter en Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
