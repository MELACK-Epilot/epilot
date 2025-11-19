/**
 * Onglet Modules Disponibles - Assignation module par module
 * Checkboxes simples + Tooltips + Recherche + Filtres
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Filter, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignMultipleModules } from '../../../hooks/useUserAssignedModules';
import { toast } from 'sonner';

interface ModulesTabProps {
  user: any;
  modulesData: any;
  categoriesData: any;
  assignedModuleIds: Set<string>;
  onAssignSuccess: () => void;
}

export const ModulesTab = ({
  user,
  modulesData,
  categoriesData,
  assignedModuleIds,
  onAssignSuccess
}: ModulesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false,
  });

  const assignModulesMutation = useAssignMultipleModules();

  // Filtrer modules disponibles
  const availableModules = useMemo(() => {
    if (!modulesData?.availableModules) return [];
    
    return modulesData.availableModules.filter((module: any) => {
      // Exclure modules déjà assignés
      if (assignedModuleIds.has(module.id)) return false;
      
      // Filtre recherche
      if (searchQuery && !module.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filtre catégorie
      if (categoryFilter !== 'all' && module.category?.id !== categoryFilter) {
        return false;
      }
      
      return true;
    });
  }, [modulesData, assignedModuleIds, searchQuery, categoryFilter]);

  // Handler assignation
  const handleAssign = async () => {
    if (selectedModules.length === 0) {
      toast.error('Sélectionnez au moins un module');
      return;
    }

    try {
      await assignModulesMutation.mutateAsync({
        userId: user.id,
        moduleIds: selectedModules,
        permissions,
      });
      
      toast.success(`${selectedModules.length} module(s) assigné(s)`);
      setSelectedModules([]);
      onAssignSuccess();
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // Toggle module selection
  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Toggle permission
  const togglePermission = (permission: keyof typeof permissions) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      
      // Lecture toujours requise
      if (permission === 'canRead') return prev;
      
      // Si on active Écriture, activer Lecture
      if (permission === 'canWrite' && !prev.canWrite) {
        newPerms.canRead = true;
      }
      
      // Si on active Suppression, activer Écriture et Lecture
      if (permission === 'canDelete' && !prev.canDelete) {
        newPerms.canRead = true;
        newPerms.canWrite = true;
      }
      
      // Si on désactive Écriture, désactiver Suppression
      if (permission === 'canWrite' && prev.canWrite) {
        newPerms.canDelete = false;
      }
      
      newPerms[permission] = !prev[permission];
      return newPerms;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[#2A9D8F]" />
          <h3 className="text-lg font-bold text-gray-900">
            Modules disponibles
          </h3>
          <Badge variant="outline">{availableModules.length}</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          💡 Sélectionnez des modules individuels et définissez leurs permissions
        </p>
      </div>

      {/* Recherche + Filtre */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 text-sm">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {Array.isArray(categoriesData) && categoriesData.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
          🔒 Permissions pour les modules sélectionnés
        </h4>
        <div className="space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canRead"
                    checked={permissions.canRead}
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label htmlFor="canRead" className="text-xs cursor-pointer">
                    📖 Lecture <Badge variant="outline" className="ml-1 text-xs">Requis</Badge>
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Lecture</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canWrite"
                    checked={permissions.canWrite}
                    onCheckedChange={() => togglePermission('canWrite')}
                  />
                  <Label htmlFor="canWrite" className="text-xs cursor-pointer">
                    ✏️ Écriture
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Modification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canDelete"
                    checked={permissions.canDelete}
                    disabled={!permissions.canWrite}
                    onCheckedChange={() => togglePermission('canDelete')}
                  />
                  <Label 
                    htmlFor="canDelete" 
                    className={`text-xs ${permissions.canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                  >
                    🗑️ Suppression
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Suppression</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canExport"
                    checked={permissions.canExport}
                    onCheckedChange={() => togglePermission('canExport')}
                  />
                  <Label htmlFor="canExport" className="text-xs cursor-pointer">
                    📥 Export
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Export</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>

      {/* Liste modules */}
      <div className="space-y-2">
        {availableModules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun module disponible</p>
          </div>
        ) : (
          availableModules.map((module: any) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedModules.includes(module.id)
                    ? 'border-[#2A9D8F] bg-green-50'
                    : 'border-gray-200'
                }`}
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => toggleModule(module.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {module.name}
                    </p>
                    {module.category && (
                      <p className="text-xs text-gray-500">
                        {module.category.icon} {module.category.name}
                      </p>
                    )}
                  </div>
                  {selectedModules.includes(module.id) && (
                    <Badge className="bg-[#2A9D8F]">Sélectionné</Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Bouton Assigner */}
      {selectedModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t pt-3"
        >
          <Button
            onClick={handleAssign}
            disabled={assignModulesMutation.isPending}
            className="w-full bg-[#2A9D8F] hover:bg-[#238276]"
          >
            {assignModulesMutation.isPending ? (
              'Assignation...'
            ) : (
              `Assigner ${selectedModules.length} module(s)`
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
