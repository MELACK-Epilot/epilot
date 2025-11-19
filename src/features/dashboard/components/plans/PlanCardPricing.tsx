/**
 * Section prix de la carte plan
 * Prix + devise + période + badges
 * @module PlanCardPricing
 */

import { Badge } from '@/components/ui/badge';
import { getPlanTheme, formatBillingPeriod } from '../../utils/planCard.utils';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardPricingProps {
  plan: PlanWithContent;
}

export const PlanCardPricing = ({ plan }: PlanCardPricingProps) => {
  const theme = getPlanTheme(plan.slug);

  return (
    <div className="p-6 border-b border-slate-100">
      <div className="flex items-baseline gap-2 mb-3">
        {plan.price === 0 ? (
          <span className={`text-4xl font-bold bg-gradient-to-r from-${theme.accent}-600 to-${theme.accent}-700 bg-clip-text text-transparent`}>
            Gratuit
          </span>
        ) : (
          <>
            <span className="text-4xl font-bold text-slate-900">
              {plan.price.toLocaleString()}
            </span>
            <span className="text-slate-500 text-sm font-medium">{plan.currency}</span>
            <span className="text-slate-400 text-sm">
              /{formatBillingPeriod(plan.billingPeriod || 'monthly')}
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {plan.discount && (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 rounded-full">
            🎉 -{plan.discount}%
          </Badge>
        )}
        {plan.trialDays && (
          <Badge variant="outline" className={`text-${theme.accent}-600 border-${theme.accent}-200 bg-${theme.accent}-50 rounded-full`}>
            ⚡ {plan.trialDays}j gratuit
          </Badge>
        )}
      </div>
    </div>
  );
};
