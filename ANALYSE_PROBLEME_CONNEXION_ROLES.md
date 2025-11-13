# 🚨 ANALYSE PROBLÈME CONNEXION PAR RÔLE

**Date** : 4 Novembre 2025 22h10  
**Problème** : Connexion ne fonctionne pas selon les rôles  
**Statut** : 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

---

## 📊 STRUCTURE DES UTILISATEURS

### Utilisateurs de Test

```sql
-- 1. Super Admin (Plateforme)
id: 38b66419-97c1-489f-abbe-fb107568d347
email: admin@epilot.cg
role: super_admin
school_group_id: NULL
school_id: NULL
✅ Doit accéder à /dashboard

-- 2. Admin Groupe
id: 6db47a8a-f646-453e-be03-8b9a252c6e77
email: ana@epilot.cg
role: admin_groupe
school_group_id: 508ed785-99c1-498e-bdef-ea8e85302d0a
school_id: NULL
✅ Doit accéder à /dashboard ET /user

-- 3. Directeur (Utilisateur École)
id: da2aef06-b380-47eb-bc78-1af72b1456d9
email: ram@epilot.cg
role: directeur
school_group_id: 508ed785-99c1-498e-bdef-ea8e85302d0a
school_id: NULL ⚠️ PROBLÈME !
✅ Doit accéder à /user uniquement
```

---

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. ❌ ERREUR CRITIQUE dans useLogin.ts

**Fichier** : `src/features/auth/hooks/useLogin.ts`  
**Lignes** : 17-28

```typescript
const convertDatabaseRole = (dbRole: string): UserRole => {
  switch (dbRole) {
    case 'super_admin':
      return UserRole.SUPER_ADMIN;
    case 'admin_groupe':
      return UserRole.GROUP_ADMIN;
    case 'admin_ecole':  // ❌ N'EXISTE PAS !
      return UserRole.SCHOOL_ADMIN;
    default:
      return UserRole.SCHOOL_ADMIN; // ❌ MAUVAIS FALLBACK !
  }
};
```

**Problème** :
- ❌ Le rôle `admin_ecole` n'existe PAS
- ❌ Le fallback retourne `SCHOOL_ADMIN` pour TOUS les rôles inconnus
- ❌ `directeur` devient `SCHOOL_ADMIN` au lieu de rester `directeur`

**Impact** :
- Le directeur (`ram@epilot.cg`) est converti en `SCHOOL_ADMIN`
- Les 15 rôles utilisateur ne sont PAS gérés
- Redirection incorrecte

---

### 2. ❌ PROBLÈME school_id NULL pour Directeur

**Utilisateur** : `ram@epilot.cg` (directeur)

```sql
school_group_id: 508ed785-99c1-498e-bdef-ea8e85302d0a ✅
school_id: NULL ❌
```

**Problème** :
- Un directeur DOIT être associé à une école (`school_id`)
- Actuellement `school_id = NULL`
- Il ne peut pas accéder à son espace utilisateur

**Solution** :
```sql
-- Assigner le directeur à une école
UPDATE users 
SET school_id = 'ID_ECOLE_EXISTANTE'
WHERE email = 'ram@epilot.cg';
```

---

### 3. ⚠️ Enum UserRole Incomplet

**Fichier** : `src/features/auth/types/auth.types.ts`

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  GROUP_ADMIN = 'admin_groupe',
  SCHOOL_ADMIN = 'admin_ecole', // ❌ N'existe pas
}
```

**Problème** :
- Seulement 3 rôles dans l'enum
- Les 15 rôles utilisateur manquent
- Pas de `directeur`, `enseignant`, `cpe`, etc.

---

### 4. ✅ RoleBasedRedirect Correct (Mais Dépend de useLogin)

**Fichier** : `src/components/RoleBasedRedirect.tsx`

```typescript
const isAdmin = isAdminRole(user.role);  // ✅ Utilise config centralisée
const isUser = isUserRole(user.role);    // ✅ Utilise config centralisée
```

**Logique** :
- ✅ Super Admin → `/dashboard`
- ✅ Admin Groupe → `/dashboard` (peut aussi `/user`)
- ✅ Utilisateurs → `/user`

**Problème** :
- Dépend de `user.role` qui vient de `useLogin`
- Si `useLogin` convertit mal le rôle → redirection incorrecte

---

## 🔧 SOLUTIONS À APPLIQUER

### Solution 1 : Corriger convertDatabaseRole

**Fichier** : `src/features/auth/hooks/useLogin.ts`

**AVANT (Incorrect)** :
```typescript
const convertDatabaseRole = (dbRole: string): UserRole => {
  switch (dbRole) {
    case 'super_admin':
      return UserRole.SUPER_ADMIN;
    case 'admin_groupe':
      return UserRole.GROUP_ADMIN;
    case 'admin_ecole':
      return UserRole.SCHOOL_ADMIN;
    default:
      return UserRole.SCHOOL_ADMIN; // ❌ MAUVAIS
  }
};
```

**APRÈS (Correct)** :
```typescript
const convertDatabaseRole = (dbRole: string): string => {
  // Ne pas convertir, retourner le rôle tel quel
  return dbRole;
};
```

**OU MIEUX** : Supprimer complètement la conversion

```typescript
// Ligne 112 - Utiliser directement profile.role
const user = {
  id: profile.id,
  email: profile.email,
  firstName: profile.first_name || 'Utilisateur',
  lastName: profile.last_name || '',
  role: profile.role, // ✅ Utiliser directement sans conversion
  avatar: profile.avatar || undefined,
  // ...
};
```

---

### Solution 2 : Mettre à Jour l'Enum UserRole

**Fichier** : `src/features/auth/types/auth.types.ts`

**Option A** : Supprimer l'enum et utiliser string

```typescript
// Supprimer l'enum UserRole
export type UserRole = string;
```

**Option B** : Ajouter tous les rôles (17 rôles)

```typescript
export enum UserRole {
  // Admins
  SUPER_ADMIN = 'super_admin',
  GROUP_ADMIN = 'admin_groupe',
  
  // Direction
  PROVISEUR = 'proviseur',
  DIRECTEUR = 'directeur',
  DIRECTEUR_ETUDES = 'directeur_etudes',
  
  // Personnel administratif
  SECRETAIRE = 'secretaire',
  COMPTABLE = 'comptable',
  
  // Personnel éducatif
  ENSEIGNANT = 'enseignant',
  CPE = 'cpe',
  SURVEILLANT = 'surveillant',
  
  // Personnel spécialisé
  BIBLIOTHECAIRE = 'bibliothecaire',
  GESTIONNAIRE_CANTINE = 'gestionnaire_cantine',
  CONSEILLER_ORIENTATION = 'conseiller_orientation',
  INFIRMIER = 'infirmier',
  
  // Utilisateurs finaux
  ELEVE = 'eleve',
  PARENT = 'parent',
  AUTRE = 'autre',
}
```

---

### Solution 3 : Assigner school_id au Directeur

**SQL** :
```sql
-- 1. Trouver une école du groupe
SELECT id, name 
FROM schools 
WHERE school_group_id = '508ed785-99c1-498e-bdef-ea8e85302d0a'
LIMIT 1;

-- 2. Assigner l'école au directeur
UPDATE users 
SET school_id = 'ID_ECOLE_TROUVEE'
WHERE email = 'ram@epilot.cg';
```

---

## 📋 FLUX DE CONNEXION CORRECT

### 1. Super Admin (admin@epilot.cg)

```
Connexion
  ↓
useLogin récupère profile.role = 'super_admin'
  ↓
user.role = 'super_admin' (sans conversion)
  ↓
RoleBasedRedirect détecte isAdminRole('super_admin') = true
  ↓
Redirection vers /dashboard
  ↓
✅ Accès Dashboard Super Admin
```

---

### 2. Admin Groupe (ana@epilot.cg)

```
Connexion
  ↓
useLogin récupère profile.role = 'admin_groupe'
  ↓
user.role = 'admin_groupe' (sans conversion)
  ↓
RoleBasedRedirect détecte isAdminRole('admin_groupe') = true
  ↓
Redirection vers /dashboard
  ↓
✅ Accès Dashboard Admin Groupe
✅ Peut aussi accéder à /user
```

---

### 3. Directeur (ram@epilot.cg)

```
Connexion
  ↓
useLogin récupère profile.role = 'directeur'
  ↓
user.role = 'directeur' (sans conversion)
  ↓
RoleBasedRedirect détecte isUserRole('directeur') = true
  ↓
Redirection vers /user
  ↓
✅ Accès Espace Utilisateur École
```

---

## 🎯 CHECKLIST DE CORRECTION

### Étape 1 : Corriger useLogin.ts

- [ ] Supprimer `convertDatabaseRole()`
- [ ] Utiliser `profile.role` directement
- [ ] Tester connexion super_admin
- [ ] Tester connexion admin_groupe
- [ ] Tester connexion directeur

---

### Étape 2 : Mettre à Jour auth.types.ts

- [ ] Option A : Supprimer enum UserRole
- [ ] Option B : Ajouter tous les 17 rôles
- [ ] Vérifier imports dans tous les fichiers

---

### Étape 3 : Corriger BDD

- [ ] Trouver ID d'une école du groupe
- [ ] Assigner school_id au directeur
- [ ] Vérifier que school_id n'est plus NULL

---

### Étape 4 : Tests de Connexion

- [ ] Se connecter en tant que Super Admin
  - [ ] Vérifie redirection vers /dashboard
  - [ ] Vérifie accès pages super admin
  
- [ ] Se connecter en tant qu'Admin Groupe
  - [ ] Vérifie redirection vers /dashboard
  - [ ] Vérifie accès pages admin groupe
  - [ ] Vérifie accès à /user
  
- [ ] Se connecter en tant que Directeur
  - [ ] Vérifie redirection vers /user
  - [ ] Vérifie PAS d'accès à /dashboard
  - [ ] Vérifie affichage son école

---

## 🔍 LOGS DE DEBUG

### Ajouter dans useLogin.ts (ligne 112)

```typescript
console.log('🔐 Login Success:', {
  email: profile.email,
  role: profile.role,
  schoolGroupId: profile.school_group_id,
  schoolId: profile.school_id,
  status: profile.status
});
```

### Ajouter dans RoleBasedRedirect.tsx (ligne 38)

```typescript
console.log('🔄 Role Check:', {
  role: user.role,
  isAdmin: isAdminRole(user.role),
  isUser: isUserRole(user.role),
  currentPath: location.pathname
});
```

---

## 📊 RÉSUMÉ DES PROBLÈMES

| Problème | Fichier | Gravité | Impact |
|----------|---------|---------|--------|
| Conversion rôle incorrecte | useLogin.ts | 🔴 Critique | Tous les rôles |
| Enum incomplet | auth.types.ts | 🟠 Majeur | Types TypeScript |
| school_id NULL | BDD users | 🟠 Majeur | Directeur |
| admin_ecole référencé | useLogin.ts | 🔴 Critique | Fallback incorrect |

---

## ✅ RÉSULTAT ATTENDU APRÈS CORRECTIONS

### Super Admin
- ✅ Connexion réussie
- ✅ Redirection vers `/dashboard`
- ✅ Accès toutes pages super admin
- ❌ Pas d'accès `/user`

### Admin Groupe
- ✅ Connexion réussie
- ✅ Redirection vers `/dashboard`
- ✅ Accès pages admin groupe
- ✅ Accès `/user` (optionnel)

### Directeur
- ✅ Connexion réussie
- ✅ Redirection vers `/user`
- ✅ Affichage son école
- ❌ Pas d'accès `/dashboard`

---

**Date** : 4 Novembre 2025  
**Version** : 4.4.0  
**Statut** : 🔴 CORRECTIONS URGENTES REQUISES  
**Impact** : 🔴 SYSTÈME DE CONNEXION NON FONCTIONNEL
