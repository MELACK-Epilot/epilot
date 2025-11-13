# 🔧 Guide de Résolution : Erreur "admin_id does not exist"

## 🎯 Problème

Après avoir exécuté la migration pour supprimer `admin_id`, vous obtenez cette erreur :

```
column "admin_id" of relation "school_groups" does not exist
```

**Cause :** Un trigger ou une fonction obsolète essaie encore d'utiliser `admin_id`.

---

## ✅ Solution en 3 Étapes

### **Étape 1 : Exécuter le Script de Nettoyage**

```bash
# Fichier : database/CLEANUP_OLD_TRIGGERS.sql
```

Ce script va :
1. ✅ Identifier tous les triggers sur `school_groups` et `users`
2. ✅ Supprimer tous les triggers obsolètes
3. ✅ Supprimer toutes les fonctions utilisant `admin_id`
4. ✅ Recréer les triggers corrects (sans `admin_id`)

**Exécution :**
```
1. Ouvrir Supabase SQL Editor
2. Copier CLEANUP_OLD_TRIGGERS.sql
3. Exécuter
```

---

### **Étape 2 : Vérifier les Résultats**

Après exécution, vous devriez voir :

```
✅ Trigger supprimé : trigger_name_1
✅ Trigger supprimé : trigger_name_2
📊 Triggers restants sur school_groups : 1
✅ Aucune fonction obsolète trouvée
```

**Triggers attendus (corrects) :**
- `update_school_groups_updated_at` sur `school_groups`
- `update_users_updated_at` sur `users`

---

### **Étape 3 : Tester la Création d'Utilisateur**

1. **Supprimer l'utilisateur existant** (si email déjà utilisé) :
```sql
-- Dans Supabase SQL Editor
DELETE FROM users WHERE email = 'int@epilot.cg';
```

2. **Recréer l'utilisateur** via l'interface :
```
Page Utilisateurs → Créer un utilisateur
- Prénom : Jean
- Nom : Dupont
- Email : int@epilot.cg (ou nouveau)
- Rôle : Administrateur de Groupe
- Groupe : (laisser vide pour l'instant)
```

3. **Assigner au groupe** :
```
Page Groupes Scolaires → Sélectionner groupe → Assigner administrateur
```

---

## 🔍 Diagnostic Avancé

### **Si l'erreur persiste, vérifier manuellement :**

```sql
-- 1. Vérifier les triggers restants
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('school_groups', 'users')
ORDER BY trigger_name;

-- 2. Vérifier les fonctions contenant admin_id
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%admin_id%'
ORDER BY routine_name;

-- 3. Vérifier que admin_id n'existe plus
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'school_groups' 
  AND column_name = 'admin_id';
-- Résultat attendu : 0 lignes
```

---

## 🚨 Triggers Suspects à Supprimer

Si vous trouvez ces triggers, supprimez-les :

```sql
DROP TRIGGER IF EXISTS update_school_group_admin ON users CASCADE;
DROP TRIGGER IF EXISTS sync_admin_id ON users CASCADE;
DROP TRIGGER IF EXISTS set_admin_id ON users CASCADE;
DROP TRIGGER IF EXISTS update_admin_id ON users CASCADE;
DROP TRIGGER IF EXISTS handle_admin_assignment ON users CASCADE;
DROP TRIGGER IF EXISTS auto_assign_admin ON school_groups CASCADE;
```

---

## 🎯 Fonctions Suspectes à Supprimer

```sql
DROP FUNCTION IF EXISTS update_school_group_admin_id() CASCADE;
DROP FUNCTION IF EXISTS sync_admin_id() CASCADE;
DROP FUNCTION IF EXISTS set_admin_id() CASCADE;
DROP FUNCTION IF EXISTS update_admin_id_on_user_change() CASCADE;
DROP FUNCTION IF EXISTS handle_admin_assignment() CASCADE;
```

---

## ✅ Checklist Finale

- [ ] Script `CLEANUP_OLD_TRIGGERS.sql` exécuté
- [ ] Aucun trigger obsolète restant
- [ ] Aucune fonction obsolète restante
- [ ] Colonne `admin_id` n'existe plus
- [ ] Création d'utilisateur fonctionne
- [ ] Assignation admin fonctionne
- [ ] Vue `school_groups_with_admin` retourne les données

---

## 🎉 Résultat Attendu

Après nettoyage, vous devriez pouvoir :

1. ✅ Créer un utilisateur avec rôle `admin_groupe`
2. ✅ Assigner cet utilisateur à un groupe scolaire
3. ✅ Voir l'admin dans le tableau des groupes
4. ✅ Aucune erreur "admin_id does not exist"

---

## 📝 Notes Importantes

### **Pourquoi cette erreur ?**

Lors de la création initiale du schéma, des triggers ont été créés pour synchroniser automatiquement `admin_id`. Ces triggers n'ont pas été supprimés lors de la migration.

### **Architecture Finale**

```
users.school_group_id → school_groups.id + role='admin_groupe'
```

**Plus de colonne `admin_id` dans `school_groups` !**

---

**Date :** 3 novembre 2025  
**Auteur :** Cascade AI  
**Version :** 1.0.0
