/**
 * Actions de la carte plan (Super Admin uniquement)
 * Boutons Modifier et Supprimer
 * @module PlanCardActions
 */

import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlanTheme } from '../../utils/planCard.utils';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardActionsProps {
  plan: PlanWithContent;
  onEdit: (plan: PlanWithContent) => void;
  onDelete: (plan: PlanWithContent) => void;
}

export const PlanCardActions = ({ plan, onEdit, onDelete }: PlanCardActionsProps) => {
  const theme = getPlanTheme(plan.slug);

  return (
    <div className={`p-4 bg-gradient-to-r ${theme.bgPattern} border-t border-slate-100 flex gap-2`}>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-slate-200 hover:bg-white rounded-xl"
        onClick={() => onEdit(plan)}
      >
        <Edit className="w-3.5 h-3.5 mr-1.5" />
        Modifier
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
        onClick={() => onDelete(plan)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
