# ✅ HIÉRARCHIE DÉFINITIVE E-PILOT CONGO

## 🎯 Structure à 3 Niveaux (VALIDÉE)

```
┌─────────────────────────────────────────────────────────────┐
│1️⃣ SUPER ADMIN E-PILOT (Plateforme)                         │
│    • Crée les Groupes Scolaires                             │
│    • Crée les Catégories Métiers (8 catégories)            │
│    • Crée les Modules Pédagogiques (50 modules)            │
│    • Définit les Plans d'abonnement (Gratuit→Institutionnel)│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ ADMIN DE GROUPE SCOLAIRE (Réseau d'écoles)              │
│    • Voit les modules/catégories selon son PLAN            │
│    • Crée les Écoles de son groupe                          │
│    • Crée les Utilisateurs (enseignants, CPE, comptables)  │
│    • Affecte les utilisateurs aux écoles                    │
│    • Assigne les RÔLES aux utilisateurs                     │
│    • Assigne les MODULES/CATÉGORIES selon le rôle          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ UTILISATEURS (Personnel des écoles)                      │
│    • Enseignant, CPE, Comptable, Surveillant, etc.         │
│    • Accèdent uniquement aux modules qui leur sont assignés │
│    • Travaillent dans UNE école spécifique                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ SUPER ADMIN E-PILOT (Plateforme)

### Rôle
`super_admin`

### Responsabilités

#### Crée les Groupes Scolaires
- Exemple : "LE LIANO", "GROUPE EXCELLENCE", etc.
- Assigne un Admin de Groupe à chaque groupe

#### Crée les Catégories Métiers (8 catégories)
1. Pédagogie
2. Administration
3. Finances
4. Vie Scolaire
5. Ressources Humaines
6. Communication
7. Orientation
8. Santé

#### Crée les Modules Pédagogiques (50 modules)
- Gestion des Notes
- Gestion des Absences
- Emploi du Temps
- Inscriptions
- Paiements
- Bibliothèque
- Cantine
- etc. (50 modules au total)

#### Définit les Plans d'Abonnement
- **Gratuit** : 0 FCFA (1 école, 50 élèves, 5 personnel)
- **Premium** : 25k FCFA (3 écoles, 200 élèves, 20 personnel)
- **Pro** : 50k FCFA (10 écoles, 1000 élèves, 100 personnel)
- **Institutionnel** : 150k FCFA (Illimité)

### Accès
- ✅ `/dashboard/plans` - CRUD Plans
- ✅ `/dashboard/categories` - CRUD Catégories
- ✅ `/dashboard/modules` - CRUD Modules
- ✅ `/dashboard/school-groups` - CRUD Groupes
- ❌ `/user` - Pas d'accès

### Scope
**Plateforme complète** (tous les groupes)

---

## 2️⃣ ADMIN DE GROUPE SCOLAIRE (Réseau d'écoles)

### Rôle
`admin_groupe`

### Responsabilités

#### Voit les modules/catégories selon son PLAN
- Si Plan Gratuit → Modules limités
- Si Plan Premium → Plus de modules
- Si Plan Pro → Encore plus
- Si Plan Institutionnel → Tous les modules

#### Crée les Écoles de son groupe
- Exemple : "Lycée Technique", "Collège Central", "École Primaire"
- Limite selon le plan (1, 3, 10, ou illimité)

#### Crée les Utilisateurs
- Proviseur
- Directeur
- Enseignants
- CPE
- Comptable
- Secrétaire
- Surveillant
- etc.

#### Affecte les utilisateurs aux écoles
- Marie (Enseignante) → Lycée Technique
- Jean (CPE) → Collège Central
- Paul (Comptable) → École Primaire

#### Assigne les RÔLES aux utilisateurs
- Ramsès → `proviseur`
- Marie → `enseignant`
- Jean → `cpe`
- Paul → `comptable`

#### Assigne les MODULES/CATÉGORIES selon le rôle
- **Proviseur** → Tous les modules
- **Enseignant** → Gestion Notes, Absences, Emploi du Temps
- **CPE** → Gestion Absences, Discipline, Vie Scolaire
- **Comptable** → Gestion Paiements, Finances

### Accès
- ✅ `/dashboard/school-groups` - Son groupe uniquement
- ✅ `/dashboard/schools` - Ses écoles
- ✅ `/dashboard/users` - Ses utilisateurs
- ✅ `/dashboard/my-modules` - Modules disponibles selon plan
- ✅ `/user` - Utilisation des modules
- ❌ `/dashboard/plans` - Pas d'accès
- ❌ `/dashboard/categories` - Pas d'accès (lecture seule)

### Scope
**Son groupe scolaire uniquement** (multi-écoles)

---

## 3️⃣ UTILISATEURS (Personnel des écoles)

### Rôles (15)

#### Direction (3)
- `proviseur` - Lycée
- `directeur` - Collège/Primaire
- `directeur_etudes` - Directeur des Études

#### Administratif (2)
- `secretaire` - Secrétariat
- `comptable` - Comptabilité

#### Pédagogique (3)
- `enseignant` - Enseignant
- `cpe` - Conseiller Principal d'Éducation
- `surveillant` - Surveillant

#### Support (4)
- `bibliothecaire` - Bibliothécaire
- `gestionnaire_cantine` - Gestionnaire Cantine
- `conseiller_orientation` - Conseiller d'Orientation
- `infirmier` - Infirmier

#### Finaux (2)
- `eleve` - Élève
- `parent` - Parent

#### Autre (1)
- `autre` - Autre

### Responsabilités

#### Accèdent uniquement aux modules assignés
- Enseignant → Gestion Notes, Absences
- CPE → Gestion Absences, Discipline
- Comptable → Gestion Paiements

#### Travaillent dans UNE école spécifique
- Marie (Enseignante) → Lycée Technique uniquement
- Jean (CPE) → Collège Central uniquement

### Accès
- ✅ `/user` - Espace utilisateur
- ✅ Modules assignés par l'Admin de Groupe
- ❌ `/dashboard` - Pas d'accès

### Scope
**Leur école uniquement** (local)

---

## 🔄 Flux Complet (Exemple Réel)

### Étape 1 : Super Admin
```
Super Admin E-Pilot
  ↓
Crée 8 Catégories Métiers
  ↓
Crée 50 Modules Pédagogiques
  ↓
Définit 4 Plans d'abonnement
  ↓
Crée Groupe Scolaire "LE LIANO"
  ↓
Assigne Admin de Groupe (Anais)
  ↓
Groupe "LE LIANO" a Plan Premium (3 écoles, 20 modules)
```

### Étape 2 : Admin de Groupe (Anais)
```
Admin de Groupe "LE LIANO" (Anais)
  ↓
Voit 20 modules (selon Plan Premium)
  ↓
Crée 3 Écoles :
  - Lycée Technique
  - Collège Central
  - École Primaire
  ↓
Crée Utilisateurs :
  - Ramsès (Proviseur) → Lycée Technique
  - Marie (Enseignante) → Lycée Technique
  - Jean (CPE) → Collège Central
  - Paul (Comptable) → École Primaire
  ↓
Assigne Modules selon rôle :
  - Ramsès → Tous les 20 modules
  - Marie → Gestion Notes, Absences (2 modules)
  - Jean → Gestion Absences, Discipline (2 modules)
  - Paul → Gestion Paiements (1 module)
```

### Étape 3 : Utilisateurs
```
Ramsès (Proviseur, Lycée Technique)
  ↓
Accède à /user
  ↓
Voit 20 modules assignés
  ↓
Utilise : Gestion Notes, Absences, Emploi du Temps, etc.

Marie (Enseignante, Lycée Technique)
  ↓
Accède à /user
  ↓
Voit 2 modules assignés
  ↓
Utilise : Gestion Notes, Absences

Jean (CPE, Collège Central)
  ↓
Accède à /user
  ↓
Voit 2 modules assignés
  ↓
Utilise : Gestion Absences, Discipline
```

---

## 📊 Matrice des Permissions

| Action | super_admin | admin_groupe | Utilisateurs |
|--------|-------------|--------------|--------------|
| **Créer Plans** | ✅ | ❌ | ❌ |
| **Créer Catégories** | ✅ | ❌ | ❌ |
| **Créer Modules** | ✅ | ❌ | ❌ |
| **Créer Groupes** | ✅ | ❌ | ❌ |
| **Voir Modules selon Plan** | ✅ Tous | ✅ Selon plan | ❌ |
| **Créer Écoles** | ❌ | ✅ | ❌ |
| **Créer Utilisateurs** | ❌ | ✅ | ❌ |
| **Assigner Rôles** | ❌ | ✅ | ❌ |
| **Assigner Modules** | ❌ | ✅ | ❌ |
| **Utiliser Modules** | ❌ | ✅ | ✅ |

---

## 🎯 Points Clés

### Super Admin
- **CRÉE** : Plans, Catégories, Modules, Groupes
- **NE crée PAS** : Écoles, Utilisateurs
- **Scope** : Plateforme

### Admin de Groupe
- **VOIT** : Modules selon son plan
- **CRÉE** : Écoles, Utilisateurs
- **ASSIGNE** : Rôles, Modules
- **Scope** : Son groupe

### Utilisateurs
- **VOIENT** : Modules assignés
- **UTILISENT** : Modules
- **Scope** : Leur école

---

## 🎉 Résumé

**3 Niveaux** :
1. Super Admin → Définit le catalogue
2. Admin de Groupe → Choisit + Crée + Assigne
3. Utilisateurs → Utilisent

**Hiérarchie claire, logique et complète !** 🚀🇨🇬

---

**Date** : 4 Novembre 2025  
**Version** : 4.0.0 DÉFINITIVE  
**Statut** : ✅ VALIDÉE ET IMPLÉMENTÉE
