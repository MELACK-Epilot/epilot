# 🔧 Fix : Relation profiles ↔ school_groups

**Date** : 1er novembre 2025  
**Erreur** : `Could not find a relationship between 'profiles' and 'school_groups'`  
**Solution** : ✅ Créer la relation dans Supabase

---

## 🎯 Problème

Lors de la connexion, l'erreur suivante apparaît :
```
Erreur lors de la récupération du profil: 
Could not find a relationship between 'profiles' and 'school_groups' in the schema cache
```

**Cause** : La table `profiles` n'a pas de foreign key vers `school_groups`.

---

## ✅ Solution

### Étape 1 : Exécuter le Script SQL

1. **Aller dans Supabase Dashboard**
   - URL : https://csltuxbanvweyfzqpfap.supabase.co
   - Section : **SQL Editor**

2. **Créer une nouvelle query**
   - Cliquer sur "New query"

3. **Copier-coller ce script** :

```sql
-- Ajouter la colonne school_group_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_group_id UUID;

-- Créer la foreign key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_school_group_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_school_group_id_fkey
    FOREIGN KEY (school_group_id)
    REFERENCES school_groups(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_profiles_school_group_id 
ON profiles(school_group_id);
```

4. **Exécuter** (Ctrl+Enter ou bouton "Run")

---

### Étape 2 : Mettre à Jour les Données

Si vous avez déjà des utilisateurs dans `profiles`, il faut leur assigner un `school_group_id` :

```sql
-- Exemple : Assigner l'utilisateur int@epilot.com au groupe LAMARELLE
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'int@epilot.com';

-- Vérifier
SELECT 
  email, 
  name, 
  role, 
  school_group_id,
  (SELECT name FROM school_groups WHERE id = profiles.school_group_id) as groupe
FROM profiles
WHERE email = 'int@epilot.com';
```

**Résultat attendu** :
```
email            | name        | role          | school_group_id                      | groupe
-----------------|-------------|---------------|--------------------------------------|----------
int@epilot.com   | Utilisateur | admin_groupe  | 7ee9cdef-9f4b-41a6-992b-e04922345e98 | LAMARELLE
```

---

### Étape 3 : Vérifier la Relation

```sql
-- Vérifier que la foreign key existe
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='profiles'
  AND kcu.column_name='school_group_id';
```

**Résultat attendu** :
```
table_name | column_name      | foreign_table_name
-----------|------------------|-------------------
profiles   | school_group_id  | school_groups
```

---

### Étape 4 : Tester la Connexion

1. **Recharger l'application** (Ctrl+R)
2. **Se connecter** avec `int@epilot.com`
3. **Vérifier** :
   - ✅ Pas d'erreur
   - ✅ Nom du groupe affiché
   - ✅ Logo du groupe affiché
   - ✅ Dashboard fonctionne

---

## 🔍 Vérifications Supplémentaires

### Vérifier la Structure de profiles

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Colonnes attendues** :
- id (uuid)
- email (text)
- full_name (text)
- name (text)
- avatar_url (text)
- role (text)
- is_active (boolean)
- phone (text)
- address (text)
- birth_date (date)
- **school_group_id (uuid)** ✅ NOUVEAU
- created_at (timestamp)
- updated_at (timestamp)

---

### Vérifier les Données

```sql
-- Tous les utilisateurs avec leur groupe
SELECT 
  p.email,
  p.name,
  p.role,
  p.is_active,
  sg.name as groupe_scolaire,
  sg.logo as groupe_logo
FROM profiles p
LEFT JOIN school_groups sg ON p.school_group_id = sg.id
ORDER BY p.created_at DESC;
```

---

## 🚨 Erreurs Possibles

### Erreur 1 : "column school_group_id already exists"
**Solution** : Normal, la colonne existe déjà. Passez à l'étape suivante.

### Erreur 2 : "constraint already exists"
**Solution** : Normal, la foreign key existe déjà. Tout est bon !

### Erreur 3 : "relation school_groups does not exist"
**Solution** : Créer d'abord la table `school_groups` :
```sql
-- Vérifier si school_groups existe
SELECT * FROM school_groups LIMIT 1;
```

---

## 📋 Checklist

- [ ] Script SQL exécuté
- [ ] Colonne `school_group_id` ajoutée
- [ ] Foreign key créée
- [ ] Index créé
- [ ] Données mises à jour (school_group_id assigné)
- [ ] Relation vérifiée
- [ ] Application rechargée
- [ ] Connexion testée
- [ ] Pas d'erreur
- [ ] Dashboard fonctionne

---

## 🎯 Résultat Attendu

**Avant** :
```
❌ Erreur lors de la récupération du profil: 
Could not find a relationship between 'profiles' and 'school_groups'
```

**Après** :
```
✅ Connexion réussie
✅ Profil récupéré
✅ Groupe scolaire : LAMARELLE
✅ Logo affiché
✅ Dashboard opérationnel
```

---

## 📝 Script Complet

Le script complet est disponible dans :
**Fichier** : `FIX_PROFILES_RELATION.sql`

---

**Fix simple et rapide - 5 minutes !** ⚡✅
