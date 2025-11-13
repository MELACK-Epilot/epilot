/**
 * Header moderne pour Dashboard Admin Groupe
 * Design épuré avec stats essentielles et actions rapides
 * @module GroupDashboardHeader
 */

import { Plus, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export const GroupDashboardHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer le titre de la page selon l'URL
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Tableau de Bord';
    if (path.includes('/schools')) return 'Écoles';
    if (path.includes('/users')) return 'Utilisateurs';
    if (path.includes('/finances')) return 'Finances';
    if (path.includes('/reports')) return 'Rapports';
    if (path.includes('/modules')) return 'Modules';
    if (path.includes('/communication')) return 'Communication';
    if (path.includes('/profile')) return 'Mon Profil';
    return 'Tableau de Bord';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-xl bg-white/95"
    >
      <div className="px-6 py-4">
        {/* Ligne 1 : Identité et Actions */}
        <div className="flex items-center justify-between mb-4">
          {/* Logo + Nom du Groupe */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.schoolGroupLogo ? (
                <img
                  src={user.schoolGroupLogo}
                  alt={user.schoolGroupName || 'Logo'}
                  className="w-14 h-14 rounded-xl object-cover shadow-lg border-2 border-white"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white">
                  {user?.schoolGroupName?.[0] || 'G'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2A9D8F] rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {user?.schoolGroupName || 'Groupe Scolaire'}
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Bonjour {user?.firstName} • Tableau de bord
              </p>
            </div>
          </div>

          {/* Titre de la Page (sauf sur dashboard) */}
          {location.pathname !== '/dashboard' && (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {getPageTitle()}
              </h2>
            </div>
          )}

          {/* Actions Rapides */}
          <div className="flex items-center gap-2">

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-10 w-10 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#E63946] rounded-full" />
            </Button>

            {/* Ajouter École */}
            <Button
              onClick={() => navigate('/dashboard/schools?action=create')}
              className="bg-[#2A9D8F] hover:bg-[#238276] text-white gap-2 h-10"
            >
              <Plus className="w-4 h-4" />
              Nouvelle École
            </Button>

            {/* Paramètres */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/dashboard/profile')}
              className="h-10 w-10"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
