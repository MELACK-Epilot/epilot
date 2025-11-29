/**
 * UserDetailsDialog - Modal utilisateur complet et moderne (Refactorisé)
 * 
 * Architecture:
 * - Composant orchestrateur (zéro logique métier)
 * - Hooks extraits dans /hooks
 * - Tabs extraits dans /tabs
 * - Utils et types séparés
 * 
 * @module user-details/UserDetailsDialog
 */

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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

import {
  User as UserIcon,
  Mail,
  Printer,
  MoreVertical,
  Edit,
  Key,
  Power,
  Trash2,
  Send,
  Package,
  Shield,
  Activity,
  Briefcase,
  X,
} from 'lucide-react';

import { useAuth } from '@/features/auth/store/auth.store';
import { UserAvatar } from '../../UserAvatar';
import { useUserDetails } from './hooks';
import { getRoleLabel, getProfileLabel } from './utils';
import { OverviewTab, ModulesTab, PermissionsTab, ActivityTab } from './tabs';
import type { UserDetailsDialogProps, ConfirmDialogType } from './types';

export const UserDetailsDialog = ({
  user,
  open,
  onOpenChange,
  onEdit,
}: UserDetailsDialogProps) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmDialog, setShowConfirmDialog] = useState<ConfirmDialogType>(null);

  // Hook principal (toute la logique)
  const {
    profiles,
    userModules,
    activityLogs,
    stats,
    modulesLoading,
    updateProfileMutation,
    handleProfileChange,
    handleToggleStatus,
  } = useUserDetails({ user, open });

  if (!user) return null;

  const canManageUser = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_groupe';
  const isAdminRole = user.role === 'super_admin' || user.role === 'admin_groupe';

  const handleConfirmAction = () => {
    handleToggleStatus();
    setShowConfirmDialog(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          {/* Header - Fixed */}
          <div className="relative bg-gradient-to-r from-[#1D3557] to-[#457B9D] p-6 text-white shrink-0">
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
                <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                    onClick={() => window.print()}
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

          {/* Tabs - Scrollable Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 bg-gray-50 border-b shrink-0">
              <TabsList className="w-full justify-start rounded-none h-auto bg-transparent p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="gap-2 px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none bg-transparent"
                >
                  <UserIcon className="h-4 w-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger
                  value="modules"
                  className="gap-2 px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none bg-transparent"
                >
                  <Package className="h-4 w-4" />
                  Modules ({userModules.length})
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="gap-2 px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none bg-transparent"
                >
                  <Shield className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="gap-2 px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] data-[state=active]:shadow-none bg-transparent"
                >
                  <Activity className="h-4 w-4" />
                  Activité
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Content Area */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab
                    user={user}
                    profiles={profiles}
                    canManageUser={canManageUser}
                    isAdminRole={isAdminRole}
                    onProfileChange={handleProfileChange}
                    isUpdating={updateProfileMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="modules" className="mt-0">
                  <ModulesTab modules={userModules} isLoading={modulesLoading} />
                </TabsContent>

                <TabsContent value="permissions" className="mt-0">
                  <PermissionsTab
                    role={user.role}
                    accessProfileCode={user.accessProfileCode}
                    modules={userModules}
                  />
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <ActivityTab logs={activityLogs} />
                </TabsContent>
              </div>
            </ScrollArea>
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
              onClick={handleConfirmAction}
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

export default UserDetailsDialog;
