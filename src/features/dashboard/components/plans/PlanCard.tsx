/**
 * Carte plan complète (composition)
 * Assemble tous les sous-composants
 * @module PlanCard
 */

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { PlanCardHeader } from './PlanCardHeader';
import { PlanCardPricing } from './PlanCardPricing';
import { PlanCardFeatures } from './PlanCardFeatures';
import { PlanCardModules } from './PlanCardModules';
import { PlanCardActions } from './PlanCardActions';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardProps {
  plan: PlanWithContent;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (plan: PlanWithContent) => void;
  onDelete: (plan: PlanWithContent) => void;
  isSuperAdmin: boolean;
}

export const PlanCard = ({
  plan,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isSuperAdmin,
}: PlanCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl">
        <PlanCardHeader plan={plan} />
        <PlanCardPricing plan={plan} />
        <PlanCardFeatures plan={plan} />
        <PlanCardModules plan={plan} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
        {isSuperAdmin && <PlanCardActions plan={plan} onEdit={onEdit} onDelete={onDelete} />}
      </Card>
    </motion.div>
  );
};
