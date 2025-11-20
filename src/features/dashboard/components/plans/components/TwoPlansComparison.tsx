/**
 * Comparaison focalisée de 2 plans
 */

import { ArrowRight, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { compareTwoPlans } from '../../../utils/comparison-utils';
import type { PlanWithContent } from '../../../hooks/usePlanWithContent';

interface TwoPlansComparisonProps {
  plan1: PlanWithContent;
  plan2: PlanWithContent;
}

export const TwoPlansComparison = ({ plan1, plan2 }: TwoPlansComparisonProps) => {
  const differences = compareTwoPlans(plan1, plan2);
  const differencesCount = differences.filter((d) => d.isDifferent).length;

  const renderValue = (value: any, type: string) => {
    if (type === 'boolean') {
      return value ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <X className="w-5 h-5 text-gray-400" />
      );
    }

    if (value === -1) return <span className="text-lg font-bold">∞</span>;
    if (typeof value === 'number') return <span className="text-lg font-bold">{value.toLocaleString()}</span>;
    return <span className="text-lg font-bold">{value}</span>;
  };

  const getValueType = (key: string): string => {
    if (key === 'customBranding' || key === 'apiAccess') return 'boolean';
    return 'number';
  };

  return (
    <Card className="p-6 border-0 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Comparaison Détaillée</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {differencesCount} différence{differencesCount > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Plans headers */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div></div>
        <Card className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white text-center">
          <h4 className="font-bold text-lg">{plan1.name}</h4>
          <div className="text-2xl font-bold mt-2">
            {plan1.price === 0 ? 'Gratuit' : `${plan1.price.toLocaleString()} ${plan1.currency}`}
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-center">
          <h4 className="font-bold text-lg">{plan2.name}</h4>
          <div className="text-2xl font-bold mt-2">
            {plan2.price === 0 ? 'Gratuit' : `${plan2.price.toLocaleString()} ${plan2.currency}`}
          </div>
        </Card>
      </div>

      {/* Comparisons */}
      <div className="space-y-2">
        {differences.map((diff, index) => (
          <div
            key={diff.key}
            className={`grid grid-cols-3 gap-4 p-4 rounded-lg transition-colors ${
              diff.isDifferent
                ? 'bg-yellow-50 border-2 border-yellow-200'
                : index % 2 === 0
                ? 'bg-slate-50'
                : 'bg-white'
            }`}
          >
            {/* Label */}
            <div className="flex items-center gap-2">
              {diff.isDifferent && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              <span className="font-medium text-slate-700">{diff.label}</span>
            </div>

            {/* Plan 1 value */}
            <div className="flex items-center justify-center">
              {renderValue(diff.plan1Value, getValueType(diff.key))}
            </div>

            {/* Plan 2 value */}
            <div className="flex items-center justify-center">
              {renderValue(diff.plan2Value, getValueType(diff.key))}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade suggestion */}
      {plan2.price > plan1.price && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-blue-900">Upgrade vers {plan2.name}</div>
              <div className="text-sm text-blue-700">
                +{(plan2.price - plan1.price).toLocaleString()} {plan2.currency}/
                {plan2.billingPeriod === 'yearly' ? 'an' : 'mois'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
