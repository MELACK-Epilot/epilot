/**
 * Modal de création d'alerte financière intelligente
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Bell, Loader2, TrendingDown, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (alertData: AlertData) => Promise<void>;
  selectedSchools?: string[];
  schoolNames?: string[];
}

export interface AlertData {
  name: string;
  type: 'revenue' | 'expenses' | 'profit' | 'overdue' | 'recovery';
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  schools: string[];
  notifyEmail: boolean;
  notifyApp: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
}

export const AlertModal = ({
  open,
  onOpenChange,
  onCreate,
  selectedSchools = [],
  schoolNames = [],
}: AlertModalProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AlertData['type']>('revenue');
  const [condition, setCondition] = useState<AlertData['condition']>('below');
  const [threshold, setThreshold] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyApp, setNotifyApp] = useState(true);
  const [frequency, setFrequency] = useState<AlertData['frequency']>('realtime');
  const [isCreating, setIsCreating] = useState(false);

  const alertTypes = [
    {
      value: 'revenue',
      label: 'Revenus',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Surveiller les revenus totaux',
    },
    {
      value: 'expenses',
      label: 'Dépenses',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Surveiller les dépenses',
    },
    {
      value: 'profit',
      label: 'Profit',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Surveiller le profit net',
    },
    {
      value: 'overdue',
      label: 'Retards',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Surveiller les paiements en retard',
    },
    {
      value: 'recovery',
      label: 'Recouvrement',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Surveiller le taux de recouvrement',
    },
  ];

  const handleCreate = async () => {
    if (!name || !threshold) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreate({
        name,
        type,
        condition,
        threshold: parseFloat(threshold),
        schools: selectedSchools.length > 0 ? selectedSchools : ['all'],
        notifyEmail,
        notifyApp,
        frequency,
      });
      onOpenChange(false);
      // Reset form
      setName('');
      setThreshold('');
    } catch (error) {
      console.error('Erreur création alerte:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedAlertType = alertTypes.find((t) => t.value === type);
  const Icon = selectedAlertType?.icon || Bell;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-6 h-6 text-blue-600" />
            Créer une alerte financière
          </DialogTitle>
          <DialogDescription>
            Recevez des notifications automatiques selon vos critères
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Écoles concernées */}
          {schoolNames.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                Écoles surveillées :
              </Label>
              <div className="flex flex-wrap gap-2">
                {schoolNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Nom de l'alerte */}
          <div className="space-y-2">
            <Label htmlFor="alert-name" className="text-base font-semibold">
              Nom de l'alerte *
            </Label>
            <Input
              id="alert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alerte revenus faibles"
            />
          </div>

          {/* Type d'alerte */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type de métrique *</Label>
            <div className="grid grid-cols-2 gap-3">
              {alertTypes.map((alertType) => {
                const AlertIcon = alertType.icon;
                return (
                  <motion.div
                    key={alertType.value}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      type === alertType.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setType(alertType.value as AlertData['type'])}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${alertType.bgColor}`}>
                        <AlertIcon className={`w-5 h-5 ${alertType.color}`} />
                      </div>
                      <div>
                        <div className="font-medium">{alertType.label}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {alertType.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Condition et seuil */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-base font-semibold">
                Condition *
              </Label>
              <Select value={condition} onValueChange={(value: any) => setCondition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Inférieur à</SelectItem>
                  <SelectItem value="above">Supérieur à</SelectItem>
                  <SelectItem value="equals">Égal à</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-base font-semibold">
                Seuil * {type === 'recovery' ? '(%)' : '(FCFA)'}
              </Label>
              <Input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={type === 'recovery' ? '85' : '1000000'}
              />
            </div>
          </div>

          {/* Aperçu de l'alerte */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={selectedAlertType?.color || 'text-blue-600'} />
              <span className="font-semibold text-gray-900">Aperçu de l'alerte :</span>
            </div>
            <p className="text-sm text-gray-700">
              {name || 'Nom de l\'alerte'} : Vous serez notifié si{' '}
              <span className="font-semibold">{selectedAlertType?.label}</span>{' '}
              est{' '}
              <span className="font-semibold">
                {condition === 'below' ? 'inférieur' : condition === 'above' ? 'supérieur' : 'égal'}
              </span>{' '}
              à{' '}
              <span className="font-semibold">
                {threshold || '___'} {type === 'recovery' ? '%' : 'FCFA'}
              </span>
            </p>
          </div>

          {/* Fréquence */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-base font-semibold">
              Fréquence de vérification
            </Label>
            <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Temps réel</SelectItem>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Méthodes de notification</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-email"
                  checked={notifyEmail}
                  onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                />
                <Label htmlFor="notify-email" className="cursor-pointer">
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-app"
                  checked={notifyApp}
                  onCheckedChange={(checked) => setNotifyApp(checked as boolean)}
                />
                <Label htmlFor="notify-app" className="cursor-pointer">
                  Notification dans l'application
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name || !threshold}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Créer l'alerte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
