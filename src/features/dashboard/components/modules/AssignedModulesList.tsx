/**
 * Liste des modules déjà assignés à un utilisateur
 * Avec actions: Retirer, Modifier permissions
 * @module AssignedModulesList
 */

import { useState } from 'react';
import { CheckCircle2, Settings, Trash2, Shield, AlertCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AssignedModule {
  id: string;
  module_id: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_export: boolean;
  assigned_at: string;
  module?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    category?: {
      name: string;
      color?: string;
    };
  };
}

interface AssignedModulesListProps {
  modules: AssignedModule[];
  onRemove: (moduleId: string) => Promise<void>;
  onUpdatePermissions: (moduleId: string, permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const AssignedModulesList = ({ 
  modules, 
  onRemove, 
  onUpdatePermissions,
  isLoading = false
}: AssignedModulesListProps) => {
  const [editingModule, setEditingModule] = useState<AssignedModule | null>(null);
  const [removingModule, setRemovingModule] = useState<string | null>(null);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{ moduleId: string; moduleName: string } | null>(null);
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false
  });

  const handleEditClick = (module: AssignedModule) => {
    setEditingModule(module);
    setPermissions({
      canRead: module.can_read,
      canWrite: module.can_write,
      canDelete: module.can_delete,
      canExport: module.can_export
    });
  };

  const handleSavePermissions = async () => {
    if (!editingModule) return;

    try {
      await onUpdatePermissions(editingModule.module_id, permissions);
      setEditingModule(null);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleRemoveClick = (moduleId: string, moduleName: string) => {
    setConfirmRemoveDialog({ moduleId, moduleName });
  };

  const handleConfirmRemove = async () => {
    if (!confirmRemoveDialog) return;

    setRemovingModule(confirmRemoveDialog.moduleId);
    try {
      await onRemove(confirmRemoveDialog.moduleId);
      setConfirmRemoveDialog(null);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    } finally {
      setRemovingModule(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun module assigné
        </h3>
        <p className="text-gray-600">
          Cet utilisateur n'a pas encore de modules assignés.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Utilisez l'onglet "Modules Disponibles" pour en assigner.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {modules.map((module) => {
          console.log('Module data:', module); // Debug
          
          return (
            <Card key={module.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Infos module */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1 text-base">
                      {module.module?.name || module.module_id || 'Module sans nom'}
                    </h4>
                    {module.module?.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {module.module.description}
                      </p>
                    )}
                    {module.module?.category && (
                      <Badge variant="outline" className="mb-2">
                        {module.module.category.name}
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {module.can_read && (
                        <Badge variant="secondary" className="text-xs">
                          📖 Lecture
                        </Badge>
                      )}
                      {module.can_write && (
                        <Badge variant="secondary" className="text-xs">
                          ✏️ Écriture
                        </Badge>
                      )}
                      {module.can_delete && (
                        <Badge variant="secondary" className="text-xs">
                          🗑️ Suppression
                        </Badge>
                      )}
                      {module.can_export && (
                        <Badge variant="secondary" className="text-xs">
                          📤 Export
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Assigné le {new Date(module.assigned_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(module)}
                    disabled={removingModule === module.module_id}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveClick(module.module_id, module.module?.name || 'ce module')}
                    disabled={removingModule === module.module_id}
                  >
                    {removingModule === module.module_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Retrait...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Retirer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dialog Modification Permissions */}
      <Dialog open={!!editingModule} onOpenChange={() => setEditingModule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2A9D8F]" />
              Modifier les permissions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-1">
                {editingModule?.module?.name || 'Module'}
              </p>
              <p className="text-xs text-blue-700">
                Définissez les permissions pour ce module
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-canRead"
                  checked={permissions.canRead}
                  onCheckedChange={(checked) =>
                    setPermissions((p) => ({ ...p, canRead: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-canRead" className="cursor-pointer flex-1">
                  <div className="font-medium">📖 Lecture</div>
                  <div className="text-xs text-gray-500">Consulter les données</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-canWrite"
                  checked={permissions.canWrite}
                  onCheckedChange={(checked) =>
                    setPermissions((p) => ({ ...p, canWrite: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-canWrite" className="cursor-pointer flex-1">
                  <div className="font-medium">✏️ Écriture</div>
                  <div className="text-xs text-gray-500">Créer et modifier</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-canDelete"
                  checked={permissions.canDelete}
                  onCheckedChange={(checked) =>
                    setPermissions((p) => ({ ...p, canDelete: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-canDelete" className="cursor-pointer flex-1">
                  <div className="font-medium">🗑️ Suppression</div>
                  <div className="text-xs text-gray-500">Supprimer des données</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-canExport"
                  checked={permissions.canExport}
                  onCheckedChange={(checked) =>
                    setPermissions((p) => ({ ...p, canExport: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-canExport" className="cursor-pointer flex-1">
                  <div className="font-medium">📤 Export</div>
                  <div className="text-xs text-gray-500">Exporter les données</div>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>
              Annuler
            </Button>
            <Button onClick={handleSavePermissions} className="bg-[#2A9D8F] hover:bg-[#238276]">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Retrait - MODERNE */}
      <Dialog open={!!confirmRemoveDialog} onOpenChange={() => setConfirmRemoveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer le retrait
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                Êtes-vous sûr de vouloir retirer ce module ?
              </p>
              <p className="text-sm text-red-700">
                <strong>{confirmRemoveDialog?.moduleName}</strong>
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                ⚠️ Cette action retirera l'accès de l'utilisateur à ce module. Vous pourrez le réassigner plus tard si nécessaire.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmRemoveDialog(null)}
              disabled={!!removingModule}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRemove}
              disabled={!!removingModule}
              className="bg-red-600 hover:bg-red-700"
            >
              {removingModule ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Retrait...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmer le retrait
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
