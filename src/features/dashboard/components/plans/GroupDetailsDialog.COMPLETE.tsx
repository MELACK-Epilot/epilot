/**
 * Dialogue complet affichant les détails d'un groupe scolaire
 * Inclut: informations, écoles, utilisateurs, paiements, contact, export, impression
 * @module GroupDetailsDialog
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Users, School, Calendar, DollarSign, TrendingUp, X, 
  Download, Printer, FileText, Phone, Mail, MapPin, Globe,
  CreditCard, UserCheck, GraduationCap, BookOpen
} from 'lucide-react';
import { type PlanSubscription } from '../../hooks/usePlanSubscriptions';
import { useGroupDetails } from '../../hooks/useGroupDetails';
import { formatDate } from './utils/subscriptions.utils';
import { formatBillingPeriod, formatPrice, exportGroupToExcel, exportGroupToPDF, printGroupDetails } from './utils/groupDialog.utils';

interface GroupDetailsDialogProps {
  group: PlanSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20';
    case 'trial':
      return 'bg-[#E9C46A]/10 text-[#E9C46A] border-[#E9C46A]/20';
    case 'cancelled':
      return 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Actif';
    case 'trial': return 'Essai';
    case 'cancelled': return 'Annulé';
    case 'expired': return 'Expiré';
    default: return status;
  }
};

export const GroupDetailsDialog = ({ group, open, onOpenChange }: GroupDetailsDialogProps) => {
  const { data: details, isLoading: detailsLoading } = useGroupDetails(group?.school_group_id);

  if (!group) return null;

  const handleExportExcel = () => {
    exportGroupToExcel(group, details || null);
  };

  const handleExportPDF = () => {
    exportGroupToPDF(group, details || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto print:max-w-none print:max-h-none">
        <DialogHeader className="print:mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Logo du groupe */}
              <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2A9D8F]/20 to-[#1D3557]/20">
                {group.school_group_logo ? (
                  <img
                    src={group.school_group_logo}
                    alt={group.school_group_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-[#2A9D8F]" />
                )}
              </div>

              {/* Nom et statut */}
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {group.school_group_name}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={getStatusColor(group.status)}>
                    {getStatusLabel(group.status)}
                  </Badge>
                  {group.auto_renew && (
                    <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Auto-renew
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {group.plan_name}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={printGroupDetails}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Contenu avec onglets */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5 no-print">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="schools">Écoles ({group.schools_count || 0})</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs ({group.users_count || 0})</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Informations d'abonnement */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#2A9D8F]" />
                Abonnement
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Plan</p>
                  <p className="font-semibold text-gray-900">{group.plan_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Prix</p>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(group.plan_price || 0, group.plan_currency || 'FCFA')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatBillingPeriod(group.plan_billing_period || 'monthly')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Date de début</p>
                  <p className="font-semibold text-gray-900">{formatDate(group.start_date)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Date de fin</p>
                  <p className="font-semibold text-gray-900">{formatDate(group.end_date)}</p>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2A9D8F]" />
                Statistiques
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <School className="h-5 w-5" />
                    </div>
                    <p className="text-white/80 text-sm">Écoles</p>
                  </div>
                  <p className="text-3xl font-bold">{group.schools_count || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="text-white/80 text-sm">Utilisateurs</p>
                  </div>
                  <p className="text-3xl font-bold">{group.users_count || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <p className="text-white/80 text-sm">Élèves</p>
                  </div>
                  <p className="text-3xl font-bold">
                    {details?.schools?.reduce((sum, school) => sum + (school.students_count || 0), 0) || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#E63946] to-[#c52030] rounded-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <p className="text-white/80 text-sm">Enseignants</p>
                  </div>
                  <p className="text-3xl font-bold">
                    {details?.schools?.reduce((sum, school) => sum + (school.teachers_count || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Modules actifs */}
            {details?.modules && details.modules.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#2A9D8F]" />
                  Modules actifs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {details.modules.map((module, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Onglet Écoles */}
          <TabsContent value="schools" className="space-y-4">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : details?.schools && details.schools.length > 0 ? (
              <div className="grid gap-4">
                {details.schools.map((school) => (
                  <div key={school.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <School className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{school.name}</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          {school.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{school.address}</span>
                            </div>
                          )}
                          {school.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{school.phone}</span>
                            </div>
                          )}
                          {school.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{school.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            <span>{school.students_count || 0} élèves</span>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {school.teachers_count || 0} enseignants
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {school.students_count || 0} élèves
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune école trouvée pour ce groupe
              </div>
            )}
          </TabsContent>

          {/* Onglet Utilisateurs */}
          <TabsContent value="users" className="space-y-4">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : details?.users && details.users.length > 0 ? (
              <div className="grid gap-3">
                {details.users.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {user.role}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          Inscrit le {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun utilisateur trouvé pour ce groupe
              </div>
            )}
          </TabsContent>

          {/* Onglet Paiements */}
          <TabsContent value="payments" className="space-y-4">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : details?.payments && details.payments.length > 0 ? (
              <div className="grid gap-3">
                {details.payments.map((payment) => (
                  <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {formatPrice(payment.amount, payment.currency)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {payment.payment_method || 'Méthode non spécifiée'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={payment.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}
                        >
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun paiement trouvé pour ce groupe
              </div>
            )}
          </TabsContent>

          {/* Onglet Contact */}
          <TabsContent value="contact" className="space-y-4">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {details?.contact?.name && (
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Nom du contact</p>
                          <p className="font-medium text-gray-900">{details.contact.name}</p>
                        </div>
                      </div>
                    )}
                    {details?.contact?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{details.contact.email}</p>
                        </div>
                      </div>
                    )}
                    {details?.contact?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone</p>
                          <p className="font-medium text-gray-900">{details.contact.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {details?.contact?.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Adresse</p>
                          <p className="font-medium text-gray-900">{details.contact.address}</p>
                        </div>
                      </div>
                    )}
                    {details?.contact?.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Site web</p>
                          <a 
                            href={details.contact.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {details.contact.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {!details?.contact?.name && !details?.contact?.email && !details?.contact?.phone && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune information de contact disponible
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
