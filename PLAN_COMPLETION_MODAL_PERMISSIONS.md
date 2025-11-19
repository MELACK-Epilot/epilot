# 🚀 PLAN COMPLÉTION MODAL & PAGE PERMISSIONS

## 🎯 OBJECTIF

Compléter le modal d'assignation et la page Permissions & Modules avec toutes les fonctionnalités manquantes.

---

## 📊 STRUCTURE BDD IDENTIFIÉE

### Tables Principales
```sql
✅ user_assigned_modules
   - id, user_id, module_id
   - can_read, can_write, can_delete, can_export
   - assigned_by, assigned_at
   - is_active, valid_from, valid_until
   - notes

✅ user_assigned_categories
   - id, user_id, category_id
   - default_can_read, default_can_write, default_can_delete, default_can_export
   - assigned_by, assigned_at
   - is_active

✅ modules
   - id, name, slug, description
   - category_id, icon, color
   - status, required_plan

✅ business_categories
   - id, name, slug, description
   - icon, color

✅ assignment_profiles (pour profils prédéfinis)
   - id, school_group_id
   - name, description
   - role_suggestion
   - is_default, is_active
```

---

## 🔧 FONCTIONNALITÉS À IMPLÉMENTER

### PRIORITÉ 1: Modal Complet (URGENT)

#### 1.1 Ajouter Onglet "Modules Assignés"
```tsx
<Tabs>
  <Tab value="assigned">
    {/* Liste modules déjà assignés */}
    <AssignedModulesList
      modules={assignedModules}
      onRemove={handleRemoveModule}
      onUpdatePermissions={handleUpdatePermissions}
    />
  </Tab>
  
  <Tab value="available">
    {/* Modules disponibles (actuel) */}
    <AvailableModulesGrid ... />
  </Tab>
</Tabs>
```

#### 1.2 Hook pour Retirer Module
```typescript
// Hook: useRemoveUserModule
const removeModule = async (userId, moduleId) => {
  await supabase
    .from('user_assigned_modules')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('module_id', moduleId);
};
```

#### 1.3 Hook pour Modifier Permissions
```typescript
// Hook: useUpdateModulePermissions
const updatePermissions = async (userId, moduleId, permissions) => {
  await supabase
    .from('user_assigned_modules')
    .update({
      can_read: permissions.canRead,
      can_write: permissions.canWrite,
      can_delete: permissions.canDelete,
      can_export: permissions.canExport,
      updated_at: new Date()
    })
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('is_active', true);
};
```

---

### PRIORITÉ 2: Export/Import

#### 2.1 Export CSV
```typescript
const handleExport = async () => {
  // Récupérer toutes les assignations
  const { data } = await supabase
    .from('user_assigned_modules')
    .select(`
      *,
      user:users(first_name, last_name, email),
      module:modules(name, slug)
    `)
    .eq('is_active', true);

  // Générer CSV
  const csv = generateCSV(data);
  downloadFile(csv, 'permissions-export.csv');
};
```

#### 2.2 Import CSV
```typescript
const handleImport = async (file) => {
  const data = await parseCSV(file);
  
  // Valider
  const validated = validateImportData(data);
  
  // Bulk insert
  await supabase
    .from('user_assigned_modules')
    .upsert(validated);
};
```

---

### PRIORITÉ 3: Assignation en Masse

#### 3.1 Composant BulkAssignDialog
```tsx
<Dialog>
  <DialogTitle>
    Assigner à {selectedUsers.length} utilisateurs
  </DialogTitle>
  
  <ModuleSelector
    onSelect={setSelectedModules}
  />
  
  <PermissionsSelector
    onChange={setPermissions}
  />
  
  <Preview
    users={selectedUsers}
    modules={selectedModules}
    permissions={permissions}
  />
  
  <Button onClick={handleBulkAssign}>
    Confirmer l'assignation
  </Button>
</Dialog>
```

#### 3.2 Hook useBulkAssign
```typescript
const bulkAssign = async (userIds, moduleIds, permissions) => {
  const assignments = userIds.flatMap(userId =>
    moduleIds.map(moduleId => ({
      user_id: userId,
      module_id: moduleId,
      ...permissions,
      assigned_by: currentUser.id,
      assigned_at: new Date()
    }))
  );

  await supabase
    .from('user_assigned_modules')
    .upsert(assignments);
};
```

---

### PRIORITÉ 4: Onglets Avancés

#### 4.1 Vue Matricielle
```tsx
<MatrixView>
  {/* En-tête: Catégories */}
  <thead>
    <tr>
      <th>Utilisateur</th>
      {categories.map(cat => (
        <th key={cat.id}>{cat.name}</th>
      ))}
    </tr>
  </thead>
  
  {/* Corps: Users x Categories */}
  <tbody>
    {users.map(user => (
      <tr key={user.id}>
        <td>{user.name}</td>
        {categories.map(cat => (
          <td 
            onClick={() => toggleCategory(user.id, cat.id)}
            className={getCellColor(user.id, cat.id)}
          >
            {getModulesCount(user.id, cat.id)}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</MatrixView>
```

#### 4.2 Profils Prédéfinis
```tsx
<ProfilesView>
  {/* Liste profils */}
  {profiles.map(profile => (
    <ProfileCard
      profile={profile}
      onApply={(userId) => applyProfile(userId, profile.id)}
      onEdit={() => editProfile(profile.id)}
      onDelete={() => deleteProfile(profile.id)}
    />
  ))}
  
  {/* Créer nouveau profil */}
  <CreateProfileDialog />
</ProfilesView>
```

#### 4.3 Historique
```tsx
<HistoryView>
  <Timeline>
    {history.map(entry => (
      <TimelineItem
        action={entry.action}
        user={entry.user}
        module={entry.module}
        timestamp={entry.timestamp}
        onUndo={() => undoAction(entry.id)}
      />
    ))}
  </Timeline>
</HistoryView>
```

---

## 📝 HOOKS À CRÉER

### 1. useRemoveUserModule
```typescript
export const useRemoveUserModule = () => {
  return useMutation({
    mutationFn: async ({ userId, moduleId }) => {
      const { error } = await supabase
        .from('user_assigned_modules')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('module_id', moduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userModules']);
    }
  });
};
```

### 2. useUpdateModulePermissions
```typescript
export const useUpdateModulePermissions = () => {
  return useMutation({
    mutationFn: async ({ userId, moduleId, permissions }) => {
      const { error } = await supabase
        .from('user_assigned_modules')
        .update({
          can_read: permissions.canRead,
          can_write: permissions.canWrite,
          can_delete: permissions.canDelete,
          can_export: permissions.canExport,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('is_active', true);
      
      if (error) throw error;
    }
  });
};
```

### 3. useBulkAssignModules
```typescript
export const useBulkAssignModules = () => {
  return useMutation({
    mutationFn: async ({ userIds, moduleIds, permissions, assignedBy }) => {
      const assignments = userIds.flatMap(userId =>
        moduleIds.map(moduleId => ({
          user_id: userId,
          module_id: moduleId,
          ...permissions,
          assigned_by: assignedBy,
          assigned_at: new Date(),
          is_active: true
        }))
      );

      const { error } = await supabase
        .from('user_assigned_modules')
        .upsert(assignments);
      
      if (error) throw error;
      return assignments.length;
    }
  });
};
```

### 4. useExportPermissions
```typescript
export const useExportPermissions = () => {
  return async (schoolGroupId) => {
    const { data } = await supabase
      .from('user_assigned_modules')
      .select(`
        *,
        user:users(first_name, last_name, email, role),
        module:modules(name, slug, category:business_categories(name))
      `)
      .eq('users.school_group_id', schoolGroupId)
      .eq('is_active', true);

    return generateCSV(data);
  };
};
```

---

## 🎨 COMPOSANTS À CRÉER

### 1. AssignedModulesList.tsx
```tsx
export const AssignedModulesList = ({ 
  modules, 
  onRemove, 
  onUpdatePermissions 
}) => {
  return (
    <div className="space-y-2">
      {modules.map(module => (
        <AssignedModuleCard
          key={module.id}
          module={module}
          onRemove={() => onRemove(module.id)}
          onUpdatePermissions={(perms) => onUpdatePermissions(module.id, perms)}
        />
      ))}
    </div>
  );
};
```

### 2. BulkAssignDialog.tsx
```tsx
export const BulkAssignDialog = ({
  selectedUsers,
  isOpen,
  onClose
}) => {
  const [selectedModules, setSelectedModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Sélection modules */}
      {/* Permissions */}
      {/* Preview */}
      {/* Confirmation */}
    </Dialog>
  );
};
```

### 3. MatrixPermissionsView.tsx
```tsx
export const MatrixPermissionsView = ({
  users,
  categories
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="matrix-table">
        {/* Headers */}
        {/* Rows */}
      </table>
    </div>
  );
};
```

---

## 📋 ORDRE D'IMPLÉMENTATION

### Jour 1: Modal Complet
```
1. ✅ Créer useRemoveUserModule hook
2. ✅ Créer useUpdateModulePermissions hook
3. ✅ Créer AssignedModulesList component
4. ✅ Ajouter onglets au modal
5. ✅ Tester retrait et modification
```

### Jour 2: Export/Import + Bulk
```
1. ✅ Créer useExportPermissions hook
2. ✅ Créer useImportPermissions hook
3. ✅ Implémenter export CSV
4. ✅ Implémenter import CSV
5. ✅ Créer BulkAssignDialog
6. ✅ Implémenter assignation en masse
```

### Jour 3: Onglets Avancés
```
1. ✅ Créer MatrixPermissionsView
2. ✅ Créer ProfilesPermissionsView
3. ✅ Créer HistoryPermissionsView
4. ✅ Activer les onglets
5. ✅ Tests complets
```

---

## ✅ CHECKLIST FINALE

### Modal
```
☐ Onglet "Modules Assignés" avec liste
☐ Bouton "Retirer" par module
☐ Bouton "Modifier permissions" par module
☐ Onglet "Modules Disponibles" (existe)
☐ Recherche et filtres
☐ Feedback visuel (loading, success, error)
```

### Page
```
☐ Export CSV fonctionnel
☐ Import CSV fonctionnel
☐ Assignation en masse réelle
☐ Vue Matricielle active
☐ Profils active
☐ Historique actif
```

### Hooks
```
☐ useRemoveUserModule
☐ useUpdateModulePermissions
☐ useBulkAssignModules
☐ useExportPermissions
☐ useImportPermissions
☐ useAssignmentHistory
```

---

**Prêt à implémenter!** 🚀

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 11.0 Plan Complétion  
**Date:** 16 Novembre 2025
