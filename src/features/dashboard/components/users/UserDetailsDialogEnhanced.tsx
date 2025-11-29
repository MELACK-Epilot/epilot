/**
 * UserDetailsDialogEnhanced - Modal utilisateur complet et moderne
 * 
 * Features:
 * - Actions rapides (modifier profil, activer/désactiver, reset password)
 * - Modules assignés en temps réel
 * - Statistiques utilisateur
 * - Historique d'activité temps réel
 * - Design moderne avec animations
 * 
 * @module UserDetailsDialogEnhanced
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Icons
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Printer,
  MoreVertical,
  Edit,
  UserCog,
  Key,
  Power,
  Trash2,
  Send,
  Package,
  Eye,
  PenLine,
  Download,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  GraduationCap,
  Briefcase,
  X,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { User } from '../../types/dashboard.types';
import { UserAvatar } from '../UserAvatar';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';
import { useAccessProfiles } from '../../hooks/useAccessProfiles';

// ============================================
// TYPES
// ============================================

interface UserDetailsDialogEnhancedProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: User) => void;
  onRefresh?: () => void;
}

interface UserModule {
  id: string;
  module_id: string;
  module_name: string;
  module_slug: string;
  module_icon: string | null;
  category_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_export: boolean;
  assigned_by_profile: string | null;
}

interface UserStats {
  totalLogins: number;
  lastLoginDays: number;
  modulesCount: number;
  activityScore: number;
}

// ============================================
// HOOKS
// ============================================

const useUserModules = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-modules-detail', userId],
    queryFn: async (): Promise<UserModule[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_modules')
        .select(`
          id,
          module_id,
          can_read,
          can_write,
          can_delete,
          can_export,
          assigned_by_profile,
          modules!inner(
            name,
            slug,
            icon,
            business_categories(name)
          )
        `)
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (error) throw error;

      return (data || []).map((um: any) => ({
        id: um.id,
        module_id: um.module_id,
        module_name: um.modules?.name || 'Module',
        module_slug: um.modules?.slug || '',
        module_icon: um.modules?.icon,
        category_name: um.modules?.business_categories?.name || 'Autre',
        can_read: um.can_read,
        can_write: um.can_write,
        can_delete: um.can_delete,
        can_export: um.can_export,
        assigned_by_profile: um.assigned_by_profile,
      }));
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

const useUserActivity = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Activity logs not available:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, profileCode }: { userId: string; profileCode: string | null }) => {
      const { error } = await supabase
        .from('users')
        .update({ access_profile_code: profileCode })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-modules-detail'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('Profil mis à jour', {
        description: 'Les modules ont été synchronisés automatiquement.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
};

const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'active' | 'inactive' }) => {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        variables.newStatus === 'active' ? 'Compte activé' : 'Compte désactivé'
      );
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
};

// ============================================
// HELPERS
// ============================================

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_groupe: 'Admin Groupe',
    proviseur: 'Proviseur',
    directeur: 'Directeur',
    directeur_etudes: 'Directeur des Études',
    enseignant: 'Enseignant',
    comptable: 'Comptable',
    secretaire: 'Secrétaire',
    surveillant: 'Surveillant',
    cpe: 'CPE',
    bibliothecaire: 'Bibliothécaire',
    infirmier: 'Infirmier',
    parent: 'Parent',
    eleve: 'Élève',
  };
  return labels[role] || role;
};

const getProfileLabel = (code: string | null | undefined): string => {
  if (!code) return 'Aucun profil';
  const labels: Record<string, string> = {
    chef_etablissement: 'Chef d\'Établissement',
    financier_sans_suppression: 'Financier',
    administratif_basique: 'Administratif',
    enseignant_saisie_notes: 'Enseignant',
    parent_consultation: 'Parent',
    eleve_consultation: 'Élève',
  };
  return labels[code] || code;
};

// ============================================
// COMPONENT
// ============================================

export const UserDetailsDialogEnhanced = ({
  user,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: UserDetailsDialogEnhancedProps) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmDialog, setShowConfirmDialog] = useState<'deactivate' | 'delete' | null>(null);

  // Hooks
  const { data: profiles = [] } = useAccessProfiles();
  const { data: userModules = [], isLoading: modulesLoading, refetch: refetchModules } = useUserModules(user?.id);
  const { data: activityLogs = [] } = useUserActivity(user?.id);
  const updateProfileMutation = useUpdateUserProfile();
  const toggleStatusMutation = useToggleUserStatus();

  // Realtime subscription
  useEffect(() => {
    if (!user?.id || !open) return;

    const channel = supabase
      .channel(`user-detail:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('🔔 Modules changed for user');
          refetchModules();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, open, refetchModules]);

  if (!user) return null;

  // Stats
  const stats: UserStats = {
    totalLogins: activityLogs.filter((a: any) => a.action === 'login').length,
    lastLoginDays: user.lastLogin
      ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
      : -1,
    modulesCount: userModules.length,
    activityScore: Math.min(100, activityLogs.length * 5),
  };

  // Modules grouped by category
  const modulesByCategory = userModules.reduce<Record<string, UserModule[]>>((acc, mod) => {
    const key = mod.category_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mod);
    return acc;
  }, {});

  // Handlers
  const handleProfileChange = (profileCode: string) => {
    if (!user.id) return;
    updateProfileMutation.mutate({
      userId: user.id,
      profileCode: profileCode === 'none' ? null : profileCode,
    });
  };

  const handleToggleStatus = () => {
    if (!user.id) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ userId: user.id, newStatus });
    setShowConfirmDialog(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const canManageUser = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_groupe';
  const isAdminRole = user.role === 'super_admin' || user.role === 'admin_groupe';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#1D3557] to-[#457B9D] p-6 text-white shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-5">
              <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatar={user.avatar}
                status={user.status}
                size="xl"
                className="ring-4 ring-white/20"
              />

              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-white/80 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge
                    className={
                      user.status === 'active'
                        ? 'bg-green-500/20 text-green-100 border-green-400/30'
                        : 'bg-red-500/20 text-red-100 border-red-400/30'
                    }
                  >
                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                  {user.accessProfileCode && (
                    <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/30">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {getProfileLabel(user.accessProfileCode)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {canManageUser && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimer
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEdit?.(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="h-4 w-4 mr-2" />
                        Réinitialiser MDP
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer un message
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowConfirmDialog('deactivate')}
                        className={user.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {user.status === 'active' ? 'Désactiver' : 'Activer'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowConfirmDialog('delete')}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{stats.modulesCount}</p>
                <p className="text-xs text-white/70">Modules</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{stats.totalLogins}</p>
                <p className="text-xs text-white/70">Connexions</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">
                  {stats.lastLoginDays >= 0 ? `${stats.lastLoginDays}j` : '-'}
                </p>
                <p className="text-xs text-white/70">Dernière connexion</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Progress value={stats.activityScore} className="h-2 mt-2" />
                <p className="text-xs text-white/70 mt-1">Activité</p>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 bg-gray-50 border-b shrink-0">
              <TabsList className="w-full justify-start rounded-none h-auto bg-transparent p-0">
                <TabsTrigger 
                  value="overview" 
                  className="gap-2 px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none"
                >
                  <UserIcon className="h-4 w-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger 
                  value="modules" 
                  className="gap-2 px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none"
                >
                  <Package className="h-4 w-4" />
                  Modules ({userModules.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className="gap-2 px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none"
                >
                  <Shield className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="gap-2 px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none"
                >
                  <Activity className="h-4 w-4" />
                  Activité
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <ScrollArea className="h-full w-full">
                <div className="p-6">
                  {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                        Informations Personnelles
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Téléphone</span>
                          <span className="font-medium">{user.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Genre</span>
                          <span className="font-medium">
                            {user.gender === 'M' ? 'Masculin' : user.gender === 'F' ? 'Féminin' : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date de naissance</span>
                          <span className="font-medium">
                            {user.dateOfBirth
                              ? format(new Date(user.dateOfBirth), 'dd MMM yyyy', { locale: fr })
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Créé le</span>
                          <span className="font-medium">
                            {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Organization */}
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        Organisation
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Groupe Scolaire</span>
                          <span className="font-medium">{user.schoolGroupName || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">École</span>
                          <span className="font-medium">{user.schoolName || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rôle</span>
                          <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Profil d'accès</span>
                          <Badge variant="secondary">
                            {getProfileLabel(user.accessProfileCode)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Profile Change */}
                  {canManageUser && !isAdminRole && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Changer le profil d'accès
                      </h4>
                      <div className="flex items-center gap-3">
                        <Select
                          value={user.accessProfileCode || 'none'}
                          onValueChange={handleProfileChange}
                          disabled={updateProfileMutation.isPending}
                        >
                          <SelectTrigger className="w-64 bg-white">
                            <SelectValue placeholder="Sélectionner un profil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun profil</SelectItem>
                            {profiles.map((p: any) => (
                              <SelectItem key={p.code} value={p.code}>
                                {p.name_fr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {updateProfileMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                        )}
                        <span className="text-sm text-amber-700">
                          Les modules seront synchronisés automatiquement
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Modules Tab */}
                <TabsContent value="modules" className="mt-0 space-y-4">
                  {modulesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : userModules.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Aucun module assigné</p>
                      <p className="text-sm mt-1">
                        Assignez un profil pour attribuer des modules automatiquement
                      </p>
                    </div>
                  ) : (
                    Object.entries(modulesByCategory).map(([category, modules]) => (
                      <div key={category} className="bg-white rounded-xl border p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {modules.map((mod) => (
                            <div
                              key={mod.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="font-medium text-sm">{mod.module_name}</span>
                              <div className="flex items-center gap-1">
                                {mod.can_read && (
                                  <Badge variant="outline" className="text-xs px-1.5">
                                    <Eye className="h-3 w-3" />
                                  </Badge>
                                )}
                                {mod.can_write && (
                                  <Badge variant="outline" className="text-xs px-1.5">
                                    <PenLine className="h-3 w-3" />
                                  </Badge>
                                )}
                                {mod.can_export && (
                                  <Badge variant="outline" className="text-xs px-1.5">
                                    <Download className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        Rôle Système
                      </h3>
                      <div className="p-4 bg-emerald-50 rounded-lg">
                        <p className="text-lg font-bold text-emerald-900">
                          {getRoleLabel(user.role)}
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                          Définit les accès de base dans l'application
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        Profil d'Accès
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-900">
                          {getProfileLabel(user.accessProfileCode)}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Définit les modules et permissions granulaires
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Summary */}
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Résumé des Droits</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">
                          {userModules.filter((m) => m.can_read).length}
                        </p>
                        <p className="text-xs text-green-600">Lecture</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">
                          {userModules.filter((m) => m.can_write).length}
                        </p>
                        <p className="text-xs text-blue-600">Écriture</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">
                          {userModules.filter((m) => m.can_delete).length}
                        </p>
                        <p className="text-xs text-red-600">Suppression</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">
                          {userModules.filter((m) => m.can_export).length}
                        </p>
                        <p className="text-xs text-purple-600">Export</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-0 space-y-4">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Aucune activité récente</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityLogs.map((log: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-white rounded-lg border hover:border-gray-300 transition-colors"
                        >
                          <div
                            className={`p-2 rounded-full ${
                              log.action === 'login'
                                ? 'bg-green-100 text-green-600'
                                : log.action === 'logout'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {log.action === 'login' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : log.action === 'logout' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <Activity className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{log.action}</p>
                            <p className="text-xs text-gray-500">{log.details || '-'}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {log.created_at &&
                              formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!showConfirmDialog} onOpenChange={() => setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showConfirmDialog === 'deactivate'
                ? user.status === 'active'
                  ? 'Désactiver ce compte ?'
                  : 'Activer ce compte ?'
                : 'Supprimer ce compte ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showConfirmDialog === 'deactivate'
                ? user.status === 'active'
                  ? "L'utilisateur ne pourra plus se connecter."
                  : "L'utilisateur pourra à nouveau se connecter."
                : 'Cette action est irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={showConfirmDialog === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserDetailsDialogEnhanced;
