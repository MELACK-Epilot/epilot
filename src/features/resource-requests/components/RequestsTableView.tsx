/**
 * Vue en tableau des demandes de ressources
 * Alternative à la vue en grille
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Printer, Download } from 'lucide-react';
import type { ResourceRequest } from '../store/useResourceRequestsStore';
import { printRequest } from '../utils/exportUtils';

interface RequestsTableViewProps {
  requests: ResourceRequest[];
  onView: (request: ResourceRequest) => void;
  onEdit?: (request: ResourceRequest) => void;
  canEdit: (request: ResourceRequest) => boolean;
}

const statusConfig = {
  pending: { label: '⏳ En attente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '✅ Approuvée', color: 'bg-green-100 text-green-700' },
  rejected: { label: '❌ Rejetée', color: 'bg-red-100 text-red-700' },
  completed: { label: '🎉 Complétée', color: 'bg-blue-100 text-blue-700' },
};

const priorityConfig = {
  low: { label: '🟢 Basse', color: 'bg-gray-100 text-gray-700' },
  normal: { label: '🔵 Normale', color: 'bg-blue-100 text-blue-700' },
  high: { label: '🟠 Haute', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '🔴 Urgente', color: 'bg-red-100 text-red-700' },
};

export const RequestsTableView = ({
  requests,
  onView,
  onEdit,
  canEdit,
}: RequestsTableViewProps) => {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                École
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Demandeur
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Priorité
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Aucune demande trouvée
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const totalAmount = request.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || request.total_estimated_amount || 0;
                
                return (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onView(request)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{request.title}</div>
                      {request.description && (
                        <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {request.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {request.school?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {request.requester?.first_name} {request.requester?.last_name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusConfig[request.status].color}>
                        {statusConfig[request.status].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={priorityConfig[request.priority].color}>
                        {priorityConfig[request.priority].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-purple-600">
                        {totalAmount.toLocaleString()} FCFA
                      </div>
                      {request.items && (
                        <div className="text-xs text-gray-500 mt-1">
                          {request.items.length} ressource{request.items.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(request.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(request)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canEdit(request) && onEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(request)}
                            title="Modifier"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => printRequest(request)}
                          title="Imprimer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
