/**
 * Onglet Activité
 * @module user-details/tabs/ActivityTab
 */

import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ActivityLog } from '../types';

interface ActivityTabProps {
  logs: ActivityLog[];
}

export const ActivityTab = ({ logs }: ActivityTabProps) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log, index) => (
        <div
          key={log.id || index}
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
  );
};
