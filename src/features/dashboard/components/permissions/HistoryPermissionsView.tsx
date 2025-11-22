/**
 * Vue Historique - Permissions & Modules
 * Timeline des changements de permissions
 * @module HistoryPermissionsView
 */

import { motion, AnimatePresence } from 'framer-motion';
import { History, User, Calendar, Loader2, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const HistoryPermissionsView = () => {
  // Récupérer les logs d'activité (filtrer si possible par type 'permission' ou 'access')
  // Pour l'instant on prend tout, mais on pourrait filtrer via le hook
  const { data: logs, isLoading } = useActivityLogs();

  const getActionLabel = (action: string) => {
    if (action.includes('create')) return 'Création';
    if (action.includes('update')) return 'Modification';
    if (action.includes('delete')) return 'Suppression';
    if (action.includes('assign')) return 'Assignation';
    if (action.includes('remove')) return 'Retrait';
    return action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('assign') || action.includes('create')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('remove') || action.includes('delete')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getActionIconColor = (action: string) => {
    if (action.includes('assign') || action.includes('create')) return 'text-green-600';
    if (action.includes('remove') || action.includes('delete')) return 'text-red-600';
    if (action.includes('update')) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Filtrer localement pour ne garder que les logs pertinents pour les permissions/modules
  // Si on n'a pas de convention de nommage stricte, on affiche tout pour l'audit global
  const history = logs || [];

  return (
    <div className="space-y-6">
      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/50 rounded-lg">
              <History className="h-5 w-5 text-orange-600 flex-shrink-0" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-900 mb-1">
                Journal d'Audit
              </p>
              <p className="text-xs text-orange-700 leading-relaxed">
                Suivez l'historique complet des modifications de sécurité, des assignations de modules 
                et des changements de profils.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Timeline */}
      <div className="space-y-4">
        <AnimatePresence>
          {history.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5 hover:shadow-md transition-shadow border-gray-200">
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100`}>
                      <ShieldAlert className={`h-5 w-5 ${getActionIconColor(entry.action)}`} />
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-100 my-2 min-h-[40px]"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getActionColor(entry.action)} border`}>
                          {getActionLabel(entry.action)}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.entity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.timestamp), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-500 block uppercase tracking-wider">Effectué par</span>
                          <span className="text-sm font-medium text-gray-900">
                            {entry.userName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({entry.userRole})
                          </span>
                        </div>
                      </div>

                      {entry.details && (
                        <div className="text-sm text-gray-600 bg-white border border-gray-100 p-3 rounded-md">
                          {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Message si vide */}
      {history.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
        >
          <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun historique
          </h3>
          <p className="text-gray-600">
            Les actions enregistrées apparaîtront ici
          </p>
        </motion.div>
      )}
    </div>
  );
};
