/**
 * Onglet Catégories - Assignation par catégorie entière
 * Assigner tous les modules d'une catégorie en 1 clic
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderTree, Info } from 'lucide-react';
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
import { useAssignCategory } from '../../../hooks/useUserAssignedModules';
import { toast } from 'sonner';

interface CategoriesTabProps {
  user: any;
  categoriesData: any;
  modulesData: any;
  onAssignSuccess: () => void;
}

export const CategoriesTab = ({
  user,
  categoriesData,
  modulesData,
  onAssignSuccess
}: CategoriesTabProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false,
  });

  const assignCategoryMutation = useAssignCategory();

  // Compter modules par catégorie
  const getCategoryModuleCount = (categoryId: string) => {
    if (!modulesData?.availableModules) return 0;
    return modulesData.availableModules.filter(
      (m: any) => m.category?.id === categoryId
    ).length;
  };

  // Handler assignation
  const handleAssign = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Sélectionnez au moins une catégorie');
      return;
    }

    try {
      let totalAssigned = 0;
      
      for (const categoryId of selectedCategories) {
        await assignCategoryMutation.mutateAsync({
          userId: user.id,
          categoryId,
          permissions,
        });
        totalAssigned++;
      }
      
      toast.success(`${totalAssigned} catégorie(s) assignée(s)`);
      setSelectedCategories([]);
      onAssignSuccess();
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // Toggle catégorie
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle permission
  const togglePermission = (permission: keyof typeof permissions) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      
      if (permission === 'canRead') return prev;
      
      if (permission === 'canWrite' && !prev.canWrite) {
        newPerms.canRead = true;
      }
      
      if (permission === 'canDelete' && !prev.canDelete) {
        newPerms.canRead = true;
        newPerms.canWrite = true;
      }
      
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
          <FolderTree className="h-5 w-5 text-[#2A9D8F]" />
          <h3 className="text-lg font-bold text-gray-900">
            Catégories disponibles
          </h3>
          <Badge variant="outline">{categoriesData?.length || 0}</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          💡 Assignez tous les modules d'une catégorie en 1 clic
        </p>
      </div>

      {/* Permissions */}
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
          🔒 Permissions pour les catégories sélectionnées
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cat-canRead"
                    checked={permissions.canRead}
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label htmlFor="cat-canRead" className="text-xs cursor-pointer">
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
                    id="cat-canWrite"
                    checked={permissions.canWrite}
                    onCheckedChange={() => togglePermission('canWrite')}
                  />
                  <Label htmlFor="cat-canWrite" className="text-xs cursor-pointer">
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
                    id="cat-canDelete"
                    checked={permissions.canDelete}
                    onCheckedChange={() => togglePermission('canDelete')}
                    disabled={!permissions.canWrite}
                  />
                  <Label htmlFor="cat-canDelete" className="text-xs cursor-pointer">
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
                    id="cat-canExport"
                    checked={permissions.canExport}
                    onCheckedChange={() => togglePermission('canExport')}
                  />
                  <Label htmlFor="cat-canExport" className="text-xs cursor-pointer">
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

      {/* Liste catégories */}
      <div className="space-y-2">
        {!categoriesData || !Array.isArray(categoriesData) || categoriesData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderTree className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune catégorie disponible</p>
          </div>
        ) : (
          categoriesData.map((category: any) => {
            const moduleCount = getCategoryModuleCount(category.id);
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedCategories.includes(category.id)
                      ? 'border-[#2A9D8F] bg-green-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {moduleCount} module(s)
                      </p>
                    </div>
                    {selectedCategories.includes(category.id) && (
                      <Badge className="bg-[#2A9D8F]">Sélectionnée</Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bouton Assigner */}
      {selectedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t pt-3"
        >
          <Button
            onClick={handleAssign}
            disabled={assignCategoryMutation.isPending}
            className="w-full bg-[#2A9D8F] hover:bg-[#238276]"
          >
            {assignCategoryMutation.isPending ? (
              'Assignation...'
            ) : (
              `Assigner ${selectedCategories.length} catégorie(s)`
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
