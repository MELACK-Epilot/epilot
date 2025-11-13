/**
 * Card pour afficher une catégorie métier
 */

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import type { BusinessCategory } from '../types/module.types';

interface CategoryCardProps {
  category: BusinessCategory;
  onClick?: () => void;
  isSelected?: boolean;
  showModuleCount?: boolean;
}

export const CategoryCard = ({
  category,
  onClick,
  isSelected = false,
  showModuleCount = true,
}: CategoryCardProps) => {
  // Récupérer l'icône Lucide dynamiquement
  const IconComponent = category.icon 
    ? (LucideIcons as any)[category.icon] || LucideIcons.Folder
    : LucideIcons.Folder;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
      <Card 
        className={`
          p-6 transition-all duration-300
          ${isSelected 
            ? 'border-2 border-[#2A9D8F] bg-[#2A9D8F]/5 shadow-lg' 
            : 'border-gray-200 hover:border-[#2A9D8F]/50'
          }
          ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        `}
        onClick={onClick}
      >
        {/* Header avec icône */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icône avec couleur de la catégorie */}
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{ 
              backgroundColor: category.color ? `${category.color}15` : '#f3f4f6',
            }}
          >
            <IconComponent 
              className="h-6 w-6" 
              style={{ color: category.color || '#6b7280' }}
            />
          </div>

          {/* Titre + Badges */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
              {category.name}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              {category.is_core && (
                <Badge variant="secondary" className="text-xs">
                  Core
                </Badge>
              )}
              
              {showModuleCount && (
                <Badge variant="outline" className="text-xs">
                  {category.module_count} module{category.module_count > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {category.description}
          </p>
        )}

        {/* Footer avec plan requis */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Plan requis</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPlanColor(category.required_plan)}`}
            >
              {getPlanLabel(category.required_plan)}
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Helpers
const getPlanColor = (plan: string) => {
  const colors = {
    gratuit: 'bg-green-100 text-green-800 border-green-200',
    premium: 'bg-blue-100 text-blue-800 border-blue-200',
    pro: 'bg-purple-100 text-purple-800 border-purple-200',
    institutionnel: 'bg-amber-100 text-amber-800 border-amber-200',
  };
  return colors[plan as keyof typeof colors] || colors.gratuit;
};

const getPlanLabel = (plan: string) => {
  const labels = {
    gratuit: 'Gratuit',
    premium: 'Premium',
    pro: 'Pro',
    institutionnel: 'Institutionnel',
  };
  return labels[plan as keyof typeof labels] || plan;
};
