# 🔍 DIAGNOSTIC TABLEAU - COLONNES DONNÉES RÉELLES

**Date** : 6 Novembre 2025

---

## 📊 COLONNES À VÉRIFIER

### **1. Colonne "Modules"** 
**Ligne 164-174** dans `UserTableView.tsx`

**Code actuel** :
```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
      <Package className="h-3 w-3" />
      <span className="text-sm font-semibold">{user.assignedModulesCount || 0}</span>
    </div>
    <span className="text-xs text-gray-500">
      {user.assignedModulesCount ? 'assigné(s)' : 'aucun'}
    </span>
  </div>
</TableCell>
```

**Propriété utilisée** : `user.assignedModulesCount`

**Source dans useUsers.ts (ligne 160)** :
```typescript
assignedModulesCount: modulesCountMap[user.id] || 0
```

**Requête SQL** :
```typescript
// Lignes 124-134
const { data: permissionsData } = await (supabase as any)
  .from('user_module_permissions')
  .select('user_id')
  .in('user_id', userIds);

if (permissionsData) {
  permissionsData.forEach((p: any) => {
    modulesCountMap[p.user_id] = (modulesCountMap[p.user_id] || 0) + 1;
  });
}
```

**✅ VERDICT** : Code correct, récupère les vraies données

---

### **2. Colonne "Dernière connexion"**
**Ligne 175-194** dans `UserTableView.tsx`

**Code actuel** :
```tsx
<TableCell>
  {user.lastLoginAt ? (
    <div className="text-sm text-gray-700">
      <div className="font-medium">
        {new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short' 
        })}
      </div>
      <div className="text-xs text-gray-500">
        {new Date(user.lastLoginAt).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  ) : (
    <span className="text-xs text-gray-400">Jamais connecté</span>
  )}
</TableCell>
```

**Propriété utilisée** : `user.lastLoginAt`

**Source dans useUsers.ts (ligne 161)** :
```typescript
lastLoginAt: user.last_login || undefined
```

**Champ base de données** : `users.last_login` (TIMESTAMPTZ)

**✅ VERDICT** : Code correct, récupère les vraies données

---

### **3. Colonne "Statut"**
**Ligne 195-205** dans `UserTableView.tsx`

**Code actuel** :
```tsx
<TableCell>
  {user.status === 'active' ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
      <CheckCircle className="h-3 w-3 mr-1" /> Actif
    </Badge>
  ) : (
    <Badge variant="secondary" className="font-medium">
      <Ban className="h-3 w-3 mr-1" /> Inactif
    </Badge>
  )}
</TableCell>
```

**Propriété utilisée** : `user.status`

**Source dans useUsers.ts (ligne 158)** :
```typescript
status: user.status || 'inactive'
```

**Champ base de données** : `users.status` (TEXT)

**✅ VERDICT** : Code correct, récupère les vraies données

---

## 🔍 VÉRIFICATIONS À FAIRE

### **1. Vérifier que les utilisateurs ont des données**

**SQL à exécuter dans Supabase** :
```sql
-- Vérifier les données users
SELECT 
  id,
  first_name,
  last_name,
  email,
  status,
  last_login,
  school_id,
  school_group_id
FROM users
WHERE school_group_id = 'VOTRE_ID_GROUPE'
LIMIT 10;
```

**Résultat attendu** :
- `status` doit être 'active' ou 'inactive'
- `last_login` doit avoir une date (ou NULL)
- `school_id` doit avoir un UUID (ou NULL)

---

### **2. Vérifier les modules assignés**

**SQL à exécuter** :
```sql
-- Compter les modules par utilisateur
SELECT 
  u.first_name,
  u.last_name,
  COUNT(ump.module_id) as modules_count
FROM users u
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = 'VOTRE_ID_GROUPE'
GROUP BY u.id, u.first_name, u.last_name
ORDER BY modules_count DESC;
```

**Résultat attendu** :
- Certains users doivent avoir `modules_count > 0`
- Si tous sont à 0, c'est qu'aucun module n'est assigné

---

### **3. Vérifier la console du navigateur**

**Ouvrir la console (F12)** et chercher :
```javascript
// Logs du hook useUsers
console.log('📦 Modules récupérés:', modules.length);
console.log('✅ Permissions insérées:', data?.length);
```

**Vérifier l'objet user** :
```javascript
// Dans la console, taper :
console.table(users.map(u => ({
  nom: u.firstName + ' ' + u.lastName,
  modules: u.assignedModulesCount,
  derniere_connexion: u.lastLoginAt,
  statut: u.status
})));
```

---

## 🐛 PROBLÈMES POSSIBLES

### **Problème 1 : Modules toujours à 0**

**Cause** : La table `user_module_permissions` est vide

**Solution** :
1. Assigner des modules à un utilisateur
2. Vérifier dans la base :
```sql
SELECT * FROM user_module_permissions LIMIT 10;
```

---

### **Problème 2 : Dernière connexion toujours "Jamais connecté"**

**Cause** : Le champ `users.last_login` est NULL

**Solution** :
1. Les utilisateurs doivent se connecter au moins une fois
2. Ou mettre à jour manuellement :
```sql
UPDATE users 
SET last_login = NOW() 
WHERE id = 'ID_USER';
```

---

### **Problème 3 : Statut toujours "Inactif"**

**Cause** : Le champ `users.status` est 'inactive' ou NULL

**Solution** :
```sql
-- Activer un utilisateur
UPDATE users 
SET status = 'active' 
WHERE id = 'ID_USER';

-- Activer tous les users d'un groupe
UPDATE users 
SET status = 'active' 
WHERE school_group_id = 'ID_GROUPE';
```

---

## ✅ CHECKLIST DE VÉRIFICATION

### **Base de données** :
- [ ] Table `users` existe
- [ ] Champ `users.status` existe (TEXT)
- [ ] Champ `users.last_login` existe (TIMESTAMPTZ)
- [ ] Table `user_module_permissions` existe
- [ ] Des données existent dans `user_module_permissions`

### **Code** :
- [ ] Hook `useUsers` récupère bien les données
- [ ] Mapping `assignedModulesCount` est correct (ligne 160)
- [ ] Mapping `lastLoginAt` est correct (ligne 161)
- [ ] Mapping `status` est correct (ligne 158)
- [ ] Composant `UserTableView` reçoit les props

### **Affichage** :
- [ ] Console du navigateur ne montre pas d'erreurs
- [ ] Données s'affichent dans le tableau
- [ ] Compteur modules est correct
- [ ] Date dernière connexion s'affiche
- [ ] Badge statut s'affiche

---

## 🔧 SCRIPT DE TEST RAPIDE

**À exécuter dans Supabase SQL Editor** :

```sql
-- 1. Créer un utilisateur de test
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  last_login,
  school_group_id
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Jean',
  'Test',
  'enseignant',
  'active',
  NOW(),
  'VOTRE_ID_GROUPE'
) RETURNING id;

-- 2. Assigner 3 modules à cet utilisateur
-- (Remplacer USER_ID par l'ID retourné ci-dessus)
INSERT INTO user_module_permissions (
  user_id,
  module_id,
  module_name,
  module_slug,
  category_id,
  category_name,
  can_read,
  assigned_by,
  assigned_at
)
SELECT 
  'USER_ID',
  m.id,
  m.name,
  m.slug,
  m.category_id,
  'Test',
  true,
  'VOTRE_ID_ADMIN',
  NOW()
FROM modules m
LIMIT 3;

-- 3. Vérifier
SELECT 
  u.first_name,
  u.last_name,
  u.status,
  u.last_login,
  COUNT(ump.module_id) as modules_count
FROM users u
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.email = 'test@example.com'
GROUP BY u.id;
```

**Résultat attendu** :
```
first_name | last_name | status | last_login          | modules_count
-----------|-----------|--------|---------------------|---------------
Jean       | Test      | active | 2025-11-06 07:25:00 | 3
```

---

## 🎯 CONCLUSION

Le code du tableau est **100% correct** et récupère les **vraies données** de la base.

Si les colonnes affichent des valeurs incorrectes, c'est que :
1. ❌ Les données n'existent pas dans la base
2. ❌ Les utilisateurs n'ont pas de modules assignés
3. ❌ Les utilisateurs ne se sont jamais connectés
4. ❌ Le statut des utilisateurs est 'inactive'

**Solution** : Vérifier la base de données avec les requêtes SQL ci-dessus.

---

**Date** : 6 Novembre 2025  
**Status** : ✅ CODE CORRECT - VÉRIFIER LES DONNÉES
