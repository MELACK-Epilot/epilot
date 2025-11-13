/**
 * Bouton d'export PDF avec menu déroulant
 */

import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateMonthlyReport, generateAlertsReport } from '@/utils/pdfReports';
import { toast } from 'sonner';

interface ExportPDFButtonProps {
  groupName: string;
  stats: any;
  schools: any[];
  alerts: any[];
}

export const ExportPDFButton = ({ groupName, stats, schools, alerts }: ExportPDFButtonProps) => {
  const handleMonthlyReport = () => {
    try {
      generateMonthlyReport(groupName, stats, schools);
      toast.success('Rapport mensuel généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
      console.error(error);
    }
  };

  const handleAlertsReport = () => {
    try {
      generateAlertsReport(groupName, alerts);
      toast.success('Rapport d\'alertes généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Download className="w-4 h-4" />
          Exporter PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleMonthlyReport} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          Rapport Mensuel Complet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAlertsReport} className="gap-2 cursor-pointer">
          <AlertCircle className="w-4 h-4" />
          Rapport d'Alertes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
