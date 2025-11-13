/**
 * Modal de paramètres avancés pour les rapports financiers
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Bell, FileText, Eye } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: SettingsData) => void;
}

export interface SettingsData {
  // Affichage
  defaultView: 'overview' | 'analytics' | 'schools';
  showCharts: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  
  // Rapports
  autoExportFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
  defaultExportFormat: 'pdf' | 'excel' | 'csv';
  includeChartsInExport: boolean;
  
  // Notifications
  emailNotifications: boolean;
  appNotifications: boolean;
  alertThreshold: number;
  
  // Données
  defaultPeriod: string;
  refreshInterval: number;
}

export const SettingsModal = ({ open, onOpenChange, onSave }: SettingsModalProps) => {
  // Affichage
  const [defaultView, setDefaultView] = useState<'overview' | 'analytics' | 'schools'>('overview');
  const [showCharts, setShowCharts] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Rapports
  const [autoExportFrequency, setAutoExportFrequency] = useState<'never' | 'daily' | 'weekly' | 'monthly'>('never');
  const [defaultExportFormat, setDefaultExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [includeChartsInExport, setIncludeChartsInExport] = useState(true);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(10);
  
  // Données
  const [defaultPeriod, setDefaultPeriod] = useState('current-month');
  const [refreshInterval, setRefreshInterval] = useState(5);

  const handleSave = () => {
    onSave({
      defaultView,
      showCharts,
      compactMode,
      animationsEnabled,
      autoExportFrequency,
      defaultExportFormat,
      includeChartsInExport,
      emailNotifications,
      appNotifications,
      alertThreshold,
      defaultPeriod,
      refreshInterval,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-6 h-6 text-blue-600" />
            Paramètres des rapports financiers
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'affichage et le comportement des rapports
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="py-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="display" className="gap-2">
              <Eye className="w-4 h-4" />
              Affichage
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              Rapports
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Settings className="w-4 h-4" />
              Données
            </TabsTrigger>
          </TabsList>

          {/* Onglet Affichage */}
          <TabsContent value="display" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Vue par défaut</Label>
                  <p className="text-sm text-gray-600">
                    Onglet affiché à l'ouverture
                  </p>
                </div>
                <Select value={defaultView} onValueChange={(value: any) => setDefaultView(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Vue d'ensemble</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="schools">Écoles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Afficher les graphiques</Label>
                  <p className="text-sm text-gray-600">
                    Visualisations dans les rapports
                  </p>
                </div>
                <Switch checked={showCharts} onCheckedChange={setShowCharts} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode compact</Label>
                  <p className="text-sm text-gray-600">
                    Réduire l'espacement entre les éléments
                  </p>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Animations</Label>
                  <p className="text-sm text-gray-600">
                    Transitions et effets visuels
                  </p>
                </div>
                <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Rapports */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Export automatique</Label>
                  <p className="text-sm text-gray-600">
                    Fréquence d'export automatique
                  </p>
                </div>
                <Select value={autoExportFrequency} onValueChange={(value: any) => setAutoExportFrequency(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Jamais</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Format par défaut</Label>
                  <p className="text-sm text-gray-600">
                    Format d'export préféré
                  </p>
                </div>
                <Select value={defaultExportFormat} onValueChange={(value: any) => setDefaultExportFormat(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Inclure les graphiques</Label>
                  <p className="text-sm text-gray-600">
                    Dans les exports PDF
                  </p>
                </div>
                <Switch checked={includeChartsInExport} onCheckedChange={setIncludeChartsInExport} />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications email</Label>
                  <p className="text-sm text-gray-600">
                    Recevoir les alertes par email
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications app</Label>
                  <p className="text-sm text-gray-600">
                    Recevoir les alertes dans l'application
                  </p>
                </div>
                <Switch checked={appNotifications} onCheckedChange={setAppNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Seuil d'alerte (%)</Label>
                  <p className="text-sm text-gray-600">
                    Variation déclenchant une alerte
                  </p>
                </div>
                <Select value={alertThreshold.toString()} onValueChange={(value) => setAlertThreshold(parseInt(value))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Données */}
          <TabsContent value="data" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Période par défaut</Label>
                  <p className="text-sm text-gray-600">
                    Période affichée au chargement
                  </p>
                </div>
                <Select value={defaultPeriod} onValueChange={setDefaultPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Mois en cours</SelectItem>
                    <SelectItem value="last-month">Mois dernier</SelectItem>
                    <SelectItem value="current-quarter">Trimestre</SelectItem>
                    <SelectItem value="current-year">Année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Actualisation auto (min)</Label>
                  <p className="text-sm text-gray-600">
                    Intervalle de rafraîchissement
                  </p>
                </div>
                <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
