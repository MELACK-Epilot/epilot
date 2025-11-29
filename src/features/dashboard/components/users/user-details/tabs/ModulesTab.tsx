/**
 * Onglet Modules assignés - Version SaaS Moderne
 * @module user-details/tabs/ModulesTab
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Package,
  Eye,
  PenLine,
  Download,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupModulesByCategory } from '../utils';
import type { UserModule } from '../types';

interface ModulesTabProps {
  modules: UserModule[];
  isLoading: boolean;
  canEdit?: boolean;
  onToggleModule?: (moduleId: string, enabled: boolean) => void;
  onTogglePermission?: (moduleId: string, permission: string, value: boolean) => void;
}

const PermissionBadge = ({
  icon: Icon,
  label,
  active,
  color,
  onClick,
  canEdit,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  color: string;
  onClick?: () => void;
  canEdit?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={canEdit ? onClick : undefined}
          disabled={!canEdit}
          className={`
            flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
            ${active
              ? `${color} text-white shadow-sm`
              : 'bg-gray-100 text-gray-400'
            }
            ${canEdit ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
          `}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}: {active ? 'Activé' : 'Désactivé'}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const ModulesTab = ({
  modules,
  isLoading,
  canEdit = false,
  onToggleModule,
  onTogglePermission,
}: ModulesTabProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D3557]" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun module assigné</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Assignez un profil d'accès pour attribuer des modules automatiquement avec leurs permissions.
        </p>
      </div>
    );
  }

  const modulesByCategory = groupModulesByCategory(modules);
  const categories = Object.entries(modulesByCategory);

  // Stats globales
  const totalRead = modules.filter((m) => m.can_read).length;
  const totalWrite = modules.filter((m) => m.can_write).length;
  const totalDelete = modules.filter((m) => m.can_delete).length;
  const totalExport = modules.filter((m) => m.can_export).length;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Lecture</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{totalRead}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <PenLine className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Écriture</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalWrite}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Suppression</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{totalDelete}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Download className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Export</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{totalExport}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map(([category, categoryModules], index) => {
          const isExpanded = expandedCategories[category] !== false; // Par défaut ouvert

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1D3557] to-[#457B9D] flex items-center justify-center">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">{category}</h4>
                        <p className="text-sm text-gray-500">
                          {categoryModules.length} module{categoryModules.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {categoryModules.some((m) => m.can_read) && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            <Eye className="h-3 w-3 mr-1" />
                            {categoryModules.filter((m) => m.can_read).length}
                          </Badge>
                        )}
                        {categoryModules.some((m) => m.can_write) && (
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            <PenLine className="h-3 w-3 mr-1" />
                            {categoryModules.filter((m) => m.can_write).length}
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t bg-gray-50/50">
                    <div className="divide-y">
                      {categoryModules.map((mod) => (
                        <div
                          key={mod.id}
                          className="flex items-center justify-between p-4 hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                            <span className="font-medium text-gray-900">{mod.module_name}</span>
                            {mod.assigned_by_profile && (
                              <Badge variant="outline" className="text-xs">
                                via profil
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <PermissionBadge
                              icon={Eye}
                              label="Lecture"
                              active={mod.can_read}
                              color="bg-emerald-500"
                              canEdit={canEdit}
                              onClick={() => onTogglePermission?.(mod.id, 'can_read', !mod.can_read)}
                            />
                            <PermissionBadge
                              icon={PenLine}
                              label="Écriture"
                              active={mod.can_write}
                              color="bg-blue-500"
                              canEdit={canEdit}
                              onClick={() => onTogglePermission?.(mod.id, 'can_write', !mod.can_write)}
                            />
                            <PermissionBadge
                              icon={Trash2}
                              label="Suppression"
                              active={mod.can_delete}
                              color="bg-red-500"
                              canEdit={canEdit}
                              onClick={() => onTogglePermission?.(mod.id, 'can_delete', !mod.can_delete)}
                            />
                            <PermissionBadge
                              icon={Download}
                              label="Export"
                              active={mod.can_export}
                              color="bg-purple-500"
                              canEdit={canEdit}
                              onClick={() => onTogglePermission?.(mod.id, 'can_export', !mod.can_export)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 pt-2">
        <p>
          {modules.length} module{modules.length > 1 ? 's' : ''} dans {categories.length} catégorie{categories.length > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
