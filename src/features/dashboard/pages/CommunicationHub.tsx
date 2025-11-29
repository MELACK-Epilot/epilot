/**
 * Hub de Communication E-Pilot - Version Premium
 * Gestion de +500 groupes scolaires
 * Tickets, Messagerie, Annonces, Broadcasts
 * @module CommunicationHub
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  LifeBuoy,
  Mail,
  MailOpen,
  Megaphone,
  Search,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  Eye,
  Reply,
  Trash2,
  MoreVertical,
  Paperclip,
  Calendar,
  Zap,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  useTickets, 
  useTicketsStats,
  useMessages,
  useMessagingStats,
} from '../hooks/useCommunication';
import { useBroadcastStats } from '../hooks/useMessaging';
import { 
  useDeleteTicket,
  useAddComment,
  useUpdateTicketStatus,
  useBulkDeleteTickets,
  useBulkUpdateTicketStatus,
} from '../hooks/useTickets';
import { 
  useSendMessage, 
  useDeleteMessage, 
  useMarkMessageAsRead,
  useBulkDeleteMessages,
  useBulkMarkAsRead,
} from '../hooks/useMessaging';
import { useRealtimeCommunication } from '../hooks/useRealtimeCommunication';
import { CreateTicketDialog } from '../components/communication/CreateTicketDialog';
import { ViewTicketDialog } from '../components/communication/ViewTicketDialog';
import { ComposeMessageDialog } from '../components/communication/ComposeMessageDialog';
import { ViewMessageDialog } from '../components/communication/ViewMessageDialog';
import { MessagesList } from '../components/communication/MessagesList';
import { ConfirmDeleteDialog } from '../components/communication/ConfirmDeleteDialog';
import { ConfirmActionDialog } from '../components/communication/ConfirmActionDialog';
import type { Ticket, TicketStatus, TicketPriority } from '../types/communication.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

// Configurations
const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bgColor: string; icon: typeof AlertCircle }> = {
  low: { label: 'Faible', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock },
  medium: { label: 'Moyenne', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: AlertCircle },
  high: { label: 'Haute', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle },
  urgent: { label: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  open: { label: 'Ouvert', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
  in_progress: { label: 'En cours', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: TrendingUp },
  resolved: { label: 'Résolu', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  closed: { label: 'Fermé', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: '🔧 Technique',
  pedagogique: '📚 Pédagogique',
  financier: '💰 Financier',
  administratif: '📋 Administratif',
  autre: '📝 Autre',
};

/**
 * Composant principal
 */
export const CommunicationHub = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tickets' | 'messages' | 'broadcasts'>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // États pour la sélection multiple
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  
  // États pour les modals
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  // États pour les modals de confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    ticketId: string | null;
  }>({ isOpen: false, ticketId: null });
  
  // États pour les messages
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [deleteMessageConfirm, setDeleteMessageConfirm] = useState<{
    isOpen: boolean;
    messageId: string | null;
  }>({ isOpen: false, messageId: null });

  // Data hooks
  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useTickets();
  const { data: ticketsStats } = useTicketsStats();
  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: messagingStats } = useMessagingStats();
  const { data: broadcastStats } = useBroadcastStats();
  
  // Mutation hooks
  const deleteTicketMutation = useDeleteTicket();
  const addCommentMutation = useAddComment();
  const updateStatusMutation = useUpdateTicketStatus();
  const sendMessageMutation = useSendMessage();
  const deleteMessageMutation = useDeleteMessage();
  const markMessageAsReadMutation = useMarkMessageAsRead();
  
  // Mutation hooks pour actions groupées
  const bulkDeleteTicketsMutation = useBulkDeleteTickets();
  const bulkUpdateTicketStatusMutation = useBulkUpdateTicketStatus();
  const bulkDeleteMessagesMutation = useBulkDeleteMessages();
  const bulkMarkAsReadMutation = useBulkMarkAsRead();
  
  // 🔥 Temps réel activé pour +500 groupes scolaires
  useRealtimeCommunication();

  // Filtrage des tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.createdBy?.schoolGroup?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Calculer le nombre de messages non lus depuis les données réelles
  const unreadMessagesCount = useMemo(() => {
    return messages.filter(msg => !msg.isRead).length;
  }, [messages]);

  // Export Excel
  const exportToExcel = () => {
    if (!filteredTickets.length) {
      toast({ title: "Aucune donnée", description: "Aucun ticket à exporter", variant: "destructive" });
      return;
    }
    
    const headers = ['N° Ticket', 'Titre', 'Catégorie', 'Priorité', 'Statut', 'Groupe', 'Créé par', 'Date'];
    const rows = filteredTickets.map(t => [
      t.id.slice(0, 8),
      t.title,
      CATEGORY_LABELS[t.category] || t.category,
      PRIORITY_CONFIG[t.priority]?.label || t.priority,
      STATUS_CONFIG[t.status]?.label || t.status,
      t.createdBy?.schoolGroup || 'N/A',
      t.createdBy?.name || 'N/A',
      format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })
    ]);
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1D3557" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Tickets">
    <Table>
      <Row>${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
      ${rows.map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join('')}</Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`;
    
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tickets-${format(new Date(), 'yyyy-MM-dd')}.xls`;
    link.click();
    
    toast({ title: "Export réussi", description: `${filteredTickets.length} tickets exportés` });
  };

  // Handlers
  const handleTicketCreate = (data: unknown) => {
    console.log('Creating ticket:', data);
    toast({ title: "Ticket créé", description: "Votre ticket a été soumis avec succès" });
    setIsCreateTicketOpen(false);
    refetchTickets();
  };

  const handleDeleteTicket = async () => {
    if (!deleteConfirm.ticketId) return;
    
    try {
      await deleteTicketMutation.mutateAsync(deleteConfirm.ticketId);
      toast({ 
        title: "✅ Ticket supprimé", 
        description: "Le ticket a été supprimé avec succès" 
      });
      setDeleteConfirm({ isOpen: false, ticketId: null, ticketTitle: null });
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de supprimer le ticket",
        variant: "destructive" 
      });
    }
  };

  const openDeleteConfirm = (ticket: Ticket) => {
    setDeleteConfirm({
      isOpen: true,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
    });
  };

  const handleReplyToTicket = (ticket: Ticket) => {
    // Ouvrir le modal de composition avec le destinataire pré-rempli
    setIsComposeOpen(true);
    // TODO: Pré-remplir le destinataire avec ticket.createdBy.id
  };

  const handleAddComment = async (ticketId: string, comment: string) => {
    try {
      await addCommentMutation.mutateAsync({ ticketId, content: comment });
      toast({ title: "✅ Commentaire ajouté" });
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ ticketId, status });
      toast({ title: "✅ Statut mis à jour" });
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de mettre à jour le statut",
        variant: "destructive" 
      });
    }
  };

  const handleSendMessage = async (data: any) => {
    try {
      await sendMessageMutation.mutateAsync({
        recipientIds: data.recipientIds,
        subject: data.subject,
        content: data.content,
        type: data.type,
        attachments: data.attachments,
      });
      toast({ 
        title: "✅ Message envoyé", 
        description: "Votre message a été envoyé avec succès" 
      });
      setIsComposeOpen(false);
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible d'envoyer le message",
        variant: "destructive" 
      });
    }
  };

  const handleMessageClick = async (message: any) => {
    setSelectedMessage(message);
    
    // Marquer comme lu si non lu
    if (!message.isRead) {
      try {
        await markMessageAsReadMutation.mutateAsync(message.id);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleReplyToMessage = (message: any) => {
    setIsComposeOpen(true);
    // TODO: Pré-remplir avec le destinataire
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageConfirm.messageId) return;
    
    try {
      await deleteMessageMutation.mutateAsync(deleteMessageConfirm.messageId);
      toast({ 
        title: "✅ Message supprimé", 
        description: "Le message a été supprimé avec succès" 
      });
      setDeleteMessageConfirm({ isOpen: false, messageId: null });
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de supprimer le message",
        variant: "destructive" 
      });
    }
  };

  const openDeleteMessageConfirm = (messageId: string) => {
    setDeleteMessageConfirm({
      isOpen: true,
      messageId,
    });
  };

  // Handlers pour actions groupées - Tickets
  const handleBulkDeleteTickets = async () => {
    if (selectedTickets.length === 0) return;
    
    try {
      const count = await bulkDeleteTicketsMutation.mutateAsync(selectedTickets);
      toast({ 
        title: "✅ Tickets supprimés", 
        description: `${count} ticket(s) supprimé(s) avec succès` 
      });
      setSelectedTickets([]);
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de supprimer les tickets",
        variant: "destructive" 
      });
    }
  };

  const handleBulkUpdateTicketStatus = async (status: string) => {
    if (selectedTickets.length === 0) return;
    
    try {
      const count = await bulkUpdateTicketStatusMutation.mutateAsync({ ticketIds: selectedTickets, status });
      toast({ 
        title: "✅ Statuts mis à jour", 
        description: `${count} ticket(s) mis à jour` 
      });
      setSelectedTickets([]);
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de mettre à jour les statuts",
        variant: "destructive" 
      });
    }
  };

  // Handlers pour actions groupées - Messages
  const handleBulkDeleteMessages = async () => {
    if (selectedMessages.length === 0) return;
    
    try {
      const count = await bulkDeleteMessagesMutation.mutateAsync(selectedMessages);
      toast({ 
        title: "✅ Messages supprimés", 
        description: `${count} message(s) supprimé(s) avec succès` 
      });
      setSelectedMessages([]);
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de supprimer les messages",
        variant: "destructive" 
      });
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedMessages.length === 0) return;
    
    try {
      const count = await bulkMarkAsReadMutation.mutateAsync(selectedMessages);
      toast({ 
        title: "✅ Messages marqués comme lus", 
        description: `${count} message(s) marqué(s) comme lus` 
      });
      setSelectedMessages([]);
    } catch (error) {
      toast({ 
        title: "❌ Erreur", 
        description: "Impossible de marquer les messages comme lus",
        variant: "destructive" 
      });
    }
  };

  // Handlers pour la sélection
  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const selectAllTickets = () => {
    setSelectedTickets(filteredTickets.map(t => t.id));
  };

  const deselectAllTickets = () => {
    setSelectedTickets([]);
  };

  const selectAllMessages = () => {
    setSelectedMessages(messages.map(m => m.id));
  };

  const deselectAllMessages = () => {
    setSelectedMessages([]);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1800px] mx-auto space-y-6"
      >
        {/* Header Premium */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-2xl shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1D3557] tracking-tight">
                Centre de Communication
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <span>Gérez les tickets, messages et annonces</span>
                {ticketsStats?.open ? (
                  <Badge className="bg-orange-500 text-white border-0 animate-pulse">
                    {ticketsStats.open} tickets ouverts
                  </Badge>
                ) : null}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetchTickets()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsCreateTicketOpen(true)} className="gap-2 cursor-pointer">
                  <LifeBuoy className="w-4 h-4 text-orange-500" />
                  Nouveau Ticket
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsComposeOpen(true)} className="gap-2 cursor-pointer">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Nouveau Message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Megaphone className="w-4 h-4 text-purple-500" />
                  Broadcast
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={exportToExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </motion.div>

        {/* KPIs Premium */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Tickets */}
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] p-4 hover:shadow-xl transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-xs font-medium uppercase">Total</p>
              <p className="text-2xl font-bold text-white">{ticketsStats?.total || 0}</p>
            </div>
          </Card>

          {/* Ouverts */}
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-orange-500 to-amber-600 p-4 hover:shadow-xl transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                {ticketsStats?.open ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : null}
              </div>
              <p className="text-white/70 text-xs font-medium uppercase">Ouverts</p>
              <p className="text-2xl font-bold text-white">{ticketsStats?.open || 0}</p>
            </div>
          </Card>

          {/* En cours */}
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-purple-500 to-indigo-600 p-4 hover:shadow-xl transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-xs font-medium uppercase">En cours</p>
              <p className="text-2xl font-bold text-white">{ticketsStats?.inProgress || 0}</p>
            </div>
          </Card>

          {/* Résolus */}
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] p-4 hover:shadow-xl transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-xs font-medium uppercase">Résolus</p>
              <p className="text-2xl font-bold text-white">{ticketsStats?.resolved || 0}</p>
            </div>
          </Card>

          {/* Messages non lus */}
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-500 to-cyan-600 p-4 hover:shadow-xl transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                {unreadMessagesCount > 0 && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
              </div>
              <p className="text-white/70 text-xs font-medium uppercase">Non lus</p>
              <p className="text-2xl font-bold text-white">{unreadMessagesCount}</p>
            </div>
          </Card>

          {/* Temps moyen */}
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-[#E9C46A] to-[#F4A261] p-4 hover:shadow-xl transition-all group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-xs font-medium uppercase">Temps moy.</p>
              <p className="text-2xl font-bold text-white">{ticketsStats?.avgResolutionTime || 0}h</p>
            </div>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 bg-white shadow-sm h-12 p-1">
              <TabsTrigger value="tickets" className="data-[state=active]:bg-[#1D3557] data-[state=active]:text-white gap-2">
                <LifeBuoy className="w-4 h-4" />
                Tickets
                {ticketsStats?.open ? (
                  <Badge className="bg-orange-500 text-white text-xs ml-1">{ticketsStats.open}</Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-[#1D3557] data-[state=active]:text-white gap-2">
                <Mail className="w-4 h-4" />
                Messages
                {unreadMessagesCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs ml-1 animate-pulse">{unreadMessagesCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="broadcasts" className="data-[state=active]:bg-[#1D3557] data-[state=active]:text-white gap-2">
                <Megaphone className="w-4 h-4" />
                Broadcasts
              </TabsTrigger>
            </TabsList>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="mt-6 space-y-4">
              {/* Filtres */}
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher par titre, description, groupe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="open">Ouverts</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="resolved">Résolus</SelectItem>
                        <SelectItem value="closed">Fermés</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes priorités</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Faible</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        <SelectItem value="technique">🔧 Technique</SelectItem>
                        <SelectItem value="pedagogique">📚 Pédagogique</SelectItem>
                        <SelectItem value="financier">💰 Financier</SelectItem>
                        <SelectItem value="administratif">📋 Administratif</SelectItem>
                        <SelectItem value="autre">📝 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => setIsCreateTicketOpen(true)}
                      className="bg-[#2A9D8F] hover:bg-[#238b7e] text-white gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau Ticket
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Barre d'actions groupées - Tickets */}
              {selectedTickets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedTickets.length === filteredTickets.length}
                          onCheckedChange={(checked) => 
                            checked ? selectAllTickets() : deselectAllTickets()
                          }
                          className="border-blue-400"
                        />
                        <div>
                          <p className="font-semibold text-[#1D3557]">
                            {selectedTickets.length} ticket(s) sélectionné(s)
                          </p>
                          <p className="text-xs text-gray-600">
                            {selectedTickets.length === filteredTickets.length 
                              ? "Tous les tickets sont sélectionnés" 
                              : `${filteredTickets.length - selectedTickets.length} ticket(s) restant(s)`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Select onValueChange={handleBulkUpdateTicketStatus}>
                          <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Changer le statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Ouvert
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-500" />
                                En cours
                              </div>
                            </SelectItem>
                            <SelectItem value="resolved">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Résolu
                              </div>
                            </SelectItem>
                            <SelectItem value="closed">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-gray-500" />
                                Fermé
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="destructive" 
                          onClick={handleBulkDeleteTickets}
                          disabled={bulkDeleteTicketsMutation.isPending}
                          className="gap-2"
                        >
                          {bulkDeleteTicketsMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Supprimer
                        </Button>
                        
                        <Button variant="outline" onClick={deselectAllTickets}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Liste des tickets */}
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2A9D8F]" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LifeBuoy className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun ticket</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? "Aucun ticket ne correspond à vos filtres"
                      : "Aucun ticket pour le moment"}
                  </p>
                  <Button onClick={() => setIsCreateTicketOpen(true)} className="bg-[#2A9D8F]">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un ticket
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((ticket, index) => {
                    const priorityConfig = PRIORITY_CONFIG[ticket.priority];
                    const statusConfig = STATUS_CONFIG[ticket.status];
                    const PriorityIcon = priorityConfig?.icon || AlertCircle;
                    const StatusIcon = statusConfig?.icon || Clock;

                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card 
                          className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <div className="flex-shrink-0 pt-1">
                              <Checkbox 
                                checked={selectedTickets.includes(ticket.id)}
                                onCheckedChange={() => toggleTicketSelection(ticket.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="border-gray-400"
                              />
                            </div>

                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {ticket.createdBy?.avatar ? (
                                <img 
                                  src={ticket.createdBy.avatar} 
                                  alt={ticket.createdBy.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-semibold text-sm">
                                  {ticket.createdBy?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#2A9D8F] transition-colors">
                                      {ticket.title}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {CATEGORY_LABELS[ticket.category] || ticket.category}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-1">
                                    {ticket.description}
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Badge className={`${priorityConfig?.bgColor} ${priorityConfig?.color} border-0`}>
                                    <PriorityIcon className="w-3 h-3 mr-1" />
                                    {priorityConfig?.label}
                                  </Badge>
                                  <Badge className={`${statusConfig?.bgColor} ${statusConfig?.color} border-0`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig?.label}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{ticket.createdBy?.name}</span>
                                </div>
                                {ticket.createdBy?.schoolGroup && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    <span>{ticket.createdBy.schoolGroup}</span>
                                  </div>
                                )}
                                {ticket.comments?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{ticket.comments.length}</span>
                                  </div>
                                )}
                                {ticket.attachments && ticket.attachments.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{ticket.attachments.length}</span>
                                  </div>
                                )}
                                <span className="ml-auto flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(ticket.createdAt), 'dd MMM HH:mm', { locale: fr })}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReplyToTicket(ticket); }}>
                                  <Reply className="w-4 h-4 mr-2" />
                                  Répondre
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    openDeleteConfirm(ticket);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-6 space-y-4">
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Rechercher un message..." className="pl-10" />
                  </div>
                  <Button onClick={() => setIsComposeOpen(true)} className="bg-[#1D3557] gap-2">
                    <Send className="w-4 h-4" />
                    Nouveau Message
                  </Button>
                </div>
              </Card>

              {/* Barre d'actions groupées - Messages */}
              {selectedMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-teal-50 border-green-200 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedMessages.length === messages.length}
                          onCheckedChange={(checked) => 
                            checked ? selectAllMessages() : deselectAllMessages()
                          }
                          className="border-green-400"
                        />
                        <div>
                          <p className="font-semibold text-[#1D3557]">
                            {selectedMessages.length} message(s) sélectionné(s)
                          </p>
                          <p className="text-xs text-gray-600">
                            {selectedMessages.length === messages.length 
                              ? "Tous les messages sont sélectionnés" 
                              : `${messages.length - selectedMessages.length} message(s) restant(s)`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleBulkMarkAsRead}
                          disabled={bulkMarkAsReadMutation.isPending}
                          className="gap-2 bg-white"
                        >
                          {bulkMarkAsReadMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MailOpen className="w-4 h-4" />
                          )}
                          Marquer comme lus
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          onClick={handleBulkDeleteMessages}
                          disabled={bulkDeleteMessagesMutation.isPending}
                          className="gap-2"
                        >
                          {bulkDeleteMessagesMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Supprimer
                        </Button>
                        
                        <Button variant="outline" onClick={deselectAllMessages}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              <MessagesList
                messages={messages}
                isLoading={messagesLoading}
                onMessageClick={handleMessageClick}
                onReply={handleReplyToMessage}
                onDelete={openDeleteMessageConfirm}
                selectedMessages={selectedMessages}
                onToggleSelection={toggleMessageSelection}
              />
            </TabsContent>

            {/* Broadcasts Tab */}
            <TabsContent value="broadcasts" className="mt-6 space-y-4">
              <Card className="p-8 text-center border-0 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Broadcasts</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Envoyez des messages à tous les groupes scolaires ou ciblez des segments spécifiques (par plan, région, etc.)
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    Nouveau Broadcast
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setActiveTab('messages')}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Voir l'historique
                  </Button>
                </div>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Send className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Broadcasts envoyés</p>
                      <p className="text-xl font-bold text-gray-900">{broadcastStats?.totalBroadcasts || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Destinataires atteints</p>
                      <p className="text-xl font-bold text-gray-900">{broadcastStats?.totalRecipients || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taux de lecture</p>
                      <p className="text-xl font-bold text-gray-900">{broadcastStats?.readPercentage || 0}%</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Modals */}
        <CreateTicketDialog
          isOpen={isCreateTicketOpen}
          onClose={() => setIsCreateTicketOpen(false)}
          onCreate={handleTicketCreate}
        />

        <ViewTicketDialog
          ticket={selectedTicket}
          isOpen={selectedTicket !== null}
          onClose={() => setSelectedTicket(null)}
          onAddComment={handleAddComment}
          onUpdateStatus={handleUpdateStatus}
        />

        <ComposeMessageDialog
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onSend={handleSendMessage}
        />

        <ConfirmDeleteDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, ticketId: null, ticketTitle: null })}
          onConfirm={handleDeleteTicket}
          itemName={deleteConfirm.ticketTitle || undefined}
          isLoading={deleteTicketMutation.isPending}
        />

        <ViewMessageDialog
          message={selectedMessage}
          isOpen={selectedMessage !== null}
          onClose={() => setSelectedMessage(null)}
          onReply={handleReplyToMessage}
          onDelete={(message) => openDeleteMessageConfirm(message.id)}
        />

        <ConfirmDeleteDialog
          isOpen={deleteMessageConfirm.isOpen}
          onClose={() => setDeleteMessageConfirm({ isOpen: false, messageId: null })}
          onConfirm={handleDeleteMessage}
          title="Supprimer le message"
          description="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
          isLoading={deleteMessageMutation.isPending}
        />
      </motion.div>
    </div>
  );
};

export default CommunicationHub;
