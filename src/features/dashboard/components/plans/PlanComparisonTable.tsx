/**
 * Tableau comparatif des plans d'abonnement
 * Affiche les fonctionnalités côte à côte
 * @module PlanComparisonTable
 */

import { Building2, Users, HardDrive, Headphones, Palette, Zap, CheckCircle2, X, Crown, Package, Layers, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '../../types/dashboard.types';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanComparisonTableProps {
  plans: Plan[] | PlanWithContent[];
}

interface Feature {
  key: keyof Plan;
  label: string;
  icon: React.ElementType;
  renderValue: (plan: Plan) => React.ReactNode;
}

const features: Feature[] = [
  {
    key: 'maxSchools',
    label: 'Nombre d\'écoles',
    icon: Building2,
    renderValue: (plan) => (
      <span className="font-semibold">
        {plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools}
      </span>
    ),
  },
  {
    key: 'maxStudents',
    label: 'Nombre d\'élèves',
    icon: Users,
    renderValue: (plan) => (
      <span className="font-semibold">
        {plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'maxPersonnel' as any,
    label: 'Personnel',
    icon: Users,
    renderValue: (plan) => {
      const p = plan as any;
      const maxStaff = p.maxStaff || p.maxPersonnel;
      return (
        <span className="font-semibold">
          {maxStaff === -1 ? 'Illimité' : maxStaff}
        </span>
      );
    },
  },
  {
    key: 'storageLimit' as any,
    label: 'Stockage',
    icon: HardDrive,
    renderValue: (plan) => {
      const p = plan as any;
      const storage = p.maxStorage || p.storageLimit;
      return (
        <span className="font-semibold">
          {typeof storage === 'number' ? `${storage} GB` : storage}
        </span>
      );
    },
  },
  {
    key: 'supportLevel',
    label: 'Support',
    icon: Headphones,
    renderValue: (plan) => {
      const labels: Record<string, string> = {
        email: 'Email',
        priority: 'Prioritaire',
        '24/7': '24/7',
      };
      return (
        <Badge variant="outline" className="font-medium">
          {labels[plan.supportLevel] || plan.supportLevel}
        </Badge>
      );
    },
  },
  {
    key: 'customBranding',
    label: 'Branding personnalisé',
    icon: Palette,
    renderValue: (plan) =>
      plan.customBranding ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      ),
  },
  {
    key: 'apiAccess',
    label: 'Accès API',
    icon: Zap,
    renderValue: (plan) =>
      plan.apiAccess ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      ),
  },
  {
    key: 'trialDays',
    label: 'Essai gratuit',
    icon: Package,
    renderValue: (plan) => (
      <span className="font-semibold">
        {plan.trialDays ? `${plan.trialDays} jours` : '-'}
      </span>
    ),
  },
  {
    key: 'categories' as any,
    label: 'Catégories métiers',
    icon: Briefcase,
    renderValue: (plan) => {
      const planWithContent = plan as any;
      const count = planWithContent.categories?.length || 0;
      return (
        <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
          {count} {count > 1 ? 'catégories' : 'catégorie'}
        </Badge>
      );
    },
  },
  {
    key: 'modules' as any,
    label: 'Modules pédagogiques',
    icon: Layers,
    renderValue: (plan) => {
      const planWithContent = plan as any;
      const count = planWithContent.modules?.length || 0;
      return (
        <Badge variant="outline" className="font-medium bg-purple-50 text-purple-700 border-purple-200">
          {count} {count > 1 ? 'modules' : 'module'}
        </Badge>
      );
    },
  },
];

export const PlanComparisonTable = ({ plans }: PlanComparisonTableProps) => {
  if (!plans || plans.length === 0) {
    return null;
  }

  // Trier les plans par prix
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#2A9D8F]" />
          Tableau Comparatif des Plans
        </h3>
        <Badge variant="outline" className="text-xs">
          {sortedPlans.length} plans disponibles
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50">
                Fonctionnalité
              </th>
              {sortedPlans.map((plan) => (
                <th key={plan.id} className="text-center p-4 bg-gray-50 min-w-[150px]">
                  <div className="flex flex-col items-center gap-2">
                    {plan.isPopular && (
                      <Badge className="bg-[#E9C46A] text-white border-0 mb-1">
                        <Crown className="w-3 h-3 mr-1" />
                        Populaire
                      </Badge>
                    )}
                    <span className="font-bold text-gray-900">{plan.name}</span>
                    <div className="flex items-baseline gap-1">
                      {plan.price === 0 ? (
                        <span className="text-lg font-bold text-[#2A9D8F]">Gratuit</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-gray-900">
                            {plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">{plan.currency}</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {((plan as any).billingPeriod === 'monthly' || (plan as any).billingCycle === 'monthly') && '/mois'}
                      {((plan as any).billingPeriod === 'quarterly' || (plan as any).billingCycle === 'quarterly') && '/trimestre'}
                      {((plan as any).billingPeriod === 'biannual' || (plan as any).billingCycle === 'biannual') && '/semestre'}
                      {((plan as any).billingPeriod === 'yearly' || (plan as any).billingCycle === 'yearly') && '/an'}
                    </span>
                    {plan.discount && (
                      <Badge variant="outline" className="text-xs text-[#E63946] border-[#E63946]">
                        -{plan.discount}%
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.key}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700">{feature.label}</span>
                  </div>
                </td>
                {sortedPlans.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {feature.renderValue(plan)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Inclus</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-gray-300" />
          <span>Non inclus</span>
        </div>
      </div>
    </Card>
  );
};

export default PlanComparisonTable;
