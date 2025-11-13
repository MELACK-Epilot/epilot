# 📊 ANALYSE - Page Plans & Tarification (Super Admin)

**Date** : 9 novembre 2025, 21:10  
**Fichier** : `src/features/dashboard/pages/Plans.tsx`

---

## 🎯 OBJECTIF DE LA PAGE

La page **Plans & Tarification** permet au **Super Admin E-Pilot** de :
1. **Créer** les plans d'abonnement pour les Groupes Scolaires
2. **Gérer** les plans existants (modifier, archiver)
3. **Visualiser** les statistiques et la répartition des abonnements
4. **Comparer** les plans entre eux

---

## 🏗️ ARCHITECTURE DE LA PAGE

### **1. Composants Principaux**

```tsx
Plans.tsx (488 lignes)
├── Header avec actions
│   ├── Breadcrumb (Finances → Plans & Tarifs)
│   ├── Titre + Description
│   └── Actions (Export CSV, Vue Table/Cartes, Nouveau Plan)
│
├── Statistiques (4 KPIs)
│   ├── Total Plans
│   ├── Plans Actifs
│   ├── Abonnements
│   └── Revenus MRR
│
├── Graphique Pie Chart
│   └── Répartition des abonnements par plan
│
├── Tableau Comparatif
│   └── Comparaison des plans (si > 1 plan)
│
├── Barre de Recherche
│   └── Recherche par nom ou slug
│
├── Affichage des Plans
│   ├── Vue Cartes (par défaut)
│   └── Vue Table (alternative)
│
└── Dialog Création/Modification
    └── PlanFormDialog (formulaire complet)
```

---

## 📦 STRUCTURE D'UN PLAN

### **Données d'un Plan**

```typescript
Plan {
  // Identité
  id: string
  name: string              // Ex: "Premium"
  slug: string              // Ex: "premium"
  description: string       // Description du plan
  
  // Tarification
  price: number             // Prix en FCFA
  currency: 'FCFA' | 'EUR' | 'USD'
  billingPeriod: 'monthly' | 'quarterly' | 'biannual' | 'yearly'
  discount?: number         // Réduction en %
  trialDays?: number        // Jours d'essai gratuit
  
  // Limites
  maxSchools: number        // Nombre d'écoles (-1 = illimité)
  maxStudents: number       // Nombre d'élèves (-1 = illimité)
  maxStaff: number          // Nombre de personnel (-1 = illimité)
  maxStorage: number        // Stockage en GB
  
  // Fonctionnalités
  features: string[]        // Liste des fonctionnalités
  supportLevel: 'email' | 'priority' | '24/7'
  customBranding: boolean   // Personnalisation marque
  apiAccess: boolean        // Accès API
  
  // Contenu (assigné via tables de liaison)
  categories: Category[]    // Catégories métiers incluses
  modules: Module[]         // Modules pédagogiques inclus
  
  // État
  isActive: boolean         // Plan actif/archivé
  isPopular: boolean        // Badge "Populaire"
}
```

---

## 🎨 AFFICHAGE DES PLANS (Vue Cartes)

### **Structure d'une Carte Plan**

```
┌─────────────────────────────────────┐
│ 👑 Populaire (si isPopular)         │
├─────────────────────────────────────┤
│ 🎨 HEADER (Gradient coloré)        │
│   📦 Icône + Badge Actif            │
│   Premium                           │
│   Description du plan               │
├─────────────────────────────────────┤
│ 💰 PRIX                             │
│   50,000 FCFA /mois                 │
│   -10% de réduction                 │
├─────────────────────────────────────┤
│ 📊 CARACTÉRISTIQUES                 │
│   Écoles: 5                         │
│   Élèves: 500                       │
│   Personnel: 50                     │
│   Stockage: 10 GB                   │
│   Essai gratuit: 14 jours           │
├─────────────────────────────────────┤
│ 📂 CONTENU DU PLAN (Expandable)    │
│   ▼ 3 catégories · 15 modules      │
│   ┌─────────────────────────────┐  │
│   │ 📂 Catégories Métiers       │  │
│   │ • Scolarité                 │  │
│   │ • Pédagogie                 │  │
│   │ • Finances                  │  │
│   ├─────────────────────────────┤  │
│   │ 📦 Modules Inclus           │  │
│   │ • Gestion Notes (Premium)   │  │
│   │ • Emploi du Temps (Core)    │  │
│   │ • Bulletins                 │  │
│   │ +12 autres modules          │  │
│   └─────────────────────────────┘  │
├─────────────────────────────────────┤
│ 🔧 ACTIONS (Super Admin)           │
│   [Modifier] [🗑️]                   │
└─────────────────────────────────────┘
```

### **Codes Couleurs par Plan**

```typescript
Gratuit       → Gris    (from-gray-500 to-gray-600)
Premium       → Turquoise (from-[#2A9D8F] to-[#1D8A7E])
Pro           → Bleu foncé (from-[#1D3557] to-[#0F1F35])
Institutionnel → Or      (from-[#E9C46A] to-[#D4AF37])
```

### **Icônes par Plan**

```typescript
Gratuit       → 📦 Package
Premium       → ⚡ Zap
Pro           → 👑 Crown
Institutionnel → 🏢 Building2
```

---

## 📊 STATISTIQUES (4 KPIs)

### **1. Total Plans**
- **Valeur** : Nombre total de plans créés
- **Icône** : 📦 Package
- **Couleur** : Bleu

### **2. Plans Actifs**
- **Valeur** : Nombre de plans actifs (is_active = true)
- **Icône** : ✅ CheckCircle2
- **Couleur** : Vert

### **3. Abonnements**
- **Valeur** : Nombre total de groupes abonnés
- **Icône** : 📈 TrendingUp
- **Couleur** : Violet

### **4. Revenus MRR**
- **Valeur** : Monthly Recurring Revenue (en K FCFA)
- **Icône** : 💰 DollarSign
- **Couleur** : Or
- **Trend** : Flèche vers le haut si MRR > 0

---

## 📈 GRAPHIQUE PIE CHART

### **Répartition des Abonnements par Plan**

```typescript
// Données du graphique
distributionData = [
  { name: 'Gratuit', value: 10, percentage: 40, color: '#6B7280' },
  { name: 'Premium', value: 8, percentage: 32, color: '#2A9D8F' },
  { name: 'Pro', value: 5, percentage: 20, color: '#1D3557' },
  { name: 'Institutionnel', value: 2, percentage: 8, color: '#E9C46A' }
]
```

**Affichage** :
- Pie chart avec labels : "Premium: 8 (32%)"
- Tooltip au survol : "8 abonnement(s)"
- Légende en bas avec couleurs

---

## 📋 TABLEAU COMPARATIF

### **Comparaison des Plans**

Affiché uniquement si **plus de 1 plan** existe.

```
┌─────────────┬─────────┬─────────┬─────┬──────────────┐
│ Critère     │ Gratuit │ Premium │ Pro │ Institutionnel│
├─────────────┼─────────┼─────────┼─────┼──────────────┤
│ Prix        │ Gratuit │ 50K     │ 150K│ 500K         │
│ Écoles      │ 1       │ 5       │ 20  │ Illimité     │
│ Élèves      │ 50      │ 500     │ 2000│ Illimité     │
│ Personnel   │ 10      │ 50      │ 200 │ Illimité     │
│ Stockage    │ 1 GB    │ 10 GB   │ 50GB│ Illimité     │
│ Support     │ Email   │ Priority│ 24/7│ 24/7         │
│ Branding    │ ❌      │ ❌      │ ✅  │ ✅           │
│ API         │ ❌      │ ❌      │ ✅  │ ✅           │
└─────────────┴─────────┴─────────┴─────┴──────────────┘
```

---

## 🔍 RECHERCHE

### **Barre de Recherche**

```typescript
// Recherche par nom OU slug
searchQuery = "premium"

// Requête SQL
.or(`name.ilike.%${query}%,slug.ilike.%${query}%`)

// Résultats filtrés en temps réel
```

---

## 🔧 ACTIONS SUPER ADMIN

### **1. Créer un Plan**

**Bouton** : "Nouveau Plan" (vert turquoise)

**Ouvre** : `PlanFormDialog` en mode `create`

**Formulaire** :
```
┌─────────────────────────────────────┐
│ Créer un Plan                       │
├─────────────────────────────────────┤
│ Informations de base                │
│ • Nom du plan                       │
│ • Slug (identifiant unique)         │
│ • Description                       │
│                                     │
│ Tarification                        │
│ • Prix (FCFA)                       │
│ • Période de facturation            │
│ • Réduction (%)                     │
│ • Jours d'essai gratuit             │
│                                     │
│ Limites                             │
│ • Nombre d'écoles                   │
│ • Nombre d'élèves                   │
│ • Nombre de personnel               │
│ • Stockage (GB)                     │
│                                     │
│ Fonctionnalités                     │
│ • Niveau de support                 │
│ • Personnalisation marque           │
│ • Accès API                         │
│ • Plan populaire                    │
│                                     │
│ Catégories & Modules                │
│ • Sélection des catégories métiers  │
│ • Sélection des modules pédagogiques│
│                                     │
│ [Annuler] [Créer le plan]          │
└─────────────────────────────────────┘
```

### **2. Modifier un Plan**

**Bouton** : "Modifier" (dans la carte)

**Ouvre** : `PlanFormDialog` en mode `edit`

**Pré-remplit** : Toutes les données du plan existant

### **3. Archiver un Plan**

**Bouton** : 🗑️ (rouge)

**Action** : Met `is_active = false` (soft delete)

**Confirmation** : "Êtes-vous sûr de vouloir archiver le plan ?"

### **4. Exporter CSV**

**Bouton** : "Exporter CSV"

**Génère** : Fichier CSV avec tous les plans

**Colonnes** :
- Nom, Slug, Prix, Devise, Période
- Écoles, Élèves, Personnel, Stockage
- Support, Branding, API, Statut

---

## 🔄 WORKFLOW COMPLET

### **Création d'un Plan**

```
1. Super Admin clique "Nouveau Plan"
   ↓
2. Remplit le formulaire
   • Nom: "Premium"
   • Prix: 50,000 FCFA
   • Limites: 5 écoles, 500 élèves, 50 personnel, 10 GB
   • Sélectionne 3 catégories métiers
   • Sélectionne 15 modules pédagogiques
   ↓
3. Clique "Créer le plan"
   ↓
4. Backend crée le plan dans subscription_plans
   ↓
5. Backend assigne les catégories dans plan_categories
   ↓
6. Backend assigne les modules dans plan_modules
   ↓
7. Toast de confirmation : "Plan créé avec 3 catégories et 15 modules"
   ↓
8. Page se rafraîchit, nouveau plan visible
```

### **Abonnement d'un Groupe au Plan**

```
1. Admin Groupe souscrit au plan "Premium"
   ↓
2. Trigger SQL auto_assign_modules se déclenche
   ↓
3. Copie automatique des modules du plan vers group_module_configs
   ↓
4. Copie automatique des catégories vers group_business_categories
   ↓
5. Admin Groupe a immédiatement accès aux 15 modules
```

---

## 🎯 FONCTIONNALITÉS CLÉS

### **1. Flexibilité Totale**
- Super Admin voit **TOUS** les modules et catégories
- Peut créer des plans personnalisés
- Peut inclure des modules "Premium" dans un plan "Gratuit"

### **2. Assignation Automatique**
- Quand un groupe souscrit à un plan
- Les modules et catégories sont **automatiquement assignés**
- Via trigger SQL `auto_assign_modules`

### **3. Gestion des Limites**
- Chaque plan a des limites (écoles, élèves, personnel, stockage)
- Triggers SQL vérifient les limites avant création
- Alertes si proche de la limite (80%)

### **4. Visualisation Avancée**
- Graphique Pie Chart pour la répartition
- Tableau comparatif pour comparer les plans
- Cartes expandables pour voir le contenu

### **5. Recherche & Filtres**
- Recherche par nom ou slug
- Filtrage par statut (actif/archivé)
- Tri par prix (ascendant)

---

## 🗄️ BASE DE DONNÉES

### **Tables Impliquées**

```sql
-- Table principale
subscription_plans (
  id, name, slug, description,
  price, currency, billing_period,
  max_schools, max_students, max_staff, max_storage,
  support_level, custom_branding, api_access,
  is_active, is_popular, discount, trial_days
)

-- Tables de liaison
plan_categories (
  plan_id, category_id
)

plan_modules (
  plan_id, module_id
)

-- Tables référencées
business_categories (
  id, name, icon, color
)

pedagogical_modules (
  id, name, description, is_core, is_premium
)

-- Table des abonnements
school_group_subscriptions (
  id, school_group_id, plan_id,
  status, start_date, end_date
)
```

### **Vue SQL plan_stats**

```sql
CREATE VIEW plan_stats AS
SELECT
  p.id,
  p.name,
  p.slug,
  COUNT(s.id) as subscription_count,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
  SUM(CASE WHEN s.status = 'active' THEN p.price ELSE 0 END) as mrr
FROM subscription_plans p
LEFT JOIN school_group_subscriptions s ON s.plan_id = p.id
GROUP BY p.id, p.name, p.slug;
```

---

## 🔐 SÉCURITÉ

### **Contrôle d'Accès**

```typescript
// Seul le Super Admin peut :
if (isSuperAdmin) {
  // Créer des plans
  // Modifier des plans
  // Archiver des plans
  // Voir les actions (boutons Modifier/Supprimer)
}

// Admin Groupe peut seulement :
// - Voir les plans disponibles
// - Souscrire à un plan (via page Abonnements)
```

### **RLS (Row Level Security)**

```sql
-- Seul Super Admin peut modifier les plans
CREATE POLICY "Super Admin can manage plans"
ON subscription_plans
FOR ALL
USING (auth.jwt() ->> 'role' = 'super_admin');

-- Tous peuvent voir les plans actifs
CREATE POLICY "Everyone can view active plans"
ON subscription_plans
FOR SELECT
USING (is_active = true);
```

---

## 📊 HOOKS UTILISÉS

### **1. usePlans()**
- Récupère la liste des plans
- Filtrage par recherche et statut
- Tri par prix (ascendant)

### **2. useAllPlansWithContent()**
- Récupère les plans avec catégories et modules
- Utilisé pour l'affichage des cartes

### **3. usePlanStats()**
- Récupère les statistiques (total, actifs, abonnements)
- Utilise la vue SQL `plan_stats`

### **4. usePlanRevenue()**
- Calcule le MRR (Monthly Recurring Revenue)
- Somme des prix des abonnements actifs

### **5. usePlanDistributionData()**
- Calcule la répartition des abonnements par plan
- Données pour le Pie Chart

### **6. useCreatePlan()**
- Mutation pour créer un plan
- Invalide les caches après création

### **7. useUpdatePlan()**
- Mutation pour modifier un plan
- Invalide les caches après modification

### **8. useDeletePlan()**
- Mutation pour archiver un plan (soft delete)
- Met `is_active = false`

---

## 🎨 DESIGN & UX

### **Animations**

```typescript
// Cartes avec animation stagger
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: index * 0.1 }}
>
```

### **Hover Effects**

```css
hover:shadow-2xl
transition-all duration-300
group-hover:scale-105
```

### **Couleurs**

```typescript
Turquoise : #2A9D8F (couleur principale E-Pilot)
Bleu foncé : #1D3557
Or : #E9C46A
Rouge : #E63946
Gris : #6B7280
```

### **Glassmorphism**

```css
bg-white/20
backdrop-blur-sm
```

---

## 🎯 RÉSUMÉ

### **Ce que comprend la page Plans & Tarification**

1. **Gestion CRUD des Plans** :
   - Créer, Modifier, Archiver des plans d'abonnement
   - Définir les limites (écoles, élèves, personnel, stockage)
   - Assigner des catégories métiers et modules pédagogiques

2. **Visualisation Avancée** :
   - 4 KPIs (Total, Actifs, Abonnements, MRR)
   - Graphique Pie Chart (répartition des abonnements)
   - Tableau comparatif (comparaison des plans)
   - Cartes expandables (contenu détaillé)

3. **Workflow Automatisé** :
   - Assignation automatique des modules/catégories lors de l'abonnement
   - Vérification des limites via triggers SQL
   - Alertes si proche de la limite

4. **Sécurité** :
   - Seul le Super Admin peut gérer les plans
   - RLS pour contrôler l'accès
   - Soft delete (archivage)

5. **UX Premium** :
   - Animations fluides
   - Design moderne avec gradients
   - Recherche en temps réel
   - Export CSV

---

## 🚀 COMMENT ÇA MARCHE ?

### **Étape 1 : Super Admin crée un plan**
```
Super Admin → Nouveau Plan → Remplit formulaire → Sélectionne catégories/modules → Crée
```

### **Étape 2 : Plan stocké en BDD**
```
subscription_plans (plan créé)
plan_categories (catégories assignées)
plan_modules (modules assignés)
```

### **Étape 3 : Admin Groupe souscrit**
```
Admin Groupe → Page Abonnements → Sélectionne "Premium" → Souscrit
```

### **Étape 4 : Assignation automatique**
```
Trigger auto_assign_modules → Copie modules vers group_module_configs
Trigger auto_assign_categories → Copie catégories vers group_business_categories
```

### **Étape 5 : Admin Groupe a accès**
```
Admin Groupe → Page "Mes Modules" → Voit les 15 modules du plan Premium
Admin Groupe → Peut activer/désactiver les modules
Admin Groupe → Peut assigner les modules aux utilisateurs
```

---

**La page Plans & Tarification est le cœur du système d'abonnement E-Pilot !** 🎯
