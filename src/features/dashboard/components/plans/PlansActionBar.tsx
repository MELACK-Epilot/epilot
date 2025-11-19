/**
 * Barre d'actions de la page Plans
 * Recherche et boutons d'action
 * @module PlansActionBar
 */

import { motion } from 'framer-motion';
import { Search, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PlansActionBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  onCreate: () => void;
  isSuperAdmin: boolean;
  hasPlans: boolean;
}

export const PlansActionBar = ({
  searchQuery,
  onSearchChange,
  onExport,
  onCreate,
  isSuperAdmin,
  hasPlans,
}: PlansActionBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Recherche avancée */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Rechercher un plan, module ou catégorie..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onExport}
              disabled={!hasPlans}
              className="border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            {isSuperAdmin && (
              <Button
                onClick={onCreate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
