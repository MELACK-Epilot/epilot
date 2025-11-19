/**
 * Liste Virtualisée de Modules
 * Optimisé pour 2000+ modules avec react-window
 * Render seulement les items visibles → Performance maximale
 */

import { memo, useCallback } from 'react';
import { List } from 'react-window';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Module {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

interface VirtualizedModuleListProps {
  modules: Module[];
  selectedModules: string[];
  onToggleModule: (moduleId: string) => void;
  height?: number;
  itemHeight?: number;
}

// Row Component (Memoized pour performance)
const ModuleRow = memo(({ index, modules, selectedModules, onToggleModule }: any) => {
  const module = modules[index];
  
  if (!module) return null;
  
  const isSelected = selectedModules.includes(module.id);
  
  return (
    <div className="px-2 py-1">
      <Card
        className={`p-3 cursor-pointer transition-all hover:shadow-md ${
          isSelected
            ? 'border-[#2A9D8F] bg-green-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onToggleModule(module.id)}
      >
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleModule(module.id)}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Icon */}
          {module.icon && (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ 
                backgroundColor: module.color ? `${module.color}20` : '#f3f4f6',
                color: module.color || '#6b7280'
              }}
            >
              {module.icon}
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {module.name}
              </p>
              {isSelected && (
                <Badge className="bg-[#2A9D8F] text-white text-xs">
                  Sélectionné
                </Badge>
              )}
            </div>
            {module.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {module.description}
              </p>
            )}
            {module.category_name && (
              <div className="flex items-center gap-1 mt-1">
                {module.category_icon && (
                  <span className="text-xs">{module.category_icon}</span>
                )}
                <span className="text-xs text-gray-600">
                  {module.category_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

ModuleRow.displayName = 'ModuleRow';

/**
 * Liste Virtualisée de Modules
 * Utilise react-window pour render seulement les items visibles
 */
export const VirtualizedModuleList = memo(({
  modules,
  selectedModules,
  onToggleModule,
  height = 600,
  itemHeight = 90
}: VirtualizedModuleListProps) => {
  // Empty state
  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">📦</div>
        <p className="text-sm text-gray-500">Aucun module disponible</p>
      </div>
    );
  }
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <List
        defaultHeight={height}
        rowCount={modules.length}
        rowHeight={itemHeight}
        rowComponent={ModuleRow}
        rowProps={{ modules, selectedModules, onToggleModule }}
        overscanCount={5}
      />
    </div>
  );
});

VirtualizedModuleList.displayName = 'VirtualizedModuleList';

/**
 * Variante avec Infinite Scroll
 */
interface VirtualizedInfiniteModuleListProps extends VirtualizedModuleListProps {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export const VirtualizedInfiniteModuleList = memo(({
  modules,
  selectedModules,
  onToggleModule,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  height = 600,
  itemHeight = 90
}: VirtualizedInfiniteModuleListProps) => {
  // Callback pour détecter scroll vers le bas
  const handleScroll = useCallback(({ scrollOffset }: any) => {
    const scrollHeight = modules.length * itemHeight;
    const threshold = scrollHeight - height - 200; // 200px avant la fin
    
    if (scrollOffset > threshold && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [modules.length, itemHeight, height, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">📦</div>
        <p className="text-sm text-gray-500">Aucun module disponible</p>
      </div>
    );
  }
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <List
        defaultHeight={height}
        rowCount={modules.length}
        rowHeight={itemHeight}
        rowComponent={ModuleRow}
        rowProps={{ modules, selectedModules, onToggleModule }}
        overscanCount={5}
        onResize={handleScroll}
      />
      
      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="p-4 text-center border-t">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin h-4 w-4 border-2 border-[#2A9D8F] border-t-transparent rounded-full" />
            Chargement...
          </div>
        </div>
      )}
    </div>
  );
});

VirtualizedInfiniteModuleList.displayName = 'VirtualizedInfiniteModuleList';
