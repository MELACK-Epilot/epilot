/**
 * 🎨 KPI Card Minimaliste NASA
 * Carte d'indicateur clé de performance
 * @module KPICard
 */

import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  color: string;
  icon: LucideIcon;
  subtext?: string;
}

export const KPICard = ({ title, value, trend, color, icon: Icon, subtext }: KPICardProps) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
    {/* Gradient Background */}
    <div 
      className="absolute inset-0 opacity-10"
      style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
    />
    
    <div className="relative p-6 flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`text-sm font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>
      
      {/* Value */}
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  </Card>
);
