/**
 * Header du Dashboard Proviseur
 */

import { memo } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export const DashboardHeader = memo(() => {
  const { data: user } = useCurrentUser();
  const currentDate = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-sm hover:shadow-lg transition-all duration-500 relative overflow-hidden group">
      {/* Éléments décoratifs subtils */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-100/25 to-teal-100/15 rounded-full -ml-16 -mb-16 group-hover:scale-110 transition-transform duration-1000"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          {/* Titre et navigation */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                Dashboard Proviseur
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Vue d'ensemble de votre établissement
              </p>
            </div>
          </div>

          {/* Infos utilisateur et date */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium capitalize">{formatDate(currentDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{user?.school?.name || 'École'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name || 'Proviseur'}</p>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0">
                  Proviseur
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de statut */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-600">Système opérationnel</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="text-sm text-gray-600">
            Dernière mise à jour : <span className="font-medium">{formatTime(currentDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
