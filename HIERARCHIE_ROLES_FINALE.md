# ✅ HIÉRARCHIE DES RÔLES E-PILOT - VERSION FINALE

## 🎯 Clarification Importante

**Il n'y a PAS de rôle `school_admin` dans le système E-Pilot !**

---

## 🧬 Structure Hiérarchique (3 Niveaux)

### 1️⃣ **Super Admin Plateforme** (1 rôle)

**Rôle** : `super_admin`

**Responsabilités** :
- Gère TOUS les groupes scolaires
- Crée les catégories métiers
- Crée les modules pédagogiques
- Définit les plans d'abonnement
- Vue globale de la plateforme

**Accès** :
- ✅ Dashboard Admin (`/dashboard`) UNIQUEMENT
- ❌ Pas d'accès `/user`

**Scope** : Multi-groupes (toute la plateforme)

---

### 2️⃣ **Admin de Groupe Scolaire** (1 rôle)

**Rôle** : `admin_groupe`

**Responsabilités** :
- Gère PLUSIEURS écoles d'un groupe
- Crée et gère les écoles du groupe
- Crée les utilisateurs des écoles (proviseur, enseignant, etc.)
- Active/désactive les modules pour ses écoles
- Assigne les catégories métiers
- Statistiques du groupe

**Accès** :
- ✅ Dashboard Admin (`/dashboard`) - Gestion
- ✅ Espace Utilisateur (`/user`) - Utilisation modules

**Scope** : Multi-écoles (un groupe scolaire)

**Exemple** :
- Groupe "LE LIANO" avec 3 écoles
- Admin de groupe gère les 3 écoles
- Crée les proviseurs, enseignants, etc.

---

### 3️⃣ **Utilisateurs École** (13 rôles)

#### **Direction** (3 rôles)
```
proviseur           - Lycée
directeur           - Collège/Primaire
directeur_etudes    - Directeur des Études
```

#### **Personnel Administratif** (2 rôles)
```
secretaire   - Secrétariat
comptable    - Comptabilité
```

#### **Personnel Pédagogique** (3 rôles)
```
enseignant   - Enseignant
cpe          - Conseiller Principal d'Éducation
surveillant  - Surveillant
```

#### **Personnel Support** (3 rôles)
```
bibliothecaire          - Bibliothécaire
conseiller_orientation  - Conseiller d'Orientation
infirmier              - Infirmier
```

#### **Utilisateurs Finaux** (2 rôles)
```
eleve   - Élève
parent  - Parent
```

**Responsabilités** :
- Utilisent les modules assignés
- Gèrent leur domaine (notes, absences, etc.)
- Consultent emploi du temps
- Gèrent leur profil

**Accès** :
- ✅ Espace Utilisateur (`/user`) UNIQUEMENT
- ❌ Pas d'accès `/dashboard`

**Scope** : Local (une école)

---

## 📊 Matrice des Accès

| Rôle | `/dashboard` | `/user` | Scope |
|------|--------------|---------|-------|
| **super_admin** | ✅ Oui | ❌ Non | Plateforme |
| **admin_groupe** | ✅ Oui | ✅ Oui | Groupe |
| **proviseur** | ❌ Non | ✅ Oui | École |
| **directeur** | ❌ Non | ✅ Oui | École |
| **enseignant** | ❌ Non | ✅ Oui | École |
| **cpe** | ❌ Non | ✅ Oui | École |
| **comptable** | ❌ Non | ✅ Oui | École |
| **eleve** | ❌ Non | ✅ Oui | École |
| **parent** | ❌ Non | ✅ Oui | École |
| **autre** | ❌ Non | ✅ Oui | École |

---

## 🔄 Flux de Création

### Étape 1 : Super Admin
```
Super Admin
  ↓
Crée Groupe Scolaire "LE LIANO"
  ↓
Assigne Admin de Groupe
```

### Étape 2 : Admin de Groupe
```
Admin de Groupe (LE LIANO)
  ↓
Crée École "Lycée Technique"
  ↓
Crée Utilisateurs :
  - Proviseur (Ramsès)
  - Enseignants (Marie, Jean)
  - CPE (Anais)
  - Comptable (Paul)
```

### Étape 3 : Utilisateurs École
```
Proviseur (Ramsès)
  ↓
Utilise modules :
  - Gestion Notes
  - Emploi du Temps
  - Rapports
```

---

## ⚠️ Erreur Courante : `school_admin`

**Problème** : Utilisateur avec rôle `school_admin`

**Message d'erreur** :
```
Accès refusé
Votre rôle: school_admin
```

**Cause** : Le rôle `school_admin` **n'existe pas** dans le système

**Solution** : Corriger le rôle dans la base de données

```sql
-- Remplacer school_admin par admin_groupe
UPDATE users
SET role = 'admin_groupe'::user_role
WHERE role = 'school_admin';
```

**Fichier** : `database/FIX_SCHOOL_ADMIN_ROLE.sql`

---

## 🎯 Règles de Redirection

### Règle 1 : Utilisateur École → Dashboard
```
Proviseur essaie /dashboard
  ↓
🔄 Redirection automatique
  ↓
Arrive sur /user
```

### Règle 2 : Admin de Groupe
```
Admin de Groupe peut aller sur :
  ✅ /dashboard (gestion)
  ✅ /user (utilisation modules)
```

### Règle 3 : Super Admin
```
Super Admin va sur :
  ✅ /dashboard uniquement
```

---

## 📝 Enum `user_role` (Base de Données)

```sql
CREATE TYPE user_role AS ENUM (
  -- Admin
  'super_admin',
  'admin_groupe',
  
  -- Direction
  'proviseur',
  'directeur',
  'directeur_etudes',
  
  -- Personnel Administratif
  'secretaire',
  'comptable',
  
  -- Personnel Pédagogique
  'enseignant',
  'cpe',
  'surveillant',
  
  -- Personnel Support
  'bibliothecaire',
  'gestionnaire_cantine',
  'conseiller_orientation',
  'infirmier',
  
  -- Utilisateurs Finaux
  'eleve',
  'parent',
  
  -- Autre
  'autre'
);
```

**Total** : 17 rôles

---

## 🎉 Résumé

### Rôles Admin (2)
- `super_admin` : Plateforme complète
- `admin_groupe` : Groupe scolaire

### Rôles Utilisateurs (15)
- Direction : 3
- Administratif : 2
- Pédagogique : 3
- Support : 4
- Finaux : 2
- Autre : 1

### ⚠️ Rôles Inexistants
- ❌ `school_admin` (n'existe pas !)
- ❌ `admin` (utiliser `admin_groupe`)
- ❌ `administrator` (utiliser `super_admin`)

---

## 🚀 Action Immédiate

Si tu as l'erreur "Votre rôle: school_admin" :

1. **Exécute** : `database/FIX_SCHOOL_ADMIN_ROLE.sql`
2. **Rafraîchis** la page
3. **Reconnecte-toi**

Tu seras redirigé vers `/dashboard` avec le rôle `admin_groupe` ! ✅

---

**Date** : 4 Novembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ HIÉRARCHIE FINALE VALIDÉE
