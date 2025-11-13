# 🎯 ACTIONS DE DEBUG - Utilisateurs = 0 (10 nov 2025, 14h06)

## ✅ CE QUE NOUS SAVONS

1. **SQL retourne 3 utilisateurs** ✅
   ```json
   {
     "total_users": 3,
     "users_actifs": 3,
     "users_inactifs": 0,
     "users_sans_groupe": 0
   }
   ```

2. **Le hook TypeScript retourne 0** ❌
   - Widget affiche : Users: 0
   - Groupes: 2 (correct)

3. **Conclusion** : Le problème est dans le **code TypeScript** ou les **permissions RLS** !

---

## 🚀 ACTIONS À FAIRE MAINTENANT

### Action 1 : **Rafraîchir la page et ouvrir la console**

1. Appuyez sur **Ctrl + Shift + R** (rafraîchissement forcé)
2. Appuyez sur **F12** (ouvrir DevTools)
3. Allez dans l'onglet **Console**
4. Cherchez les logs qui commencent par `📊 Module`

**Vous devriez voir** :
```javascript
📊 Module "Admission des élèves": {
  groupsWithModule: 2,
  groupIds: ["uuid-groupe-1", "uuid-groupe-2"],
  activeUsers: 0,  // ← Le problème
  usersData: [...],  // ← Les données retournées
  error: null ou {...}  // ← Erreur éventuelle
}
```

**IMPORTANT** : Copiez-collez **TOUT** ce que vous voyez dans la console !

---

### Action 2 : **Exécuter le test SQL complet**

Dans **Supabase SQL Editor**, exécutez le fichier :
```
TEST_REQUETE_USERS.sql
```

Ce fichier va tester **5 étapes** :
1. Groupes avec le module
2. Comptage des utilisateurs
3. Détail des utilisateurs
4. Test avec UUIDs directs
5. Politiques RLS

**Copiez-collez les résultats** de chaque étape !

---

### Action 3 : **Vérifier les permissions RLS**

Exécutez cette requête dans Supabase :
```sql
-- Vérifier les politiques RLS sur la table users
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

**Copiez-collez le résultat** !

---

## 🔍 HYPOTHÈSES

### Hypothèse A : **RLS bloque la requête** (70% probable)
Les politiques RLS empêchent le client Supabase de lire les utilisateurs.

**Symptômes** :
- SQL direct retourne 3 users ✅
- Client Supabase retourne 0 users ❌
- `usersData` dans les logs est vide `[]`
- `error` contient un message de permission

**Solution** :
```sql
-- Créer une politique plus permissive
CREATE POLICY "Authenticated users can view users for counting" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

### Hypothèse B : **Problème avec l'opérateur IN** (20% probable)
L'opérateur `.in('school_group_id', groupIds)` ne fonctionne pas correctement.

**Symptômes** :
- `groupIds` dans les logs contient les UUIDs ✅
- `usersData` est vide `[]`
- Pas d'erreur

**Solution** :
Utiliser une requête différente (à tester).

---

### Hypothèse C : **Cache Supabase** (10% probable)
Le client Supabase utilise un cache obsolète.

**Symptômes** :
- Tout semble correct dans les logs
- Mais count = 0

**Solution** :
```typescript
// Forcer le rafraîchissement
const { count } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .in('school_group_id', groupIds)
  .eq('status', 'active')
  .limit(1000);  // Forcer une nouvelle requête
```

---

## 📊 RÉSULTATS ATTENDUS

### Si Hypothèse A (RLS)
```javascript
📊 Module "Admission des élèves": {
  groupIds: ["uuid1", "uuid2"],
  activeUsers: 0,
  usersData: [],  // ← Vide à cause de RLS
  error: {
    message: "permission denied for table users",
    code: "42501"
  }
}
```

### Si Hypothèse B (Opérateur IN)
```javascript
📊 Module "Admission des élèves": {
  groupIds: ["uuid1", "uuid2"],  // ← UUIDs présents
  activeUsers: 0,
  usersData: [],  // ← Vide sans raison
  error: null  // ← Pas d'erreur
}
```

### Si Hypothèse C (Cache)
```javascript
📊 Module "Admission des élèves": {
  groupIds: ["uuid1", "uuid2"],
  activeUsers: 0,
  usersData: [],
  error: null
}
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Rafraîchir la page** et copier les logs de la console
2. ✅ **Exécuter TEST_REQUETE_USERS.sql** et copier les résultats
3. ✅ **Vérifier les politiques RLS** et copier les résultats
4. ✅ **M'envoyer tous les résultats** pour diagnostic final

---

**Date** : 10 novembre 2025, 14h06  
**Priorité** : 🔴 CRITIQUE  
**Temps estimé** : 10 minutes pour collecter les infos
