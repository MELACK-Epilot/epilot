/**
 * Page Permissions & Modules - VERSION SIMPLIFIÉE
 * Focus unique sur la gestion des accès et rôles
 * @module PermissionsModulesPage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, Users, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/store/auth.store';
import { useUsers } from '../hooks/useUsers';
import { useAccessProfiles } from '../hooks/useAccessProfiles';
import { useAccessProfileStats } from '../hooks/useAccessProfileStats';
import { toast } from 'sonner';

// Composants
import { ProfilesPermissionsView } from '../components/permissions/ProfilesPermissionsView';

export default function PermissionsModulesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data
  const { refetch } = useUsers({ schoolGroupId: user?.schoolGroupId });
  const { data: profileStats, refetch: refetchStats } = useAccessProfileStats();
  const { data: profiles, refetch: refetchProfiles } = useAccessProfiles();

  // KPIs basés sur les profils d'accès (pas les rôles)
  const totalUsersWithProfile = profileStats?.totalUsersWithProfile ?? 0;
  const mostUsedProfile = profileStats?.mostUsedProfile;
  const totalProfiles = profiles?.length ?? 0;
  const configuredProfiles = profiles?.filter((p: any) => 
    Object.keys(p.permissions || {}).length > 0
  ).length ?? 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchStats(), refetchProfiles()]);
      toast.success('Données actualisées');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-[1800px] mx-auto">
      {/* Header Simplifié */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#2A9D8F]" />
            </div>
            Gestion des Accès
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Définissez les permissions pour chaque rôle (Enseignant, Comptable, etc.)
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-500 hover:text-[#2A9D8F]"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs Concrets - Design Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carte Utilisateurs - Bleu */}
        <Card 
          onClick={() => navigate('/dashboard/users')}
          className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 p-6 hover:shadow-xl transition-all group cursor-pointer transform hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                Actifs
              </span>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Utilisateurs Gérés</p>
              <h3 className="text-3xl font-bold text-white">{totalUsersWithProfile}</h3>
            </div>
          </div>
        </Card>

        {/* Carte Rôle Populaire - Violet (Nouveau) */}
        <Card 
          className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600 p-6 hover:shadow-xl transition-all group cursor-pointer transform hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                Top Profil
              </span>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Le plus utilisé</p>
              {mostUsedProfile ? (
                <div>
                  <h3 className="text-xl font-bold text-white truncate">{mostUsedProfile.profile_name}</h3>
                  <p className="text-white/70 text-sm">{mostUsedProfile.user_count} utilisateur{Number(mostUsedProfile.user_count) > 1 ? 's' : ''}</p>
                </div>
              ) : (
                <h3 className="text-xl font-bold text-white">Aucun</h3>
              )}
            </div>
          </div>
        </Card>

        {/* Carte Configurés - Émeraude */}
        <Card 
          className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 hover:shadow-xl transition-all group cursor-pointer transform hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                Opérationnels
              </span>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Profils Configurés</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">{configuredProfiles}</h3>
                <span className="text-sm text-white/70 font-medium">sur {totalProfiles} profils</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Vue Principale - Gestion des Profils */}
      <ProfilesPermissionsView onRefresh={handleRefresh} />
    </div>
  );
}
