/**
 * Composant Card statistique réutilisable
 * Élimine la redondance des cards avec icônes et gradients
 * 
 * @module StatsCard
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GRADIENTS, COMMON_CLASSES, ANIMATIONS } from '../../constants/designSystem';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: keyof typeof GRADIENTS;
  description?: string;
  link?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  index?: number;
  className?: string;
}

export const StatsCard = memo(({ 
  title,
  value,
  icon: Icon,
  gradient,
  description,
  link,
  trend,
  index = 0,
  className
}: StatsCardProps) => {
  const cardContent = (
    <Card className={cn(
      'group relative overflow-hidden border-0 shadow-lg',
      COMMON_CLASSES.cardHover,
      'transition-all duration-300',
      link && 'cursor-pointer',
      className
    )}>
      {/* Gradient de fond */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br',
        GRADIENTS[gradient],
        'opacity-90'
      )} />
      
      {/* Cercles décoratifs animés */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative p-6">
        {/* Header avec icône */}
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            COMMON_CLASSES.iconContainer,
            'bg-white/20 backdrop-blur-sm'
          )}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          
          {/* Badge trend (si disponible) */}
          {trend && (
            <div className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg flex items-center gap-1">
              <TrendingUp className={cn(
                'h-3.5 w-3.5',
                trend.isPositive ? 'text-green-200' : 'text-red-200 rotate-180'
              )} />
              <span className="text-xs font-bold text-white/90">
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        
        {/* Titre */}
        <h3 className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">
          {title}
        </h3>
        
        {/* Valeur principale */}
        <p className="text-4xl font-extrabold text-white drop-shadow-lg mb-1">
          {value}
        </p>
        
        {/* Description */}
        {description && (
          <p className="text-white/60 text-xs font-medium">
            {description}
          </p>
        )}
      </div>
    </Card>
  );

  const motionWrapper = (
    <motion.div
      {...ANIMATIONS.stagger(index)}
    >
      {cardContent}
    </motion.div>
  );

  if (link) {
    return (
      <Link to={link}>
        {motionWrapper}
      </Link>
    );
  }

  return motionWrapper;
});

StatsCard.displayName = 'StatsCard';
