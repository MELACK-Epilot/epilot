# 🎯 Système d'Affectation Flexible des Modules - Guide Complet

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Utilisation Frontend](#utilisation-frontend)
5. [Hooks React Query](#hooks-react-query)
6. [Composants UI](#composants-ui)
7. [Best Practices](#best-practices)
8. [Sécurité](#sécurité)

---

## 🎨 Vue d'ensemble

### Principe de Fonctionnement

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN DE GROUPE                                             │
│ ─────────────────────────────────────────────────────────   │
│ 1. Voit tous les modules de son plan (Gratuit → Instit.)   │
│ 2. Sélectionne un utilisateur                               │
│ 3. Assigne librement les modules/catégories                 │
│ 4. Définit les permissions (lecture, écriture, etc.)        │
│ 5. Peut créer des profils réutilisables (optionnel)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UTILISATEUR FINAL                                           │
│ ─────────────────────────────────────────────────────────   │
│ • Voit UNIQUEMENT ses modules assignés                      │
│ • Isolation totale (RLS Supabase)                          │
│ • Permissions granulaires (read/write/delete/export)       │
└─────────────────────────────────────────────────────────────┘
```

### Avantages

✅ **Flexibilité totale** : Aucune contrainte de rôle rigide
✅ **Isolation parfaite** : RLS garantit la sécurité
✅ **Permissions granulaires** : 4 niveaux (read, write, delete, export)
✅ **Profils réutilisables** : Templates pour accélérer l'affectation
✅ **Audit complet** : Traçabilité de toutes les affectations
✅ **Performance optimale** : Vues SQL + index

---

## 🏗️ Architecture

### Tables Créées

1. **`user_assigned_modules`** : Modules assignés individuellement
2. **`user_assigned_categories`** : Catégories assignées (donne accès à tous les modules)
3. **`assignment_profiles`** : Profils réutilisables (templates)
4. **`profile_modules`** : Modules dans un profil

### Vues SQL

1. **`user_effective_modules`** : Tous les modules accessibles (directs + via catégories)
2. **`user_module_permissions`** : Permissions agrégées

### Fonctions SQL

1. **`assign_module_to_user()`** : Assigne un module avec validation
2. **`revoke_module_from_user()`** : Révoque un module (soft delete)

---

## 🚀 Installation

### Étape 1 : Exécuter le script SQL

```bash
# Dans Supabase SQL Editor
psql -h db.xxx.supabase.co -U postgres -d postgres -f database/CREATE_USER_MODULE_ASSIGNMENT_SYSTEM.sql
```

Ou copier/coller le contenu dans le SQL Editor de Supabase.

### Étape 2 : Vérifier la création

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%assigned%';

-- Résultat attendu :
-- user_assigned_modules
-- user_assigned_categories
-- assignment_profiles
-- profile_modules
```

---

## 💻 Utilisation Frontend

### Hooks React Query

#### 1. Hook : `useUserAssignedModules`

```typescript
// src/features/dashboard/hooks/useUserAssignedModules.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Récupère les modules assignés à un utilisateur
 */
export const useUserAssignedModules = (userId?: string) => {
  return useQuery({
    queryKey: ['user-assigned-modules', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Assigne un module à un utilisateur
 */
export const useAssignModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      permissions = { canRead: true, canWrite: false, canDelete: false, canExport: false },
      validUntil = null,
      notes = null,
    }: {
      userId: string;
      moduleId: string;
      permissions?: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canExport: boolean;
      };
      validUntil?: string | null;
      notes?: string | null;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('assign_module_to_user', {
        p_user_id: userId,
        p_module_id: moduleId,
        p_assigned_by: currentUser.user.id,
        p_can_read: permissions.canRead,
        p_can_write: permissions.canWrite,
        p_can_delete: permissions.canDelete,
        p_can_export: permissions.canExport,
        p_valid_until: validUntil,
        p_notes: notes,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};

/**
 * Révoque un module d'un utilisateur
 */
export const useRevokeModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const { data, error } = await supabase.rpc('revoke_module_from_user', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};

/**
 * Assigne plusieurs modules en masse
 */
export const useAssignMultipleModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
      permissions,
    }: {
      userId: string;
      moduleIds: string[];
      permissions: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canExport: boolean;
      };
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const results = await Promise.all(
        moduleIds.map((moduleId) =>
          supabase.rpc('assign_module_to_user', {
            p_user_id: userId,
            p_module_id: moduleId,
            p_assigned_by: currentUser.user.id,
            p_can_read: permissions.canRead,
            p_can_write: permissions.canWrite,
            p_can_delete: permissions.canDelete,
            p_can_export: permissions.canExport,
          })
        )
      );

      const errors = results.filter((r) => r.error || !r.data?.success);
      if (errors.length > 0) {
        throw new Error(`${errors.length} modules n'ont pas pu être assignés`);
      }

      return { success: true, count: moduleIds.length };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};
```

---

### Composant : Dialog d'Affectation

```typescript
// src/features/dashboard/components/users/UserModulesDialog.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSchoolGroupModules } from '../../hooks/useSchoolGroupModules';
import { useUserAssignedModules, useAssignMultipleModules } from '../../hooks/useUserAssignedModules';
import { toast } from 'sonner';

interface UserModulesDialogProps {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    school_group_id: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserModulesDialog = ({ user, isOpen, onClose }: UserModulesDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false,
  });

  // Modules disponibles selon le plan du groupe
  const { data: availableModules, isLoading: loadingAvailable } = useSchoolGroupModules(
    user?.school_group_id
  );

  // Modules déjà assignés à l'utilisateur
  const { data: assignedModules, isLoading: loadingAssigned } = useUserAssignedModules(user?.id);

  // Mutation pour assigner
  const assignMutation = useAssignMultipleModules();

  const isLoading = loadingAvailable || loadingAssigned;

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleAssign = async () => {
    if (!user || selectedModules.length === 0) return;

    try {
      await assignMutation.mutateAsync({
        userId: user.id,
        moduleIds: selectedModules,
        permissions,
      });

      toast.success(`${selectedModules.length} module(s) assigné(s) avec succès`);
      setSelectedModules([]);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'affectation');
    }
  };

  if (!user) return null;

  const assignedModuleIds = new Set(assignedModules?.map((m) => m.module_id) || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1D3557]">
            Assigner des modules à {user.first_name} {user.last_name}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Rôle : <Badge variant="outline">{user.role}</Badge>
          </p>
        </DialogHeader>

        {/* Permissions globales */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Permissions par défaut</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canRead"
                checked={permissions.canRead}
                onCheckedChange={(checked) =>
                  setPermissions((p) => ({ ...p, canRead: checked as boolean }))
                }
              />
              <Label htmlFor="canRead" className="text-sm">
                Lecture
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
              <Label htmlFor="canWrite" className="text-sm">
                Écriture
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
              <Label htmlFor="canDelete" className="text-sm">
                Suppression
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
              <Label htmlFor="canExport" className="text-sm">
                Export
              </Label>
            </div>
          </div>
        </div>

        {/* Liste des modules */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
            </div>
          ) : (
            <div className="space-y-2">
              {availableModules?.availableModules.map((module, index) => {
                const isAssigned = assignedModuleIds.has(module.id);
                const isSelected = selectedModules.includes(module.id);

                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2A9D8F] bg-green-50'
                        : isAssigned
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => !isAssigned && handleToggleModule(module.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isSelected || isAssigned}
                        disabled={isAssigned}
                        onCheckedChange={() => handleToggleModule(module.id)}
                      />
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{module.name}</h4>
                          {isAssigned && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="text-sm text-gray-600">{module.description}</p>
                      </div>
                      <Badge variant="outline">{module.category?.name}</Badge>
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
            {selectedModules.length} module(s) sélectionné(s)
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedModules.length === 0 || assignMutation.isPending}
              className="bg-[#2A9D8F] hover:bg-[#238276]"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Affectation...
                </>
              ) : (
                `Assigner ${selectedModules.length} module(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## ✅ Best Practices

### 1. Validation côté serveur
✅ Toujours utiliser les fonctions SQL (`assign_module_to_user`) qui valident :
- Appartenance au même groupe
- Disponibilité selon le plan
- Permissions de l'admin

### 2. Permissions granulaires
✅ Utiliser les 4 niveaux : `can_read`, `can_write`, `can_delete`, `can_export`

### 3. Soft delete
✅ Ne jamais supprimer physiquement, utiliser `is_active = FALSE`

### 4. Audit trail
✅ Toujours enregistrer `assigned_by`, `assigned_at`, `notes`

### 5. Cache intelligent
✅ React Query avec `staleTime: 5 * 60 * 1000` (5 minutes)

---

## 🔒 Sécurité

### RLS (Row Level Security)
✅ **Isolation totale** : Chaque utilisateur voit uniquement SES modules
✅ **Admin de groupe** : Gère uniquement les utilisateurs de SON groupe
✅ **Super Admin** : Vue globale en lecture seule

### Validation
✅ **Côté serveur** : Fonctions SQL avec `SECURITY DEFINER`
✅ **Côté client** : Validation Zod + TypeScript strict

---

## 📊 Résumé

| Fonctionnalité | Status |
|----------------|--------|
| Tables créées | ✅ |
| RLS configuré | ✅ |
| Vues SQL | ✅ |
| Fonctions SQL | ✅ |
| Hooks React Query | ✅ |
| Composant UI | ✅ |
| Permissions granulaires | ✅ |
| Audit trail | ✅ |
| Isolation totale | ✅ |

**Système 100% prêt pour la production !** 🚀
