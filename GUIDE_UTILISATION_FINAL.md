# 🚀 GUIDE D'UTILISATION FINAL - SYSTÈME COMPLET

## ✅ TOUT EST PRÊT!

---

## 📋 ÉTAPES D'INTÉGRATION

### 1. Wrapper l'Application avec le Provider

```typescript
// src/App.tsx ou src/features/dashboard/layouts/DashboardLayout.tsx

import { ModulesProvider } from '@/features/dashboard/providers/ModulesProvider';

function DashboardLayout() {
  return (
    <ModulesProvider>
      {/* Votre contenu dashboard */}
      <Outlet />
    </ModulesProvider>
  );
}
```

---

### 2. Utiliser dans les Composants

#### Exemple: Modal d'Assignation

```typescript
import { useModules } from '@/features/dashboard/providers/ModulesProvider';
import { useModulesStore } from '@/features/dashboard/store/modules.store';

function UserModulesDialog({ user }) {
  const { assignModules, assignCategory, isAssigning } = useModules();
  const { 
    selectedModules, 
    selectedCategories,
    defaultPermissions,
    clearSelection 
  } = useModulesStore();

  const handleAssign = async () => {
    try {
      // Assigner catégories
      for (const categoryId of selectedCategories) {
        await assignCategory({
          userId: user.id,
          categoryId,
          permissions: defaultPermissions,
        });
      }

      // Assigner modules
      if (selectedModules.length > 0) {
        await assignModules({
          userId: user.id,
          moduleIds: selectedModules,
          permissions: defaultPermissions,
        });
      }

      clearSelection();
    } catch (error) {
      console.error('Erreur assignation:', error);
    }
  };

  return (
    <Dialog>
      {/* UI */}
      <Button onClick={handleAssign} disabled={isAssigning}>
        {isAssigning ? 'Assignation...' : 'Assigner'}
      </Button>
    </Dialog>
  );
}
```

---

### 3. Utiliser le Store Zustand

```typescript
import { useModulesStore } from '@/features/dashboard/store/modules.store';

function ModulesList({ modules }) {
  const { selectedModules, toggleModule } = useModulesStore();

  return (
    <div>
      {modules.map(module => (
        <div key={module.id}>
          <Checkbox
            checked={selectedModules.includes(module.id)}
            onCheckedChange={() => toggleModule(module.id)}
          />
          {module.name}
        </div>
      ))}
    </div>
  );
}
```

---

### 4. Gérer les Permissions

```typescript
import { useModulesStore } from '@/features/dashboard/store/modules.store';

function PermissionsSelector() {
  const { defaultPermissions, setDefaultPermissions } = useModulesStore();

  return (
    <div>
      <Checkbox
        checked={defaultPermissions.canRead}
        onCheckedChange={(checked) =>
          setDefaultPermissions({ canRead: checked })
        }
      />
      Lecture
      
      <Checkbox
        checked={defaultPermissions.canWrite}
        onCheckedChange={(checked) =>
          setDefaultPermissions({ canWrite: checked })
        }
      />
      Écriture
    </div>
  );
}
```

---

## 🔐 SÉCURITÉ GARANTIE

### Validation Automatique

Toutes les fonctions RPC valident automatiquement:

1. ✅ **Même Groupe Scolaire**
   - Admin et user doivent être du même `school_group_id`
   - Erreur: `UNAUTHORIZED`

2. ✅ **Module dans Plan**
   - Module doit être dans le plan actif du groupe
   - Erreur: `MODULE_NOT_IN_PLAN`

3. ✅ **Pas de Doublon**
   - Module ne peut pas être assigné 2 fois
   - Erreur: `ALREADY_ASSIGNED`

---

## 📊 MESSAGES D'ERREUR

### Codes d'Erreur RPC

```typescript
// ADMIN_NOT_FOUND
"Administrateur non trouvé"

// USER_NOT_FOUND
"Utilisateur non trouvé"

// UNAUTHORIZED
"Vous ne pouvez assigner que des modules aux utilisateurs de votre groupe scolaire"

// MODULE_NOT_IN_PLAN
"Le module 'X' n'est pas inclus dans votre plan d'abonnement"

// CATEGORY_NOT_IN_PLAN
"La catégorie 'X' n'est pas incluse dans votre plan"

// ALREADY_ASSIGNED
"Ce module est déjà assigné à cet utilisateur"

// NOT_FOUND
"Le module 'X' n'est pas assigné à cet utilisateur"

// NO_ACTIVE_PLAN
"Aucun plan actif trouvé pour votre groupe scolaire"

// INTERNAL_ERROR
"Erreur interne" + détails
```

---

## 🎯 EXEMPLES COMPLETS

### Exemple 1: Assigner Module Simple

```typescript
import { useModules } from '@/features/dashboard/providers/ModulesProvider';

function AssignButton({ userId, moduleId }) {
  const { assignModule, isAssigning } = useModules();

  const handleClick = async () => {
    await assignModule({
      userId,
      moduleId,
      permissions: {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canExport: false,
      }
    });
  };

  return (
    <button onClick={handleClick} disabled={isAssigning}>
      Assigner
    </button>
  );
}
```

### Exemple 2: Assigner Catégorie Entière

```typescript
import { useModules } from '@/features/dashboard/providers/ModulesProvider';

function AssignCategoryButton({ userId, categoryId }) {
  const { assignCategory, isAssigning } = useModules();

  const handleClick = async () => {
    const result = await assignCategory({
      userId,
      categoryId,
      permissions: {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canExport: false,
      }
    });

    console.log(`${result.assigned} modules assignés`);
    console.log(`${result.skipped} déjà assignés`);
  };

  return (
    <button onClick={handleClick} disabled={isAssigning}>
      Assigner Catégorie
    </button>
  );
}
```

### Exemple 3: Révoquer Module

```typescript
import { useModules } from '@/features/dashboard/providers/ModulesProvider';

function RevokeButton({ userId, moduleId }) {
  const { revokeModule, isAssigning } = useModules();

  const handleClick = async () => {
    if (confirm('Êtes-vous sûr ?')) {
      await revokeModule({ userId, moduleId });
    }
  };

  return (
    <button onClick={handleClick} disabled={isAssigning}>
      Retirer
    </button>
  );
}
```

---

## 🎨 BEST PRACTICES

### 1. Toujours Wrapper avec Provider

```typescript
// ✅ BON
<ModulesProvider>
  <YourComponent />
</ModulesProvider>

// ❌ MAUVAIS
<YourComponent /> // Erreur: useModules must be used within ModulesProvider
```

### 2. Utiliser Store pour État Local

```typescript
// ✅ BON - Store Zustand
const { selectedModules, toggleModule } = useModulesStore();

// ❌ MAUVAIS - useState local
const [selected, setSelected] = useState([]);
```

### 3. Gérer les Erreurs

```typescript
// ✅ BON
try {
  await assignModule({ userId, moduleId });
} catch (error) {
  // Erreur déjà affichée par le provider (toast)
  console.error('Erreur:', error);
}

// ❌ MAUVAIS - Ignorer les erreurs
await assignModule({ userId, moduleId }); // Pas de try/catch
```

### 4. Invalider les Queries

```typescript
// ✅ BON - Automatique avec provider
await assignModule({ userId, moduleId });
// Les queries sont invalidées automatiquement

// ❌ MAUVAIS - Invalider manuellement
await assignModule({ userId, moduleId });
queryClient.invalidateQueries(); // Déjà fait par le provider
```

---

## 🎉 RÉSUMÉ

### Ce qui est Prêt ✅

```
✅ 4 Fonctions RPC sécurisées
✅ Store Zustand avec persist
✅ Provider React avec Context
✅ 5 Hooks optimisés
✅ Validation stricte serveur
✅ Messages d'erreur explicites
✅ Toast notifications
✅ Invalidation cache auto
✅ Progress tracking
✅ Production ready
```

### Comment Utiliser 🚀

```
1. Wrapper app avec ModulesProvider
2. Utiliser useModules() dans composants
3. Utiliser useModulesStore() pour état
4. Appeler assignModule/assignCategory/revokeModule
5. Gérer les erreurs (automatique avec toast)
```

### Sécurité Garantie 🔒

```
✅ Impossible d'assigner module hors plan
✅ Impossible d'assigner à user d'autre groupe
✅ Impossible d'assigner module déjà assigné
✅ Validation stricte côté serveur
✅ Messages d'erreur clairs
```

---

**C'est PARFAIT et PRÊT À UTILISER!** 🚀

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 21.0 Guide Utilisation Final  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Production Ready - Documentation Complète
