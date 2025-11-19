# 📊 STATUT IMPLÉMENTATION MODAL COMPLET

## ✅ CE QUI A ÉTÉ FAIT

### 1. Hooks de Gestion Créés ✅
```
📄 src/features/dashboard/hooks/useModuleManagement.ts

✅ useRemoveUserModule
   - Retire un module d'un utilisateur
   - Met is_active à false
   - Invalide les queries

✅ useUpdateModulePermissions
   - Modifie les permissions d'un module
   - Met à jour can_read, can_write, can_delete, can_export
   - Invalide les queries

✅ useBulkAssignModules
   - Assignation en masse
   - userIds x moduleIds
   - Upsert avec gestion conflits

✅ useExportPermissions
   - Export CSV des permissions
   - Téléchargement automatique
   - Format professionnel
```

---

## 🎯 PROCHAINES ÉTAPES (PAR PRIORITÉ)

### PRIORITÉ 1: Compléter le Modal (URGENT)

Vu la taille du code nécessaire, voici ce qu'il faut faire:

#### Étape 1: Modifier UserModulesDialog.v2.tsx
```typescript
// Ajouter système d'onglets
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Dans le composant
const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');

// Importer les nouveaux hooks
import { 
  useRemoveUserModule, 
  useUpdateModulePermissions 
} from '../../hooks/useModuleManagement';

// Utiliser les hooks
const removeModuleMutation = useRemoveUserModule();
const updatePermissionsMutation = useUpdateModulePermissions();

// Handlers
const handleRemoveModule = async (moduleId: string) => {
  await removeModuleMutation.mutateAsync({
    userId: user.id,
    moduleId
  });
};

const handleUpdatePermissions = async (moduleId: string, permissions: any) => {
  await updatePermissionsMutation.mutateAsync({
    userId: user.id,
    moduleId,
    permissions
  });
};
```

#### Étape 2: Ajouter Onglet "Modules Assignés"
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="available">
      Modules Disponibles ({unassignedCount})
    </TabsTrigger>
    <TabsTrigger value="assigned">
      Modules Assignés ({assignedModules?.length || 0})
    </TabsTrigger>
  </TabsList>

  {/* Onglet Disponibles (code actuel) */}
  <TabsContent value="available">
    {/* Code actuel */}
  </TabsContent>

  {/* Onglet Assignés (NOUVEAU) */}
  <TabsContent value="assigned">
    <AssignedModulesList
      modules={assignedModules}
      onRemove={handleRemoveModule}
      onUpdatePermissions={handleUpdatePermissions}
    />
  </TabsContent>
</Tabs>
```

#### Étape 3: Créer Composant AssignedModulesList
```tsx
// src/features/dashboard/components/modules/AssignedModulesList.tsx

interface AssignedModulesListProps {
  modules: any[];
  onRemove: (moduleId: string) => Promise<void>;
  onUpdatePermissions: (moduleId: string, permissions: any) => Promise<void>;
}

export const AssignedModulesList = ({ 
  modules, 
  onRemove, 
  onUpdatePermissions 
}: AssignedModulesListProps) => {
  const [editingModule, setEditingModule] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {modules.map(module => (
        <Card key={module.module_id} className="p-4">
          <div className="flex items-center justify-between">
            {/* Infos module */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">{module.module?.name}</h4>
                <div className="flex gap-2 mt-1">
                  {module.can_read && <Badge variant="secondary">📖 Lecture</Badge>}
                  {module.can_write && <Badge variant="secondary">✏️ Écriture</Badge>}
                  {module.can_delete && <Badge variant="secondary">🗑️ Suppression</Badge>}
                  {module.can_export && <Badge variant="secondary">📤 Export</Badge>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingModule(module.module_id)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(module.module_id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Retirer
              </Button>
            </div>
          </div>

          {/* Dialog modification permissions */}
          {editingModule === module.module_id && (
            <EditPermissionsDialog
              module={module}
              onSave={(perms) => {
                onUpdatePermissions(module.module_id, perms);
                setEditingModule(null);
              }}
              onCancel={() => setEditingModule(null)}
            />
          )}
        </Card>
      ))}
    </div>
  );
};
```

---

### PRIORITÉ 2: Implémenter Export/Import

#### Modifier PermissionsModulesPage.tsx
```typescript
import { useExportPermissions } from '../hooks/useModuleManagement';

const exportPermissions = useExportPermissions();

const handleExport = async () => {
  try {
    await exportPermissions(user?.schoolGroupId);
  } catch (error) {
    // Erreur déjà gérée dans le hook
  }
};

// Import (à implémenter)
const handleImport = () => {
  // Ouvrir dialog de sélection fichier
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await importPermissions(file);
    }
  };
  input.click();
};
```

---

### PRIORITÉ 3: Assignation en Masse

#### Créer BulkAssignDialog.tsx
```tsx
// src/features/dashboard/components/permissions/BulkAssignDialog.tsx

export const BulkAssignDialog = ({
  selectedUsers,
  isOpen,
  onClose,
  onSuccess
}: BulkAssignDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canExport: false
  });

  const bulkAssignMutation = useBulkAssignModules();

  const handleAssign = async () => {
    await bulkAssignMutation.mutateAsync({
      userIds: selectedUsers.map(u => u.id),
      moduleIds: selectedModules,
      permissions,
      assignedBy: currentUser.id
    });
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Assigner des modules à {selectedUsers.length} utilisateur(s)
          </DialogTitle>
        </DialogHeader>

        {/* Sélection modules */}
        <ModuleSelector
          onSelect={setSelectedModules}
          selected={selectedModules}
        />

        {/* Permissions */}
        <PermissionsSelector
          permissions={permissions}
          onChange={setPermissions}
        />

        {/* Preview */}
        <AssignmentPreview
          users={selectedUsers}
          modules={selectedModules}
          permissions={permissions}
        />

        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedModules.length === 0}
          >
            Assigner ({selectedUsers.length} × {selectedModules.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Intégrer dans UsersPermissionsView.tsx
```typescript
const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

const handleBulkAssign = () => {
  if (selectedUsers.length === 0) {
    toast.error('Aucun utilisateur sélectionné');
    return;
  }
  setBulkDialogOpen(true);
};

// Dans le JSX
<BulkAssignDialog
  selectedUsers={users.filter(u => selectedUsers.includes(u.id))}
  isOpen={bulkDialogOpen}
  onClose={() => setBulkDialogOpen(false)}
  onSuccess={() => {
    setSelectedUsers([]);
    onRefresh();
  }}
/>
```

---

## 📋 FICHIERS À CRÉER/MODIFIER

### Créer
```
✅ src/features/dashboard/hooks/useModuleManagement.ts (FAIT)
☐ src/features/dashboard/components/modules/AssignedModulesList.tsx
☐ src/features/dashboard/components/modules/EditPermissionsDialog.tsx
☐ src/features/dashboard/components/permissions/BulkAssignDialog.tsx
☐ src/features/dashboard/components/permissions/ModuleSelector.tsx
☐ src/features/dashboard/components/permissions/PermissionsSelector.tsx
☐ src/features/dashboard/components/permissions/AssignmentPreview.tsx
```

### Modifier
```
☐ src/features/dashboard/components/users/UserModulesDialog.v2.tsx
   - Ajouter système d'onglets
   - Intégrer AssignedModulesList
   - Utiliser nouveaux hooks

☐ src/features/dashboard/components/permissions/UsersPermissionsView.tsx
   - Intégrer BulkAssignDialog
   - Implémenter handleBulkAssign

☐ src/features/dashboard/pages/PermissionsModulesPage.tsx
   - Implémenter export réel
   - Implémenter import
```

---

## 🎯 ESTIMATION TEMPS

```
Modal Complet:           4-6 heures
  - Onglets:             1h
  - AssignedModulesList: 2h
  - EditPermissions:     1h
  - Tests:               1-2h

Export/Import:           2-3 heures
  - Export CSV:          1h
  - Import CSV:          1-2h

Bulk Assign:             3-4 heures
  - BulkAssignDialog:    2h
  - Intégration:         1h
  - Tests:               1h

TOTAL:                   9-13 heures
```

---

## ✅ RECOMMANDATION

Vu l'ampleur du travail, je recommande de procéder par étapes:

### Phase 1 (URGENT - 4h)
```
1. Modifier UserModulesDialog.v2.tsx
2. Créer AssignedModulesList.tsx
3. Tester retrait et modification
```

### Phase 2 (Important - 2h)
```
1. Implémenter Export CSV
2. Tester export
```

### Phase 3 (Important - 3h)
```
1. Créer BulkAssignDialog
2. Intégrer dans UsersPermissionsView
3. Tester assignation en masse
```

---

## 🚀 POUR CONTINUER

**Veux-tu que je:**

1. ✅ **Complète le modal maintenant** (UserModulesDialog.v2.tsx + AssignedModulesList)
2. ✅ **Implémente l'export/import**
3. ✅ **Crée le BulkAssignDialog**
4. ✅ **Tout faire en une fois** (9-13h de code)

**Ou préfères-tu:**
- 📋 Un guide détaillé pour que tu le fasses toi-même?
- 🎯 Que je me concentre sur une partie spécifique?

**Dis-moi ce que tu préfères et je continue!** 🚀

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 12.0 Statut Implémentation  
**Date:** 16 Novembre 2025  
**Statut:** 🟡 En Cours - Hooks Créés, Composants À Faire
