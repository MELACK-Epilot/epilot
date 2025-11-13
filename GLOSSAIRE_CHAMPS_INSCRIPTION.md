# 📖 Glossaire des Champs d'Inscription

## 🎯 Noms simplifiés et signification

Ce document explique tous les champs de la fiche d'inscription avec leurs **nouveaux noms simplifiés**.

---

## 👤 Informations Élève

| Champ SQL | Nom TypeScript | Signification | Exemple |
|-----------|----------------|---------------|---------|
| `student_first_name` | `studentFirstName` | Prénom de l'élève | "Jean" |
| `student_last_name` | `studentLastName` | Nom de famille | "Dupont" |
| `student_date_of_birth` | `studentDateOfBirth` | Date de naissance | "2010-05-15" |
| `student_place_of_birth` | `studentPlaceOfBirth` | Lieu de naissance | "Brazzaville" |
| `student_gender` | `studentGender` | Genre (M/F) | "M" |
| `student_photo` | `studentPhoto` | URL de la photo | "https://..." |

---

## 🎓 Informations Académiques

### **Classe et Niveau**

| Champ SQL | Nom TypeScript | Signification | Exemple |
|-----------|----------------|---------------|---------|
| `requested_level` | `requestedLevel` | **Niveau demandé** (OBLIGATOIRE) | "5EME", "6EME", "CM2" |
| `serie` | `serie` | Série (pour lycée) | "A", "C", "D" |
| `requested_class_id` | `requestedClassId` | ID de la classe spécifique (optionnel) | UUID ou NULL |

### **Statut Académique**

| Champ SQL | Nom TypeScript | Signification | Valeurs |
|-----------|----------------|---------------|---------|
| `est_redoublant` | `estRedoublant` | **Redouble la classe** - L'élève refait la même année | `true` / `false` |
| `est_affecte` | `estAffecte` | **Affecté par le ministère** - A un document officiel d'affectation | `true` / `false` |
| `numero_affectation` | `numeroAffectation` | **N° du document d'affectation** - Numéro officiel du ministère | "AFF-2024-12345" |

**Explication** :
- **Redoublant** : Élève qui n'a pas réussi l'année et recommence
- **Affecté** : Après l'examen, le ministère affecte les élèves aux écoles. Ceux qui ont ce statut ont un document officiel.
- **Non affecté** : Élève inscrit directement sans passer par le système d'affectation

---

## 💰 Aides Financières

| Champ SQL | Nom TypeScript | Signification | Détails |
|-----------|----------------|---------------|---------|
| `a_aide_sociale` | `aAideSociale` | **Bénéficie d'une aide sociale** | Programme de prise en charge (PCS, ONG, État) |
| `a_bourse` | `aBourse` | **Bénéficie d'une bourse** | Aide financière basée sur le mérite ou les besoins |
| `est_pensionnaire` | `estPensionnaire` | **Vit à l'internat** | Élève hébergé et nourri à l'école |

### **Différences** :

#### **Aide Sociale (PCS)** 🏛️
- **Qui paie ?** État, ONG, programme social
- **Critères** : Situation sociale difficile
- **Couverture** : Frais de scolarité (partiel ou total)
- **Exemple** : Famille sans revenus, orphelin

#### **Bourse** 🎓
- **Qui paie ?** Fondation privée, entreprise, école
- **Critères** : Mérite académique ou situation sociale
- **Couverture** : Variable (peut inclure fournitures, uniforme)
- **Exemple** : Élève brillant avec mention

#### **Pensionnaire (Internat)** 🏠
- **Qui paie ?** Parents (frais supplémentaires)
- **Critères** : Choix des parents, distance de l'école
- **Couverture** : Hébergement + repas
- **Exemple** : Élève venant d'une autre ville

---

## 💵 Frais (en FCFA)

| Champ SQL | Nom TypeScript | Signification | Exemple |
|-----------|----------------|---------------|---------|
| `frais_inscription` | `fraisInscription` | **Frais d'inscription** - Payé une fois à l'inscription | 40 000 FCFA |
| `frais_scolarite` | `fraisScolarite` | **Frais de scolarité** - Payé par trimestre ou année | 90 000 FCFA |
| `frais_cantine` | `fraisCantine` | **Frais de cantine** - Repas à l'école | 10 000 FCFA |
| `frais_transport` | `fraisTransport` | **Frais de transport** - Bus scolaire | 10 000 FCFA |

**Note** : Ces montants peuvent varier selon :
- Le niveau (primaire, collège, lycée)
- Le statut (pensionnaire, externe)
- Les aides (bourse, aide sociale)

---

## 👨‍👩‍👧 Informations Parents

### **Parent 1 (Obligatoire)**

| Champ SQL | Nom TypeScript | Signification |
|-----------|----------------|---------------|
| `parent1_first_name` | `parent1.firstName` | Prénom du parent 1 |
| `parent1_last_name` | `parent1.lastName` | Nom du parent 1 |
| `parent1_phone` | `parent1.phone` | Téléphone (OBLIGATOIRE) |
| `parent1_email` | `parent1.email` | Email (optionnel) |
| `parent1_profession` | `parent1.profession` | Profession (optionnel) |

### **Parent 2 (Optionnel)**

| Champ SQL | Nom TypeScript | Signification |
|-----------|----------------|---------------|
| `parent2_first_name` | `parent2.firstName` | Prénom du parent 2 |
| `parent2_last_name` | `parent2.lastName` | Nom du parent 2 |
| `parent2_phone` | `parent2.phone` | Téléphone |
| `parent2_email` | `parent2.email` | Email |
| `parent2_profession` | `parent2.profession` | Profession |

---

## 📍 Adresse

| Champ SQL | Nom TypeScript | Signification | Exemple |
|-----------|----------------|---------------|---------|
| `address` | `address` | Adresse complète | "123 Avenue de la Paix" |
| `city` | `city` | Ville | "Brazzaville" |
| `region` | `region` | Région/Département | "Brazzaville" |

---

## 📄 Documents

| Champ SQL | Nom TypeScript | Signification | Format |
|-----------|----------------|---------------|--------|
| `documents` | `documents` | **Liste des documents uploadés** | JSON Array |

**Structure JSON** :
```json
[
  {
    "id": "uuid",
    "name": "Acte de naissance",
    "type": "application/pdf",
    "url": "https://storage.../acte.pdf",
    "uploadedAt": "2024-10-30T10:00:00Z"
  },
  {
    "id": "uuid",
    "name": "Bulletin N-1",
    "type": "application/pdf",
    "url": "https://storage.../bulletin.pdf",
    "uploadedAt": "2024-10-30T10:05:00Z"
  }
]
```

**Documents typiques** :
- ✅ Acte de naissance
- ✅ Bulletin de l'année précédente
- ✅ Certificat de transfert (si vient d'une autre école)
- ✅ Photo d'identité
- ✅ Carnet de vaccination
- ✅ Document d'affectation (si affecté)

---

## 🔄 Workflow et Statut

| Champ SQL | Nom TypeScript | Signification | Valeurs possibles |
|-----------|----------------|---------------|-------------------|
| `status` | `status` | **Statut de l'inscription** | `en_attente`, `en_cours`, `validee`, `refusee`, `annulee` |
| `workflow_step` | `workflowStep` | **Étape du processus** | `soumission`, `verification`, `validation`, `finalisation` |

### **Statuts** :
- **en_attente** 🟡 : Soumise, en attente de traitement
- **en_cours** 🔵 : En cours de vérification
- **validee** 🟢 : Validée et acceptée
- **refusee** 🔴 : Refusée (avec raison)
- **annulee** ⚫ : Annulée par parent/admin

### **Étapes** :
1. **soumission** : Formulaire soumis
2. **verification** : Vérification des documents
3. **validation** : Validation par la direction
4. **finalisation** : Paiement et attribution classe

---

## 📊 Métadonnées

| Champ SQL | Nom TypeScript | Signification |
|-----------|----------------|---------------|
| `inscription_number` | `inscriptionNumber` | Numéro unique (auto-généré) |
| `academic_year` | `academicYear` | Année académique |
| `submitted_at` | `submittedAt` | Date de soumission |
| `validated_at` | `validatedAt` | Date de validation |
| `validated_by` | `validatedBy` | ID de l'admin qui a validé |
| `internal_notes` | `internalNotes` | Notes internes (admin) |
| `rejection_reason` | `rejectionReason` | Raison du refus |

---

## 🎯 Exemples d'utilisation

### **Exemple 1 : Élève normal**
```json
{
  "studentFirstName": "Marie",
  "studentLastName": "Koumba",
  "requestedLevel": "6EME",
  "serie": "A",
  "estRedoublant": false,
  "estAffecte": true,
  "numeroAffectation": "AFF-2024-5678",
  "aAideSociale": false,
  "aBourse": false,
  "estPensionnaire": false,
  "fraisInscription": 40000,
  "fraisScolarite": 90000
}
```

### **Exemple 2 : Élève avec aide sociale**
```json
{
  "studentFirstName": "Paul",
  "studentLastName": "Mbemba",
  "requestedLevel": "5EME",
  "serie": "C",
  "estRedoublant": false,
  "estAffecte": false,
  "aAideSociale": true,        // ✅ Bénéficie d'une aide
  "aBourse": false,
  "estPensionnaire": false,
  "fraisInscription": 0,       // Pris en charge
  "fraisScolarite": 0          // Pris en charge
}
```

### **Exemple 3 : Élève pensionnaire avec bourse**
```json
{
  "studentFirstName": "Sophie",
  "studentLastName": "Nkounkou",
  "requestedLevel": "3EME",
  "serie": "D",
  "estRedoublant": false,
  "estAffecte": true,
  "numeroAffectation": "AFF-2024-9012",
  "aAideSociale": false,
  "aBourse": true,             // ✅ Bourse d'excellence
  "estPensionnaire": true,     // ✅ Vit à l'internat
  "fraisInscription": 40000,
  "fraisScolarite": 45000,     // 50% de réduction (bourse)
  "fraisCantine": 30000,       // Inclus dans pensionnat
  "fraisTransport": 0          // Pas besoin (pensionnaire)
}
```

---

## 📝 Résumé des changements de noms

| Ancien nom ❌ | Nouveau nom ✅ | Plus clair ? |
|--------------|---------------|--------------|
| `is_redoublant` | `est_redoublant` | ✅ Français cohérent |
| `statut_affectation` | `est_affecte` | ✅ Boolean plus simple |
| `numero_decision_affectation` | `numero_affectation` | ✅ Plus court |
| `is_pcs` | `a_aide_sociale` | ✅ Beaucoup plus clair ! |
| `is_interne` | `est_pensionnaire` | ✅ Terme exact |
| `has_bourse` | `a_bourse` | ✅ Français cohérent |

---

**Tous les champs sont maintenant clairs et compréhensibles !** 🎉

**Date** : 31 octobre 2025  
**Projet** : E-Pilot Congo 🇨🇬
