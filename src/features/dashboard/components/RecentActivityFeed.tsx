/**
 * Fil d'activité récente pour Admin Groupe
 * Affiche les dernières actions importantes
 * @module RecentActivityFeed
 */

import { School, Users, DollarSign, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecentActivity } from '../hooks/useRecentActivity';

export const RecentActivityFeed = () => {
  const { data: activities = [], isLoading } = useRecentActivity();

  // Mapper le type vers une icône
  const getIcon = (type: string) => {
    switch (type) {
      case 'school': return School;
      case 'user': return Users;
      case 'payment': return DollarSign;
      case 'alert': return AlertCircle;
      case 'report': return FileText;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-[#2A9D8F] bg-[#2A9D8F]/10';
      case 'warning':
        return 'text-[#E9C46A] bg-[#E9C46A]/10';
      case 'info':
        return 'text-[#1D3557] bg-[#1D3557]/10';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Activité Récente</h3>
        <Badge variant="outline" className="text-xs">
          Dernières 24h
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold">Aucune activité récente</p>
          <p className="text-xs mt-1">Les actions apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getIcon(activity.type);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>

              {/* Status */}
                {/* Status */}
                {activity.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Voir Plus */}
      {!isLoading && activities.length > 0 && (
        <button className="w-full mt-4 py-2 text-sm font-medium text-[#2A9D8F] hover:text-[#238276] hover:bg-[#2A9D8F]/5 rounded-lg transition-colors">
          Voir toute l'activité
        </button>
      )}
    </Card>
  );
};
