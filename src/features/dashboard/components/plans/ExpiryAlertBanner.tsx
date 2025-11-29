/**
 * Bannière d'alerte pour les abonnements expirant bientôt
 * @module ExpiryAlertBanner
 */

import { AlertTriangle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { PlanSubscription } from '../../hooks/usePlanSubscriptionsOptimized';

interface ExpiryAlertBannerProps {
  subscriptions: PlanSubscription[];
}

export const ExpiryAlertBanner = ({ subscriptions }: ExpiryAlertBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  // Abonnements expirant dans 7 jours
  const expiringSoon = subscriptions.filter(s => {
    if (!s.days_until_expiry) return false;
    return s.days_until_expiry > 0 && s.days_until_expiry <= 7;
  });

  // Abonnements expirant dans 30 jours
  const expiringThisMonth = subscriptions.filter(s => {
    if (!s.days_until_expiry) return false;
    return s.days_until_expiry > 7 && s.days_until_expiry <= 30;
  });

  // Essais se terminant bientôt
  const trialsEnding = subscriptions.filter(s => {
    if (s.status !== 'trial' || !s.trial_end_date) return false;
    const daysUntil = Math.ceil((new Date(s.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 3;
  });

  const hasAlerts = expiringSoon.length > 0 || trialsEnding.length > 0;

  if (!hasAlerts || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        {/* Alerte critique: Expire dans 7 jours */}
        {expiringSoon.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-4 mb-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    ⚠️ {expiringSoon.length} abonnement(s) expirent dans moins de 7 jours
                  </h3>
                  <p className="text-sm text-red-700">
                    Action requise : Contactez ces groupes pour renouveler leur abonnement
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expiringSoon.slice(0, 3).map(sub => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-red-800 border border-red-200"
                      >
                        {sub.school_group_name}
                        <span className="text-red-600">
                          ({sub.days_until_expiry}j)
                        </span>
                      </span>
                    ))}
                    {expiringSoon.length > 3 && (
                      <span className="text-xs text-red-600 font-medium">
                        +{expiringSoon.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-red-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* Alerte info: Essais se terminant */}
        {trialsEnding.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    💡 {trialsEnding.length} période(s) d'essai se terminent bientôt
                  </h3>
                  <p className="text-sm text-blue-700">
                    Opportunité : Convertissez ces essais en abonnements payants
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trialsEnding.map(sub => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-blue-800 border border-blue-200"
                      >
                        {sub.school_group_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        {/* Info: Expire dans 30 jours */}
        {expiringThisMonth.length > 0 && expiringSoon.length === 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    📅 {expiringThisMonth.length} abonnement(s) expirent ce mois-ci
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Planifiez le renouvellement pour éviter les interruptions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-yellow-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-yellow-600" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
