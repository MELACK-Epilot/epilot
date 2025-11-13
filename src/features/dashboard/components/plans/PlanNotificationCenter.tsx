/**
 * Centre de notifications pour les plans
 * Alertes en temps réel avec actions rapides
 * @module PlanNotificationCenter
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, CheckCheck, Trash2, ExternalLink,
  AlertTriangle, Info, CheckCircle2, TrendingUp, Users,
  DollarSign, Package, Clock, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { usePlanNotifications, type PlanNotification } from '../../hooks/usePlanNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PlanNotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = usePlanNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: PlanNotification['type']) => {
    switch (type) {
      case 'subscription_created':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'subscription_cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'limit_reached':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'payment_failed':
        return <DollarSign className="w-5 h-5 text-red-500" />;
      case 'upgrade_request':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'churn_risk':
        return <Users className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: PlanNotification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-l-amber-500 bg-amber-50';
      case 'medium':
        return 'border-l-4 border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-l-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="relative">
      {/* Bouton Bell avec badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-600" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">{unreadCount}</span>
          </motion.div>
        )}
      </button>

      {/* Panel de notifications */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Filtres et actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="text-xs"
                    >
                      Toutes ({notifications.length})
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unread')}
                      className="text-xs"
                    >
                      Non lues ({unreadCount})
                    </Button>
                  </div>

                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Tout lire
                    </Button>
                  )}
                </div>
              </div>

              {/* Liste des notifications */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {filter === 'unread' 
                        ? 'Aucune notification non lue'
                        : 'Aucune notification'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-slate-50 transition-colors ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        } ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icône */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-slate-900">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>

                            <p className="text-sm text-slate-600 mb-2">
                              {notification.message}
                            </p>

                            {/* Métadonnées */}
                            <div className="flex items-center gap-2 mb-2">
                              {notification.planName && (
                                <Badge variant="outline" className="text-xs">
                                  <Package className="w-3 h-3 mr-1" />
                                  {notification.planName}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(notification.timestamp, {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Marquer comme lu
                                </button>
                              )}
                              {notification.actionUrl && (
                                <a
                                  href={notification.actionUrl}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  onClick={() => setIsOpen(false)}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Voir détails
                                </a>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 ml-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Tout effacer
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanNotificationCenter;
