/**
 * Widget des demandes d'upgrade pour le Dashboard Hub Abonnements
 * Affiche les demandes en attente avec actions rapides
 * @module UpgradeRequestsWidget
 */

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Clock, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { usePlanChangeRequests } from '../../hooks/usePlanChangeRequests';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const UpgradeRequestsWidget = () => {
  const navigate = useNavigate();
  const { data: requests, isLoading } = usePlanChangeRequests('pending');

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#2A9D8F]" />
        </div>
      </Card>
    );
  }

  const pendingCount = requests?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Demandes d'Upgrade</h3>
              <p className="text-sm text-gray-600">En attente de validation</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 text-lg px-3 py-1 animate-pulse">
              {pendingCount}
            </Badge>
          )}
        </div>

        {pendingCount === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune demande en attente</p>
          </div>
        ) : (
          <>
            {/* Liste des 3 premières demandes */}
            <div className="space-y-3 mb-4">
              {requests?.slice(0, 3).map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 text-sm">
                        {request.schoolGroupName}
                      </span>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">
                      {request.currentPlanName}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline" className="bg-orange-100 text-orange-700">
                      {request.requestedPlanName}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Demandé le {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bouton Voir tout */}
            <Button
              onClick={() => navigate('/dashboard/plan-change-requests')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Voir toutes les demandes ({pendingCount})
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </Card>
    </motion.div>
  );
};
