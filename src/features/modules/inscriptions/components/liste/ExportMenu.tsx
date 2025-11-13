/**
 * Menu d'export avec options CSV, Excel, PDF
 * Correction: Fragment ajouté pour résoudre React.Children.only
 */

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { exportInscriptions } from '../../utils/exportInscriptions';
import type { Inscription } from '../../types/inscriptions.types';

interface ExportMenuProps {
  inscriptions: Inscription[];
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ExportMenu = ({ 
  inscriptions, 
  variant = 'ghost',
  size = 'sm',
  className = ''
}: ExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (inscriptions.length === 0) {
      toast.error('Aucune inscription à exporter');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(`Export ${format.toUpperCase()} en cours...`);

    try {
      await exportInscriptions(inscriptions, format, 'inscriptions');
      toast.success(`Export ${format.toUpperCase()} réussi !`, { id: toastId });
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExporting || inscriptions.length === 0}
          className={className}
        >
          <>
            <Download className="w-3.5 h-3.5" />
            Exporter
          </>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">CSV</span>
            <span className="text-xs text-gray-500">Fichier texte séparé par virgules</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Excel</span>
            <span className="text-xs text-gray-500">Classeur Microsoft Excel</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileDown className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">PDF</span>
            <span className="text-xs text-gray-500">Document portable</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-gray-500">
          {inscriptions.length} inscription(s)
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
