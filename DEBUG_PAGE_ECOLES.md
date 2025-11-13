# 🐛 Debug Page Écoles - Page Blanche

**Date** : 1er novembre 2025  
**Statut** : 🔍 À débugger

---

## 🎯 Problème

La page Écoles affiche une **page blanche** quand on clique dessus dans la sidebar.

---

## 🔍 Vérifications à Faire

### 1. **Console du Navigateur**

Ouvrir la console (F12) et chercher :
- Erreurs JavaScript (rouge)
- Warnings (jaune)
- Messages d'erreur React

**Erreurs possibles** :
- `Cannot read property 'X' of undefined`
- `X is not a function`
- `Failed to fetch`
- `Network error`

---

### 2. **Vérifier l'Import**

**Fichier** : `src/features/dashboard/pages/Schools.tsx`

```typescript
import { SchoolFormDialog } from '../components/schools/SchoolFormDialog';
```

**Vérifier** :
- Le fichier existe : `src/features/dashboard/components/schools/SchoolFormDialog.tsx`
- Le composant est exporté correctement
- Pas d'erreur de syntaxe dans SchoolFormDialog.tsx

---

### 3. **Vérifier les Hooks**

```typescript
const { data: schools, isLoading } = useSchools({ 
  search, 
  status: statusFilter,
  school_group_id: user.schoolGroupId
});
```

**Vérifier** :
- `user.schoolGroupId` n'est pas `undefined`
- Le hook `useSchools` ne retourne pas d'erreur
- La requête Supabase fonctionne

---

### 4. **Vérifier les Données**

**Test dans la console** :
```javascript
// Vérifier l'utilisateur
console.log('User:', user);
console.log('SchoolGroupId:', user?.schoolGroupId);

// Vérifier les écoles
console.log('Schools:', schools);
console.log('IsLoading:', isLoading);
```

---

## 🔧 Solutions Possibles

### Solution 1 : Vérifier schoolGroupId

**Problème** : `user.schoolGroupId` est `undefined`

**Solution** :
```typescript
if (!user.schoolGroupId) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur de configuration</AlertTitle>
      <AlertDescription>
        Votre compte n'est pas associé à un groupe scolaire.
      </AlertDescription>
    </Alert>
  );
}
```

---

### Solution 2 : Ajouter Error Boundary

**Fichier** : `src/features/dashboard/pages/Schools.tsx`

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function Schools() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* Contenu de la page */}
    </ErrorBoundary>
  );
}
```

---

### Solution 3 : Vérifier la Requête Supabase

**Fichier** : `src/features/dashboard/hooks/useSchools-simple.ts`

Ajouter des logs :
```typescript
export const useSchools = (filters?: SchoolFilters) => {
  return useQuery({
    queryKey: ['schools', filters],
    queryFn: async () => {
      console.log('Fetching schools with filters:', filters);
      
      let query = supabase
        .from('schools')
        .select(`...`)
        .order('created_at', { ascending: false });

      if (filters?.school_group_id) {
        console.log('Filtering by school_group_id:', filters.school_group_id);
        query = query.eq('school_group_id', filters.school_group_id);
      }

      const { data, error } = await query;
      
      console.log('Schools data:', data);
      console.log('Schools error:', error);

      if (error) throw error;

      return transformedData;
    },
  });
};
```

---

### Solution 4 : Vérifier la Table schools

**Dans Supabase SQL Editor** :
```sql
-- Vérifier que la table existe
SELECT * FROM schools LIMIT 1;

-- Vérifier les écoles du groupe LAMARELLE
SELECT * FROM schools 
WHERE school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98';

-- Vérifier le school_group_id de l'utilisateur
SELECT school_group_id FROM users 
WHERE email = 'int@epilot.com';
```

---

## 🧪 Test Rapide

### Test 1 : Afficher un Message Simple

Remplacer temporairement le contenu de Schools.tsx :

```typescript
export default function Schools() {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <h1>Page Écoles</h1>
      <p>User: {user?.email}</p>
      <p>SchoolGroupId: {user?.schoolGroupId}</p>
      <p>SchoolGroupName: {user?.schoolGroupName}</p>
    </div>
  );
}
```

**Si ça s'affiche** : Le problème est dans le reste du composant  
**Si ça ne s'affiche pas** : Le problème est dans le routing ou l'auth

---

### Test 2 : Tester le Hook

```typescript
export default function Schools() {
  const { user } = useAuth();
  const { data: schools, isLoading, error } = useSchools({ 
    school_group_id: user?.schoolGroupId 
  });
  
  return (
    <div className="p-6">
      <h1>Page Écoles - Debug</h1>
      <p>Loading: {isLoading ? 'Oui' : 'Non'}</p>
      <p>Error: {error ? error.message : 'Aucune'}</p>
      <p>Schools count: {schools?.length || 0}</p>
      <pre>{JSON.stringify(schools, null, 2)}</pre>
    </div>
  );
}
```

---

## 📋 Checklist Debug

- [ ] Ouvrir la console (F12)
- [ ] Aller sur la page Écoles
- [ ] Noter les erreurs affichées
- [ ] Vérifier `user.schoolGroupId`
- [ ] Vérifier la requête Supabase
- [ ] Vérifier les données dans la BDD
- [ ] Tester avec un message simple
- [ ] Tester le hook isolément
- [ ] Vérifier SchoolFormDialog.tsx
- [ ] Vérifier les imports

---

## 🎯 Erreurs Communes

### Erreur 1 : schoolGroupId undefined
```
Solution : Vérifier que l'utilisateur a bien un school_group_id dans la BDD
```

### Erreur 2 : Table schools n'existe pas
```
Solution : Exécuter le schéma SQL pour créer la table
```

### Erreur 3 : RLS bloque l'accès
```
Solution : Vérifier les politiques RLS dans Supabase
```

### Erreur 4 : Composant SchoolFormDialog a une erreur
```
Solution : Vérifier la syntaxe et les imports dans SchoolFormDialog.tsx
```

---

**Suivre ces étapes pour identifier et corriger le problème !** 🐛🔍
