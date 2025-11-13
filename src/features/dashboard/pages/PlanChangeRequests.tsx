/**
 * Page de gestion des demandes de changement de plan (Super Admin) - VERSION PREMIUM
 * Design glassmorphism, KPIs avancés, timeline, filtres, export
 * @module PlanChangeRequests
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Home,
  ChevronRight,
  Search,
  Filter,
  Download,
  ArrowRight,
  DollarSign,
  Users,
  Package,
  History,
  Eye,
  MessageSquare,
} from 'lucide-react';
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

/**
 * Page principale
 */
export const PlanChangeRequests = () => {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PlanChangeRequest | null>(null);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data: requests, isLoading } = usePlanChangeRequests(statusFilter);
  const { data: stats } = usePlanChangeRequestsStats();

  // Filtrage par recherche
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (!searchQuery) return requests;
    
    const query = searchQuery.toLowerCase();
    return requests.filter(req =>
      req.schoolGroupName.toLowerCase().includes(query) ||
      req.schoolGroupCode.toLowerCase().includes(query) ||
      req.currentPlanName.toLowerCase().includes(query) ||
      req.requestedPlanName.toLowerCase().includes(query) ||
      req.requestedByName.toLowerCase().includes(query)
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

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Demandes de changement de plan</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1D3557] mb-2">Demandes de changement de plan</h1>
        <p className="text-gray-600">Gérez les demandes d'upgrade des Admin Groupe</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard 
            title="Total" 
            value={stats.total} 
            icon={FileText} 
            gradient="from-gray-500 to-gray-600"
            delay={0}
          />
          <StatsCard 
            title="En attente" 
            value={stats.pending} 
            icon={Clock} 
            gradient="from-yellow-500 to-yellow-600"
            trend={{ value: `${stats.pending} actives`, isPositive: true }}
            delay={0.1}
          />
          <StatsCard 
            title="Approuvées" 
            value={stats.approved} 
            icon={CheckCircle2} 
            gradient="from-green-500 to-green-600"
            trend={{ value: `${Math.round((stats.approved / (stats.total || 1)) * 100)}%`, isPositive: true }}
            delay={0.2}
          />
          <StatsCard 
            title="Refusées" 
            value={stats.rejected} 
            icon={XCircle} 
            gradient="from-red-500 to-red-600"
            delay={0.3}
          />
        </div>
      )}

      {/* Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par groupe, code, plan ou utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('pending')}
        >
          En attente ({stats?.pending || 0})
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('approved')}
        >
          Approuvées ({stats?.approved || 0})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('rejected')}
        >
          Refusées ({stats?.rejected || 0})
        </Button>
        <Button
          variant={statusFilter === undefined ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          Toutes ({stats?.total || 0})
        </Button>
        </div>
      </div>

      {/* Liste des demandes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
        </div>
      ) : filteredRequests && filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              index={index}
              onApprove={() => handleApprove(request)}
              onReject={() => handleReject(request)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande</h3>
          <p className="text-gray-600">
            {searchQuery
              ? `Aucune demande trouvée pour "${searchQuery}"`
              : statusFilter === 'pending'
              ? 'Aucune demande en attente pour le moment'
              : 'Aucune demande trouvée avec ce filtre'}
          </p>
        </Card>
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
    </div>
  );
};

export default PlanChangeRequests;
