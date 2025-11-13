# 📋 ORDRE D'EXÉCUTION DES SCRIPTS SQL

## ✅ État Actuel

Tables existantes :
- ✅ `users`
- ✅ `modules`
- ✅ `subscription_plans`
- ✅ `school_groups`
- ✅ `schools`

Tables manquantes :
- ❌ `categories`

---

## 🚀 Scripts à Exécuter (Dans l'Ordre)

### Script 1 : Créer la Table Categories
**Fichier** : `database/CREATE_CATEGORIES_TABLE.sql`

**Action** :
1. Crée la table `categories`
2. Insère 8 catégories métiers par défaut
3. Configure les politiques RLS

**Résultat attendu** : 8 catégories créées

---

### Script 2 : Créer les Tables d'Assignation
**Fichier** : `database/PHASE1_TABLES_ASSIGNATION.sql`

**Action** :
1. Crée `user_modules` (assignation modules → utilisateurs)
2. Crée `user_categories` (assignation catégories → utilisateurs)
3. Crée `plan_modules` (modules disponibles par plan)
4. Crée `plan_categories` (catégories disponibles par plan)
5. Configure les politiques RLS

**Résultat attendu** : 4 tables créées (vides)

---

### Script 3 (Optionnel) : Corriger le Rôle school_admin
**Fichier** : `database/FIX_SCHOOL_ADMIN_ROLE.sql`

**Action** :
- Remplace `school_admin` par `admin_groupe`

**Résultat attendu** : Rôles corrigés

---

## 📝 Commandes à Exécuter

### Dans Supabase SQL Editor

```sql
-- 1. Créer categories
-- Copier/Coller : database/CREATE_CATEGORIES_TABLE.sql
-- Exécuter

-- 2. Créer tables d'assignation
-- Copier/Coller : database/PHASE1_TABLES_ASSIGNATION.sql
-- Exécuter

-- 3. (Si nécessaire) Corriger rôles
-- Copier/Coller : database/FIX_SCHOOL_ADMIN_ROLE.sql
-- Exécuter
```

---

## ✅ Vérification Finale

Après exécution, vérifie avec :

```sql
-- Vérifier que tout existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') 
    THEN '✅ categories'
    ELSE '❌ categories'
  END as categories_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_modules') 
    THEN '✅ user_modules'
    ELSE '❌ user_modules'
  END as user_modules_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_categories') 
    THEN '✅ user_categories'
    ELSE '❌ user_categories'
  END as user_categories_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_modules') 
    THEN '✅ plan_modules'
    ELSE '❌ plan_modules'
  END as plan_modules_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_categories') 
    THEN '✅ plan_categories'
    ELSE '❌ plan_categories'
  END as plan_categories_status;

-- Compter les catégories
SELECT COUNT(*) as nb_categories FROM categories;
-- Résultat attendu : 8

-- Lister les catégories
SELECT name, slug, icon, color FROM categories ORDER BY display_order;
```

---

## 🎯 Résultat Final Attendu

```
✅ categories (8 lignes)
✅ user_modules (0 lignes)
✅ user_categories (0 lignes)
✅ plan_modules (0 lignes)
✅ plan_categories (0 lignes)
```

**Base de données prête pour la Phase 1 !** 🚀

---

**Date** : 4 Novembre 2025  
**Statut** : ✅ PRÊT À EXÉCUTER
