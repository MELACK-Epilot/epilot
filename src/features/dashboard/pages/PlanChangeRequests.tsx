/**
 * Page de gestion des demandes de changement de plan (Super Admin) - VERSION PREMIUM
 * Design moderne cohérent avec la page Plans, fonctionnalités complètes
 * @module PlanChangeRequests
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Building2,
  User,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  Search,
  Download,
  ArrowRight,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileSpreadsheet,
  FileDown,
  Copy,
  RefreshCw,
  Zap,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  usePlanChangeRequests,
  usePlanChangeRequestsStats,
  useApprovePlanChangeRequest,
  useRejectPlanChangeRequest,
  type PlanChangeRequest,
} from '../hooks/usePlanChangeRequests';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PLAN_RESTRICTIONS } from '../config/planRestrictions';

/**
 * Stats Card Premium avec Glassmorphism
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  delay = 0,
}: {
  title: string;
  value: number;
  icon: any;
  gradient: string;
  trend?: { value: string; isPositive: boolean };
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className={`group relative p-6 overflow-hidden border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br ${gradient}`}>
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6 text-white" />
            </div>
            {trend && (
              <div className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg flex items-center gap-1">
                <TrendingUp className={`w-3.5 h-3.5 ${trend.isPositive ? 'text-white/90' : 'text-white/60'}`} />
                <span className="text-xs font-bold text-white/90">{trend.value}</span>
              </div>
            )}
          </div>
          <p className="text-white/70 text-sm font-semibold tracking-wide uppercase mb-2">{title}</p>
          <p className="text-4xl font-extrabold text-white drop-shadow-lg">{value}</p>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Dialog de révision
 */
const ReviewDialog = ({
  request,
  isOpen,
  onClose,
  type,
}: {
  request: PlanChangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'approve' | 'reject';
}) => {
  const [notes, setNotes] = useState('');
  const approveRequest = useApprovePlanChangeRequest();
  const rejectRequest = useRejectPlanChangeRequest();

  const handleSubmit = async () => {
    if (!request) return;

    try {
      if (type === 'approve') {
        await approveRequest.mutateAsync({
          requestId: request.id,
          reviewNotes: notes || undefined,
        });
      } else {
        await rejectRequest.mutateAsync({
          requestId: request.id,
          reviewNotes: notes || undefined,
        });
      }

      setNotes('');
      onClose();
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'approve' ? 'Approuver la demande' : 'Refuser la demande'}
          </DialogTitle>
          <DialogDescription>
            {type === 'approve'
              ? 'Le plan du groupe sera automatiquement mis à jour.'
              : 'La demande sera refusée et l\'Admin Groupe sera notifié.'}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Groupe :</span> {request.schoolGroupName}
              </p>
              <p>
                <span className="font-medium">Plan actuel :</span> {request.currentPlanName}
              </p>
              <p>
                <span className="font-medium">Plan demandé :</span> {request.requestedPlanName}
              </p>
              <p>
                <span className="font-medium">Coût estimé :</span>{' '}
                {request.estimatedCost.toLocaleString()} FCFA/mois
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  type === 'approve'
                    ? 'Ajoutez des notes pour l\'Admin Groupe...'
                    : 'Expliquez la raison du refus...'
                }
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={approveRequest.isPending || rejectRequest.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={approveRequest.isPending || rejectRequest.isPending}
            className={
              type === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {approveRequest.isPending || rejectRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : type === 'approve' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approuver
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Refuser
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Carte de demande Premium avec Timeline
 */
const RequestCard = ({
  request,
  index,
  onApprove,
  onReject,
}: {
  request: PlanChangeRequest;
  index: number;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approuvée
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
            <XCircle className="w-3 h-3 mr-1" />
            Refusée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg">
            Annulée
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const currentPlan = PLAN_RESTRICTIONS[request.currentPlanName?.toLowerCase() || 'gratuit'];
  const requestedPlan = PLAN_RESTRICTIONS[request.requestedPlanName?.toLowerCase() || 'premium'];
  const priceDiff = (requestedPlan?.price.monthly || 0) - (currentPlan?.price.monthly || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group relative p-6 hover:shadow-2xl transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/30">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7" />
              </div>
              {request.status === 'pending' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#2A9D8F] transition-colors">
                {request.schoolGroupName}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {request.schoolGroupCode}
                </Badge>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-600">
                  {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Plan actuel</p>
            <p className="font-medium text-gray-900">{request.currentPlanName}</p>
            <p className="text-sm text-gray-600">{request.currentPlanPrice?.toLocaleString()} FCFA/mois</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Plan demandé</p>
            <p className="font-medium text-[#2A9D8F]">{request.requestedPlanName}</p>
            <p className="text-sm text-gray-600">{request.requestedPlanPrice.toLocaleString()} FCFA/mois</p>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>Demandé par : {request.requestedByName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              Le {format(new Date(request.createdAt), 'dd MMMM yyyy', { locale: fr })}
            </span>
          </div>
          {request.desiredDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                Date souhaitée : {format(new Date(request.desiredDate), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
          {request.reason && (
            <div className="flex items-start gap-2 text-gray-600">
              <FileText className="w-4 h-4 mt-0.5" />
              <span className="flex-1">{request.reason}</span>
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onReject}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refuser
            </Button>
            <Button
              onClick={onApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approuver
            </Button>
          </div>
        )}

        {request.status !== 'pending' && request.reviewedByName && (
          <div className="pt-4 border-t text-sm text-gray-600">
            <p>
              {request.status === 'approved' ? 'Approuvée' : 'Refusée'} par {request.reviewedByName} le{' '}
              {format(new Date(request.reviewedAt!), 'dd MMMM yyyy', { locale: fr })}
            </p>
            {request.reviewNotes && <p className="mt-1 italic">"{request.reviewNotes}"</p>}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

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

/**
 * Page principale
 */
export const PlanChangeRequests = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PlanChangeRequest | null>(null);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: requests, isLoading, refetch } = usePlanChangeRequests(statusFilter);
  const { data: stats } = usePlanChangeRequestsStats();

  // Filtrage par recherche
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (!searchQuery) return requests;
    
    const query = searchQuery.toLowerCase();
    return requests.filter(req =>
      req.schoolGroupName?.toLowerCase().includes(query) ||
      req.schoolGroupCode?.toLowerCase().includes(query) ||
      req.currentPlanName?.toLowerCase().includes(query) ||
      req.requestedPlanName?.toLowerCase().includes(query) ||
      req.requestedByName?.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  const handleApprove = (request: PlanChangeRequest) => {
    setSelectedRequest(request);
    setReviewType('approve');
    setIsReviewDialogOpen(true);
  };

  const handleReject = (request: PlanChangeRequest) => {
    setSelectedRequest(request);
    setReviewType('reject');
    setIsReviewDialogOpen(true);
  };

  // Export Excel
  const exportToExcel = () => {
    if (!filteredRequests.length) return;
    
    const headers = ['Groupe', 'Code', 'Plan Actuel', 'Plan Demandé', 'Demandeur', 'Statut', 'Date'];
    const rows = filteredRequests.map(req => [
      req.schoolGroupName,
      req.schoolGroupCode,
      req.currentPlanName || 'N/A',
      req.requestedPlanName,
      req.requestedByName,
      req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Approuvée' : 'Refusée',
      new Date(req.createdAt).toLocaleDateString('fr-FR')
    ]);
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1D3557" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Demandes">
    <Table>
      <Row>${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
      ${rows.map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join('')}</Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`;
    
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `demandes-changement-plan-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    
    toast({ title: "Export réussi", description: "Fichier Excel téléchargé" });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto space-y-6"
      >
        {/* Header Premium */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#E9C46A] to-[#F4A261] rounded-2xl shadow-lg">
              <ArrowRight className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1D3557] tracking-tight">
                Demandes de Changement
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <span>Gérez les demandes d'upgrade des Admin Groupe</span>
                {stats?.pending ? (
                  <Badge className="bg-orange-500 text-white border-0 animate-pulse">
                    {stats.pending} en attente
                  </Badge>
                ) : null}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={exportToExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/plans')}
              className="bg-[#1D3557] hover:bg-[#152a45] text-white gap-2"
            >
              <Package className="w-4 h-4" />
              Voir les Plans
            </Button>
          </div>
        </motion.div>

        {/* 4 KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Total</p>
                <p className="text-4xl font-bold text-white">{stats?.total || 0}</p>
              </div>
            </Card>
          </motion.div>

          {/* En attente */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-orange-500 to-amber-600 p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  {stats?.pending ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                  ) : null}
                </div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">En Attente</p>
                <p className="text-4xl font-bold text-white">{stats?.pending || 0}</p>
              </div>
            </Card>
          </motion.div>

          {/* Approuvées */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {stats?.total ? Math.round((stats.approved / stats.total) * 100) : 0}%
                  </Badge>
                </div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Approuvées</p>
                <p className="text-4xl font-bold text-white">{stats?.approved || 0}</p>
              </div>
            </Card>
          </motion.div>

          {/* Refusées */}
          <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-[#E63946] to-[#c62d3a] p-6 hover:shadow-xl transition-all group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Refusées</p>
                <p className="text-4xl font-bold text-white">{stats?.rejected || 0}</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filtres et Recherche */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par groupe, code, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              className={statusFilter === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              <Clock className="w-4 h-4 mr-2" />
              En attente ({stats?.pending || 0})
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('approved')}
              className={statusFilter === 'approved' ? 'bg-[#2A9D8F] hover:bg-[#238b7e]' : ''}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approuvées ({stats?.approved || 0})
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('rejected')}
              className={statusFilter === 'rejected' ? 'bg-[#E63946] hover:bg-[#c62d3a]' : ''}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refusées ({stats?.rejected || 0})
            </Button>
            <Button
              variant={statusFilter === undefined ? 'default' : 'outline'}
              onClick={() => setStatusFilter(undefined)}
            >
              Toutes ({stats?.total || 0})
            </Button>
          </div>
        </motion.div>

        {/* Liste des demandes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
          </div>
        ) : filteredRequests && filteredRequests.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredRequests.map((request, index) => (
              <RequestCard
                key={request.id}
                request={request}
                index={index}
                onApprove={() => handleApprove(request)}
                onReject={() => handleReject(request)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card className="p-12 text-center border-0 shadow-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune demande</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery
                  ? `Aucune demande trouvée pour "${searchQuery}"`
                  : statusFilter === 'pending'
                  ? 'Aucune demande en attente pour le moment. Les Admin Groupe peuvent soumettre des demandes de changement de plan.'
                  : 'Aucune demande trouvée avec ce filtre.'}
              </p>
              {statusFilter !== undefined && (
                <Button 
                  variant="outline" 
                  onClick={() => setStatusFilter(undefined)}
                  className="mt-4"
                >
                  Voir toutes les demandes
                </Button>
              )}
            </Card>
          </motion.div>
        )}

        {/* Dialog de révision */}
        <ReviewDialog
          request={selectedRequest}
          isOpen={isReviewDialogOpen}
          onClose={() => {
            setIsReviewDialogOpen(false);
            setSelectedRequest(null);
          }}
          type={reviewType}
        />
      </motion.div>
    </div>
  );
};

export default PlanChangeRequests;
