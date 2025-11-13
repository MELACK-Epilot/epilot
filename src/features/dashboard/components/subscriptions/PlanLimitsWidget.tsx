/**
 * Widget d'affichage des limites du plan
 * Affiche l'utilisation actuelle et les limites
 * @module PlanLimitsWidget
 */

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  HardDrive,
  Package,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { usePlanRestrictions } from '../../hooks/usePlanRestrictions';
import { useState } from 'react';
import { PlanUpgradeRequestDialog } from '../plans/PlanUpgradeRequestDialog';
import { useCurrentUserGroup } from '../../hooks/useCurrentUserGroup';

export const PlanLimitsWidget = () => {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { data: currentGroup } = useCurrentUserGroup();
  const {
    planLimits,
    currentUsage,
    getUsagePercentage,
    getRemaining,
    needsUpgrade,
    limitAlerts,
  } = usePlanRestrictions();

  // Si pas de limites, ne rien afficher
  if (!planLimits) return null;

  const limits = [
    {
      icon: Building2,
      label: 'Écoles',
      type: 'schools' as const,
      current: currentUsage.schools,
      max: planLimits.maxSchools,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      label: 'Utilisateurs',
      type: 'users' as const,
      current: currentUsage.users,
      max: planLimits.maxUsers,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: HardDrive,
      label: 'Stockage',
      type: 'storage' as const,
      current: currentUsage.storage,
      max: planLimits.maxStorage,
      unit: 'GB',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Package,
      label: 'Modules',
      type: 'modules' as const,
      current: currentUsage.modules,
      max: planLimits.maxModules,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Utilisation du Plan
              </h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 text-sm">
                  {planLimits.name}
                </Badge>
                {needsUpgrade && (
                  <Badge className="bg-orange-100 text-orange-700 text-sm animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Upgrade recommandé
                  </Badge>
                )}
              </div>
            </div>
            {needsUpgrade && (
              <Button
                size="sm"
                onClick={() => setIsUpgradeDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Demander upgrade
              </Button>
            )}
          </div>

          {/* Alertes */}
          {limitAlerts.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 mb-1">
                    Limites bientôt atteintes
                  </p>
                  <ul className="text-xs text-orange-700 space-y-1">
                    {limitAlerts.map((alert) => (
                      <li key={alert.type}>
                        • {alert.type === 'schools' ? 'Écoles' : alert.type === 'users' ? 'Utilisateurs' : alert.type === 'storage' ? 'Stockage' : 'Modules'} : {alert.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Grille des limites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {limits.map((limit, index) => {
              const Icon = limit.icon;
              const percentage = getUsagePercentage(limit.type);
              const remaining = getRemaining(limit.type);
              const isUnlimited = limit.max === null;

              return (
                <motion.div
                  key={limit.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${limit.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${limit.color}`} />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {limit.label}
                      </span>
                    </div>
                    {isUnlimited ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Illimité
                      </Badge>
                    ) : percentage >= 100 ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Limite atteinte
                      </Badge>
                    ) : percentage >= 80 ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {percentage.toFixed(0)}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {percentage.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  {!isUnlimited && (
                    <>
                      <Progress
                        value={percentage}
                        className={`h-2 mb-2 ${
                          percentage >= 100
                            ? '[&>div]:bg-red-500'
                            : percentage >= 80
                            ? '[&>div]:bg-orange-500'
                            : '[&>div]:bg-green-500'
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                          {limit.current} / {limit.max} {limit.unit || ''}
                        </span>
                        {remaining !== null && (
                          <span className="font-medium">
                            {remaining} restant{remaining > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {isUnlimited && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aucune limite</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Prix du plan */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tarif mensuel</span>
              <span className="font-bold text-gray-900">
                {planLimits.price.monthly.toLocaleString()} {planLimits.price.currency}/mois
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Dialog Demande d'upgrade */}
      {currentGroup && (
        <PlanUpgradeRequestDialog
          currentPlan={{
            id: currentGroup.id,
            name: planLimits.name,
            slug: planLimits.slug,
            price: planLimits.price.monthly,
          }}
          isOpen={isUpgradeDialogOpen}
          onClose={() => setIsUpgradeDialogOpen(false)}
        />
      )}
    </>
  );
};
