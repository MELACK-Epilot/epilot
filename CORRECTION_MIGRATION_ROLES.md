# ✅ CORRECTION - Migration Rôles Utilisateurs

## ❌ Erreur Rencontrée

```
ERROR: 22P02: invalid input value for enum user_role: "documentaliste"
LINE 53: WHERE role = 'documentaliste';
```

## 🎯 Cause

La ligne suivante essayait de migrer un rôle qui **n'existe pas** dans l'enum actuel :

```sql
UPDATE users 
SET role = 'bibliothecaire'
WHERE role = 'documentaliste';  -- ❌ Ce rôle n'existe pas !
```

## ✅ Solution Appliquée

Suppression de la ligne de migration car :
1. `'documentaliste'` n'est pas dans l'enum actuel
2. Donc aucun utilisateur ne peut avoir ce rôle
3. Donc pas besoin de migration

```sql
-- Note: Pas de migration nécessaire car 'documentaliste' n'existe pas dans l'enum actuel
-- Si des utilisateurs avec ce rôle existent, ils seront migrés manuellement après
```

## 🚀 Script Corrigé

Le fichier `ADD_NEW_USER_ROLES.sql` est maintenant prêt à être exécuté !

### Contenu Final
```sql
-- Ajouter les 9 nouveaux rôles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proviseur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur_etudes';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibliothecaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'eleve';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestionnaire_cantine';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'autre';

-- Pas de migration de données nécessaire
```

## 📊 Rôles Avant/Après

### Avant (7 rôles)
```
super_admin
admin_groupe
enseignant
cpe
comptable
surveillant
+ 1 rôle inconnu (peut-être documentaliste ou autre)
```

### Après (15 rôles minimum)
```
ADMINISTRATEURS:
- super_admin
- admin_groupe

DIRECTION:
- proviseur
- directeur
- directeur_etudes

ADMINISTRATIFS:
- secretaire
- comptable

PÉDAGOGIQUES:
- enseignant
- cpe
- surveillant

SUPPORT:
- bibliothecaire
- gestionnaire_cantine

UTILISATEURS:
- eleve
- parent

GÉNÉRIQUE:
- autre
```

## ✅ Prochaine Étape

**EXÉCUTER LE SCRIPT MAINTENANT !**

1. Ouvrir Supabase SQL Editor
2. Copier/coller le contenu de `ADD_NEW_USER_ROLES.sql`
3. Cliquer "Run"
4. ✅ Vérifier le message de succès

## 🧪 Vérification Post-Migration

```sql
-- Compter les rôles
SELECT COUNT(*) as total_roles
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype;

-- Lister tous les rôles
SELECT enumlabel as role_name
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;
```

**Résultat attendu** : Au moins 15 rôles

## 🎉 Résultat

Après l'exécution, le formulaire `GroupUserFormDialog` sera 100% compatible avec la base de données !

Tous les 12 rôles du formulaire seront acceptés par la base de données. ✅
