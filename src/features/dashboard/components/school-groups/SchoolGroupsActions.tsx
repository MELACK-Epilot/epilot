/**
 * Composant Actions pour la page Groupes Scolaires
 */

import { Download, Plus, Upload, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SchoolGroupsActionsProps {
  selectedRows: string[];
  onExport: () => void;
  onBulkDelete: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onClearSelection: () => void;
  onCreateNew: () => void;
}

export const SchoolGroupsActions = ({
  selectedRows,
  onExport,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  onClearSelection,
  onCreateNew,
}: SchoolGroupsActionsProps) => {
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Groupes Scolaires</h1>
        <p className="text-gray-600 mt-1">
          Gérez les établissements et leurs administrateurs
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Actions en masse */}
        {hasSelection && (
          <div className="flex items-center gap-2 mr-2">
            <Badge variant="secondary" className="px-3 py-1">
              {selectedRows.length} sélectionné(s)
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions en masse
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions groupées</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBulkActivate}>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Activer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onBulkDeactivate}>
                  <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                  Désactiver
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBulkDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Annuler
            </Button>
          </div>
        )}

        {/* Actions principales */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              📄 Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              📊 Export Excel
            </DropdownMenuItem>
            <DropdownMenuItem>
              📋 Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Importer
        </Button>

        <Button onClick={onCreateNew} className="bg-[#1D3557] hover:bg-[#2A9D8F]">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau groupe
        </Button>
      </div>
    </div>
  );
};
