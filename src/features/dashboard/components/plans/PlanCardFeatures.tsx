/**
 * Section caractéristiques de la carte plan
 * Limites et options
 * @module PlanCardFeatures
 */

import { Building2, Users, HardDrive, Headphones, Shield, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatSupportLevel } from '../../utils/planCard.utils';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardFeaturesProps {
  plan: PlanWithContent;
}

export const PlanCardFeatures = ({ plan }: PlanCardFeaturesProps) => {
  const features = [
    { 
      icon: Building2, 
      label: 'Écoles', 
      value: plan.maxSchools === -1 ? 'Illimité' : plan.maxSchools, 
      color: 'text-blue-600' 
    },
    { 
      icon: Users, 
      label: 'Élèves', 
      value: plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents.toLocaleString(), 
      color: 'text-green-600' 
    },
    { 
      icon: HardDrive, 
      label: 'Stockage', 
      value: `${plan.maxStorage} GB`, 
      color: 'text-purple-600' 
    },
    { 
      icon: Headphones, 
      label: 'Support', 
      value: formatSupportLevel(plan.supportLevel), 
      color: 'text-orange-600' 
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {features.map((item, i) => (
        <div 
          key={i} 
          className="flex items-center justify-between text-sm group-hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-600">
            <div className={`w-8 h-8 ${item.color.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg flex items-center justify-center`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <span className="font-medium">{item.label}</span>
          </div>
          <span className="font-semibold text-slate-900">{item.value}</span>
        </div>
      ))}

      {/* Options premium */}
      <div className="flex items-center gap-2 pt-2">
        {plan.customBranding && (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 rounded-full">
            <Shield className="w-3 h-3 mr-1" />
            Branding
          </Badge>
        )}
        {plan.apiAccess && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 rounded-full">
            <Globe className="w-3 h-3 mr-1" />
            API
          </Badge>
        )}
      </div>
    </div>
  );
};
