/**
 * Panneau latéral pour gérer les widgets du dashboard
 * @module ManageWidgetsSheet
 */

import { RotateCcw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import type { WidgetId } from '../types/widget.types';

interface ManageWidgetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WIDGET_CONFIGS = [
  {
    id: 'system-alerts' as WidgetId,
    title: 'Alertes Système Critiques',
    description: 'Notifications importantes et erreurs système',
  },
  {
    id: 'financial-overview' as WidgetId,
    title: 'Aperçu Financier',
    description: 'Graphique des revenus mensuels',
  },
  {
    id: 'module-status' as WidgetId,
    title: 'Adoption des Modules',
    description: 'Taux d\'utilisation des modules par les écoles',
  },
  {
    id: 'realtime-activity' as WidgetId,
    title: 'Flux d\'Activité Temps Réel',
    description: 'Dernières actions système en direct',
  },
];

export const ManageWidgetsSheet = ({ open, onOpenChange }: ManageWidgetsSheetProps) => {
  const { layout, toggleWidget, resetLayout } = useDashboardLayout();

  const isWidgetEnabled = (widgetId: WidgetId) => {
    return layout.find((item) => item.id === widgetId)?.enabled ?? false;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Gérer les Widgets</SheetTitle>
          <SheetDescription>
            Activez ou désactivez les widgets affichés sur votre tableau de bord
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Liste des widgets */}
          <div className="space-y-4">
            {WIDGET_CONFIGS.map((widget) => (
              <div
                key={widget.id}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={widget.id}
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {widget.title}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    {widget.description}
                  </p>
                </div>
                <Switch
                  id={widget.id}
                  checked={isWidgetEnabled(widget.id)}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
              </div>
            ))}
          </div>

          {/* Bouton de réinitialisation */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full"
              onClick={resetLayout}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser le Layout
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Restaurer la disposition par défaut
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
