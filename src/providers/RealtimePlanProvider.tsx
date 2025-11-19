/**
 * Realtime Plan Provider
 * Active les mises à jour temps réel pour tous les composants
 * À wrapper autour de l'application
 */

import { ReactNode } from 'react';
import { useRealtimePlanUpdates } from '@/features/dashboard/hooks/useRealtimePlanUpdates';

interface RealtimePlanProviderProps {
  children: ReactNode;
}

export const RealtimePlanProvider = ({ children }: RealtimePlanProviderProps) => {
  // Active le Realtime
  useRealtimePlanUpdates();

  return <>{children}</>;
};
