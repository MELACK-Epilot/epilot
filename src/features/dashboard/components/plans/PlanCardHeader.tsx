/**
 * Header de la carte plan
 * Badge populaire + gradient + icône
 * @module PlanCardHeader
 */

import { Package, Zap, Crown, Building2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPlanTheme } from '../../utils/planCard.utils';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardHeaderProps {
  plan: PlanWithContent;
}

const iconMap = {
  Package,
  Zap,
  Crown,
  Building2,
};

export const PlanCardHeader = ({ plan }: PlanCardHeaderProps) => {
  const theme = getPlanTheme(plan.slug);
  const IconComponent = iconMap[theme.icon as keyof typeof iconMap] || Package;

  return (
    <div className={`relative bg-gradient-to-br ${theme.gradient} p-8 text-white overflow-hidden`}>
      {/* Badge Populaire */}
      {plan.isPopular && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg rounded-full px-3 py-1">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Populaire
          </Badge>
        </div>
      )}

      {/* Motifs de fond */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.bgPattern} rounded-full -translate-y-16 translate-x-16`} />
      <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br ${theme.bgPattern} rounded-full translate-y-12 -translate-x-12`} />
      
      <div className="relative z-10">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <IconComponent className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2 group-hover:text-white/90 transition-colors">{plan.name}</h3>
        <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{plan.description}</p>
      </div>
    </div>
  );
};
