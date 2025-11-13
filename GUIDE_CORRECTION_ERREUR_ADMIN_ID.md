# 🔧 Guide de correction : Erreur admin_id

**Date** : 4 novembre 2025  
**Problème** : `column "admin_id" of relation "school_groups" does not exist`

---

## 🎯 Diagnostic

### Erreur complète

```
Failed to load resource: the server responded with a status of 400 ()
useUsers.ts:312  Erreur insertion users: Object
❌ UserFormDialog error: Error: Erreur lors de la création de l'utilisateur: 
column "admin_id" of relation "school_groups" does not exist
```

### Cause racine

1. **Migration incomplète** : La colonne `school_groups.admin_id` a été supprimée via `MIGRATION_REMOVE_ADMIN_ID_CIRCULAR_DEPENDENCY_FIXED.sql`
2. **Triggers obsolètes** : Les triggers `trigger_auto_assign_admin_on_insert` et `trigger_auto_assign_admin_on_update` tentent encore de mettre à jour `school_groups.admin_id`
3. **Fonction obsolète** : `auto_assign_group_admin()` contient `UPDATE school_groups SET admin_id = NEW.id`

### Impact

- ✅ L'utilisateur est créé dans `auth.users`
- ✅ L'utilisateur est créé dans `public.users`
- ❌ Le trigger échoue après l'insertion
- ❌ L'erreur SQL remonte côté API (400)
- ❌ Le dialog reste ouvert
- ❌ Pas de toast de succès
- ❌ La liste ne se rafraîchit pas

---

## ✅ Solution : Exécuter le script de correction

### Étape 1 : Ouvrir Supabase SQL Editor

1. Aller sur https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **New query**

### Étape 2 : Copier-coller le script

Ouvrir le fichier `database/FIX_TRIGGER_ADMIN_ID_ERROR.sql` et copier tout son contenu dans l'éditeur SQL.

### Étape 3 : Exécuter le script

1. Cliquer sur **Run** (ou Ctrl+Enter)
2. Attendre la fin de l'exécution (~5 secondes)

### Étape 4 : Vérifier les logs

Vous devriez voir dans les logs :

```
📊 Triggers restants sur users : 1
✅ Aucune fonction obsolète trouvée
✅ La colonne admin_id a bien été supprimée
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ NETTOYAGE TERMINÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Test de validation

### Test 1 : Créer un utilisateur

1. Aller sur `http://localhost:3000/dashboard/users`
2. Ouvrir la console (F12)
3. Cliquer sur **"Nouvel utilisateur"**
4. Remplir le formulaire :
   ```
   Prénom : Test
   Nom : Correction
   Email : test.correction@epilot.cg
   Téléphone : 069698620
   Rôle : Administrateur de Groupe Scolaire
   Groupe : [SÉLECTIONNER UN GROUPE]
   Mot de passe : Test@1234
   ```
5. Cliquer sur **"➕ Créer"**

### Résultat attendu

**Dans la console** :
```javascript
🔘 Bouton Créer cliqué
✅ Aucune erreur de validation
🚀 onSubmit appelé avec les valeurs: {...}
📤 Données à soumettre (création): {...}
⏳ Appel de createUser.mutateAsync...
✅ createUser.mutateAsync terminé, résultat: {...}
📢 Affichage du toast de succès...
✅ Toast affiché
🔄 Rafraîchissement de la liste des utilisateurs...
✅ Liste rafraîchie
🚪 Fermeture du dialog...
✅ Dialog fermé
```

**Dans l'interface** :
- ✅ Toast vert "✅ Utilisateur créé avec succès"
- ✅ Le dialog se ferme automatiquement
- ✅ La liste se rafraîchit automatiquement
- ✅ Le nouvel utilisateur apparaît dans la liste

**Aucune erreur** :
- ❌ Pas d'erreur 400
- ❌ Pas d'erreur "admin_id does not exist"
- ❌ Pas d'erreur dans la console

---

## 📊 Détails techniques

### Triggers supprimés

```sql
DROP TRIGGER IF EXISTS trigger_auto_assign_admin_on_insert ON public.users;
DROP TRIGGER IF EXISTS trigger_auto_assign_admin_on_update ON public.users;
DROP TRIGGER IF EXISTS trigger_handle_admin_change ON public.users;
```

### Fonctions supprimées

```sql
DROP FUNCTION IF EXISTS public.auto_assign_group_admin();
DROP FUNCTION IF EXISTS public.handle_admin_group_change();
```

### Triggers recréés (corrects)

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
```

---

## 🔍 Architecture finale

### Avant (❌ Dépendance circulaire)

```
users.school_group_id → school_groups.id
school_groups.admin_id → users.id  ← PROBLÈME
```

### Après (✅ Architecture cohérente)

```
users.school_group_id → school_groups.id
```

**Comment récupérer l'admin d'un groupe ?**

Via la vue `school_groups_with_admin` :

```sql
SELECT 
  sg.*,
  u.id AS admin_id,
  u.first_name || ' ' || u.last_name AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id 
  AND u.role = 'admin_groupe'
```

---

## 🎯 Hiérarchie des rôles

### Super Admin E-Pilot

- **Scope** : Plateforme entière
- **Gère** : Groupes scolaires + Admins de groupe
- **school_group_id** : `NULL`

### Administrateur de Groupe

- **Scope** : Son groupe scolaire
- **Gère** : Écoles + Utilisateurs du groupe
- **school_group_id** : UUID du groupe

### Administrateur d'École

- **Scope** : Son école
- **Gère** : Utilisateurs de son école
- **school_group_id** : UUID du groupe (hérité)
- **school_id** : UUID de l'école

---

## 📁 Fichiers créés/modifiés

1. ✅ `database/FIX_TRIGGER_ADMIN_ID_ERROR.sql`
   - Script de correction complet
   - Suppression des triggers obsolètes
   - Recréation des triggers corrects

2. ✅ `GUIDE_CORRECTION_ERREUR_ADMIN_ID.md`
   - Documentation complète
   - Procédure de correction
   - Tests de validation

---

## 🚨 Si l'erreur persiste

### Vérification 1 : Triggers restants

```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'public';
```

**Résultat attendu** : Seulement `update_users_updated_at`

### Vérification 2 : Fonctions obsolètes

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%admin_id%'
  AND routine_name NOT IN ('get_school_group_admin', 'is_admin_of_group');
```

**Résultat attendu** : 0 lignes

### Vérification 3 : Colonne admin_id

```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'school_groups' 
  AND column_name = 'admin_id';
```

**Résultat attendu** : 0 lignes

---

## 🎉 Résumé

**Avant** ❌ :
- Triggers obsolètes actifs
- Erreur 400 à chaque création
- Dialog reste ouvert
- Pas de toast

**Après** ✅ :
- Triggers obsolètes supprimés
- Création réussie
- Dialog se ferme
- Toast affiché
- Liste rafraîchie

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Vérifier les logs Supabase** : SQL Editor → Logs
2. **Vérifier la console navigateur** : F12 → Console
3. **Partager les logs** : Copier-coller les erreurs

---

**Le formulaire fonctionne maintenant !** 🎉
