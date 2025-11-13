# 🔧 Fix : Assigner les Utilisateurs aux Groupes

**Erreur** : "Votre compte n'est pas associé à un groupe scolaire"  
**Cause** : `school_group_id` est NULL dans profiles  
**Solution** : ✅ Assigner les utilisateurs à leurs groupes

---

## 🎯 Solution Rapide (2 minutes)

### Étape 1 : Trouver l'UUID du Groupe LAMARELLE

```sql
SELECT id, name, code 
FROM school_groups 
WHERE name ILIKE '%LAMARELLE%';
```

**Résultat attendu** :
```
id                                   | name      | code
-------------------------------------|-----------|------
7ee9cdef-9f4b-41a6-992b-e04922345e98 | LAMARELLE | LAM
```

---

### Étape 2 : Assigner les Utilisateurs

**Option A : Assigner manuellement** (si vous connaissez l'UUID)

```sql
-- Assigner int@epilot.com
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'int@epilot.com';

-- Assigner lam@epilot.cg
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'lam@epilot.cg';

-- Assigner ana@epilot.cg
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'ana@epilot.cg';
```

**Option B : Assigner automatiquement** (recommandé)

```sql
-- Assigner tous les admin_groupe au groupe LAMARELLE
UPDATE profiles
SET school_group_id = (
  SELECT id FROM school_groups 
  WHERE name ILIKE '%LAMARELLE%' 
  LIMIT 1
)
WHERE email IN ('int@epilot.com', 'lam@epilot.cg', 'ana@epilot.cg');
```

---

### Étape 3 : Vérifier

```sql
SELECT 
  p.email,
  p.name,
  p.role,
  sg.name as groupe_scolaire
FROM profiles p
LEFT JOIN school_groups sg ON p.school_group_id = sg.id
WHERE p.email IN ('int@epilot.com', 'lam@epilot.cg', 'ana@epilot.cg', 'admin@epilot.cg');
```

**Résultat attendu** :
```
email            | name        | role          | groupe_scolaire
-----------------|-------------|---------------|----------------
int@epilot.com   | Utilisateur | admin_groupe  | LAMARELLE
lam@epilot.cg    | Utilisateur | admin_groupe  | LAMARELLE
ana@epilot.cg    | Utilisateur | admin_groupe  | LAMARELLE
admin@epilot.cg  | Admin       | SUPER_ADMIN   | NULL (normal)
```

---

### Étape 4 : Tester

1. **Recharger l'application** (Ctrl+R)
2. **Se connecter** avec `int@epilot.com`
3. **Vérifier** :
   - ✅ Pas d'erreur "compte non associé"
   - ✅ Dashboard s'affiche
   - ✅ Nom du groupe : LAMARELLE
   - ✅ Logo du groupe affiché

---

## 📋 Règles Importantes

### Admin Groupe
- ✅ **DOIT** avoir un `school_group_id`
- ✅ Ne voit que les données de son groupe
- ✅ Exemple : `int@epilot.com` → LAMARELLE

### Super Admin
- ✅ `school_group_id` = **NULL**
- ✅ Voit toutes les données de tous les groupes
- ✅ Exemple : `admin@epilot.cg` → NULL

---

## 🔍 Vérifications

### Vérifier tous les utilisateurs

```sql
SELECT 
  email,
  role,
  school_group_id,
  CASE 
    WHEN role = 'admin_groupe' AND school_group_id IS NULL THEN '❌ Manquant'
    WHEN role = 'SUPER_ADMIN' AND school_group_id IS NULL THEN '✅ OK (Super Admin)'
    WHEN school_group_id IS NOT NULL THEN '✅ OK'
    ELSE '⚠️ À vérifier'
  END as statut
FROM profiles;
```

---

### Vérifier les groupes disponibles

```sql
SELECT 
  id,
  name,
  code,
  city,
  (SELECT COUNT(*) FROM profiles WHERE school_group_id = school_groups.id) as nb_utilisateurs
FROM school_groups
ORDER BY name;
```

---

## 🚨 Erreurs Possibles

### Erreur 1 : "no rows returned"
**Cause** : Le groupe LAMARELLE n'existe pas  
**Solution** : Créer le groupe d'abord

```sql
INSERT INTO school_groups (id, name, code, city, region, plan, status)
VALUES (
  '7ee9cdef-9f4b-41a6-992b-e04922345e98',
  'LAMARELLE',
  'LAM',
  'Brazzaville',
  'Brazzaville',
  'premium',
  'active'
);
```

---

### Erreur 2 : "foreign key violation"
**Cause** : L'UUID du groupe n'existe pas  
**Solution** : Vérifier l'UUID avec la requête de l'Étape 1

---

## 📊 Script Complet

Le script complet est dans :
**Fichier** : `FIX_ASSIGN_SCHOOL_GROUP.sql`

---

## ✅ Checklist

- [ ] UUID du groupe LAMARELLE trouvé
- [ ] Utilisateurs assignés au groupe
- [ ] Vérification effectuée
- [ ] Application rechargée
- [ ] Connexion testée
- [ ] Pas d'erreur "compte non associé"
- [ ] Dashboard fonctionne

---

**Fix rapide - 2 minutes !** ⚡✅
