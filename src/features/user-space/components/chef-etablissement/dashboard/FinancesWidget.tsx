/**
 * FinancesWidget - Widget des finances
 * Affiche le taux de recouvrement et les paiements récents
 * 
 * @module ChefEtablissement/Components
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp,
  TrendingDown,
  ChevronRight,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FinancesWidgetData } from '../../../types/chef-etablissement.types';

interface FinancesWidgetProps {
  readonly data: FinancesWidgetData;
  readonly onViewDetails?: () => void;
}

/**
 * Formater un montant en FCFA
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

/**
 * Formater un montant court
 */
const formatShortCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

/**
 * Widget des finances
 */
export const FinancesWidget = memo<FinancesWidgetProps>(({
  data,
  onViewDetails,
}) => {
  // Couleur du taux de recouvrement
  const recoveryColor = useMemo(() => {
    if (data.recoveryRate >= 80) return 'text-green-600';
    if (data.recoveryRate >= 60) return 'text-amber-600';
    return 'text-red-600';
  }, [data.recoveryRate]);

  const progressColor = useMemo(() => {
    if (data.recoveryRate >= 80) return 'bg-green-500';
    if (data.recoveryRate >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  }, [data.recoveryRate]);

  return (
    <Card className="border-0 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Wallet className="h-4 w-4 text-amber-600" />
            </div>
            Finances
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`${data.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {data.trend === 'up' ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {data.trend === 'up' ? '+5%' : '-3%'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Revenus du mois */}
        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Revenus du mois</p>
          <p className="text-3xl font-bold text-amber-600">
            {formatShortCurrency(data.monthlyRevenue)}
            <span className="text-lg font-normal text-gray-500 ml-1">FCFA</span>
          </p>
        </div>

        {/* Taux de recouvrement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Taux de recouvrement</span>
            <span className={`font-bold ${recoveryColor}`}>
              {data.recoveryRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.recoveryRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>
        </div>

        {/* Impayés */}
        {data.pendingAmount > 0 && (
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Impayés</p>
              <p className="text-xs text-red-600">
                {formatCurrency(data.pendingAmount)} FCFA en attente
              </p>
            </div>
          </div>
        )}

        {/* Derniers paiements */}
        {data.recentPayments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Derniers paiements
            </p>
            <div className="space-y-2">
              {data.recentPayments.slice(0, 2).map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <CreditCard className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.studentName}
                    </p>
                    <p className="text-xs text-gray-500">{payment.type}</p>
                  </div>
                  <p className="text-sm font-medium text-green-600">
                    +{formatShortCurrency(payment.amount)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton voir plus */}
        {onViewDetails && (
          <Button
            variant="ghost"
            className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            onClick={onViewDetails}
          >
            Voir les détails
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

FinancesWidget.displayName = 'FinancesWidget';

export default FinancesWidget;
