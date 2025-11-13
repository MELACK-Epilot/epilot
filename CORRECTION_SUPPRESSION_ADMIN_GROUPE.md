# ✅ CORRECTION SUPPRESSION ADMIN GROUPE

**Date** : 10 novembre 2025  
**Erreur** : `update or delete on table "users" violates foreign key constraint "user_module_permissions_assigned_by_fkey"`

---

## 🔴 PROBLÈME IDENTIFIÉ

### **Erreur complète** :
```
Failed to load resource: the server responded with a status of 409
🚨 Mutation Error: unknown update or delete on table "users" violates foreign key constraint "user_module_permissions_assigned_by_fkey" on table "user_module_permissions"
```

### **Cause racine** :
La table `user_module_permissions` a une colonne `assigned_by` qui référence `users(id)`. Lorsqu'on tente de supprimer un admin groupe qui a assigné des permissions, la contrainte de clé étrangère bloque la suppression par défaut.

**Comportement actuel** :
```sql
FOREIGN KEY (assigned_by) REFERENCES users(id)
-- Par défaut : ON DELETE RESTRICT (bloque la suppression)
```

---

## ✅ SOLUTION IMPLÉMENTÉE

### **Script créé** : `database/FIX_USER_DELETE_CONSTRAINT.sql`

**Actions** :
1. ✅ Supprime l'ancienne contrainte `user_module_permissions_assigned_by_fkey`
2. ✅ Recrée la contrainte avec `ON DELETE SET NULL`
3. ✅ Corrige d'autres contraintes similaires (`schools.created_by`, `school_groups.created_by`, etc.)
4. ✅ Liste toutes les contraintes FK vers `users` pour vérification

---

## 🔧 COMPORTEMENT APRÈS CORRECTION

### **Avant (bloquant)** :
```sql
DELETE FROM users WHERE id = 'xxx';
-- ❌ ERROR: violates foreign key constraint
```

### **Après (permissif)** :
```sql
DELETE FROM users WHERE id = 'xxx';
-- ✅ SUCCESS
-- user_module_permissions.assigned_by → NULL (au lieu de bloquer)
```

---

## 📊 CONTRAINTES CORRIGÉES

| Table | Colonne | Comportement |
|-------|---------|--------------|
| `user_module_permissions` | `assigned_by` | `ON DELETE SET NULL` |
| `schools` | `created_by` | `ON DELETE SET NULL` |
| `school_groups` | `created_by` | `ON DELETE SET NULL` |
| `system_alerts` | `created_by` | `ON DELETE SET NULL` |

---

## 🎯 AVANTAGES

### **Préservation de l'historique** :
- Les permissions assignées restent en base
- `assigned_by = NULL` indique que l'utilisateur a été supprimé
- Pas de perte de données

### **Flexibilité** :
- Permet la suppression d'utilisateurs sans cascade
- Évite les erreurs 409 Conflict
- Meilleure expérience utilisateur

### **Alternative considérée** :
- `ON DELETE CASCADE` : supprimerait toutes les permissions → perte de données
- `ON DELETE RESTRICT` : bloque la suppression → erreur actuelle
- **`ON DELETE SET NULL`** : meilleur compromis ✅

---

## 🚀 INSTALLATION

### **Commande** :
```sql
-- Exécuter dans Supabase SQL Editor
\i database/FIX_USER_DELETE_CONSTRAINT.sql
```

### **Ou copier-coller** :
1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Copier le contenu du fichier
4. Cliquer sur "Run"

---

## 🧪 TESTS À EFFECTUER

### **Test 1 : Supprimer un admin groupe**
1. Aller dans `/dashboard/school-groups`
2. Sélectionner un admin groupe
3. Cliquer sur "Supprimer"
4. ✅ Devrait réussir sans erreur 409

### **Test 2 : Vérifier les permissions**
```sql
-- Vérifier que les permissions sont préservées
SELECT * FROM user_module_permissions 
WHERE assigned_by IS NULL;
-- Devrait afficher les permissions dont l'assigneur a été supprimé
```

### **Test 3 : Vérifier les contraintes**
```sql
-- Lister toutes les contraintes FK vers users
SELECT 
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_module_permissions', 'schools', 'school_groups', 'system_alerts');
-- Devrait afficher "SET NULL" pour delete_rule
```

---

## ⚠️ NOTE SUR LES WEBSOCKETS

Les erreurs WebSocket (`ws://localhost:3000/`) sont **normales** et **sans impact** :
```
WebSocket connection to 'ws://localhost:3000/' failed: 
Error in connection establishment: net::ERR_CONNECTION_REFUSED
```

**Cause** : Vite HMR (Hot Module Replacement) tente de se connecter au serveur de dev.

**Impact** : Aucun - l'application fonctionne normalement.

**Solution** : Ignorer ces messages ou désactiver HMR dans `vite.config.ts` :
```ts
server: {
  hmr: false // Désactive HMR si les logs dérangent
}
```

---

## 📁 FICHIERS

1. ✅ **CRÉÉ** : `database/FIX_USER_DELETE_CONSTRAINT.sql`
2. ✅ **CRÉÉ** : `CORRECTION_SUPPRESSION_ADMIN_GROUPE.md`

---

## ✅ RÉSULTAT ATTENDU

**Avant (erreur)** :
```
❌ 409 Conflict
❌ violates foreign key constraint
❌ Suppression bloquée
```

**Après (fonctionnel)** :
```
✅ 200 OK
✅ Utilisateur supprimé
✅ assigned_by/created_by → NULL
✅ Historique préservé
```

---

**🎉 APRÈS EXÉCUTION DU SCRIPT, LA SUPPRESSION FONCTIONNERA !** ✅

**Exécutez `FIX_USER_DELETE_CONSTRAINT.sql` dans Supabase !** 🚀
