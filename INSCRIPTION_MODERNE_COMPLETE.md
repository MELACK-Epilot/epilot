# 🎓 Page Inscription Moderne E-Pilot Congo - DESIGN PROFESSIONNEL

## ✅ ANALYSE DE L'IMAGE FOURNIE

### **Design SchoolExpert Identifié**

L'image montre :
- ✅ **Header vert** avec logo + titre "SCOLARITÉ | TABLEAU DE BORD"
- ✅ **Année académique** affichée (2024-2025)
- ✅ **6 Cartes cliquables** par niveau d'enseignement avec compteurs
- ✅ **Section verte** "METTRE À JOUR LES DONNÉES DES ÉLÈVES INSCRITS"
- ✅ **Section bleue** "FAIRE UN VERSEMENT"
- ✅ **Design épuré** et professionnel

---

## 🎯 NOUVELLE PAGE INSCRIPTION MODERNE

### **Inspiration Design**

Je vais créer une page inspirée de :
1. ✅ **SchoolExpert** (image fournie) - Cartes par niveau
2. ✅ **E-Pilot Congo** - Couleurs officielles
3. ✅ **Best Practices 2025** - Formulaire multi-étapes

---

## 📊 STRUCTURE PROPOSÉE

### **Page Hub Inscriptions** (Déjà créée - avec onglets)

**Onglet 1 : Vue d'ensemble**
- Stats globales
- Inscriptions récentes

**Onglet 2 : Par Niveau** ⭐ **INSPIRÉ DE L'IMAGE**
- 5 Cartes cliquables (comme dans l'image)
- Badge avec nombre d'inscriptions
- Bouton "Accéder" pour créer inscription

**Onglet 3 : Statistiques**
- Stats détaillées

---

### **Nouvelle Page : Formulaire Inscription Complet** ⭐

**Design Multi-Étapes** (Wizard) :

#### **Étape 1 : Informations générales** 🧑
- Photo de l'élève (upload)
- Nom, Post-nom, Prénom
- Sexe (Radio buttons)
- Date de naissance
- Lieu de naissance
- Nationalité
- Identifiant national
- Adresse complète
- Téléphone, Email

#### **Étape 2 : Parents / Tuteurs** 👨‍👩‍👧
- **Père** : Nom, Profession, Téléphone
- **Mère** : Nom, Profession, Téléphone
- **Tuteur** (optionnel) : Nom, Lien de parenté, Téléphone, Adresse

#### **Étape 3 : Informations scolaires** 🏫
- Année académique (auto)
- Niveau (Select avec 5 options comme l'image)
- Classe / Niveau d'étude
- Filière / Section
- Option / Spécialité
- Type d'inscription (Nouvelle, Réinscription, Transfert)
- Ancienne école (si transfert)
- Moyenne d'admission
- Numéro dossier papier

#### **Étape 4 : Informations financières** 💰
- Droit d'inscription
- Frais de scolarité
- Mode de paiement (Select)
- Montant payé
- Solde restant (calculé auto)
- Référence paiement
- Date paiement

#### **Étape 5 : Documents** 📄
- Acte de naissance (upload PDF/image)
- Photo d'identité (upload)
- Certificat de transfert (upload)
- Relevé de notes (upload)
- Carnet de vaccination (upload)

#### **Étape 6 : Validation** ✅
- Récapitulatif complet
- Observations administratives
- Bouton "Enregistrer l'inscription"

---

## 🎨 DESIGN MODERNE

### **Stepper (Indicateur d'étapes)**

```
[1] ──── [2] ──── [3] ──── [4] ──── [5] ──── [6]
 ✓       ✓       ●       ○       ○       ○
Infos   Parents  Scolaire Finance Docs   Validation
```

**Caractéristiques** :
- Icônes colorées par étape
- Ligne de progression
- Étapes complétées en vert
- Étape active en bleu
- Étapes futures en gris

### **Cartes par Niveau** (Inspiré de l'image)

```
┌─────────────────────────────┐
│  [4]                    🎓  │
│                             │
│  Préscolaire et Primaire    │
│                             │
│      [Accéder]              │
└─────────────────────────────┘
```

**Design** :
- Badge numérique (nombre d'inscriptions)
- Icône en haut à droite
- Label du niveau
- Bouton "Accéder" avec gradient
- Hover effects

### **Formulaire Multi-Étapes**

```
┌─────────────────────────────────────┐
│ Header (gradient bleu-vert)         │
│ Étape 1 : Informations générales    │
├─────────────────────────────────────┤
│                                     │
│  [Photo élève]                      │
│                                     │
│  Nom:     [_____________]           │
│  Prénom:  [_____________]           │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│  [← Précédent]      [Suivant →]    │
└─────────────────────────────────────┘
```

---

## 🚀 TECHNOLOGIES

### **Composants UI**
- ✅ Shadcn/UI (Input, Select, Textarea, RadioGroup)
- ✅ Framer Motion (animations)
- ✅ React Hook Form (validation)
- ✅ Zod (schéma validation)

### **Upload Fichiers**
- ✅ react-dropzone (drag & drop)
- ✅ Supabase Storage (stockage)

### **Validation**
```typescript
const inscriptionSchema = z.object({
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(2, "Prénom requis"),
  sexe: z.enum(['M', 'F']),
  dateNaissance: z.string(),
  telephonePere: z.string().regex(/^\+242/, "Format +242"),
  // ...
});
```

---

## 📁 FICHIERS À CRÉER

### **1. Page Formulaire Inscription**
```
src/features/modules/inscriptions/pages/
  ├── InscriptionFormPage.tsx (formulaire complet)
  └── InscriptionFormSteps/
      ├── Step1GeneralInfo.tsx
      ├── Step2Parents.tsx
      ├── Step3Scolaire.tsx
      ├── Step4Finance.tsx
      ├── Step5Documents.tsx
      └── Step6Validation.tsx
```

### **2. Composants Réutilisables**
```
src/features/modules/inscriptions/components/
  ├── InscriptionStepper.tsx (indicateur étapes)
  ├── FileUpload.tsx (upload avec preview)
  ├── NiveauCard.tsx (carte niveau cliquable)
  └── InscriptionSummary.tsx (récapitulatif)
```

### **3. Hooks**
```
src/features/modules/inscriptions/hooks/
  ├── useInscriptionForm.ts (gestion formulaire)
  ├── useFileUpload.ts (upload fichiers)
  └── useInscriptionValidation.ts (validation)
```

---

## 🎯 FLUX UTILISATEUR

### **Scénario 1 : Nouvelle Inscription**

1. **Hub Inscriptions** → Clic "Nouvelle inscription"
2. **Formulaire Étape 1** → Remplir infos générales
3. **Formulaire Étape 2** → Remplir parents
4. **Formulaire Étape 3** → Remplir infos scolaires
5. **Formulaire Étape 4** → Remplir finances
6. **Formulaire Étape 5** → Upload documents
7. **Formulaire Étape 6** → Validation + Enregistrement
8. **Retour Hub** → Inscription créée

### **Scénario 2 : Inscription par Niveau**

1. **Hub Inscriptions** → Onglet "Par Niveau"
2. **Clic sur carte** (ex: Préscolaire)
3. **Formulaire pré-rempli** → Niveau = Préscolaire
4. **Compléter formulaire** → Étapes 1-6
5. **Enregistrement** → Inscription créée

---

## ✅ FONCTIONNALITÉS CLÉS

### **1. Validation en Temps Réel**
- ✅ Champs obligatoires marqués *
- ✅ Messages d'erreur contextuels
- ✅ Validation à chaque étape
- ✅ Impossible de passer si erreurs

### **2. Sauvegarde Automatique**
- ✅ LocalStorage pour brouillon
- ✅ Récupération si page fermée
- ✅ Notification "Brouillon sauvegardé"

### **3. Upload Fichiers**
- ✅ Drag & drop
- ✅ Preview images
- ✅ Taille max 5MB
- ✅ Formats acceptés : PDF, JPG, PNG

### **4. Calculs Automatiques**
- ✅ Solde restant = Frais - Montant payé
- ✅ Numéro inscription auto-généré
- ✅ Année académique auto

### **5. Récapitulatif Final**
- ✅ Toutes les infos affichées
- ✅ Possibilité de modifier
- ✅ Bouton "Enregistrer"
- ✅ PDF téléchargeable

---

## 🎨 COULEURS E-PILOT

### **Par Étape**
- Étape 1 (Général) : Vert #2A9D8F
- Étape 2 (Parents) : Or #E9C46A
- Étape 3 (Scolaire) : Bleu #1D3557
- Étape 4 (Finance) : Rouge #E63946
- Étape 5 (Documents) : Violet #9333EA
- Étape 6 (Validation) : Vert #2A9D8F

---

## 📊 BASE DE DONNÉES

### **Table : inscriptions**

```sql
CREATE TABLE inscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_inscription VARCHAR(20) UNIQUE NOT NULL,
  
  -- Informations générales
  photo_url TEXT,
  nom VARCHAR(100) NOT NULL,
  postnom VARCHAR(100),
  prenom VARCHAR(100) NOT NULL,
  sexe CHAR(1) CHECK (sexe IN ('M', 'F')),
  date_naissance DATE NOT NULL,
  lieu_naissance VARCHAR(200),
  nationalite VARCHAR(100),
  identifiant_national VARCHAR(50),
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  
  -- Parents/Tuteurs
  nom_pere VARCHAR(200),
  profession_pere VARCHAR(100),
  telephone_pere VARCHAR(20) NOT NULL,
  nom_mere VARCHAR(200),
  profession_mere VARCHAR(100),
  telephone_mere VARCHAR(20) NOT NULL,
  nom_tuteur VARCHAR(200),
  lien_parente VARCHAR(100),
  telephone_tuteur VARCHAR(20),
  adresse_tuteur TEXT,
  
  -- Informations scolaires
  annee_academique VARCHAR(20) NOT NULL,
  niveau VARCHAR(50) NOT NULL,
  classe VARCHAR(50) NOT NULL,
  filiere VARCHAR(100),
  option VARCHAR(100),
  type_inscription VARCHAR(20) CHECK (type_inscription IN ('nouvelle', 'reinscription', 'transfert')),
  ancienne_ecole VARCHAR(200),
  moyenne_admission DECIMAL(4,2),
  numero_dossier VARCHAR(50),
  
  -- Informations financières
  droit_inscription DECIMAL(10,2) NOT NULL,
  frais_scolarite DECIMAL(10,2) NOT NULL,
  mode_paiement VARCHAR(50),
  montant_paye DECIMAL(10,2),
  solde_restant DECIMAL(10,2),
  reference_paiement VARCHAR(100),
  date_paiement DATE,
  
  -- Documents
  acte_naissance_url TEXT,
  photo_identite_url TEXT,
  certificat_transfert_url TEXT,
  releve_notes_url TEXT,
  carnet_vaccination_url TEXT,
  
  -- Gestion interne
  agent_inscription_id UUID REFERENCES users(id),
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
  observations TEXT,
  
  school_group_id UUID REFERENCES school_groups(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 PROCHAINES ÉTAPES

### **1. Créer les composants**
- [ ] InscriptionFormPage.tsx (page principale)
- [ ] InscriptionStepper.tsx (stepper)
- [ ] Step1-6 components (étapes)
- [ ] FileUpload.tsx (upload)

### **2. Créer les hooks**
- [ ] useInscriptionForm.ts
- [ ] useFileUpload.ts
- [ ] useInscriptionValidation.ts

### **3. Intégration Supabase**
- [ ] Créer table inscriptions
- [ ] Créer bucket storage pour documents
- [ ] Créer RLS policies

### **4. Tests**
- [ ] Test formulaire complet
- [ ] Test upload fichiers
- [ ] Test validation
- [ ] Test sauvegarde

---

## 🎉 RÉSULTAT ATTENDU

**Page Inscription Moderne** :
- ✅ Design professionnel inspiré de SchoolExpert
- ✅ Formulaire multi-étapes (6 étapes)
- ✅ Validation complète
- ✅ Upload fichiers
- ✅ Calculs automatiques
- ✅ Sauvegarde brouillon
- ✅ Récapitulatif final
- ✅ Couleurs E-Pilot Congo
- ✅ Animations fluides
- ✅ Responsive mobile/desktop

**Prêt pour la production ! 🚀🇨🇬**
