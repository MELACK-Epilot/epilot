/**
 * Vue Historique - Permissions & Modules
 * Timeline des changements de permissions
 * @module HistoryPermissionsView
 */

import { useState } from 'react';
import { History, User, Package, Calendar, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface HistoryPermissionsViewProps {
  onRefresh: () => void;
}

export const HistoryPermissionsView = ({ onRefresh }: HistoryPermissionsViewProps) => {
  // Historique exemple (à remplacer par vraies données)
  const [history] = useState([
    {
      id: '1',
      action: 'assigned',
      user: { firstName: 'Jean', lastName: 'Dupont', role: 'enseignant' },
      module: { name: 'Bulletins scolaires', category: 'Pédagogie' },
      assigned_by: { firstName: 'Admin', lastName: 'Groupe' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      permissions: { canRead: true, canWrite: true, canDelete: false, canExport: false }
    },
    {
      id: '2',
      action: 'removed',
      user: { firstName: 'Marie', lastName: 'Martin', role: 'comptable' },
      module: { name: 'Caisse scolaire', category: 'Finances' },
      assigned_by: { firstName: 'Admin', lastName: 'Groupe' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
      permissions: null
    },
    {
      id: '3',
      action: 'updated',
      user: { firstName: 'Pierre', lastName: 'Durand', role: 'proviseur' },
      module: { name: 'Gestion des classes', category: 'Pédagogie' },
      assigned_by: { firstName: 'Admin', lastName: 'Groupe' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      permissions: { canRead: true, canWrite: true, canDelete: true, canExport: true }
    }
  ]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'assigned': return 'Assigné';
      case 'removed': return 'Retiré';
      case 'updated': return 'Modifié';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'assigned': return 'bg-green-100 text-green-700 border-green-200';
      case 'removed': return 'bg-red-100 text-red-700 border-red-200';
      case 'updated': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900 mb-1">
              Historique des Changements
            </p>
            <p className="text-xs text-orange-700">
              Suivez toutes les modifications de permissions effectuées sur votre groupe scolaire
            </p>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {history.map((entry, index) => (
          <Card key={entry.id} className="p-5">
            <div className="flex items-start gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(entry.action)}`}>
                  {entry.action === 'assigned' && <Package className="h-5 w-5" />}
                  {entry.action === 'removed' && <Package className="h-5 w-5" />}
                  {entry.action === 'updated' && <Package className="h-5 w-5" />}
                </div>
                {index < history.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={`${getActionColor(entry.action)} border`}>
                      {getActionLabel(entry.action)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {entry.user.firstName} {entry.user.lastName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {entry.user.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {entry.module.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({entry.module.category})
                    </span>
                  </div>

                  {entry.permissions && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-600">Permissions:</span>
                      {entry.permissions.canRead && (
                        <Badge variant="secondary" className="text-xs">📖 Lecture</Badge>
                      )}
                      {entry.permissions.canWrite && (
                        <Badge variant="secondary" className="text-xs">✏️ Écriture</Badge>
                      )}
                      {entry.permissions.canDelete && (
                        <Badge variant="secondary" className="text-xs">🗑️ Suppression</Badge>
                      )}
                      {entry.permissions.canExport && (
                        <Badge variant="secondary" className="text-xs">📤 Export</Badge>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Par {entry.assigned_by.firstName} {entry.assigned_by.lastName}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Message si vide */}
      {history.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun historique
            </h3>
            <p className="text-gray-600">
              Les modifications de permissions apparaîtront ici
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
