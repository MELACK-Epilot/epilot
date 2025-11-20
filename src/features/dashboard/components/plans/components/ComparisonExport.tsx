/**
 * Boutons d'export pour le tableau comparatif
 */

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportPlansToExcel, exportPlansToPDF } from '../../../utils/comparison-utils';
import type { PlanWithContent } from '../../../hooks/usePlanWithContent';
import { toast } from 'sonner';

interface ComparisonExportProps {
  plans: PlanWithContent[];
}

export const ComparisonExport = ({ plans }: ComparisonExportProps) => {
  const handleExportExcel = () => {
    try {
      exportPlansToExcel(plans);
      toast.success('Export Excel réussi', {
        description: `${plans.length} plans exportés`,
      });
    } catch (error) {
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      exportPlansToPDF(plans);
      toast.success('Export PDF en cours', {
        description: 'La fenêtre d\'impression va s\'ouvrir',
      });
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          <div>
            <div className="font-medium">Excel (CSV)</div>
            <div className="text-xs text-slate-500">Tableau complet</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          <div>
            <div className="font-medium">PDF</div>
            <div className="text-xs text-slate-500">Version imprimable</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
