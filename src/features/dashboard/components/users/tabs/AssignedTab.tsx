/**
 * Onglet Modules Assignés - Gestion des modules déjà assignés
 * Modifier permissions + Retirer modules
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Trash2, Edit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssignedTabProps {
  modules: any[];
  onRemove: (moduleId: string) => void;
  onUpdatePermissions: (moduleId: string, permissions: any) => void;
  isLoading: boolean;
}

export const AssignedTab = ({
  modules,
  onRemove,
  onUpdatePermissions,
  isLoading
}: AssignedTabProps) => {
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<any>(null);

  // Grouper par catégorie
  const modulesByCategory = modules.reduce((acc: any, module: any) => {
    const categoryName = module.module?.category?.name || 'Sans catégorie';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(module);
    return acc;
  }, {});

  // Start editing
  const startEdit = (module: any) => {
    setEditingModule(module.module_id);
    setEditPermissions({
      canRead: module.can_read,
      canWrite: module.can_write,
      canDelete: module.can_delete,
      canExport: module.can_export,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingModule(null);
    setEditPermissions(null);
  };

  // Save permissions
  const savePermissions = (moduleId: string) => {
    if (editPermissions) {
      onUpdatePermissions(moduleId, editPermissions);
      setEditingModule(null);
      setEditPermissions(null);
    }
  };

  // Toggle permission
  const togglePermission = (permission: keyof typeof editPermissions) => {
    if (!editPermissions) return;
    
    setEditPermissions((prev: any) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]"></div>
      </div>
    );
  }

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
          <CheckCircle2 className="h-5 w-5 text-[#2A9D8F]" />
          <h3 className="text-lg font-bold text-gray-900">
            Modules assignés
          </h3>
          <Badge variant="outline">{modules.length}</Badge>
        </div>
      </div>

      {/* Info */}
      {modules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            💡 Modifiez les permissions ou retirez des modules
          </p>
        </div>
      )}

      {/* Liste modules groupés par catégorie */}
      {modules.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucun module assigné</p>
          <p className="text-xs mt-1">Assignez des modules depuis les autres onglets</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(modulesByCategory).map(([categoryName, categoryModules]: [string, any]) => (
            <div key={categoryName}>
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                📁 {categoryName}
                <Badge variant="outline" className="text-xs">
                  {categoryModules.length}
                </Badge>
              </h4>
              <div className="space-y-2">
                {categoryModules.map((module: any) => {
                  const isEditing = editingModule === module.module_id;
                  const perms = isEditing ? editPermissions : {
                    canRead: module.can_read,
                    canWrite: module.can_write,
                    canDelete: module.can_delete,
                    canExport: module.can_export,
                  };

                  return (
                    <motion.div
                      key={module.module_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card className={`p-3 ${isEditing ? 'border-[#2A9D8F] bg-green-50' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 mb-2">
                              {module.module?.name || 'Module inconnu'}
                            </p>
                            
                            {/* Permissions */}
                            <div className="grid grid-cols-2 gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-1.5">
                                      <Checkbox
                                        id={`${module.module_id}-read`}
                                        checked={perms.canRead}
                                        disabled={!isEditing}
                                        className={!isEditing ? 'cursor-not-allowed' : ''}
                                      />
                                      <Label 
                                        htmlFor={`${module.module_id}-read`} 
                                        className="text-xs cursor-pointer"
                                      >
                                        📖 Lecture
                                      </Label>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Consulter uniquement</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-1.5">
                                      <Checkbox
                                        id={`${module.module_id}-write`}
                                        checked={perms.canWrite}
                                        disabled={!isEditing}
                                        onCheckedChange={() => isEditing && togglePermission('canWrite')}
                                        className={!isEditing ? 'cursor-not-allowed' : ''}
                                      />
                                      <Label 
                                        htmlFor={`${module.module_id}-write`} 
                                        className="text-xs cursor-pointer"
                                      >
                                        ✏️ Écriture
                                      </Label>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Créer et modifier</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-1.5">
                                      <Checkbox
                                        id={`${module.module_id}-delete`}
                                        checked={perms.canDelete}
                                        disabled={!isEditing || !perms.canWrite}
                                        onCheckedChange={() => isEditing && togglePermission('canDelete')}
                                        className={!isEditing ? 'cursor-not-allowed' : ''}
                                      />
                                      <Label 
                                        htmlFor={`${module.module_id}-delete`} 
                                        className="text-xs cursor-pointer"
                                      >
                                        🗑️ Suppr.
                                      </Label>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Supprimer des données</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-1.5">
                                      <Checkbox
                                        id={`${module.module_id}-export`}
                                        checked={perms.canExport}
                                        disabled={!isEditing}
                                        onCheckedChange={() => isEditing && togglePermission('canExport')}
                                        className={!isEditing ? 'cursor-not-allowed' : ''}
                                      />
                                      <Label 
                                        htmlFor={`${module.module_id}-export`} 
                                        className="text-xs cursor-pointer"
                                      >
                                        📥 Export
                                      </Label>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Exporter les données</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="h-7 px-2 text-xs"
                                >
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => savePermissions(module.module_id)}
                                  className="h-7 px-2 text-xs bg-[#2A9D8F] hover:bg-[#238276]"
                                >
                                  Sauver
                                </Button>
                              </>
                            ) : (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEdit(module)}
                                        className="h-7 w-7 p-0"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Modifier permissions</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Retirer ce module?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Le module "{module.module?.name}" sera retiré de cet utilisateur.
                                        Cette action est réversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => onRemove(module.module_id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Retirer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
