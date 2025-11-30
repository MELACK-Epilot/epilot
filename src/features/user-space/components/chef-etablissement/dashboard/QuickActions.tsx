/**
 * QuickActions - Actions rapides pour le Chef d'Établissement
 * Affiche les raccourcis vers les modules les plus utilisés
 * 
 * @module ChefEtablissement/Components
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuickAction } from '../../../types/chef-etablissement.types';

interface QuickActionsProps {
  readonly actions: QuickAction[];
  readonly maxActions?: number;
}

/**
 * Composant action individuelle
 */
const ActionButton = memo<{ action: QuickAction; index: number }>(({ action, index }) => {
  const Icon = action.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Link
        to={action.href}
        className="group block"
      >
        <div
          className="
            flex items-center gap-3 p-3 rounded-xl
            bg-gray-50 hover:bg-gray-100
            border border-transparent hover:border-gray-200
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
          "
        >
          {/* Icon */}
          <div
            className="
              flex-shrink-0 w-10 h-10 rounded-lg
              flex items-center justify-center
              transition-transform group-hover:scale-110
            "
            style={{ backgroundColor: `${action.color}20` }}
          >
            <Icon 
              className="h-5 w-5" 
              style={{ color: action.color }} 
            />
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm group-hover:text-[#1D3557]">
              {action.label}
            </p>
            {action.description && (
              <p className="text-xs text-gray-500 truncate">
                {action.description}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight 
            className="
              h-4 w-4 text-gray-400 flex-shrink-0
              transition-transform group-hover:translate-x-1
            " 
          />
        </div>
      </Link>
    </motion.div>
  );
});

ActionButton.displayName = 'ActionButton';

/**
 * Widget des actions rapides
 */
export const QuickActions = memo<QuickActionsProps>(({
  actions,
  maxActions = 6,
}) => {
  const displayedActions = actions.slice(0, maxActions);

  // État vide
  if (actions.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune action rapide disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="p-1.5 bg-[#E9C46A]/20 rounded-lg">
            <Zap className="h-4 w-4 text-[#E9C46A]" />
          </div>
          Actions Rapides
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayedActions.map((action, index) => (
            <ActionButton
              key={action.id}
              action={action}
              index={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;
