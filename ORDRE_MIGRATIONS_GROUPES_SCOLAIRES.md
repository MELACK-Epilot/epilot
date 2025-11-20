# 📋 ORDRE D'APPLICATION DES MIGRATIONS

**Date:** 20 novembre 2025  
**Objectif:** Corriger l'affichage des groupes scolaires

---

## 🚀 ÉTAPES À SUIVRE

### 1️⃣ Ajouter la colonne `plan`

**Fichier:** `20251120_add_plan_column_to_school_groups.sql`

**Ce qu'elle fait:**
- Ajoute la colonne `plan` à la table `school_groups`
- Valeur par défaut: `'gratuit'`
- Contrainte: Valeurs autorisées (`gratuit`, `premium`, `pro`, `institutionnel`)
- Index créé pour performance

**Appliquer dans Supabase Dashboard → SQL Editor**

---

### 2️⃣ Créer la vue `school_groups_with_admin`

**Fichier:** `20251120_create_school_groups_with_admin_view.sql`

**Ce qu'elle fait:**
- Crée une vue qui joint `school_groups` avec `users`
- Utilise **LEFT JOIN** pour inclure TOUS les groupes (avec ou sans admin)
- Retourne toutes les colonnes nécessaires

**Appliquer dans Supabase Dashboard → SQL Editor**

---

## ✅ VÉRIFICATION

### Après migration 1:
```sql
-- Vérifier que la colonne plan existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'school_groups' AND column_name = 'plan';

-- Devrait retourner:
-- column_name | data_type      | column_default
-- plan        | character varying | 'gratuit'::character varying
```

### Après migration 2:
```sql
-- Vérifier que la vue existe
SELECT * FROM school_groups_with_admin LIMIT 5;

-- Devrait retourner tous les groupes avec leurs admins (ou NULL)
```

### Test final:
```sql
-- Compter les groupes
SELECT COUNT(*) FROM school_groups;  -- Nombre total
SELECT COUNT(*) FROM school_groups_with_admin;  -- Devrait être identique

-- Voir les groupes sans admin
SELECT name, code, admin_name 
FROM school_groups_with_admin 
WHERE admin_id IS NULL;
```

---

## 📊 RÉSULTAT ATTENDU

**Avant:**
- Tableau vide (0 groupes affichés)

**Après:**
- TOUS les groupes affichés
- Groupes sans admin: "Non assigné"
- Groupes avec admin: Nom de l'admin
- Colonne Plan: Affiche le plan d'abonnement

---

## 🎯 COLONNES DANS LA VUE

```
id                  UUID
name                TEXT
code                TEXT
region              TEXT
city                TEXT
address             TEXT
phone               TEXT
website             TEXT
founded_year        INTEGER
description         TEXT
logo                TEXT
plan                VARCHAR(50)     ← NOUVEAU
status              STATUS
school_count        INTEGER
student_count       INTEGER
staff_count         INTEGER
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
admin_id            UUID (NULL si pas d'admin)
admin_name          TEXT (NULL si pas d'admin)
admin_email         TEXT (NULL si pas d'admin)
admin_phone         TEXT (NULL si pas d'admin)
admin_avatar        TEXT (NULL si pas d'admin)
admin_status        STATUS (NULL si pas d'admin)
admin_last_login    TIMESTAMPTZ (NULL si pas d'admin)
```

---

## 💡 NOTES IMPORTANTES

1. **Plan par défaut:** Tous les groupes existants auront `plan = 'gratuit'`
2. **LEFT JOIN:** Garantit que TOUS les groupes sont affichés
3. **Compteurs:** `school_count`, `student_count`, `staff_count` sont déjà dans la table
4. **Performance:** Index créés sur `plan` pour les filtres

---

## 🔧 SI PROBLÈME

### Erreur "column already exists"
```sql
-- La colonne plan existe déjà, passer directement à la migration 2
```

### Erreur "view already exists"
```sql
-- Supprimer la vue d'abord
DROP VIEW IF EXISTS school_groups_with_admin;
-- Puis relancer la migration 2
```

### Groupes toujours pas affichés
```sql
-- Vérifier les permissions RLS
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'school_groups';

-- Vérifier que la vue retourne des données
SELECT COUNT(*) FROM school_groups_with_admin;
```

---

**Applique les migrations maintenant et tous les groupes s'afficheront!** 🎯✅
