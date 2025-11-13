# ✅ HIÉRARCHIE E-PILOT - VERSION CORRECTE FINALE

## 🎯 Structure à 3 Niveaux

### 1️⃣ Super Admin Système (Niveau Plateforme)

**Rôle** : `super_admin`

**Responsabilités** :
- ✅ Définit les plans d'abonnement (Gratuit, Premium, Pro, Institutionnel)
- ✅ Crée les catégories métiers globales
- ✅ Crée les modules pédagogiques globaux
- ✅ Gère tous les groupes scolaires
- ✅ Vue globale de la plateforme

**Accès** :
- ✅ Dashboard Admin (`/dashboard`)
- ✅ Plans d'abonnement
- ✅ Catégories métiers
- ✅ Modules globaux
- ✅ Tous les groupes scolaires

**Scope** : Plateforme complète (multi-groupes)

---

### 2️⃣ Admin de Groupe Scolaire

**Rôle** : `admin_groupe`

**Responsabilités** :
- ✅ Gère plusieurs écoles de son groupe
- ✅ Crée et configure les écoles
- ✅ Crée tous les utilisateurs des écoles (proviseur, enseignant, etc.)
- ✅ Active/désactive les modules pour ses écoles
- ✅ Assigne les catégories métiers aux écoles
- ✅ Choisit l'abonnement de son groupe (défini par super_admin)
- ✅ Statistiques de son groupe

**Accès** :
- ✅ Dashboard Admin (`/dashboard`)
- ✅ Ses écoles uniquement
- ✅ Ses utilisateurs uniquement
- ✅ Modules (choix parmi le catalogue)
- ✅ Espace Utilisateur (`/user`) - Pour utiliser les modules

**Scope** : Son groupe scolaire (multi-écoles)

**Exemple** :
```
Admin de Groupe "LE LIANO"
  ↓
Choisit abonnement Premium (défini par super_admin)
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
  ↓
Active modules pour ses écoles
```

---

### 3️⃣ Utilisateurs École

**15 rôles** :

**Direction** (3) :
- `proviseur` - Lycée
- `directeur` - Collège/Primaire
- `directeur_etudes` - Directeur des Études

**Administratif** (2) :
- `secretaire` - Secrétariat
- `comptable` - Comptabilité

**Pédagogique** (3) :
- `enseignant` - Enseignant
- `cpe` - Conseiller Principal d'Éducation
- `surveillant` - Surveillant

**Support** (4) :
- `bibliothecaire` - Bibliothécaire
- `gestionnaire_cantine` - Gestionnaire Cantine
- `conseiller_orientation` - Conseiller d'Orientation
- `infirmier` - Infirmier

**Finaux** (2) :
- `eleve` - Élève
- `parent` - Parent

**Autre** (1) :
- `autre` - Autre

**Responsabilités** :
- Utilisent les modules assignés
- Gèrent leur domaine (notes, absences, etc.)
- Consultent emploi du temps
- Gèrent leur profil

**Accès** :
- ✅ Espace Utilisateur (`/user`) UNIQUEMENT
- ❌ PAS d'accès `/dashboard`

**Scope** : Local (une école)

---

## 📊 Matrice des Permissions

| Rôle | Plans | Catégories | Groupes | Écoles | Utilisateurs | Modules | `/user` |
|------|-------|------------|---------|--------|--------------|---------|---------|
| **super_admin** | ✅ Créer | ✅ Créer | ✅ Tous | ✅ Toutes | ✅ Tous | ✅ Créer | ❌ |
| **admin_groupe** | ❌ | ❌ | ✅ Le sien | ✅ Les siennes | ✅ Les siens | ✅ Activer | ✅ |
| **Utilisateurs** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Utiliser | ✅ |

---

## 🔄 Flux Complet

### Étape 1 : Super Admin
```
Super Admin
  ↓
Crée Plans d'abonnement :
  - Gratuit (0 FCFA)
  - Premium (25k FCFA)
  - Pro (50k FCFA)
  - Institutionnel (150k FCFA)
  ↓
Crée Catégories Métiers :
  - Pédagogie
  - Administration
  - Finances
  ↓
Crée Modules :
  - Gestion Notes
  - Gestion Absences
  - Emploi du Temps
  ↓
Crée Groupe Scolaire "LE LIANO"
  ↓
Assigne Admin de Groupe
```

### Étape 2 : Admin de Groupe
```
Admin de Groupe "LE LIANO"
  ↓
Choisit abonnement Premium
  ↓
Crée École "Lycée Technique"
  ↓
Crée Utilisateurs :
  - Proviseur (Ramsès)
  - Enseignants (Marie, Jean)
  - CPE (Anais)
  ↓
Active Modules :
  - Gestion Notes
  - Gestion Absences
```

### Étape 3 : Utilisateurs
```
Proviseur (Ramsès)
  ↓
Utilise modules :
  - Gestion Notes
  - Emploi du Temps
  - Rapports
```

---

## 🎯 Séparation des Responsabilités

### Super Admin
- **Définit** les abonnements
- **Crée** les catégories
- **Crée** les modules
- **Niveau** : Plateforme

### Admin de Groupe
- **Choisit** l'abonnement (parmi ceux définis)
- **Active** les catégories (parmi celles créées)
- **Active** les modules (parmi ceux créés)
- **Crée** les écoles
- **Crée** les utilisateurs
- **Niveau** : Groupe

### Utilisateurs
- **Utilisent** les modules
- **Niveau** : École

---

## ⚠️ Important

**Super Admin** :
- NE crée PAS les écoles directement
- NE crée PAS les utilisateurs directement
- Définit le CATALOGUE (plans, catégories, modules)

**Admin de Groupe** :
- NE définit PAS les abonnements
- NE crée PAS les catégories globales
- NE crée PAS les modules globaux
- CHOISIT dans le catalogue
- CRÉE les écoles et utilisateurs

---

## 📝 Rôles Disponibles (17 total)

```sql
-- 2 Admin
'super_admin'      -- Niveau Plateforme
'admin_groupe'     -- Niveau Groupe

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

## 🎉 Résumé

**Super Admin** : Définit le catalogue (plans, catégories, modules)  
**Admin de Groupe** : Choisit dans le catalogue + Crée écoles/utilisateurs  
**Utilisateurs** : Utilisent les modules

**Hiérarchie Claire et Logique !** 🚀🇨🇬

---

**Date** : 4 Novembre 2025  
**Version** : 3.0.0 CORRECTE  
**Statut** : ✅ HIÉRARCHIE FINALE VALIDÉE
