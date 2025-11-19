# 🎯 HIÉRARCHIE DES RÔLES - CLARIFICATION IMPORTANTE

## ⚠️ ATTENTION: DISTINCTION CRITIQUE

### 🔴 CE QUI ÉTAIT FAUX
```
❌ Profils d'accès pour TOUS les utilisateurs (y compris admins)
❌ Super Admin et Admin Groupe avec profils d'accès
❌ Confusion entre niveaux hiérarchiques
```

### ✅ CE QUI EST CORRECT MAINTENANT
```
✅ Profils d'accès UNIQUEMENT pour utilisateurs d'école
✅ Super Admin et Admin Groupe N'ONT PAS de profils
✅ Hiérarchie claire et distincte
```

---

## 🏗️ HIÉRARCHIE COMPLÈTE E-PILOT

### Niveau 1: Super Admin E-Pilot 🔴
**Rôle:** `super_admin`  
**Qui:** Équipe E-Pilot (plateforme)  
**Profil d'accès:** ❌ AUCUN (pas besoin)  
**Responsabilités:**
- Crée les Groupes Scolaires
- Crée les Catégories Métiers
- Crée les Modules Pédagogiques
- Définit les Plans d'abonnement
- Gère la plateforme globale

**Exemple:** Équipe technique E-Pilot

---

### Niveau 2: Admin de Groupe Scolaire 🟠
**Rôle:** `admin_groupe`  
**Qui:** Vianney MELACK (Admin du groupe LAMARELLE)  
**Profil d'accès:** ❌ AUCUN (pas besoin)  
**Responsabilités:**
- Voit les modules selon son PLAN d'abonnement
- Crée les Écoles de son groupe
- Crée les Utilisateurs d'école
- Affecte les utilisateurs aux écoles
- Assigne les RÔLES aux utilisateurs
- Assigne les MODULES/CATÉGORIES

**Exemple:** Vianney (Admin du groupe LAMARELLE avec 1 école)

---

### Niveau 3: Utilisateurs d'École 🟢
**Rôles:** `proviseur`, `directeur`, `comptable`, `enseignant`, `parent`, `eleve`, etc.  
**Qui:** Personnel et usagers des écoles  
**Profil d'accès:** ✅ OUI (obligatoire)  
**Responsabilités:**
- Accèdent uniquement aux modules assignés
- Travaillent dans UNE école spécifique
- Permissions définies par leur profil d'accès

**Exemples:**
- Jean Dupont (Enseignant) → Profil: `enseignant_saisie_notes`
- Marie Martin (Comptable) → Profil: `financier_sans_suppression`
- Paul Directeur (Proviseur) → Profil: `chef_etablissement`

---

## 📊 TABLEAU RÉCAPITULATIF

| Niveau | Rôle | Exemple | Profil d'Accès | Gère |
|--------|------|---------|----------------|------|
| 1️⃣ Super Admin | `super_admin` | Équipe E-Pilot | ❌ Non | Plateforme globale |
| 2️⃣ Admin Groupe | `admin_groupe` | Vianney MELACK | ❌ Non | Son réseau d'écoles |
| 3️⃣ Utilisateurs École | `enseignant`, `comptable`, etc. | Jean, Marie, Paul | ✅ Oui | Leur école |

---

## 🎯 PROFILS D'ACCÈS (Niveau 3 uniquement)

### 6 Profils pour Utilisateurs d'École

#### 1. Chef d'Établissement 🏫
**Code:** `chef_etablissement`  
**Pour:** Proviseur, Directeur, Directeur des Études  
**Permissions:** Accès complet à l'école

#### 2. Comptable/Économe 💰
**Code:** `financier_sans_suppression`  
**Pour:** Comptable  
**Permissions:** Finances uniquement, sans suppression (audit)

#### 3. Secrétaire 📋
**Code:** `administratif_basique`  
**Pour:** Secrétaire, Bibliothécaire  
**Permissions:** Administration et consultation

#### 4. Enseignant 👨‍🏫
**Code:** `enseignant_saisie_notes`  
**Pour:** Enseignant  
**Permissions:** Saisie notes uniquement

#### 5. Parent 👨‍👩‍👧
**Code:** `parent_consultation`  
**Pour:** Parent  
**Permissions:** Consultation enfants uniquement

#### 6. Élève 🎒
**Code:** `eleve_consultation`  
**Pour:** Élève  
**Permissions:** Consultation propres données

---

## 🔄 FLUX CORRECTS

### Création Utilisateur École (par Admin Groupe)

```
1. Vianney (Admin Groupe) se connecte
   ↓
2. Va dans "Utilisateurs"
   ↓
3. Clique "Créer un utilisateur"
   ↓
4. Remplit le formulaire:
   - Prénom: Jean
   - Nom: Dupont
   - Rôle: Enseignant ✅
   - École: Lycée LAMARELLE
   - Profil d'Accès: Enseignant (auto-sélectionné) ✅
   ↓
5. Jean créé avec:
   - role = 'enseignant'
   - access_profile_code = 'enseignant_saisie_notes' ✅
   - school_id = uuid-lycee-lamarelle
```

### Assignation Modules (par Admin Groupe)

```
1. Vianney clique "Gérer Modules" sur Jean
   ↓
2. Modal s'ouvre (SANS sélection de profil)
   ↓
3. Vianney assigne:
   - Bulletins scolaires
   - Notes et évaluations
   ↓
4. Modules assignés avec le profil de Jean:
   - user.access_profile_code = 'enseignant_saisie_notes'
   ↓
5. Permissions automatiques selon profil!
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES

### Table: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  role user_role NOT NULL,
  
  -- Profil d'accès UNIQUEMENT pour utilisateurs d'école
  access_profile_code VARCHAR(50),
  
  school_id UUID REFERENCES schools(id),
  school_group_id UUID REFERENCES school_groups(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemples de données
INSERT INTO users VALUES
  -- Super Admin (pas de profil)
  ('uuid-1', 'Admin', 'E-Pilot', 'admin@e-pilot.cg', 'super_admin', NULL, NULL, NULL),
  
  -- Admin Groupe (pas de profil)
  ('uuid-2', 'Vianney', 'MELACK', 'vianney@lamarelle.cg', 'admin_groupe', NULL, NULL, 'uuid-groupe-lamarelle'),
  
  -- Utilisateurs École (avec profil)
  ('uuid-3', 'Jean', 'Dupont', 'jean@lamarelle.cg', 'enseignant', 'enseignant_saisie_notes', 'uuid-lycee', 'uuid-groupe-lamarelle'),
  ('uuid-4', 'Marie', 'Martin', 'marie@lamarelle.cg', 'comptable', 'financier_sans_suppression', 'uuid-lycee', 'uuid-groupe-lamarelle');
```

---

## 🎨 INTERFACE UTILISATEUR

### Formulaire Création (Admin Groupe)

#### Cas 1: Créer un Utilisateur École
```
┌─────────────────────────────────────────────┐
│ Créer un Utilisateur                        │
├─────────────────────────────────────────────┤
│ Rôle: 👨‍🏫 Enseignant                        │
│                                             │
│ École: Lycée LAMARELLE                      │
│                                             │
│ Profil d'Accès: 👨‍🏫 Enseignant            │ ✅ AFFICHÉ
│ └─ Saisie notes uniquement                  │
│                                             │
│ [Créer]                                     │
└─────────────────────────────────────────────┘
```

#### Cas 2: Créer un Admin (hypothétique)
```
┌─────────────────────────────────────────────┐
│ Créer un Utilisateur                        │
├─────────────────────────────────────────────┤
│ Rôle: 👔 Admin Groupe                       │
│                                             │
│ (Profil d'Accès: caché)                     │ ❌ PAS AFFICHÉ
│                                             │
│ [Créer]                                     │
└─────────────────────────────────────────────┘
```

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Migration Base de Données ✅
```sql
-- Retirer profils des admins
UPDATE users
SET access_profile_code = NULL
WHERE role IN ('super_admin', 'admin_groupe');

-- Profils uniquement pour utilisateurs école
UPDATE users
SET access_profile_code = CASE
  WHEN role = 'enseignant' THEN 'enseignant_saisie_notes'
  WHEN role = 'comptable' THEN 'financier_sans_suppression'
  -- ... autres rôles école
END
WHERE role NOT IN ('super_admin', 'admin_groupe');
```

### 2. Formulaire Création ✅
```typescript
// Afficher profil UNIQUEMENT si pas admin
{form.watch('role') && !['super_admin', 'admin_groupe'].includes(form.watch('role')) && (
  <FormField name="accessProfileCode">
    {/* Champ Profil d'Accès */}
  </FormField>
)}
```

### 3. Validation Zod ✅
```typescript
accessProfileCode: z.enum([...]).optional().or(z.literal(''))
// Optionnel pour permettre NULL pour les admins
```

---

## 🎯 RÈGLES MÉTIER FINALES

### ✅ CE QUI EST CORRECT

1. **Super Admin E-Pilot**
   - ❌ Pas de profil d'accès
   - ✅ Gère la plateforme globale
   - ✅ Crée groupes, plans, modules

2. **Admin de Groupe (Vianney)**
   - ❌ Pas de profil d'accès
   - ✅ Gère son réseau d'écoles
   - ✅ Crée utilisateurs d'école
   - ✅ Assigne modules selon plan

3. **Utilisateurs d'École**
   - ✅ Profil d'accès obligatoire
   - ✅ Permissions définies par profil
   - ✅ Accès limité à leur école

### ❌ CE QUI EST INTERDIT

1. ❌ Profil d'accès pour Super Admin
2. ❌ Profil d'accès pour Admin Groupe
3. ❌ Utilisateur école sans profil
4. ❌ Confusion entre niveaux

---

## 🎉 RÉSULTAT FINAL

### Hiérarchie Claire ✅
```
Super Admin E-Pilot (pas de profil)
    ↓
Admin de Groupe (pas de profil)
    ↓
Utilisateurs d'École (avec profil) ✅
```

### Base de Données Cohérente ✅
```sql
-- Super Admin
role = 'super_admin', access_profile_code = NULL ✅

-- Admin Groupe
role = 'admin_groupe', access_profile_code = NULL ✅

-- Enseignant
role = 'enseignant', access_profile_code = 'enseignant_saisie_notes' ✅
```

### Interface Logique ✅
```
- Admin crée utilisateur école
- Champ "Profil d'Accès" s'affiche ✅
- Auto-sélection selon rôle ✅
- Validation correcte ✅
```

---

## 📋 CHECKLIST FINALE

### Base de Données ✅
- [x] Colonne `access_profile_code` nullable
- [x] Profils retirés des admins
- [x] Profils définis pour utilisateurs école
- [x] Migration exécutée

### Frontend ✅
- [x] Champ profil conditionnel (pas pour admins)
- [x] Auto-sélection selon rôle
- [x] Validation Zod optionnelle
- [x] Interface cohérente

### Logique ✅
- [x] Hiérarchie claire
- [x] Profils uniquement pour utilisateurs école
- [x] Admins sans profils
- [x] Documentation complète

---

**Développé avec ❤️ pour E-Pilot Congo-Brazzaville** 🇨🇬  
**Version:** 48.0 Hiérarchie Clarifiée  
**Date:** 17 Novembre 2025  
**Statut:** 🟢 100% Correct - Hiérarchie Claire

---

## 🔍 POUR VIANNEY

**Tu es Admin de Groupe, pas Super Admin!**

✅ Tu peux:
- Créer des écoles dans ton groupe
- Créer des utilisateurs (enseignants, comptables, etc.)
- Assigner des modules selon ton plan
- Gérer ton réseau d'écoles

❌ Tu ne peux pas:
- Créer des groupes scolaires
- Créer des plans d'abonnement
- Créer des modules/catégories
- Gérer d'autres groupes

**Ton profil d'accès:** ❌ Aucun (tu es admin, pas utilisateur d'école)  
**Profils que tu assignes:** ✅ Aux utilisateurs que tu crées (enseignants, etc.)
