/**
 * InvoiceList - Liste des factures avec filtres et actions
 * Gestion complète des factures générées
 * @module InvoiceList
 */

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  DollarSign,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  planName: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  totalAmount: number;
  paymentMethod?: string;
  periodStart: string;
  periodEnd: string;
}

interface InvoiceListProps {
  invoices?: Invoice[];
  isLoading?: boolean;
  onViewInvoice?: (invoiceId: string) => void;
  onDownloadPDF?: (invoiceId: string) => void;
  onSendEmail?: (invoiceId: string) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
  onCancel?: (invoiceId: string) => void;
}

export const InvoiceList = ({
  invoices = [],
  isLoading = false,
  onViewInvoice,
  onDownloadPDF,
  onSendEmail,
  onMarkAsPaid,
  onCancel,
}: InvoiceListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { toast } = useToast();

  // Filtrage des factures
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Filtre recherche
      const matchesSearch = searchQuery === '' ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.schoolGroupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.schoolGroupCode.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtre statut
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      // Filtre date
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const invoiceDate = new Date(invoice.invoiceDate);
        const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
          case 'overdue':
            matchesDate = invoice.status === 'overdue' || (invoice.status !== 'paid' && new Date(invoice.dueDate) < now);
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  // Statistiques
  const stats = useMemo(() => {
    const total = filteredInvoices.length;
    const paid = filteredInvoices.filter(inv => inv.status === 'paid').length;
    const overdue = filteredInvoices.filter(inv => inv.status === 'overdue').length;
    const sent = filteredInvoices.filter(inv => inv.status === 'sent').length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0);

    return { total, paid, overdue, sent, totalAmount, paidAmount };
  }, [filteredInvoices]);

  const getStatusBadge = (status: string) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock, label: 'Brouillon' },
      sent: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Send, label: 'Envoyée' },
      paid: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Payée' },
      overdue: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'En retard' },
      cancelled: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Ban, label: 'Annulée' },
    };

    const config = configs[status as keyof typeof configs] || configs.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleAction = (action: string, invoiceId: string, invoiceNumber: string) => {
    const actions = {
      view: () => onViewInvoice?.(invoiceId),
      download: () => {
        onDownloadPDF?.(invoiceId);
        toast({ title: 'Téléchargement', description: `PDF de la facture ${invoiceNumber} généré.` });
      },
      send: () => {
        onSendEmail?.(invoiceId);
        toast({ title: 'Email envoyé', description: `Facture ${invoiceNumber} envoyée par email.` });
      },
      markPaid: () => {
        onMarkAsPaid?.(invoiceId);
        toast({ title: 'Facture payée', description: `Statut de ${invoiceNumber} mis à jour.` });
      },
      cancel: () => {
        onCancel?.(invoiceId);
        toast({ title: 'Facture annulée', description: `Facture ${invoiceNumber} annulée.` });
      },
    };

    actions[action as keyof typeof actions]?.();
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
            <FileText className="w-5 h-5 text-[#2A9D8F]" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total factures</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.paid}</p>
              <p className="text-sm text-gray-600">Payées</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-gray-600">En retard</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#E9C46A]" />
            <div>
              <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Montant total (FCFA)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro, groupe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Toutes les dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table des factures */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facture</TableHead>
                <TableHead>Groupe</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Aucune facture trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.schoolGroupName}</p>
                        <p className="text-xs text-gray-500">{invoice.schoolGroupCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.planName}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{invoice.totalAmount.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-600 font-medium' : ''}`}>
                          {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(invoice.periodStart), 'MMM', { locale: fr })} - {format(new Date(invoice.periodEnd), 'MMM yyyy', { locale: fr })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAction('view', invoice.id, invoice.invoiceNumber)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('download', invoice.id, invoice.invoiceNumber)}>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('send', invoice.id, invoice.invoiceNumber)}>
                            <Send className="w-4 h-4 mr-2" />
                            Envoyer par email
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAction('markPaid', invoice.id, invoice.invoiceNumber)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Marquer payée
                              </DropdownMenuItem>
                            </>
                          )}
                          {invoice.status !== 'cancelled' && (
                            <DropdownMenuItem
                              onClick={() => handleAction('cancel', invoice.id, invoice.invoiceNumber)}
                              className="text-red-600"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
