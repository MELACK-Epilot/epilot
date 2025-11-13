# 🔴 DIAGNOSTIC : Utilisateurs = 0 (10 nov 2025, 14h04)

## 📸 CAPTURE D'ÉCRAN

Widget "Adoption Modules" :
- **MOYENNE** : 100%
- **UTILISATEURS** : 0 ❌
- **Module "Admission des élèves"** :
  - Adoption : 100%
  - Groupes : 2 ✅
  - Users : 0 ❌
  - Activité : 16h

## 🔍 ANALYSE

### ✅ Ce qui fonctionne :
1. **Groupes** : 2 groupes ont le module activé ✅
2. **Adoption** : 100% (2 groupes sur 2) ✅
3. **Activité** : 16h (dernière activation) ✅

### ❌ Ce qui ne fonctionne PAS :
1. **Utilisateurs** : 0 pour tous les modules ❌

## 🎯 HYPOTHÈSES

### Hypothèse 1 : Aucun utilisateur dans les groupes
```sql
-- Vérifier si les groupes ont des utilisateurs
SELECT 
  sg.name as groupe,
  COUNT(u.id) as nb_users
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id
WHERE sg.status = 'active'
GROUP BY sg.id, sg.name;
```

### Hypothèse 2 : Tous les utilisateurs ont status != 'active'
```sql
-- Vérifier le statut des utilisateurs
SELECT 
  status,
  COUNT(*) as nb_users
FROM users
GROUP BY status;
```

### Hypothèse 3 : school_group_id est NULL
```sql
-- Vérifier si school_group_id est NULL
SELECT 
  COUNT(*) as total,
  COUNT(school_group_id) as avec_groupe,
  COUNT(*) - COUNT(school_group_id) as sans_groupe
FROM users;
```

### Hypothèse 4 : Erreur dans la requête Supabase
```typescript
// Vérifier les logs dans la console (F12)
// Chercher : 📊 Module "..."
```

## 🧪 TESTS À EFFECTUER

### Test 1 : Ouvrir la Console (F12)
1. Appuyer sur **F12**
2. Aller dans l'onglet **Console**
3. Rafraîchir la page
4. Chercher les logs : `📊 Module "Admission des élèves"`

**Attendu** :
```javascript
📊 Module "Admission des élèves": {
  groupsWithModule: 2,
  groupIds: ["uuid1", "uuid2"],
  activeUsers: 0,  // ← Pourquoi 0 ?
  error: null
}
```

### Test 2 : Exécuter les requêtes SQL
Ouvrir **Supabase SQL Editor** et exécuter :

```sql
-- 1. Vérifier les groupes avec le module "Admission des élèves"
SELECT 
  gmc.school_group_id,
  sg.name as groupe_name
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true;

-- 2. Vérifier les utilisateurs de ces groupes
WITH groups_with_module AS (
  SELECT gmc.school_group_id
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
SELECT 
  u.id,
  u.email,
  u.status,
  u.school_group_id,
  sg.name as groupe_name
FROM users u
LEFT JOIN school_groups sg ON sg.id = u.school_group_id
WHERE u.school_group_id IN (SELECT school_group_id FROM groups_with_module)
ORDER BY u.status, u.email;

-- 3. Compter les utilisateurs actifs
WITH groups_with_module AS (
  SELECT gmc.school_group_id
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as users_actifs,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as users_inactifs,
  COUNT(CASE WHEN school_group_id IS NULL THEN 1 END) as users_sans_groupe
FROM users
WHERE school_group_id IN (SELECT school_group_id FROM groups_with_module);
```

## 🎯 SOLUTIONS POSSIBLES

### Solution A : Aucun utilisateur dans les groupes
**Si la requête 2 retourne 0 lignes** :
→ Il faut créer des utilisateurs dans ces groupes

```sql
-- Créer un utilisateur de test
INSERT INTO users (email, status, school_group_id, role)
VALUES (
  'test@ecole.com',
  'active',
  (SELECT school_group_id FROM group_module_configs 
   WHERE module_id = (SELECT id FROM modules WHERE name = 'Admission des élèves' LIMIT 1)
   LIMIT 1),
  'enseignant'
);
```

### Solution B : Utilisateurs avec status != 'active'
**Si la requête 3 montre users_inactifs > 0** :
→ Activer les utilisateurs

```sql
-- Activer tous les utilisateurs
UPDATE users 
SET status = 'active'
WHERE status != 'active';
```

### Solution C : school_group_id est NULL
**Si la requête 3 montre users_sans_groupe > 0** :
→ Assigner les utilisateurs à un groupe

```sql
-- Assigner les utilisateurs sans groupe au premier groupe actif
UPDATE users
SET school_group_id = (SELECT id FROM school_groups WHERE status = 'active' LIMIT 1)
WHERE school_group_id IS NULL;
```

### Solution D : Problème de RLS (Row Level Security)
**Si les requêtes SQL retournent des données mais pas le hook** :
→ Vérifier les politiques RLS

```sql
-- Vérifier les politiques sur la table users
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Désactiver temporairement RLS pour tester
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ⚠️ NE PAS FAIRE EN PRODUCTION !
```

## 📊 RÉSULTAT ATTENDU

Après correction, le widget devrait afficher :
```
UTILISATEURS : 10 (ou le nombre réel)

Admission des élèves
Groupes: 2  │  Users: 5  │  Activité: 16h
```

## 🚀 PROCHAINES ÉTAPES

1. ✅ Ouvrir la console (F12) et vérifier les logs
2. ✅ Exécuter les requêtes SQL de test
3. ✅ Identifier la cause (A, B, C ou D)
4. ✅ Appliquer la solution correspondante
5. ✅ Rafraîchir la page et vérifier

---

**Date** : 10 novembre 2025, 14h04  
**Priorité** : 🔴 CRITIQUE  
**Temps estimé** : 15-30 minutes
