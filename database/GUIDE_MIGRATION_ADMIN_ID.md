# 🔧 Guide de Migration - Suppression admin_id

## ⚠️ Problème Rencontré

```
ERROR: cannot drop column admin_id of table school_groups because other objects depend on it
```

**Cause :** Des policies RLS sur d'autres tables (`notifications`, `expenses`) dépendent de `school_groups.admin_id`.

---

## ✅ Solution : Migration en 2 Étapes

### **Étape 1 : Utiliser le script CORRIGÉ**

**Fichier :** `MIGRATION_REMOVE_ADMIN_ID_CIRCULAR_DEPENDENCY_FIXED.sql`

Ce script :
1. ✅ Supprime d'abord les policies dépendantes
2. ✅ Supprime ensuite la colonne `admin_id`
3. ✅ Recrée les policies avec la nouvelle logique

---

## 📋 Instructions d'Exécution

### **1. Ouvrir Supabase SQL Editor**

```
https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

### **2. Copier le script FIXED**

```bash
# Ouvrir le fichier
database/MIGRATION_REMOVE_ADMIN_ID_CIRCULAR_DEPENDENCY_FIXED.sql

# Copier TOUT le contenu (Ctrl+A, Ctrl+C)
```

### **3. Coller dans SQL Editor**

```
Ctrl+V dans l'éditeur Supabase
```

### **4. Exécuter le script**

```
Cliquer sur "Run" ou Ctrl+Enter
```

### **5. Vérifier les résultats**

Le script affiche automatiquement :
- ✅ Nombre d'admins migrés
- ✅ Vérification de la suppression de `admin_id`
- ✅ Liste des contraintes créées
- ✅ Liste des policies créées

---

## 🔍 Vérifications Post-Migration

### **1. Vérifier que admin_id n'existe plus**

```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'school_groups' 
  AND column_name = 'admin_id';
```

**Résultat attendu :** 0 lignes

### **2. Vérifier la vue**

```sql
SELECT * FROM school_groups_with_admin LIMIT 5;
```

**Résultat attendu :** Liste des groupes avec leurs admins

### **3. Vérifier les policies**

```sql
-- Policies sur school_groups
SELECT policyname FROM pg_policies 
WHERE tablename = 'school_groups';

-- Policies sur notifications
SELECT policyname FROM pg_policies 
WHERE tablename = 'notifications' 
  AND policyname LIKE '%Admin Groupe%';

-- Policies sur expenses
SELECT policyname FROM pg_policies 
WHERE tablename = 'expenses' 
  AND policyname LIKE '%Admin Groupe%';
```

---

## 📊 Différences entre les 2 scripts

| Aspect | Script Original | Script FIXED |
|--------|----------------|--------------|
| **Étape 0** | ❌ Absente | ✅ Suppression policies dépendantes |
| **DROP admin_id** | ❌ Échoue | ✅ Réussit |
| **Policies notifications** | ❌ Non recréées | ✅ Recréées avec nouvelle logique |
| **Policies expenses** | ❌ Non recréées | ✅ Recréées avec nouvelle logique |

---

## 🎯 Nouvelle Logique des Policies

### **Avant (avec admin_id)**

```sql
-- ❌ Ancienne logique
CREATE POLICY "Admin Groupe can view their expenses"
ON expenses FOR SELECT
USING (
  school_group_id IN (
    SELECT id FROM school_groups 
    WHERE admin_id = auth.uid()
  )
);
```

### **Après (avec school_group_id)**

```sql
-- ✅ Nouvelle logique
CREATE POLICY "Admin Groupe can view their expenses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = expenses.school_group_id
  )
);
```

---

## 🔐 Policies Recréées

### **1. Notifications (1 policy)**

```sql
"Admin Groupe can view their group notifications"
→ Voit les notifications globales + son rôle + personnelles
```

### **2. Expenses (4 policies)**

```sql
"Admin Groupe can view their expenses"    → SELECT
"Admin Groupe can insert their expenses"  → INSERT
"Admin Groupe can update their expenses"  → UPDATE
"Admin Groupe can delete their expenses"  → DELETE
```

### **3. School Groups (2 policies)**

```sql
"Admin Groupe can view their group"   → SELECT
"Admin Groupe can update their group" → UPDATE
```

---

## ⚠️ Si la Migration Échoue

### **Erreur : "policy already exists"**

```sql
-- Supprimer manuellement les policies
DROP POLICY IF EXISTS "Admin Groupe can view their group" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can update their group" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can view their group notifications" ON notifications;
DROP POLICY IF EXISTS "Admin Groupe can view their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can insert their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can update their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can delete their expenses" ON expenses;

-- Puis relancer le script
```

### **Erreur : "constraint already exists"**

```sql
-- Supprimer manuellement les contraintes
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_groupe_has_school_group;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_super_admin_no_school_group;

-- Puis relancer le script
```

---

## 🚀 Après la Migration

### **1. Redémarrer l'application**

```bash
# Arrêter
Ctrl+C

# Redémarrer
npm run dev
```

### **2. Tester les fonctionnalités**

1. ✅ Créer un groupe scolaire
2. ✅ Créer un utilisateur admin_groupe
3. ✅ Assigner l'admin au groupe
4. ✅ Vérifier l'affichage dans le tableau
5. ✅ Tester les permissions (notifications, expenses)

---

## 📝 Résumé

| Étape | Action | Statut |
|-------|--------|--------|
| 1 | Supprimer policies dépendantes | ✅ |
| 2 | Supprimer colonne admin_id | ✅ |
| 3 | Migrer données vers users.school_group_id | ✅ |
| 4 | Créer contraintes de cohérence | ✅ |
| 5 | Créer vue school_groups_with_admin | ✅ |
| 6 | Recréer policies school_groups | ✅ |
| 7 | Recréer policies notifications | ✅ |
| 8 | Recréer policies expenses | ✅ |
| 9 | Créer fonctions utilitaires | ✅ |
| 10 | Créer trigger auto-assignation | ✅ |

---

## ✅ Checklist Finale

- [ ] Script FIXED exécuté sans erreur
- [ ] Colonne `admin_id` supprimée
- [ ] Vue `school_groups_with_admin` créée
- [ ] Policies `school_groups` créées (2)
- [ ] Policies `notifications` créées (1)
- [ ] Policies `expenses` créées (4)
- [ ] Contraintes `users` créées (2)
- [ ] Fonctions utilitaires créées (2)
- [ ] Trigger créé (1)
- [ ] Application redémarrée
- [ ] Tests fonctionnels OK

---

**Date :** 3 novembre 2025  
**Auteur :** Cascade AI  
**Version :** 1.1.0 (FIXED)
