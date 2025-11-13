/**
 * Card pour afficher un module avec possibilité d'assignation
 */

import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import type { Module } from '../types/module.types';

interface ModuleCardProps {
  module: Module;
  isAssigned: boolean;
  onToggle: (moduleId: string, assigned: boolean) => void;
  disabled?: boolean;
  showCategory?: boolean;
}

export const ModuleCard = ({
  module,
  isAssigned,
  onToggle,
  disabled = false,
  showCategory = false,
}: ModuleCardProps) => {
  // Récupérer l'icône Lucide dynamiquement
  const IconComponent = module.icon 
    ? (LucideIcons as any)[module.icon] || LucideIcons.Package
    : LucideIcons.Package;

  // Couleur selon le plan requis
  const planColors = {
    gratuit: 'bg-green-100 text-green-800 border-green-200',
    premium: 'bg-blue-100 text-blue-800 border-blue-200',
    pro: 'bg-purple-100 text-purple-800 border-purple-200',
    institutionnel: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const planLabels = {
    gratuit: 'Gratuit',
    premium: 'Premium',
    pro: 'Pro',
    institutionnel: 'Institutionnel',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <Card className={`
        p-4 transition-all duration-300
        ${isAssigned ? 'border-[#2A9D8F] bg-[#2A9D8F]/5' : 'border-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}
      `}>
        <div className="flex items-start justify-between gap-4">
          {/* Icône + Infos */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icône */}
            <div className={`
              p-2.5 rounded-lg shrink-0
              ${isAssigned 
                ? 'bg-[#2A9D8F] text-white' 
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              <IconComponent className="h-5 w-5" />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {module.name}
                </h3>
                {module.is_core && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Core
                  </Badge>
                )}
              </div>

              {module.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {module.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${planColors[module.required_plan]}`}
                >
                  {planLabels[module.required_plan]}
                </Badge>

                {isAssigned && (
                  <Badge className="text-xs bg-[#2A9D8F] text-white">
                    Assigné
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Switch */}
          <Switch
            checked={isAssigned}
            onCheckedChange={(checked) => onToggle(module.id, checked)}
            disabled={disabled}
            className="shrink-0"
          />
        </div>
      </Card>
    </motion.div>
  );
};
