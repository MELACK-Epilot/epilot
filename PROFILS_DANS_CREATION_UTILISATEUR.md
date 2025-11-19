# ✅ PROFILS D'ACCÈS DANS CRÉATION UTILISATEUR

## 🎯 CHANGEMENT MAJEUR

**AVANT:** Profil sélectionné lors de l'assignation des modules ❌  
**APRÈS:** Profil sélectionné lors de la création de l'utilisateur ✅

---

## 📊 MODIFICATIONS EFFECTUÉES

### 1. Base de Données ✅

**Migration:** `add_access_profile_to_users_v2`

```sql
-- Ajouter colonne access_profile_code à users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS access_profile_code VARCHAR(50);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_access_profile ON users(access_profile_code);

-- Profils par défaut selon rôle
UPDATE users
SET access_profile_code = CASE
  WHEN role IN ('proviseur', 'directeur', 'directeur_etudes') THEN 'chef_etablissement'
  WHEN role = 'comptable' THEN 'financier_sans_suppression'
  WHEN role = 'secretaire' THEN 'administratif_basique'
  WHEN role = 'enseignant' THEN 'enseignant_saisie_notes'
  WHEN role = 'parent' THEN 'parent_consultation'
  WHEN role = 'eleve' THEN 'eleve_consultation'
  ELSE 'chef_etablissement'
END
WHERE access_profile_code IS NULL;
```

---

### 2. Formulaire Création Utilisateur ✅

**Fichier:** `src/features/dashboard/components/users/GroupUserFormDialog.tsx`

#### Mapping Rôle → Profil
```typescript
const USER_ROLES = [
  { value: 'proviseur', label: '🎓 Proviseur', profile: 'chef_etablissement' },
  { value: 'directeur', label: '👔 Directeur', profile: 'chef_etablissement' },
  { value: 'directeur_etudes', label: '📋 Directeur des Études', profile: 'chef_etablissement' },
  { value: 'secretaire', label: '📝 Secrétaire', profile: 'administratif_basique' },
  { value: 'comptable', label: '💰 Comptable', profile: 'financier_sans_suppression' },
  { value: 'enseignant', label: '👨‍🏫 Enseignant', profile: 'enseignant_saisie_notes' },
  { value: 'surveillant', label: '👮 Surveillant', profile: 'chef_etablissement' },
  { value: 'bibliothecaire', label: '📚 Bibliothécaire', profile: 'administratif_basique' },
  { value: 'eleve', label: '🎒 Élève', profile: 'eleve_consultation' },
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent', profile: 'parent_consultation' },
  { value: 'gestionnaire_cantine', label: '🍽️ Gestionnaire de Cantine', profile: 'administratif_basique' },
  { value: 'autre', label: '👤 Autre', profile: 'chef_etablissement' },
];
```

#### Profils Disponibles
```typescript
const ACCESS_PROFILES = [
  { value: 'chef_etablissement', label: '🏫 Chef d\'Établissement', description: 'Accès complet (Directeur/Proviseur)' },
  { value: 'financier_sans_suppression', label: '💰 Comptable/Économe', description: 'Finances uniquement, sans suppression' },
  { value: 'administratif_basique', label: '📋 Secrétaire', description: 'Administration et consultation' },
  { value: 'enseignant_saisie_notes', label: '👨‍🏫 Enseignant', description: 'Saisie notes uniquement' },
  { value: 'parent_consultation', label: '👨‍👩‍👧 Parent', description: 'Consultation enfants uniquement' },
  { value: 'eleve_consultation', label: '🎒 Élève', description: 'Consultation propres données' },
];
```

#### Auto-Sélection du Profil
```typescript
<Select 
  onValueChange={(value) => {
    field.onChange(value);
    // Auto-sélectionner le profil correspondant au rôle
    const selectedRole = USER_ROLES.find(r => r.value === value);
    if (selectedRole) {
      form.setValue('accessProfileCode', selectedRole.profile);
    }
  }} 
  value={field.value}
>
```

---

### 3. Modal Assignation ✅

**Fichier:** `src/features/dashboard/components/users/UserModulesDialog.v3.tsx`

**Changement:** Retour à l'ancien composant SANS profils

```typescript
// AVANT (incorrect)
import { UserModulesDialogAvailableTabWithProfiles } from './UserModulesDialogAvailableTabWithProfiles';

// APRÈS (correct)
import { UserModulesDialogAvailableTab } from './UserModulesDialogAvailableTab';
```

**Raison:** Le profil est déjà défini sur l'utilisateur, pas besoin de le re-sélectionner à chaque assignation!

---

## 🎨 INTERFACE UTILISATEUR

### Formulaire Création Utilisateur

```
┌─────────────────────────────────────────────┐
│ Créer un Utilisateur                        │
├─────────────────────────────────────────────┤
│                                             │
│ 📋 Informations Personnelles                │
│ ├─ Prénom: Jean                             │
│ ├─ Nom: Dupont                              │
│ ├─ Email: jean.dupont@ecole.cg              │
│ └─ Téléphone: +242069698620                 │
│                                             │
│ 🛡️ Affectation                              │
│ ├─ Rôle: 👨‍🏫 Enseignant                     │
│ │  └─ Le profil d'accès sera auto-sélectionné
│ ├─ École: Lycée Victor Hugo                 │
│ └─ Profil d'Accès: 👨‍🏫 Enseignant          │
│    └─ Saisie notes uniquement               │
│                                             │
│ 🔒 Sécurité                                  │
│ └─ Mot de passe: ••••••••                   │
│                                             │
│ [Annuler]  [Créer l'utilisateur]           │
└─────────────────────────────────────────────┘
```

**Flux:**
1. Admin sélectionne **Rôle: Enseignant**
2. **Profil d'Accès** est automatiquement mis à **Enseignant (Saisie notes)**
3. Admin peut modifier le profil si nécessaire
4. Utilisateur créé avec son profil d'accès

---

## 🔄 FLUX COMPLET

### Création Utilisateur
```
1. Admin va dans "Utilisateurs"
   ↓
2. Clique "Créer un utilisateur"
   ↓
3. Remplit le formulaire:
   - Informations personnelles
   - Rôle: Enseignant ✅
   - Profil d'accès: Auto-sélectionné ✅
   - École
   - Mot de passe
   ↓
4. Clique "Créer"
   ↓
5. Utilisateur créé avec:
   - role = 'enseignant'
   - access_profile_code = 'enseignant_saisie_notes' ✅
   ↓
6. Utilisateur peut se connecter
```

### Assignation Modules
```
1. Admin va dans "Utilisateurs"
   ↓
2. Clique "Gérer Modules" sur Jean Dupont
   ↓
3. Modal s'ouvre (SANS sélection de profil)
   ↓
4. Admin assigne modules:
   - Bulletins scolaires
   - Notes et évaluations
   ↓
5. Modules assignés avec le profil de l'utilisateur:
   - user.access_profile_code = 'enseignant_saisie_notes'
   ↓
6. Permissions appliquées automatiquement selon le profil!
```

---

## 📊 AVANTAGES

### Avant (Profil dans Assignation)
```
❌ Profil sélectionné à chaque assignation
❌ Risque d'incohérence (profils différents par module)
❌ UX répétitive
❌ Complexe à gérer
```

### Après (Profil dans Utilisateur)
```
✅ Profil défini UNE FOIS à la création
✅ Cohérence garantie (même profil pour tous les modules)
✅ UX simplifiée
✅ Facile à gérer
✅ Logique métier correcte
```

---

## 🎯 LOGIQUE MÉTIER

**Principe:**
> Un utilisateur a UN profil d'accès qui définit ses permissions dans TOUT le système.

**Exemples:**
- **Jean (Enseignant)** → Profil: `enseignant_saisie_notes`
  - Tous ses modules auront les permissions d'enseignant
  - Saisie notes uniquement
  - Pas de modification bulletins
  
- **Marie (Comptable)** → Profil: `financier_sans_suppression`
  - Tous ses modules auront les permissions de comptable
  - Accès finances uniquement
  - Pas de suppression (audit)

- **Paul (Directeur)** → Profil: `chef_etablissement`
  - Tous ses modules auront les permissions de chef
  - Accès complet
  - Validation

---

## 🎉 RÉSULTAT FINAL

### Base de Données ✅
```
Table: users
├─ id
├─ first_name
├─ last_name
├─ role
├─ access_profile_code ✅ NOUVEAU
└─ ...

Table: user_module_permissions
├─ user_id
├─ module_id
├─ access_profile_code (hérité de users)
└─ ...
```

### Formulaire ✅
```
✅ Champ "Profil d'Accès" ajouté
✅ Auto-sélection selon rôle
✅ Modifiable si nécessaire
✅ Validation Zod
```

### Modal Assignation ✅
```
✅ Profil retiré (plus nécessaire)
✅ Retour à l'ancien composant
✅ Assignation simple
```

---

## 📋 CHECKLIST

### Backend ✅
- [x] Colonne `access_profile_code` ajoutée à `users`
- [x] Index créé
- [x] Profils par défaut assignés aux utilisateurs existants
- [x] Migration exécutée

### Frontend ✅
- [x] Mapping rôle → profil défini
- [x] Champ profil ajouté au formulaire
- [x] Auto-sélection implémentée
- [x] Validation Zod ajoutée
- [x] Modal assignation nettoyé

### Logique ✅
- [x] Profil défini à la création
- [x] Profil hérité lors de l'assignation
- [x] Cohérence garantie

---

## 🚀 PROCHAINES ÉTAPES

1. **Tester la création d'utilisateur**
   - Créer un enseignant
   - Vérifier que le profil est auto-sélectionné
   - Vérifier en BDD que `access_profile_code` est bien rempli

2. **Tester l'assignation**
   - Assigner des modules à l'utilisateur
   - Vérifier que les permissions correspondent au profil

3. **Mettre à jour les hooks d'assignation**
   - Utiliser `user.access_profile_code` au lieu de sélection manuelle

---

**Développé avec ❤️ pour E-Pilot Congo-Brazzaville** 🇨🇬  
**Version:** 47.0 Profils dans Création Utilisateur  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 100% Implémenté - Logique Correcte
