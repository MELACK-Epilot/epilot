# 🏗️ Architecture Modules Clickables - E-Pilot Congo

## 🎯 Concept : Modules comme Mini-Applications

Chaque module devient une **application indépendante** avec :
- ✅ Son propre routing
- ✅ Son propre dashboard
- ✅ Ses propres composants
- ✅ Sa propre logique métier
- ✅ Ses propres hooks React Query

---

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard E-Pilot                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Page Modules (Liste des modules disponibles)    │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │ │
│  │  │ Module  │ │ Module  │ │ Module  │            │ │
│  │  │ Inscr.  │ │ Notes   │ │ Emploi  │  ...       │ │
│  │  └────┬────┘ └─────────┘ └─────────┘            │ │
│  └───────┼──────────────────────────────────────────┘ │
│          │ Click                                       │
│          ↓                                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Module Inscriptions (Espace dédié)              │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Dashboard Module                           │ │ │
│  │  │  - Stats inscriptions                       │ │ │
│  │  │  - Graphiques                               │ │ │
│  │  │  - Actions rapides                          │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Liste des inscriptions                     │ │ │
│  │  │  - Filtres avancés                          │ │ │
│  │  │  - Tableau/Grille                           │ │ │
│  │  │  - Actions CRUD                             │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Structure des dossiers

```
src/
├── features/
│   ├── modules/                                    # 🆕 Nouveau dossier
│   │   │
│   │   ├── inscriptions/                           # Module Inscriptions
│   │   │   ├── pages/
│   │   │   │   ├── InscriptionsHub.tsx            # Dashboard du module
│   │   │   │   ├── InscriptionsList.tsx           # Liste complète
│   │   │   │   ├── InscriptionForm.tsx            # Formulaire création/édition
│   │   │   │   ├── InscriptionDetails.tsx         # Détails d'une inscription
│   │   │   │   └── InscriptionsStats.tsx          # Page statistiques
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── InscriptionCard.tsx            # Card inscription
│   │   │   │   ├── InscriptionFilters.tsx         # Filtres
│   │   │   │   ├── InscriptionTimeline.tsx        # Timeline du processus
│   │   │   │   ├── StudentInfoForm.tsx            # Formulaire élève
│   │   │   │   ├── ParentInfoForm.tsx             # Formulaire parents
│   │   │   │   ├── DocumentsUpload.tsx            # Upload documents
│   │   │   │   ├── InscriptionStatusBadge.tsx     # Badge statut
│   │   │   │   └── InscriptionActions.tsx         # Actions rapides
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useInscriptions.ts             # CRUD inscriptions
│   │   │   │   ├── useInscriptionForm.ts          # Logique formulaire
│   │   │   │   ├── useInscriptionStats.ts         # Statistiques
│   │   │   │   └── useInscriptionWorkflow.ts      # Workflow validation
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── inscriptions.types.ts          # Types TypeScript
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── inscriptionHelpers.ts          # Helpers
│   │   │   │   └── inscriptionValidation.ts       # Validation Zod
│   │   │   │
│   │   │   └── routes/
│   │   │       └── inscriptions.routes.tsx        # Routes du module
│   │   │
│   │   ├── notes/                                  # Module Notes (futur)
│   │   ├── emploi-temps/                           # Module Emploi du temps (futur)
│   │   ├── frais-scolarite/                        # Module Frais (futur)
│   │   └── ...                                     # Autres modules
│   │
│   └── dashboard/
│       └── pages/
│           └── Modules.tsx                         # Page liste modules
```

---

## 🔗 Routing

### **Routes principales**
```typescript
// App.tsx
<Routes>
  {/* Dashboard principal */}
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route index element={<DashboardOverview />} />
    <Route path="modules" element={<Modules />} />
    
    {/* Module Inscriptions */}
    <Route path="modules/inscriptions/*" element={<InscriptionsModule />} />
    
    {/* Autres modules */}
    <Route path="modules/notes/*" element={<NotesModule />} />
    <Route path="modules/emploi-temps/*" element={<EmploiTempsModule />} />
  </Route>
</Routes>
```

### **Routes du module Inscriptions**
```typescript
// src/features/modules/inscriptions/routes/inscriptions.routes.tsx
<Routes>
  <Route index element={<InscriptionsHub />} />                    {/* /modules/inscriptions */}
  <Route path="liste" element={<InscriptionsList />} />            {/* /modules/inscriptions/liste */}
  <Route path="nouvelle" element={<InscriptionForm />} />          {/* /modules/inscriptions/nouvelle */}
  <Route path=":id" element={<InscriptionDetails />} />            {/* /modules/inscriptions/:id */}
  <Route path=":id/modifier" element={<InscriptionForm />} />      {/* /modules/inscriptions/:id/modifier */}
  <Route path="statistiques" element={<InscriptionsStats />} />    {/* /modules/inscriptions/statistiques */}
</Routes>
```

---

## 🎨 Design du Module Hub

### **InscriptionsHub.tsx** - Dashboard du module

```typescript
┌─────────────────────────────────────────────────────────┐
│  ← Retour aux modules    Gestion des Inscriptions  🎓  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Total    │ │ En cours │ │ Validées │ │ Refusées │ │
│  │ 245      │ │ 45       │ │ 180      │ │ 20       │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 Graphique évolution inscriptions           │   │
│  │  (Line chart par mois)                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐ │
│  │  Actions rapides    │  │  Inscriptions récentes  │ │
│  │  ➕ Nouvelle inscr. │  │  - Élève A (En attente) │ │
│  │  📋 Voir la liste   │  │  - Élève B (Validée)    │ │
│  │  📊 Statistiques    │  │  - Élève C (En cours)   │ │
│  │  📥 Importer        │  │  ...                    │ │
│  └─────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modèle de données

### **Table : inscriptions**
```sql
CREATE TABLE inscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Référence
  school_id UUID REFERENCES schools(id) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,              -- Ex: "2024-2025"
  inscription_number VARCHAR(50) UNIQUE NOT NULL,  -- Ex: "INS-2024-001"
  
  -- Élève
  student_first_name VARCHAR(100) NOT NULL,
  student_last_name VARCHAR(100) NOT NULL,
  student_date_of_birth DATE NOT NULL,
  student_place_of_birth VARCHAR(100),
  student_gender VARCHAR(10) NOT NULL,             -- 'M' | 'F'
  student_photo TEXT,                              -- URL photo
  
  -- Classe demandée
  requested_class_id UUID REFERENCES classes(id),
  requested_level VARCHAR(50),                     -- Ex: "6ème", "CM2"
  
  -- Parents/Tuteurs
  parent1_first_name VARCHAR(100),
  parent1_last_name VARCHAR(100),
  parent1_phone VARCHAR(20),
  parent1_email VARCHAR(100),
  parent1_profession VARCHAR(100),
  
  parent2_first_name VARCHAR(100),
  parent2_last_name VARCHAR(100),
  parent2_phone VARCHAR(20),
  parent2_email VARCHAR(100),
  parent2_profession VARCHAR(100),
  
  -- Adresse
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  
  -- Documents
  documents JSONB,                                 -- Liste des documents uploadés
  
  -- Statut & Workflow
  status VARCHAR(50) DEFAULT 'en_attente',         -- 'en_attente' | 'en_cours' | 'validee' | 'refusee' | 'annulee'
  workflow_step VARCHAR(50) DEFAULT 'soumission',  -- 'soumission' | 'verification' | 'validation' | 'finalisation'
  
  -- Notes internes
  internal_notes TEXT,
  rejection_reason TEXT,
  
  -- Métadonnées
  submitted_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP,
  validated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_inscriptions_school ON inscriptions(school_id);
CREATE INDEX idx_inscriptions_status ON inscriptions(status);
CREATE INDEX idx_inscriptions_year ON inscriptions(academic_year);
CREATE INDEX idx_inscriptions_number ON inscriptions(inscription_number);
```

---

## 🔄 Workflow d'inscription

### **États possibles**
```typescript
type InscriptionStatus = 
  | 'en_attente'    // Soumise, en attente de traitement
  | 'en_cours'      // En cours de vérification
  | 'validee'       // Validée et acceptée
  | 'refusee'       // Refusée
  | 'annulee';      // Annulée par parent/admin

type WorkflowStep = 
  | 'soumission'      // Formulaire soumis
  | 'verification'    // Vérification documents
  | 'validation'      // Validation direction
  | 'finalisation';   // Finalisation (paiement, etc.)
```

### **Transitions**
```
en_attente → en_cours → validee
                     ↘ refusee
                     ↘ annulee
```

---

## 🎯 Fonctionnalités du module

### **1. Dashboard (Hub)**
- ✅ 4 Stats cards (Total, En cours, Validées, Refusées)
- ✅ Graphique évolution par mois
- ✅ Actions rapides
- ✅ Liste des inscriptions récentes

### **2. Liste des inscriptions**
- ✅ Tableau avec filtres avancés
- ✅ Recherche (nom, prénom, numéro)
- ✅ Filtres (statut, année, classe, date)
- ✅ Actions (Voir, Modifier, Valider, Refuser, Supprimer)
- ✅ Export CSV/PDF
- ✅ Pagination

### **3. Formulaire d'inscription**
- ✅ Formulaire multi-étapes (Wizard)
  - Étape 1 : Informations élève
  - Étape 2 : Informations parents
  - Étape 3 : Documents
  - Étape 4 : Récapitulatif
- ✅ Validation Zod
- ✅ Upload documents (acte naissance, bulletins, etc.)
- ✅ Prévisualisation avant soumission

### **4. Détails inscription**
- ✅ Toutes les informations
- ✅ Timeline du workflow
- ✅ Documents uploadés
- ✅ Historique des actions
- ✅ Actions (Valider, Refuser, Modifier, Imprimer)

### **5. Statistiques**
- ✅ Graphiques avancés
- ✅ Répartition par classe
- ✅ Évolution temporelle
- ✅ Taux de validation
- ✅ Export rapports

---

## 🚀 Prochaines étapes

### **Phase 1 : Structure de base** ✅
1. Créer la structure des dossiers
2. Créer le routing du module
3. Créer les types TypeScript
4. Créer le schéma SQL

### **Phase 2 : Dashboard Hub** 🔄
1. Créer InscriptionsHub.tsx
2. Créer les stats cards
3. Créer le graphique
4. Créer les actions rapides

### **Phase 3 : CRUD** ⏳
1. Créer InscriptionsList.tsx
2. Créer InscriptionForm.tsx (wizard)
3. Créer InscriptionDetails.tsx
4. Créer les hooks React Query

### **Phase 4 : Fonctionnalités avancées** ⏳
1. Upload documents
2. Workflow validation
3. Notifications
4. Export PDF/CSV

---

## 💡 Avantages de cette architecture

### **✅ Scalabilité**
- Chaque module est indépendant
- Facile d'ajouter de nouveaux modules
- Code réutilisable

### **✅ Maintenabilité**
- Structure claire et organisée
- Séparation des responsabilités
- Tests unitaires faciles

### **✅ Performance**
- Lazy loading des modules
- Code splitting automatique
- Cache React Query

### **✅ UX professionnelle**
- Navigation intuitive
- Breadcrumbs clairs
- Retour facile à la liste des modules

---

**Prêt à démarrer l'implémentation ?** 🚀🇨🇬
