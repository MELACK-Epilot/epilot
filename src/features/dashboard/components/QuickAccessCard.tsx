/**
 * QuickAccessCard - Card cliquable pour accès rapide aux sections
 * @module QuickAccessCard
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface QuickAccessCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  count: number | string;
  label: string;
  href: string;
  gradient: string;
  badge?: string;
  delay?: number;
}

export const QuickAccessCard = ({
  title,
  description,
  icon: Icon,
  count,
  label,
  href,
  gradient,
  badge,
  delay = 0,
}: QuickAccessCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="cursor-pointer"
      onClick={() => navigate(href)}
    >
      <Card className="relative p-6 h-full hover:shadow-xl transition-all duration-300 overflow-hidden group border-gray-200 hover:border-transparent flex flex-col">
        {/* Gradient Background on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        {/* Cercle décoratif */}
        <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            {badge && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                {badge}
              </Badge>
            )}
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mb-3 min-h-[2.5rem]">
            {description || '\u00A0'}
          </p>
          
          {/* Stats */}
          <div className="flex items-baseline gap-2 mb-3 flex-grow">
            <span className="text-3xl font-bold text-gray-900">{count}</span>
            <span className="text-sm text-gray-600">{label}</span>
          </div>

          {/* Action */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors mt-auto">
            <span>Gérer</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
