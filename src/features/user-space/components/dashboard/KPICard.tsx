/**
 * Carte KPI individuelle
 */

import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: string;
  iconBg: string;
  iconColor: string;
}

export const KPICard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  gradient, 
  iconBg, 
  iconColor 
}: KPICardProps) => {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`${iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              trend.isPositive ? 'bg-white/20' : 'bg-white/20'
            }`}>
              <span className="text-white text-xs font-medium">
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
});

KPICard.displayName = 'KPICard';
