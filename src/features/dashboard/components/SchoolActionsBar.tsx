/**
 * Barre d'actions pour page Finances École
 * Export, impression, comparaison, filtres
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  Printer,
  Mail,
  Share2,
  Calendar,
  Filter,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SchoolActionsBarProps {
  schoolName: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onSendEmail?: () => void;
  onRefresh?: () => void;
  onCompare?: () => void;
}

export const SchoolActionsBar = ({
  schoolName,
  onExportPDF,
  onExportExcel,
  onPrint,
  onSendEmail,
  onRefresh,
  onCompare,
}: SchoolActionsBarProps) => {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Titre */}
        <div>
          <h3 className="font-semibold text-gray-900">Actions Rapides</h3>
          <p className="text-xs text-gray-500">Exporter, imprimer, partager les données</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Actualiser */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>

          {/* Exporter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Rapport PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportExcel}>
                <FileText className="w-4 h-4 mr-2" />
                Tableau Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onPrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Partager */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSendEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Envoyer par email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Copier le lien
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Comparer */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCompare}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Comparer périodes
          </Button>

          {/* Filtrer */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Calendar className="w-4 h-4 mr-2" />
                Mois en cours
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="w-4 h-4 mr-2" />
                Trimestre en cours
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="w-4 h-4 mr-2" />
                Année en cours
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Calendar className="w-4 h-4 mr-2" />
                Période personnalisée...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};
