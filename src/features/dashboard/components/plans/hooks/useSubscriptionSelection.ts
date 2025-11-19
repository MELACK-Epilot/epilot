/**
 * Hook pour gérer la sélection multiple des abonnements
 */

import { useState, useCallback } from 'react';
import { type PlanSubscription } from '../../../hooks/usePlanSubscriptions';

export const useSubscriptionSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((subscriptions: PlanSubscription[]) => {
    setSelectedIds(new Set(subscriptions.map(s => s.id)));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = useCallback((subscriptions: PlanSubscription[]) => {
    return subscriptions.length > 0 && selectedIds.size === subscriptions.length;
  }, [selectedIds]);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected
  };
};
