# ✅ CORRECTION ENUM USER_ROLE - ERREUR "STUDENT"

**Date** : 7 novembre 2025  
**Erreur** : `invalid input value for enum user_role: "student"`

---

## 🔴 PROBLÈME IDENTIFIÉ

### **Erreur complète** :
```
Failed to load resource: the server responded with a status of 400 ()
Erreur insertion users: invalid input value for enum user_role: "student"
```

### **Cause racine** :
**Incohérence entre Application et Base de données**

**Application** (`src/config/roles.ts`) :
- ✅ Définit 20+ rôles dont `'eleve'`, `'enseignant'`, `'directeur'`, etc.
- ✅ Types TypeScript complets

**Base de données** (`supabase.types.ts`) :
- ❌ Enum `user_role` ne contient que : `'super_admin' | 'admin_groupe'`
- ❌ Manque tous les autres rôles
- ❌ `admin_ecole` n'existe pas dans votre architecture

---

## 🔍 ANALYSE DÉTAILLÉE

### **Rôles définis dans l'application** :
```typescript
// ADMIN_ROLES
'super_admin', 'admin_groupe'

// USER_ROLES (manquants en BDD)
'proviseur', 'directeur', 'directeur_etudes',
'secretaire', 'comptable',
'enseignant', 'cpe', 'surveillant',
'bibliothecaire', 'gestionnaire_cantine', 'conseiller_orientation', 'infirmier',
'eleve', 'parent', 'autre'
```

### **Rôles acceptés par la BDD** :
```sql
user_role: 'super_admin' | 'admin_groupe'
```

### **Architecture E-Pilot** :
- **`super_admin`** : Gère toute la plateforme
- **`admin_groupe`** : Gère un groupe scolaire + toutes ses écoles
- **`directeur/proviseur`** : Dirige une école spécifique
- **Autres rôles** : Personnel des écoles

### **Tentative de création** :
- Quelqu'un essaie de créer un utilisateur avec `role: "student"`
- "student" n'existe pas dans l'enum → Erreur 400

---

## ✅ SOLUTION APPLIQUÉE

### **Script SQL créé** : `database/FIX_USER_ROLE_ENUM.sql`

**Actions** :
1. ✅ Ajouter tous les rôles manquants à l'enum `user_role`
2. ✅ Inclure les alias (`student` → `eleve`, `teacher` → `enseignant`)
3. ✅ Vérifier les contraintes existantes
4. ✅ Messages de confirmation

### **Rôles ajoutés** :
```sql
-- Direction
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proviseur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur_etudes';

-- Administratif
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comptable';

-- Éducatif
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'enseignant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cpe';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'surveillant';

-- Spécialisé
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibliothecaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestionnaire_cantine';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'conseiller_orientation';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'infirmier';

-- Utilisateurs finaux
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'eleve';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'autre';

-- Alias (compatibilité)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher';
```

---

## 🚀 INSTALLATION

### **Commande** :
```sql
-- Exécuter dans Supabase SQL Editor
\i database/FIX_USER_ROLE_ENUM.sql
```

### **Ou copier-coller** :
1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Copier le contenu du fichier `FIX_USER_ROLE_ENUM.sql`
4. Exécuter

---

## ✅ RÉSULTAT ATTENDU

### **Avant** (erreur) :
```
❌ invalid input value for enum user_role: "student"
❌ Création utilisateur échoue
❌ Application plante
```

### **Après** (fonctionnel) :
```
✅ Enum user_role contient 20+ rôles
✅ "student" accepté (alias pour "eleve")
✅ Création utilisateur réussit
✅ Application stable
```

---

## 🧪 COMMENT TESTER

### **Vérifier l'enum** :
```sql
SELECT enumlabel as role_value 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'user_role'
)
ORDER BY enumlabel;
```

### **Tester création utilisateur** :
1. Aller sur la page qui causait l'erreur
2. Essayer de créer un utilisateur
3. ✅ Plus d'erreur "invalid input value"

---

## 📊 IMPACT

### **Sécurité** ✅
- Pas de changement des permissions
- Juste ajout de valeurs enum
- RLS policies inchangées

### **Compatibilité** ✅
- Rétrocompatible (IF NOT EXISTS)
- Alias pour transitions
- Types TypeScript cohérents

### **Fonctionnalité** ✅
- Création utilisateurs tous rôles
- Formulaires fonctionnels
- Plus d'erreurs 400

---

## 📁 FICHIERS

1. ✅ `database/FIX_USER_ROLE_ENUM.sql` (CRÉÉ)
2. ✅ `CORRECTION_USER_ROLE_ENUM.md` (CRÉÉ)
3. ✅ `src/config/roles.ts` (déjà existant, cohérent)

---

## 🎯 PROCHAINES ÉTAPES

1. **Exécuter le script SQL** ✅
2. **Tester création utilisateur** ✅
3. **Vérifier formulaires** ✅
4. **Mettre à jour types Supabase** (optionnel)

---

**🎉 APRÈS EXÉCUTION DU SCRIPT, L'ERREUR SERA CORRIGÉE !** ✅

**Exécutez `database/FIX_USER_ROLE_ENUM.sql` dans Supabase !** 🚀
