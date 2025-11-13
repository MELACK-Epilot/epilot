/**
 * Composant Détails Financiers
 * Cards avec statistiques détaillées
 */

import { AlertCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FinancialDetailsProps {
  stats: {
    monthlyRevenue: number;
    yearlyRevenue: number;
    totalRevenue: number;
    overduePayments: number;
    overdueAmount: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
    expiredSubscriptions: number;
    cancelledSubscriptions: number;
  } | null;
  isLoading: boolean;
  onViewOverdue?: () => void;
}

export const FinancialDetails = ({ stats, isLoading, onViewOverdue }: FinancialDetailsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenus par période */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
          Revenus par Période
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Ce mois</span>
            <span className="text-sm font-semibold text-gray-900">
              {(stats?.monthlyRevenue || 0).toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Cette année</span>
            <span className="text-sm font-semibold text-gray-900">
              {(stats?.yearlyRevenue || 0).toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
            <span className="text-sm font-medium text-gray-900">Total</span>
            <span className="text-lg font-bold text-[#2A9D8F]">
              {(stats?.totalRevenue || 0).toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </Card>

      {/* Paiements en retard */}
      <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-[#E63946]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#E63946]" />
          Paiements en Retard
        </h3>
        
        {/* Alerte critique si > 5 paiements en retard */}
        {(stats?.overduePayments || 0) > 5 && (
          <div className="mb-4 p-3 bg-[#E63946]/10 border border-[#E63946]/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#E63946] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#E63946]">Action requise</p>
                <p className="text-xs text-gray-600 mt-1">
                  Nombre élevé de paiements en retard. Contactez les groupes concernés.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Nombre</span>
            <span className="text-3xl font-bold text-[#E63946]">
              {stats?.overduePayments || 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Montant total</span>
            <span className="text-lg font-semibold text-[#E63946]">
              {(stats?.overdueAmount || 0).toLocaleString()} FCFA
            </span>
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4 text-[#E63946] border-[#E63946] hover:bg-[#E63946]/10"
            onClick={onViewOverdue}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Voir les détails
          </Button>
        </div>
      </Card>

      {/* Statistiques abonnements */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
          Abonnements
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
              <span className="text-sm text-gray-600">Actifs</span>
            </div>
            <span className="text-sm font-semibold text-[#2A9D8F]">
              {stats?.activeSubscriptions || 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E9C46A]" />
              <span className="text-sm text-gray-600">En attente</span>
            </div>
            <span className="text-sm font-semibold text-[#E9C46A]">
              {stats?.pendingSubscriptions || 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-600">Expirés</span>
            </div>
            <span className="text-sm font-semibold text-gray-500">
              {stats?.expiredSubscriptions || 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E63946]" />
              <span className="text-sm text-gray-600">Annulés</span>
            </div>
            <span className="text-sm font-semibold text-[#E63946]">
              {stats?.cancelledSubscriptions || 0}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
