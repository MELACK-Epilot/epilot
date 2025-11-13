/**
 * Composant Stat Card Glassmorphism Premium - Réutilisable
 * Design moderne avec animations et effets visuels
 */

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface GlassmorphismStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string; // Ex: "from-[#2A9D8F] to-[#1D8A7E]"
  delay?: number;
  trend?: {
    value: number;
    label: string;
  };
}

export const GlassmorphismStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay = 0,
  trend,
}: GlassmorphismStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      {/* Shadow blur animé */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`} />
      
      {/* Card principale */}
      <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden h-full min-h-[160px]">
        {/* Cercle décoratif animé */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient}/10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            {/* Icône + Titre */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{title}</p>
            </div>
            
            {/* Valeur */}
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
            )}
            
            {/* Trend (optionnel) */}
            {trend && (
              <div className="flex items-center gap-1.5">
                <div className={`p-1 ${trend.value >= 0 ? 'bg-[#2A9D8F]/10' : 'bg-[#E63946]/10'} rounded-md`}>
                  <span className={`text-sm font-bold ${trend.value >= 0 ? 'text-[#2A9D8F]' : 'text-[#E63946]'}`}>
                    {trend.value >= 0 ? '+' : ''}{trend.value}%
                  </span>
                </div>
                <span className="text-xs text-gray-400">{trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
