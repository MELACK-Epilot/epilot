/**
 * Dialog pour assigner des modules à un utilisateur
 * Interface moderne avec sélection multiple et permissions granulaires
 * @module UserModulesDialog
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, X, Loader2, Shield, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSchoolGroupModules } from '../../hooks/useSchoolGroupModules';
import { useUserAssignedModules, useAssignMultipleModules } from '../../hooks/useUserAssignedModules';
import { toast } from 'sonner';

interface UserModulesDialogProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolGroupId?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserModulesDialog = ({ user, isOpen, onClose }: UserModulesDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false,
  });

  // DEBUG: Log pour voir ce qui est passé
  console.log('🔍 UserModulesDialog - user:', user);
  console.log('🔍 UserModulesDialog - schoolGroupId:', user?.schoolGroupId);

  // Modules disponibles selon le plan du groupe
  const { data: availableModulesData, isLoading: loadingAvailable } = useSchoolGroupModules(
    user?.schoolGroupId
  );

  // Modules déjà assignés à l'utilisateur
  const { data: assignedModules, isLoading: loadingAssigned } = useUserAssignedModules(user?.id);

  // Mutation pour assigner
  const assignMutation = useAssignMultipleModules();

  const isLoading = loadingAvailable || loadingAssigned;

  // Filtrer les modules par recherche
  const filteredModules = useMemo(() => {
    if (!availableModulesData?.availableModules) return [];
    
    if (!searchQuery) return availableModulesData.availableModules;
    
    return availableModulesData.availableModules.filter(
      (module) =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (module.category?.name && module.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [availableModulesData, searchQuery]);

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSelectAll = () => {
    const assignedModuleIds = new Set(assignedModules?.map((m) => m.module_id) || []);
    const unassignedModules = filteredModules
      .filter((m) => !assignedModuleIds.has(m.id))
      .map((m) => m.id);
    
    setSelectedModules(unassignedModules);
  };

  const handleDeselectAll = () => {
    setSelectedModules([]);
  };

  const handleAssign = async () => {
    if (!user || selectedModules.length === 0) return;

    try {
      const result = await assignMutation.mutateAsync({
        userId: user.id,
        moduleIds: selectedModules,
        permissions,
      });

      if (result.failed > 0) {
        toast.warning(
          `${result.assigned} module(s) assigné(s), ${result.failed} échec(s)`,
          {
            description: 'Certains modules n\'ont pas pu être assignés (peut-être déjà assignés)',
          }
        );
      } else {
        toast.success(`${result.assigned} module(s) assigné(s) avec succès`, {
          description: `${user.firstName} ${user.lastName} a maintenant accès à ces modules`,
        });
      }

      setSelectedModules([]);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'affectation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  if (!user) return null;

  const assignedModuleIds = new Set(assignedModules?.map((m) => m.module_id) || []);
  const unassignedCount = filteredModules.filter((m) => !assignedModuleIds.has(m.id)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#1D3557] mb-2">
                Assigner des modules
              </DialogTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-gray-400">•</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Info Badge */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-blue-900 font-medium">
              {assignedModules?.length || 0} module(s) déjà assigné(s) • {unassignedCount} disponible(s)
            </p>
            <p className="text-blue-700 text-xs mt-1">
              Les modules déjà assignés sont marqués avec une coche verte et ne peuvent pas être re-sélectionnés
            </p>
          </div>
        </div>

        {/* Permissions globales */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Permissions par défaut</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canRead"
                checked={permissions.canRead}
                onCheckedChange={(checked) =>
                  setPermissions((p) => ({ ...p, canRead: checked as boolean }))
                }
              />
              <Label htmlFor="canRead" className="text-sm font-medium cursor-pointer">
                📖 Lecture
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canWrite"
                checked={permissions.canWrite}
                onCheckedChange={(checked) =>
                  setPermissions((p) => ({ ...p, canWrite: checked as boolean }))
                }
              />
              <Label htmlFor="canWrite" className="text-sm font-medium cursor-pointer">
                ✏️ Écriture
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canDelete"
                checked={permissions.canDelete}
                onCheckedChange={(checked) =>
                  setPermissions((p) => ({ ...p, canDelete: checked as boolean }))
                }
              />
              <Label htmlFor="canDelete" className="text-sm font-medium cursor-pointer">
                🗑️ Suppression
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canExport"
                checked={permissions.canExport}
                onCheckedChange={(checked) =>
                  setPermissions((p) => ({ ...p, canExport: checked as boolean }))
                }
              />
              <Label htmlFor="canExport" className="text-sm font-medium cursor-pointer">
                📥 Export
              </Label>
            </div>
          </div>
        </div>

        {/* Barre de recherche et actions */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={unassignedCount === 0}
          >
            Tout sélectionner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={selectedModules.length === 0}
          >
            Tout désélectionner
          </Button>
        </div>

        {/* Liste des modules */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucun module trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredModules.map((module, index) => {
                const isAssigned = assignedModuleIds.has(module.id);
                const isSelected = selectedModules.includes(module.id);

                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2A9D8F] bg-green-50'
                        : isAssigned
                        ? 'border-blue-200 bg-blue-50 opacity-60'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => !isAssigned && handleToggleModule(module.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isSelected || isAssigned}
                        disabled={isAssigned}
                        onCheckedChange={() => handleToggleModule(module.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: module.category?.color
                            ? `${module.category.color}20`
                            : '#E5E7EB',
                        }}
                      >
                        <Package
                          className="h-5 w-5"
                          style={{ color: module.category?.color || '#6B7280' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{module.name}</h4>
                          {isAssigned && (
                            <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{module.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="bg-gray-50">
                          {module.category?.name}
                        </Badge>
                        {isAssigned && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                            Déjà assigné
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#2A9D8F]">{selectedModules.length}</span> module(s)
            sélectionné(s)
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedModules.length === 0 || assignMutation.isPending}
              className="bg-[#2A9D8F] hover:bg-[#238276] text-white"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Affectation...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Assigner {selectedModules.length} module(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
