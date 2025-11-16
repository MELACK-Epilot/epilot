/**
 * Carte d'affichage d'une demande de ressources
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Building, Calendar, DollarSign, Package } from 'lucide-react';
import type { ResourceRequest } from '../store/useResourceRequestsStore';

interface RequestCardProps {
  request: ResourceRequest;
  onView: (request: ResourceRequest) => void;
  delay?: number;
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

export const RequestCard = ({ request, onView, delay = 0 }: RequestCardProps) => {
  const totalAmount = request.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || request.total_estimated_amount || 0;
  const itemsCount = request.items?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onView(request)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusConfig[request.status].color}>
              {statusConfig[request.status].label}
            </Badge>
            <Badge className={priorityConfig[request.priority].color}>
              {priorityConfig[request.priority].label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {request.description}
        </p>
      )}

      {/* Informations */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{request.requester?.first_name} {request.requester?.last_name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building className="h-4 w-4" />
          <span>{request.school?.name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(request.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="h-4 w-4" />
          <span>{itemsCount} ressource{itemsCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-600" />
          <span className="text-lg font-bold text-purple-600">
            {totalAmount.toLocaleString()} FCFA
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
          onClick={(e) => {
            e.stopPropagation();
            onView(request);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir détails
        </Button>
      </div>
    </motion.div>
  );
};
