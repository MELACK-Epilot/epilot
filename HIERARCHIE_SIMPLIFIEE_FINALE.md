# ✅ HIÉRARCHIE E-PILOT - VERSION SIMPLIFIÉE

## 🎯 Principe Fondamental

**IL N'Y A QU'UN SEUL TYPE D'ADMIN : `admin_groupe`**

L'Admin de Groupe **fait TOUT** :
- ✅ Crée les écoles
- ✅ Crée les utilisateurs
- ✅ Gère les modules
- ✅ Gère les catégories
- ✅ Gère les abonnements
- ✅ **C'est le SEUL et UNIQUE admin**

---

## 🧬 Structure (2 Niveaux)

### Niveau 1 : Admin de Groupe ⭐

**Rôle** : `admin_groupe`

**Fait TOUT** :
- Gère plusieurs écoles
- Crée et configure les écoles
- Crée tous les utilisateurs (proviseur, enseignant, etc.)
- Active/désactive les modules
- Assigne les catégories métiers
- Gère les abonnements
- Voit toutes les statistiques

**Accès** :
- ✅ Dashboard Admin (`/dashboard`) - Pour gérer
- ✅ Espace Utilisateur (`/user`) - Pour utiliser

**Exemple** :
```
Admin de Groupe "LE LIANO"
  ↓
Crée 3 écoles :
  - Lycée Technique
  - Collège Central
  - École Primaire
  ↓
Crée les utilisateurs :
  - Proviseur Lycée (Ramsès)
  - Enseignants (Marie, Jean)
  - CPE (Anais)
  - Comptable (Paul)
```

---

### Niveau 2 : Utilisateurs École

**15 rôles** :
- Direction : `proviseur`, `directeur`, `directeur_etudes`
- Administratif : `secretaire`, `comptable`
- Pédagogique : `enseignant`, `cpe`, `surveillant`
- Support : `bibliothecaire`, `conseiller_orientation`, `infirmier`, `gestionnaire_cantine`
- Finaux : `eleve`, `parent`
- Autre : `autre`

**Utilisent les modules** :
- Notes, absences, emploi du temps, etc.
- Selon leur rôle

**Accès** :
- ✅ Espace Utilisateur (`/user`) UNIQUEMENT
- ❌ PAS d'accès `/dashboard`

---

## 📊 Matrice Simple

| Qui | Dashboard | User | Fait Quoi |
|-----|-----------|------|-----------|
| **admin_groupe** | ✅ | ✅ | Gère TOUT |
| **Tous les autres** | ❌ | ✅ | Utilisent modules |

---

## 🔄 Flux Complet

```
Admin de Groupe
  ↓
Crée École "Lycée Technique"
  ↓
Crée Proviseur (Ramsès)
  ↓
Crée Enseignants (Marie, Jean)
  ↓
Active Modules (Notes, Absences)
  ↓
Utilisateurs utilisent les modules
```

---

## ⚠️ Erreur : `school_admin`

**Si tu vois** : "Votre rôle: school_admin"

**C'est une erreur** : Ce rôle n'existe pas !

**Solution** :
```sql
UPDATE users
SET role = 'admin_groupe'::user_role
WHERE role = 'school_admin';
```

---

## 🎯 Règles de Redirection

### Admin de Groupe
```
Se connecte → Va sur /dashboard
Peut aussi aller sur /user
```

### Utilisateurs École
```
Se connectent → Vont sur /user
Ne peuvent PAS aller sur /dashboard
```

---

## 📝 Rôles Disponibles (16 total)

```sql
-- 1 Admin
'admin_groupe'

-- 15 Utilisateurs
'proviseur'
'directeur'
'directeur_etudes'
'secretaire'
'comptable'
'enseignant'
'cpe'
'surveillant'
'bibliothecaire'
'gestionnaire_cantine'
'conseiller_orientation'
'infirmier'
'eleve'
'parent'
'autre'
```

---

## ⚠️ Rôles qui N'EXISTENT PAS

- ❌ `super_admin` (pas dans E-Pilot Congo)
- ❌ `school_admin` (n'a jamais existé)
- ❌ `admin` (utiliser `admin_groupe`)
- ❌ `administrator` (utiliser `admin_groupe`)

---

## 🎉 Résumé

**1 Admin** : `admin_groupe` (fait TOUT)  
**15 Utilisateurs** : Utilisent les modules

**Simple et Efficace !** 🚀🇨🇬

---

**Date** : 4 Novembre 2025  
**Version** : 2.0.0 SIMPLIFIÉE  
**Statut** : ✅ HIÉRARCHIE FINALE VALIDÉE
