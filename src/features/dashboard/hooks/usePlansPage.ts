/**
 * Hook pour la logique de la page Plans
 * Gère l'état et les actions de la page
 * @module usePlansPage
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDeletePlan } from './usePlans';
import type { PlanWithContent } from './usePlanWithContent';

export const usePlansPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanWithContent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'analytics' | 'optimization' | 'comparison'>('overview');
  
  const deletePlan = useDeletePlan();
  const { toast } = useToast();

  const handleCreate = () => {
    setSelectedPlan(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (plan: PlanWithContent) => {
    setSelectedPlan(plan);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDelete = async (plan: PlanWithContent) => {
    if (confirm(`Êtes-vous sûr de vouloir archiver le plan "${plan.name}" ?`)) {
      try {
        await deletePlan.mutateAsync(plan.id);
        toast({
          title: 'Plan archivé',
          description: `Le plan "${plan.name}" a été archivé avec succès.`,
        });
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: error.message || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    }
  };

  const toggleExpanded = (planId: string) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  return {
    // État
    searchQuery,
    selectedPlan,
    dialogOpen,
    dialogMode,
    expandedPlanId,
    activeTab,
    
    // Setters
    setSearchQuery,
    setSelectedPlan,
    setDialogOpen,
    setActiveTab,
    
    // Actions
    handleCreate,
    handleEdit,
    handleDelete,
    toggleExpanded,
  };
};
