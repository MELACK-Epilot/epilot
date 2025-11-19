/**
 * Section modules expandable de la carte plan
 * Affiche catégories et modules avec animation
 * @module PlanCardModules
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Package, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPlanTheme } from '../../utils/planCard.utils';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardModulesProps {
  plan: PlanWithContent;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PlanCardModules = ({ plan, isExpanded, onToggleExpand }: PlanCardModulesProps) => {
  const theme = getPlanTheme(plan.slug);

  return (
    <div className="px-6 pb-6">
      <button
        onClick={onToggleExpand}
        className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${theme.bgPattern} hover:from-${theme.accent}-50 hover:to-${theme.accent}-100 transition-all duration-200 border border-${theme.accent}-100`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-${theme.accent}-100 rounded-lg flex items-center justify-center`}>
            <Layers className={`w-4 h-4 text-${theme.accent}-600`} />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-900">
              {plan.categories?.length || 0} catégories · {plan.modules?.length || 0} modules
            </div>
            <div className="text-xs text-slate-500">Cliquez pour voir le détail</div>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-6">
              {/* Catégories */}
              {plan.categories && plan.categories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 bg-${theme.accent}-100 rounded-lg flex items-center justify-center`}>
                      <Layers className={`w-3 h-3 text-${theme.accent}-600`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Catégories Métiers</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {plan.categories.map((cat: any) => (
                      <div
                        key={cat.id}
                        className={`flex items-center gap-3 p-3 rounded-lg bg-${theme.accent}-50 border border-${theme.accent}-100`}
                      >
                        <div className={`w-8 h-8 bg-${theme.accent}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Package className={`w-4 h-4 text-${theme.accent}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 text-sm">{cat.name}</div>
                          {cat.description && (
                            <div className="text-xs text-slate-500 line-clamp-1">{cat.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules */}
              {plan.modules && plan.modules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 bg-${theme.accent}-100 rounded-lg flex items-center justify-center`}>
                      <Package className={`w-3 h-3 text-${theme.accent}-600`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Modules Inclus</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {plan.modules.map((mod: any) => (
                      <div
                        key={mod.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${theme.bgPattern} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Package className={`w-4 h-4 text-${theme.accent}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 text-sm">{mod.name}</span>
                            {mod.is_premium && (
                              <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 rounded-full">
                                Premium
                              </Badge>
                            )}
                            {mod.is_core && (
                              <Badge className="text-[10px] px-2 py-0 bg-gradient-to-r from-blue-400 to-blue-500 text-white border-0 rounded-full">
                                Core
                              </Badge>
                            )}
                          </div>
                          {mod.description && (
                            <div className="text-xs text-slate-500 line-clamp-1 mt-1">{mod.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si pas de contenu */}
              {(!plan.categories || plan.categories.length === 0) && (!plan.modules || plan.modules.length === 0) && (
                <div className="text-center py-6">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <div className="text-sm text-slate-500">Aucun module ou catégorie assigné</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
