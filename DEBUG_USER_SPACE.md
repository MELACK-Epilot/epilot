# 🔍 DEBUG - Espace Utilisateur Vide

## 🎯 Problème Identifié

**Symptômes** :
- ✅ Connexion en tant que Proviseur réussie
- ❌ Espace utilisateur vide
- ❌ Rôle ne s'affiche pas
- ❌ Aucune fonctionnalité visible

---

## 🔎 Causes Possibles

### 1. **Hook `useCurrentUser()` ne retourne pas de données**

**Vérifications** :
```typescript
// Dans UserDashboard.tsx
const { data: user, isLoading, error } = useCurrentUser();

console.log('User:', user);
console.log('Loading:', isLoading);
console.log('Error:', error);
```

**Problèmes potentiels** :
- ❌ `user` est `undefined`
- ❌ `user.role` est `undefined`
- ❌ `user.schoolGroupId` est `undefined`
- ❌ Erreur SQL dans la requête

---

### 2. **Données manquantes dans la table `users`**

**Colonnes requises** :
```sql
- id (UUID)
- email (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- role (user_role ENUM)
- school_id (UUID) → schools.id
- school_group_id (UUID) → school_groups.id
- avatar (TEXT)
- status (status ENUM)
```

**Vérification SQL** :
```sql
-- Vérifier l'utilisateur Proviseur
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_id,
  school_group_id,
  status
FROM users
WHERE email = 'email_proviseur@example.com';
```

**Problèmes possibles** :
- ❌ `role` est NULL
- ❌ `school_group_id` est NULL
- ❌ `first_name` ou `last_name` sont NULL
- ❌ `status` n'est pas 'active'

---

### 3. **Sidebar ne s'affiche pas**

**Cause** : `useCurrentUser()` retourne `undefined`

**Code dans `UserSidebar.tsx`** :
```typescript
const { data: user, isLoading, error } = useCurrentUser();

// Si isLoading = true → Affiche loader
if (isLoading) {
  return <div>Loading...</div>;
}

// Si user = undefined → Sidebar vide
if (!user) {
  return null; // ❌ PROBLÈME ICI
}
```

---

### 4. **Dashboard vide**

**Cause** : `getWidgets()` retourne un tableau vide

**Code dans `UserDashboard.tsx`** :
```typescript
const getWidgets = () => {
  // Si user?.role est undefined
  if (['proviseur', 'directeur', 'directeur_etudes'].includes(user?.role || '')) {
    // ❌ Ne rentre jamais ici si user?.role est undefined
  }
  
  return baseWidgets; // Retourne seulement 2 widgets basiques
};
```

---

## 🛠️ Solutions

### Solution 1 : Ajouter des Logs de Debug

**Fichier** : `src/features/user-space/pages/UserDashboard.tsx`

```typescript
export const UserDashboard = () => {
  const { data: user, isLoading, error } = useCurrentUser();
  
  // 🔍 DEBUG
  console.log('=== USER DASHBOARD DEBUG ===');
  console.log('User:', user);
  console.log('Loading:', isLoading);
  console.log('Error:', error);
  console.log('Role:', user?.role);
  console.log('School Group ID:', user?.schoolGroupId);
  console.log('===========================');
  
  // ... reste du code
};
```

---

### Solution 2 : Afficher un Message d'Erreur

**Fichier** : `src/features/user-space/pages/UserDashboard.tsx`

```typescript
if (!user && !isLoading) {
  return (
    <Card className="p-6">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-4">
          Impossible de charger vos informations utilisateur.
        </p>
        <pre className="text-left bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify({ user, error }, null, 2)}
        </pre>
      </div>
    </Card>
  );
}
```

---

### Solution 3 : Vérifier les Données SQL

**Requête de vérification** :
```sql
-- 1. Vérifier que l'utilisateur existe
SELECT * FROM users WHERE email = 'proviseur@example.com';

-- 2. Vérifier que le rôle est bien 'proviseur'
SELECT role FROM users WHERE email = 'proviseur@example.com';

-- 3. Vérifier que school_group_id est renseigné
SELECT school_group_id FROM users WHERE email = 'proviseur@example.com';

-- 4. Vérifier que l'école est bien assignée
SELECT 
  u.email,
  u.role,
  u.school_id,
  u.school_group_id,
  s.name as school_name,
  sg.name as group_name
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'proviseur@example.com';
```

---

### Solution 4 : Corriger le Mapping des Données

**Problème possible** : Les noms de colonnes ne correspondent pas

**Vérification** :
```sql
-- Vérifier les noms de colonnes exacts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

**Correction si nécessaire** :
```typescript
// Si les colonnes sont différentes
return {
  id: userData.id,
  email: userData.email,
  firstName: userData.first_name || userData.firstName, // Essayer les 2
  lastName: userData.last_name || userData.lastName,
  role: userData.role,
  schoolId: userData.school_id || userData.schoolId,
  schoolGroupId: userData.school_group_id || userData.schoolGroupId,
  avatar: userData.avatar,
  status: userData.status,
} as CurrentUser;
```

---

## 🧪 Tests à Effectuer

### Test 1 : Console Browser
```bash
1. Ouvrir DevTools (F12)
2. Aller sur /user
3. Regarder la Console
4. Chercher les logs :
   - "User:"
   - "Loading:"
   - "Error:"
```

### Test 2 : Network Tab
```bash
1. Ouvrir DevTools > Network
2. Filtrer par "users"
3. Vérifier la requête Supabase
4. Regarder la réponse :
   - Status 200 ?
   - Données retournées ?
```

### Test 3 : Supabase Dashboard
```bash
1. Aller sur Supabase Dashboard
2. Table Editor > users
3. Chercher l'utilisateur Proviseur
4. Vérifier :
   ✅ role = 'proviseur'
   ✅ school_group_id renseigné
   ✅ first_name renseigné
   ✅ last_name renseigné
   ✅ status = 'active'
```

---

## 📋 Checklist de Vérification

### Données Utilisateur
- [ ] Email correct
- [ ] Mot de passe correct
- [ ] Rôle = 'proviseur'
- [ ] school_id renseigné
- [ ] school_group_id renseigné
- [ ] first_name renseigné
- [ ] last_name renseigné
- [ ] status = 'active'

### Hook useCurrentUser
- [ ] Requête Supabase réussie
- [ ] Données retournées
- [ ] Mapping correct (first_name → firstName)
- [ ] Pas d'erreur TypeScript

### Dashboard
- [ ] user !== undefined
- [ ] user.role === 'proviseur'
- [ ] getWidgets() retourne 6 widgets
- [ ] Sidebar affichée

---

## 🎯 Solution Rapide

**Ajouter un composant de debug temporaire** :

```typescript
// Dans UserDashboard.tsx, AVANT le return
if (!user && !isLoading) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 DEBUG MODE</h1>
      <div className="space-y-4">
        <div>
          <strong>User:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Loading:</strong> {String(isLoading)}
        </div>
        <div>
          <strong>Error:</strong>
          <pre className="bg-red-100 p-4 rounded mt-2">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎉 Résultat Attendu

Une fois corrigé, tu devrais voir :
- ✅ Badge "Proviseur" dans le header
- ✅ 6 widgets (Écoles, Personnel, Emploi, Notifs, Élèves, Budget)
- ✅ Actions rapides (Gérer personnel, Rapports, Stats)
- ✅ Sidebar avec navigation complète
- ✅ Avatar (si renseigné)

---

**Prochaine étape** : Ajouter les logs de debug et vérifier les données SQL !
