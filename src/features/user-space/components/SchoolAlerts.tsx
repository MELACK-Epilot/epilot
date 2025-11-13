/**
 * Composant pour afficher les alertes importantes de l'école
 * React 19 Best Practices
 * 
 * @module SchoolAlerts
 */

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * Interface pour une alerte système
 */
interface SystemAlert {
  id: string;
  type: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  action_required: boolean;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  created_at: string;
  school_id?: string;
  school_group_id?: string;
}

/**
 * Configuration des icônes et couleurs par sévérité
 */
const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    badgeColor: 'bg-red-500',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    badgeColor: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    badgeColor: 'bg-orange-500',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    badgeColor: 'bg-blue-500',
  },
} as const;

/**
 * Hook pour récupérer les alertes de l'école
 */
const useSchoolAlerts = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-alerts', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) {
        throw new Error('Utilisateur non associé à une école');
      }

      console.log('🔍 Chargement des alertes pour l\'école:', user.schoolId);

      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('school_id', user.schoolId)
        .eq('is_read', false)
        .is('resolved_at', null)
        .in('severity', ['critical', 'error', 'warning'])
        .order('severity', { ascending: true }) // critical first
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Erreur récupération alertes:', error);
        throw error;
      }

      console.log('✅ Alertes trouvées:', data?.length || 0);
      return data as SystemAlert[];
    },
    enabled: !!user?.schoolId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000,
    refetchInterval: 60000, // Refetch toutes les minutes
    retry: 2,
  });
};

/**
 * Composant carte alerte individuelle
 * Mémorisé pour performance
 */
const AlertCard = memo(({ 
  alert, 
  onMarkAsRead 
}: { 
  alert: SystemAlert;
  onMarkAsRead: (id: string) => void;
}) => {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <div className={`flex items-start gap-3 p-4 ${config.bgColor} rounded-lg border-l-4 ${config.borderColor} relative group`}>
        {/* Icône */}
        <div className={`flex-shrink-0 ${config.color}`}>
          <Icon className="h-5 w-5 mt-0.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header avec badge sévérité */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {alert.title}
            </h4>
            <Badge 
              variant="secondary" 
              className={`${config.badgeColor} text-white text-xs px-2 py-0.5 flex-shrink-0`}
            >
              {alert.severity}
            </Badge>
          </div>
          
          {/* Message */}
          <p className="text-sm text-gray-700 mb-2">
            {alert.message}
          </p>
          
          {/* Footer avec date et actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(alert.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
            
            <div className="flex items-center gap-2">
              {/* Bouton action (si disponible) */}
              {alert.action_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => window.location.href = alert.action_url!}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {alert.action_label || 'Voir'}
                </Button>
              )}
              
              {/* Bouton marquer comme lu */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onMarkAsRead(alert.id)}
                title="Marquer comme lu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

AlertCard.displayName = 'AlertCard';

/**
 * Composant Skeleton pour le loading
 */
const AlertSkeleton = memo(() => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
));

AlertSkeleton.displayName = 'AlertSkeleton';

/**
 * État vide avec animation
 */
const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-8"
  >
    <div className="relative inline-block mb-3">
      <CheckCircle className="h-12 w-12 text-green-500" />
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-green-200 rounded-full blur-xl"
      />
    </div>
    <p className="text-gray-600 font-medium">
      Aucune alerte importante
    </p>
    <p className="text-sm text-gray-500 mt-1">
      Tout va bien pour votre école ! 🎉
    </p>
  </motion.div>
));

EmptyState.displayName = 'EmptyState';

/**
 * Composant principal SchoolAlerts
 */
export const SchoolAlerts = () => {
  const { data: alerts, isLoading, error, refetch } = useSchoolAlerts();

  // Fonction pour marquer une alerte comme lue
  const handleMarkAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      // Refetch pour mettre à jour la liste
      refetch();
    } catch (err) {
      console.error('❌ Erreur marquage alerte:', err);
    }
  };

  // Compteur d'alertes par sévérité (mémorisé)
  const alertCounts = useMemo(() => {
    if (!alerts) return { critical: 0, error: 0, warning: 0 };
    
    return alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [alerts]);

  // Ne rien afficher si pas d'alertes et pas de chargement
  if (!isLoading && (!alerts || alerts.length === 0)) {
    return null;
  }

  // État de chargement
  if (isLoading) {
    return (
      <Card className="p-6 border-l-4 border-gray-300">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AlertSkeleton key={i} />
          ))}
        </div>
      </Card>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Card className="p-6 border-l-4 border-red-500 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">
              Erreur de chargement des alertes
            </h3>
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Une erreur est survenue'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-l-4 border-red-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-bold text-red-600">
            Alertes Importantes
          </h3>
        </div>
        
        {/* Badges compteurs */}
        <div className="flex items-center gap-2">
          {alertCounts.critical > 0 && (
            <Badge variant="destructive" className="bg-red-600">
              {alertCounts.critical} critique{alertCounts.critical > 1 ? 's' : ''}
            </Badge>
          )}
          {alertCounts.error > 0 && (
            <Badge variant="destructive" className="bg-red-500">
              {alertCounts.error} erreur{alertCounts.error > 1 ? 's' : ''}
            </Badge>
          )}
          {alertCounts.warning > 0 && (
            <Badge variant="secondary" className="bg-orange-500 text-white">
              {alertCounts.warning} avertissement{alertCounts.warning > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Liste des alertes */}
      <AnimatePresence mode="popLayout">
        {!alerts || alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Export mémorisé
export default memo(SchoolAlerts);
