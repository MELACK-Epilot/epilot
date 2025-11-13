/**
 * Modal d'export moderne avec options avancées
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
  selectedSchools?: string[];
  totalSchools: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  scope: 'all' | 'selected';
  includeCharts: boolean;
  includeDetails: boolean;
  period: string;
  groupBy: 'none' | 'school' | 'level' | 'class';
  includeComparison: boolean;
}

export const ExportModal = ({
  open,
  onOpenChange,
  onExport,
  selectedSchools = [],
  totalSchools,
}: ExportModalProps) => {
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [scope, setScope] = useState<'all' | 'selected'>(
    selectedSchools.length > 0 ? 'selected' : 'all'
  );
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [period, setPeriod] = useState('current-month');
  const [groupBy, setGroupBy] = useState<'none' | 'school' | 'level' | 'class'>('none');
  const [includeComparison, setIncludeComparison] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        scope,
        includeCharts,
        includeDetails,
        period,
        groupBy,
        includeComparison,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5" />;
      case 'csv': return <FileType className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case 'pdf': return 'Rapport complet avec graphiques et mise en page professionnelle';
      case 'excel': return 'Données structurées pour analyse et tableaux croisés dynamiques';
      case 'csv': return 'Données brutes pour import dans d\'autres systèmes';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-blue-600" />
            Exporter les données financières
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configurez les options d'export selon vos besoins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 overflow-y-auto flex-1 pr-2">
          {/* Format d'export */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Format d'export</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              {(['pdf', 'excel', 'csv'] as const).map((fmt) => (
                <motion.div
                  key={fmt}
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    format === fmt
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormat(fmt)}
                >
                  <RadioGroupItem value={fmt} id={fmt} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={fmt} className="flex items-center gap-2 cursor-pointer font-medium">
                      {getFormatIcon(fmt)}
                      {fmt.toUpperCase()}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {getFormatDescription(fmt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </RadioGroup>
          </div>

          {/* Quelles écoles exporter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Quelles écoles exporter ?</Label>
            <RadioGroup value={scope} onValueChange={(value: any) => setScope(value)}>
              <div
                className={`flex items-center space-x-3 p-2 rounded-lg border-2 cursor-pointer ${
                  scope === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setScope('all')}
              >
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer flex-1 text-sm">
                  Toutes les écoles ({totalSchools} écoles)
                </Label>
              </div>
              {selectedSchools.length > 0 && (
                <div
                  className={`flex items-center space-x-3 p-2 rounded-lg border-2 cursor-pointer ${
                    scope === 'selected' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setScope('selected')}
                >
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected" className="cursor-pointer flex-1 text-sm">
                    Seulement les écoles sélectionnées ({selectedSchools.length})
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Période */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Période</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mois en cours</SelectItem>
                <SelectItem value="last-month">Mois dernier</SelectItem>
                <SelectItem value="current-quarter">Trimestre en cours</SelectItem>
                <SelectItem value="last-quarter">Trimestre dernier</SelectItem>
                <SelectItem value="current-year">Année en cours</SelectItem>
                <SelectItem value="last-year">Année dernière</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment organiser les données */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Comment organiser les données ?</Label>
            <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">📊 Vue globale (tout ensemble)</SelectItem>
                <SelectItem value="school">🏫 Séparé par école</SelectItem>
                <SelectItem value="level">📚 Séparé par niveau (6ème, 5ème...)</SelectItem>
                <SelectItem value="class">👥 Séparé par classe (6ème A, 6ème B...)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {groupBy === 'none' && '→ Un seul fichier avec toutes les données'}
              {groupBy === 'school' && '→ Un fichier par école ou des onglets séparés'}
              {groupBy === 'level' && '→ Données organisées par niveau scolaire'}
              {groupBy === 'class' && '→ Détail par classe dans chaque niveau'}
            </p>
          </div>

          {/* Options supplémentaires */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Options supplémentaires</Label>
            <div className="space-y-2">
              {format === 'pdf' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={includeCharts}
                      onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                    />
                    <Label htmlFor="charts" className="cursor-pointer text-sm">
                      Inclure les graphiques et visualisations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="details"
                      checked={includeDetails}
                      onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                    />
                    <Label htmlFor="details" className="cursor-pointer text-sm">
                      Inclure les détails par niveau
                    </Label>
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comparison"
                  checked={includeComparison}
                  onCheckedChange={(checked) => setIncludeComparison(checked as boolean)}
                />
                <Label htmlFor="comparison" className="cursor-pointer text-sm">
                  Inclure comparaison N vs N-1
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting} size="sm">
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2" size="sm">
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
