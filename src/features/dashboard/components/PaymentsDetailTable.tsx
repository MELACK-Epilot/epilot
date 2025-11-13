/**
 * Tableau détaillé des paiements avec actions
 * Affiche tous les paiements avec possibilité de filtrer, trier, et agir
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  MoreVertical,
  Send,
  Eye,
  XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSchoolPaymentsDetail, useMarkPaymentAsPaid, useSendReminder } from '../hooks/useSchoolPayments';
import { toast } from 'sonner';

interface PaymentsDetailTableProps {
  schoolId: string;
}

export const PaymentsDetailTable = ({ schoolId }: PaymentsDetailTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const { data: payments, isLoading } = useSchoolPaymentsDetail(schoolId, {
    status: statusFilter.length > 0 ? statusFilter : undefined,
    priority: priorityFilter.length > 0 ? priorityFilter : undefined,
    searchTerm,
  });

  const markAsPaid = useMarkPaymentAsPaid();
  const sendReminder = useSendReminder();

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string, statusLabel: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default', className: 'bg-green-500' },
      overdue: { variant: 'destructive', className: 'bg-red-500' },
      pending: { variant: 'secondary', className: 'bg-yellow-500' },
      cancelled: { variant: 'outline', className: 'bg-gray-500' },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge {...config}>
        {statusLabel}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'Aucune') return null;

    const variants: Record<string, any> = {
      Haute: { variant: 'destructive', icon: AlertCircle },
      Moyenne: { variant: 'secondary', icon: Clock },
      Faible: { variant: 'outline', icon: Clock },
    };

    const config = variants[priority] || variants.Faible;
    const Icon = config.icon;

    return (
      <Badge {...config} className="gap-1">
        <Icon className="w-3 h-3" />
        {priority}
      </Badge>
    );
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await markAsPaid(paymentId, schoolId);
      toast.success('Paiement marqué comme payé');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSendReminder = async (paymentId: string, method: 'email' | 'sms') => {
    try {
      await sendReminder(paymentId, method);
      toast.success(`Relance ${method} envoyée`);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const togglePayment = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const toggleAll = () => {
    if (selectedPayments.length === payments?.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments?.map(p => p.paymentId) || []);
    }
  };

  // Statistiques rapides
  const stats = useMemo(() => {
    if (!payments) return null;

    return {
      total: payments.length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      pending: payments.filter(p => p.status === 'pending').length,
      completed: payments.filter(p => p.status === 'completed').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header avec stats rapides */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Paiements Détaillés
            </h3>
            {stats && (
              <p className="text-sm text-gray-600 mt-1">
                {stats.total} paiements • {stats.overdue} en retard • {formatCurrency(stats.overdueAmount)} à recouvrer
              </p>
            )}
          </div>

          {selectedPayments.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedPayments.length} sélectionné(s)
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setSelectedPayments([])}>
                Annuler
              </Button>
            </div>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un élève, une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter[0] || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? [] : [value])}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="completed">Payé</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter[0] || 'all'}
            onValueChange={(value) => setPriorityFilter(value === 'all' ? [] : [value])}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="Haute">Haute</SelectItem>
              <SelectItem value="Moyenne">Moyenne</SelectItem>
              <SelectItem value="Faible">Faible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedPayments.length === payments?.length && payments.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments && payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow
                    key={payment.paymentId}
                    className={`hover:bg-blue-50 transition-colors ${
                      selectedPayments.includes(payment.paymentId) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedPayments.includes(payment.paymentId)}
                        onCheckedChange={() => togglePayment(payment.paymentId)}
                      />
                    </TableCell>

                    <TableCell className="font-medium">
                      {payment.studentFirstName} {payment.studentLastName}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{payment.studentClass}</Badge>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {payment.feeType}
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(payment.dueDate)}</span>
                        {payment.daysOverdue > 0 && (
                          <span className="text-xs text-red-600">
                            {payment.daysOverdue}j de retard
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(payment.status, payment.statusLabel)}
                    </TableCell>

                    <TableCell>
                      {getPriorityBadge(payment.priority)}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium">{payment.parentName}</span>
                        {payment.parentPhone && (
                          <span className="text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {payment.parentPhone}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payment.status !== 'completed' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(payment.paymentId)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Marquer comme payé
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          
                          {payment.status === 'overdue' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleSendReminder(payment.paymentId, 'email')}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Relance email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSendReminder(payment.paymentId, 'sms')}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Relance SMS
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger reçu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-600">Aucun paiement trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer avec stats */}
        {stats && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total : </span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div>
                <span className="text-gray-600">En retard : </span>
                <span className="font-semibold text-red-600">{stats.overdue}</span>
              </div>
              <div>
                <span className="text-gray-600">Montant total : </span>
                <span className="font-semibold">{formatCurrency(stats.totalAmount)}</span>
              </div>
            </div>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
