/**
 * Carte de bienvenue personnalisée pour le dashboard
 * @module WelcomeCard
 */

import { Settings, Activity, Plus, School, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

export const WelcomeCard = () => {
  const { user } = useAuthStore();
  const { data: stats } = useDashboardStats();
  
  const isSuperAdmin = user?.role === 'super_admin';

  // Actions rapides adaptées selon le rôle
  const quickActions = useMemo(() => {
    if (isSuperAdmin) {
      return [
        {
          icon: Plus,
          label: 'Ajouter Groupe',
          href: '/dashboard/school-groups?action=create',
          color: 'text-[#2A9D8F]',
        },
        {
          icon: Activity,
          label: 'Activité',
          href: '/dashboard/activity-logs',
          color: 'text-[#E9C46A]',
        },
        {
          icon: Settings,
          label: 'Paramètres',
          href: '/dashboard/settings',
          color: 'text-gray-600',
        },
      ];
    }
    
    // Actions pour Admin Groupe
    return [
      {
        icon: School,
        label: 'Ajouter École',
        href: '/dashboard/schools?action=create',
        color: 'text-[#2A9D8F]',
      },
      {
        icon: Users,
        label: 'Ajouter Utilisateur',
        href: '/dashboard/users?action=create',
        color: 'text-[#1D3557]',
      },
      {
        icon: Activity,
        label: 'Activité',
        href: '/dashboard/activity-logs',
        color: 'text-[#E9C46A]',
      },
      {
        icon: Settings,
        label: 'Mon Profil',
        href: '/dashboard/profile',
        color: 'text-gray-600',
      },
    ];
  }, [isSuperAdmin]);

  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        isSuperAdmin 
          ? 'p-6 bg-gradient-to-br from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d] border border-[#2A9D8F]/30 shadow-2xl'
          : 'p-5 bg-gradient-to-br from-white via-white to-blue-50/30 backdrop-blur-xl border border-gray-200/60 shadow-xl'
      }`}>
        {/* Effet de brillance animé */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] ${
          isSuperAdmin ? 'opacity-100' : 'opacity-50'
        }`} />
        
        {/* Cercles décoratifs améliorés */}
        <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${
          isSuperAdmin ? 'bg-[#2A9D8F]/15' : 'bg-[#2A9D8F]/10'
        }`} />
        <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl ${
          isSuperAdmin ? 'bg-[#E9C46A]/15' : 'bg-[#1D3557]/10'
        }`} />
        <div className={`absolute top-1/2 right-1/4 w-24 h-24 rounded-full blur-2xl ${
          isSuperAdmin ? 'bg-purple-500/10' : 'bg-blue-500/5'
        }`} />
        <div className="relative flex items-center justify-between">
          {/* Informations utilisateur */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className={`font-bold ${
                isSuperAdmin ? 'text-2xl text-white' : 'text-xl text-gray-900'
              }`}>
                {isSuperAdmin 
                  ? `Bonjour, ${user?.firstName || 'Administrateur'} 👋`
                  : `${user?.schoolGroupName || 'Groupe Scolaire'} 🏫`
                }
              </h1>
            </div>
            <p className={`text-xs font-medium mt-0.5 ${
              isSuperAdmin ? 'text-white/80' : 'text-gray-600'
            }`}>
              {isSuperAdmin 
                ? 'Plateforme E-Pilot Congo 🇨🇬'
                : `Bonjour ${user?.firstName} • ${stats?.totalSchoolGroups || 0} école(s) • ${stats?.estimatedMRR || 0} élèves`
              }
            </p>
          </div>

          {/* Badge statut - Compact pour Admin Groupe */}
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-sm ${
              isSuperAdmin 
                ? 'bg-gradient-to-r from-[#2A9D8F]/20 to-[#2A9D8F]/10 border-[#2A9D8F]/30'
                : 'bg-white/60 border-[#2A9D8F]/20'
            }`}>
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full animate-pulse" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-[#2A9D8F] rounded-full animate-ping" />
              </div>
              <span className={`text-[10px] font-bold ${
                isSuperAdmin ? 'text-[#2A9D8F]' : 'text-gray-700'
              }`}>Actif</span>
            </div>
          </div>
        </div>

        {/* Actions rapides - Compactes pour Admin Groupe */}
        {!isSuperAdmin && (
          <div className="relative mt-2 pt-2 border-t border-gray-200/50">
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickActions.slice(0, 3).map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-gray-700 hover:text-gray-900 hover:bg-white/60 transition-all duration-200 font-medium backdrop-blur-sm border border-gray-200/50 hover:border-gray-300"
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <a href={action.href} className="flex items-center gap-1">
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </a>
                  ) : (
                    <span className="flex items-center gap-1">
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions Super Admin - Inchangées */}
        {isSuperAdmin && (
          <div className="relative mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 flex-wrap">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-white/90 hover:text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 font-medium backdrop-blur-sm border border-white/10 hover:border-white/30"
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <a href={action.href} className="flex items-center gap-1.5">
                      <action.icon className="h-3.5 w-3.5" />
                      {action.label}
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <action.icon className="h-3.5 w-3.5" />
                      {action.label}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
