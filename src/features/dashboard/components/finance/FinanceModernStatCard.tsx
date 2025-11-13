/**
 * Card de statistique moderne pour les pages Finances
 * Design plat avec couleurs vives inspiré de la page Utilisateurs
 */

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ModernStatCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'gray' | 'red' | 'gold' | 'purple' | 'orange';
  trend?: {
    value: number;
    label: string;
  };
}

interface FinanceModernStatCardProps extends ModernStatCardData {
  delay?: number;
}

const colorClasses = {
  blue: 'bg-[#1D3557] text-white',
  green: 'bg-[#2A9D8F] text-white',
  gray: 'bg-[#6B7280] text-white',
  red: 'bg-[#E63946] text-white',
  gold: 'bg-[#E9C46A] text-gray-900',
  purple: 'bg-[#9333EA] text-white',
  orange: 'bg-[#F97316] text-white',
};

export const FinanceModernStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  delay = 0,
}: FinanceModernStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`${colorClasses[color]} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden group`}
    >
      {/* Glassmorphism overlay effect (comme QuickAccessCard) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Cercle décoratif animé (comme QuickAccessCard) */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icône avec effet glassmorphism et scale au hover */}
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-lg">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-sm font-medium bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10 shadow-sm">
              <span className="text-xs">↗</span>
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium opacity-90 mb-2 group-hover:opacity-100 transition-opacity">{title}</h3>
          <p className="text-3xl font-bold mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-75 group-hover:opacity-90 transition-opacity">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
