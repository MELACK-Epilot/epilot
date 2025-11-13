/**
 * InvoiceReminders - Système de relances automatiques
 * Gestion des rappels de paiement par email
 * @module InvoiceReminders
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Settings,
  Send,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ReminderRule {
  id: string;
  name: string;
  description: string;
  daysAfterDue: number;
  enabled: boolean;
  template: string;
  priority: 'low' | 'medium' | 'high';
}

interface InvoiceReminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
  lastReminderDate?: string;
  reminderCount: number;
  nextReminderDate?: string;
  status: 'pending' | 'sent' | 'failed';
}

interface InvoiceRemindersProps {
  reminders?: InvoiceReminder[];
  rules?: ReminderRule[];
  isLoading?: boolean;
  onSendReminder?: (invoiceId: string) => void;
  onUpdateRule?: (ruleId: string, enabled: boolean) => void;
  onBulkSend?: (invoiceIds: string[]) => void;
}

export const InvoiceReminders = ({
  reminders = [],
  rules = [],
  isLoading = false,
  onSendReminder,
  onUpdateRule,
  onBulkSend,
}: InvoiceRemindersProps) => {
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const { toast } = useToast();

  // Règles par défaut si aucune n'est fournie
  const defaultRules: ReminderRule[] = [
    {
      id: '1',
      name: 'Rappel 7 jours',
      description: 'Premier rappel envoyé 7 jours après l\'échéance',
      daysAfterDue: 7,
      enabled: true,
      template: 'payment_reminder_7_days',
      priority: 'low',
    },
    {
      id: '2',
      name: 'Rappel 14 jours',
      description: 'Deuxième rappel envoyé 14 jours après l\'échéance',
      daysAfterDue: 14,
      enabled: true,
      template: 'payment_reminder_14_days',
      priority: 'medium',
    },
    {
      id: '3',
      name: 'Rappel urgent 30 jours',
      description: 'Rappel urgent envoyé 30 jours après l\'échéance',
      daysAfterDue: 30,
      enabled: true,
      template: 'payment_reminder_urgent',
      priority: 'high',
    },
  ];

  const activeRules = rules.length > 0 ? rules : defaultRules;

  // Filtrage des rappels
  const filteredReminders = reminders.filter(reminder => {
    if (filterPriority === 'all') return true;

    const daysOverdue = reminder.daysOverdue;
    if (filterPriority === 'high') return daysOverdue >= 30;
    if (filterPriority === 'medium') return daysOverdue >= 14 && daysOverdue < 30;
    if (filterPriority === 'low') return daysOverdue >= 7 && daysOverdue < 14;

    return true;
  });

  // Statistiques
  const stats = {
    total: filteredReminders.length,
    urgent: filteredReminders.filter(r => r.daysOverdue >= 30).length,
    pending: filteredReminders.filter(r => r.status === 'pending').length,
    totalAmount: filteredReminders.reduce((sum, r) => sum + r.amount, 0),
  };

  const getPriorityBadge = (daysOverdue: number) => {
    if (daysOverdue >= 30) {
      return <Badge className="bg-red-100 text-red-700">Urgent</Badge>;
    }
    if (daysOverdue >= 14) {
      return <Badge className="bg-yellow-100 text-yellow-700">Moyen</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700">Faible</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'En attente' },
      sent: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Envoyé' },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Échec' },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSendReminder = (invoiceId: string, invoiceNumber: string) => {
    onSendReminder?.(invoiceId);
    toast({
      title: 'Rappel envoyé',
      description: `Rappel pour la facture ${invoiceNumber} envoyé avec succès.`,
    });
  };

  const handleBulkSend = () => {
    if (selectedReminders.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une facture.',
        variant: 'destructive',
      });
      return;
    }

    onBulkSend?.(selectedReminders);
    toast({
      title: 'Rappels envoyés',
      description: `${selectedReminders.length} rappels envoyés avec succès.`,
    });
    setSelectedReminders([]);
  };

  const handleSelectAll = () => {
    if (selectedReminders.length === filteredReminders.length) {
      setSelectedReminders([]);
    } else {
      setSelectedReminders(filteredReminders.map(r => r.id));
    }
  };

  const handleSelectReminder = (id: string) => {
    setSelectedReminders(prev =>
      prev.includes(id)
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#2A9D8F]" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Factures en retard</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-sm text-gray-600">Rappels urgents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#E9C46A]" />
            <div>
              <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Montant (FCFA)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration des règles */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#457B9D]" />
          <h3 className="text-lg font-semibold">Configuration des relances automatiques</h3>
        </div>

        <div className="space-y-4">
          {activeRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{rule.name}</h4>
                  {rule.priority === 'high' && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}
                  {rule.priority === 'medium' && <Badge className="bg-yellow-100 text-yellow-700">Moyen</Badge>}
                  {rule.priority === 'low' && <Badge className="bg-blue-100 text-blue-700">Faible</Badge>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Envoyé {rule.daysAfterDue} jours après l'échéance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`rule-${rule.id}`} className="text-sm">
                  {rule.enabled ? 'Activé' : 'Désactivé'}
                </Label>
                <Switch
                  id={`rule-${rule.id}`}
                  checked={rule.enabled}
                  onCheckedChange={(enabled) => onUpdateRule?.(rule.id, enabled)}
                />
              </div>
            </div>
          ))}
        </div>

        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Les relances sont envoyées automatiquement selon les règles configurées.
            Vous pouvez également envoyer des rappels manuels depuis la liste ci-dessous.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Liste des rappels à envoyer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#457B9D]" />
            <h3 className="text-lg font-semibold">Rappels à envoyer</h3>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="high">Urgents</SelectItem>
                <SelectItem value="medium">Moyens</SelectItem>
                <SelectItem value="low">Faibles</SelectItem>
              </SelectContent>
            </Select>

            {selectedReminders.length > 0 && (
              <Button onClick={handleBulkSend} className="bg-[#2A9D8F] hover:bg-[#1D8A7E]">
                <Send className="w-4 h-4 mr-2" />
                Envoyer ({selectedReminders.length})
              </Button>
            )}
          </div>
        </div>

        {filteredReminders.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Aucun rappel à envoyer</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedReminders.length === filteredReminders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
              <span className="text-sm text-gray-600">
                {selectedReminders.length} sélectionné(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedReminders.length === filteredReminders.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Retard</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReminders.map((reminder, index) => (
                    <motion.tr
                      key={reminder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedReminders.includes(reminder.id)}
                          onChange={() => handleSelectReminder(reminder.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reminder.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">
                            {reminder.reminderCount} rappel(s) envoyé(s)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reminder.schoolGroupName}</p>
                          <p className="text-xs text-gray-500">{reminder.schoolGroupCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{reminder.amount.toLocaleString()} FCFA</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(reminder.dueDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-700">
                          {reminder.daysOverdue} jours
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(reminder.daysOverdue)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reminder.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(reminder.invoiceId, reminder.invoiceNumber)}
                          disabled={reminder.status === 'sent'}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
