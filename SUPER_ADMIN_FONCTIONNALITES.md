# 🎯 Super Admin E-Pilot - Fonctionnalités Complètes

## 📋 Vue d'Ensemble

Le **Super Admin** est le rôle le plus élevé de la plateforme E-Pilot Congo. Il gère l'ensemble de l'écosystème SaaS au niveau national.

**Rôle** : `super_admin`  
**Vision** : 🌍 Nationale (tous les groupes scolaires du Congo)  
**Scope** : Multi-groupes, multi-écoles

---

## 🎨 Dashboard Principal

### URL
`/dashboard`

### Composants Actuels

#### 1. **WelcomeCard** ✅
Carte de bienvenue personnalisée avec actions rapides.

**Contenu :**
- Nom de l'administrateur
- Statut système (Opérationnel / En maintenance)
- Actions rapides :
  - ➕ Ajouter Groupe Scolaire
  - 🎛️ Gérer Widgets
  - 📊 Voir Activité
  - ⚙️ Paramètres

**Fichier** : `src/features/dashboard/components/WelcomeCard.tsx`

#### 2. **StatsWidget** ✅
KPI nationaux en temps réel avec sparklines.

**Métriques affichées :**
- **Groupes Scolaires** (ex: 245)
  - Tendance : +12.5%
  - Couleur : Bleu institutionnel (#1D3557)
  - Route : `/dashboard/school-groups`

- **Utilisateurs Actifs** (ex: 12,450)
  - Tendance : +8.3%
  - Couleur : Vert positif (#2A9D8F)
  - Route : `/dashboard/users`

- **MRR Estimé** (ex: 45.0M FCFA)
  - Tendance : +15.2%
  - Couleur : Or républicain (#E9C46A)
  - Route : `/dashboard/subscriptions`

- **Abonnements Critiques** (ex: 12)
  - Tendance : -5.1%
  - Couleur : Rouge alerte (#E63946)
  - Route : `/dashboard/subscriptions?filter=critical`

**Features :**
- Sparkline charts (7 derniers jours)
- Animations GPU-accelerated
- Cliquables (navigation directe)
- Skeleton loaders

**Fichier** : `src/features/dashboard/components/StatsWidget.tsx`

#### 3. **DashboardGrid** ✅
Grille de widgets personnalisables avec drag & drop.

**Widgets disponibles :**
- 📊 Aperçu Financier (revenus mensuels)
- 🚨 Alertes Système
- 📈 Adoption des Modules
- ⚡ Activité Temps Réel

**Features :**
- Drag & drop (react-grid-layout)
- Sauvegarde layout (localStorage)
- Redimensionnement
- Personnalisation par utilisateur

**Fichier** : `src/features/dashboard/components/DashboardGrid.tsx`

---

## 📄 Pages de Gestion

### 1. Groupes Scolaires
**URL** : `/dashboard/school-groups`  
**Fichier** : `src/features/dashboard/pages/SchoolGroups.tsx`

#### Fonctionnalités ✅
- **Liste complète** de tous les groupes
- **Recherche** (nom, code, région)
- **Filtres** :
  - Statut (actif, inactif, suspendu)
  - Plan (gratuit, premium, pro, institutionnel)
  - Région (Brazzaville, Pointe-Noire, etc.)
- **Tri** (nom, date création, nombre d'écoles)
- **Pagination** (10, 25, 50, 100 par page)

#### Actions CRUD
- ✅ **Créer** nouveau groupe
- ✅ **Voir détails** (modal)
- ✅ **Modifier** informations
- ✅ **Activer / Désactiver**
- ✅ **Suspendre** temporairement
- ✅ **Supprimer** (soft delete vers corbeille)

#### Informations Affichées
```typescript
interface SchoolGroup {
  name: string;              // Ex: "Groupe Éducatif Horizon"
  code: string;              // Ex: "GEH-001"
  region: string;            // Ex: "Brazzaville"
  city: string;              // Ex: "Brazzaville"
  adminName: string;         // Ex: "Jean Dupont"
  adminEmail: string;        // Ex: "admin@horizon.cg"
  schoolCount: number;       // Ex: 5 écoles
  studentCount: number;      // Ex: 1,350 élèves
  staffCount: number;        // Ex: 95 personnel
  plan: SubscriptionPlan;    // Ex: "Pro"
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;         // Ex: "2024-01-15"
}
```

#### Statistiques (StatCards)
- **Total Groupes** : 245
- **Groupes Actifs** : 230
- **Total Écoles** : 1,245

---

### 2. Utilisateurs
**URL** : `/dashboard/users`  
**Statut** : 🚧 À implémenter

#### Scope Super Admin
> ⚠️ **Important** : Le Super Admin gère **UNIQUEMENT** les Administrateurs de Groupe (`admin_groupe`).

#### Fonctionnalités à Implémenter
- **Liste** des Administrateurs de Groupe
- **Recherche** (nom, email, groupe)
- **Filtres** :
  - Statut (actif, inactif, suspendu)
  - Groupe scolaire
  - Date de création
- **Tri** (nom, dernière connexion)

#### Actions CRUD
- ✅ **Créer** Admin Groupe (associé à un groupe)
- ✅ **Voir détails**
- ✅ **Modifier** informations
- ✅ **Réinitialiser** mot de passe
- ✅ **Activer / Désactiver**
- ✅ **Supprimer** (soft delete)

#### Formulaire Création Admin Groupe
```typescript
interface CreateAdminGroupeForm {
  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Association
  schoolGroupId: string;     // Groupe géré
  
  // Sécurité
  password: string;          // Généré ou manuel
  sendEmail: boolean;        // Envoyer email de bienvenue
}
```

#### Informations Affichées
```typescript
interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin_groupe';      // Uniquement ce rôle
  schoolGroupName: string;   // Groupe géré
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;         // Dernière connexion
  createdAt: string;
}
```

---

### 3. Catégories Métiers
**URL** : `/dashboard/categories`  
**Statut** : 🚧 À implémenter

#### Définition
Les **Catégories Métiers** regroupent les modules par domaine fonctionnel.

**Exemples :**
- 📚 **Pédagogie** (Gestion élèves, Notes, Emploi du temps)
- 💰 **Finance** (Comptabilité, Paie, Frais de scolarité)
- 👥 **Ressources Humaines** (Personnel, Présences, Congés)
- 📱 **Communication** (SMS, Email, Notifications)
- 📊 **Rapports** (Statistiques, Exports, Tableaux de bord)

#### Fonctionnalités
- **Liste** de toutes les catégories
- **Recherche** et filtres
- **Tri** (nom, nombre de modules)

#### Actions CRUD
- ✅ **Créer** catégorie
- ✅ **Modifier** informations
- ✅ **Associer modules** à la catégorie
- ✅ **Définir icône** et couleur
- ✅ **Activer / Désactiver**
- ✅ **Supprimer**

#### Formulaire Création Catégorie
```typescript
interface CreateCategoryForm {
  name: string;              // Ex: "Pédagogie"
  slug: string;              // Ex: "pedagogie"
  description: string;       // Description détaillée
  icon: string;              // Ex: "GraduationCap"
  color: string;             // Ex: "#1D3557"
  moduleIds: string[];       // Modules associés
  planIds: string[];         // Plans ayant accès
  status: 'active' | 'inactive';
}
```

---

### 4. Plans & Tarification
**URL** : `/dashboard/plans`  
**Statut** : 🚧 À implémenter

#### Plans Disponibles
```typescript
type SubscriptionPlan = 'gratuit' | 'premium' | 'pro' | 'institutionnel';
```

#### Fonctionnalités
- **Liste** de tous les plans
- **Comparaison** des fonctionnalités
- **Grille tarifaire**

#### Actions CRUD
- ✅ **Créer** plan
- ✅ **Modifier** tarifs et fonctionnalités
- ✅ **Activer / Désactiver**
- ✅ **Définir modules** inclus

#### Formulaire Création Plan
```typescript
interface CreatePlanForm {
  name: string;              // Ex: "Plan Pro"
  slug: SubscriptionPlan;    // Ex: "pro"
  price: number;             // Ex: 50000 FCFA
  currency: 'FCFA';
  billingPeriod: 'monthly' | 'yearly';
  
  // Limites
  maxSchools: number;        // Ex: 10 écoles
  maxStudents: number;       // Ex: 5000 élèves
  maxStaff: number;          // Ex: 500 personnel
  
  // Fonctionnalités
  features: string[];        // Liste des features
  modules: string[];         // Modules inclus
  
  status: 'active' | 'inactive';
}
```

#### Exemple de Plans
```typescript
const plans = [
  {
    name: 'Gratuit',
    price: 0,
    maxSchools: 1,
    maxStudents: 100,
    maxStaff: 10,
    features: ['Gestion élèves basique', 'Notes simples'],
    modules: ['students', 'grades']
  },
  {
    name: 'Premium',
    price: 25000,
    maxSchools: 3,
    maxStudents: 1000,
    maxStaff: 50,
    features: ['Tout Gratuit +', 'Emploi du temps', 'SMS'],
    modules: ['students', 'grades', 'schedule', 'sms']
  },
  {
    name: 'Pro',
    price: 50000,
    maxSchools: 10,
    maxStudents: 5000,
    maxStaff: 500,
    features: ['Tout Premium +', 'Comptabilité', 'Paie', 'API'],
    modules: ['all']
  },
  {
    name: 'Institutionnel',
    price: 'Sur devis',
    maxSchools: 'Illimité',
    maxStudents: 'Illimité',
    maxStaff: 'Illimité',
    features: ['Tout Pro +', 'Support dédié', 'Formation', 'Personnalisation'],
    modules: ['all']
  }
];
```

---

### 5. Abonnements
**URL** : `/dashboard/subscriptions`  
**Statut** : 🚧 À implémenter

#### Fonctionnalités
- **Liste** de tous les abonnements
- **Recherche** (groupe, plan)
- **Filtres** :
  - Statut (actif, expiré, annulé, en attente)
  - Plan (gratuit, premium, pro, institutionnel)
  - Date d'expiration (< 30 jours, < 7 jours)
- **Tri** (date expiration, montant)

#### Actions
- ✅ **Créer** abonnement (attribuer plan à un groupe)
- ✅ **Voir détails**
- ✅ **Modifier** plan
- ✅ **Renouveler** manuellement
- ✅ **Annuler**
- ✅ **Voir factures**

#### Informations Affichées
```typescript
interface Subscription {
  schoolGroupName: string;   // Ex: "Groupe Horizon"
  planName: string;          // Ex: "Plan Pro"
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;         // Ex: "2024-01-01"
  endDate: string;           // Ex: "2024-12-31"
  autoRenew: boolean;        // Renouvellement auto
  amount: number;            // Ex: 50000 FCFA
  paymentMethod: string;     // Ex: "Virement bancaire"
  lastPaymentDate: string;
  nextPaymentDate: string;
}
```

#### Alertes Abonnements Critiques
- **< 30 jours** : Badge orange
- **< 7 jours** : Badge rouge + notification
- **Expiré** : Badge gris + blocage accès

---

### 6. Modules
**URL** : `/dashboard/modules`  
**Statut** : 🚧 À implémenter

#### Définition
Les **Modules** sont les fonctionnalités de la plateforme E-Pilot.

**Exemples de modules :**
- 📚 Gestion des élèves
- 📝 Gestion des notes
- 📅 Emploi du temps
- 💰 Comptabilité
- 💵 Paie du personnel
- 📱 Application mobile
- 📧 Notifications Email
- 📲 Notifications SMS
- 📊 Rapports avancés
- 🔐 Contrôle d'accès
- 📄 Génération de documents

#### Fonctionnalités
- **Liste** de tous les modules
- **Recherche** et filtres
- **Tri** (nom, catégorie, adoption)

#### Actions CRUD
- ✅ **Créer** module
- ✅ **Modifier** informations
- ✅ **Associer** à une catégorie
- ✅ **Définir** plan minimum requis
- ✅ **Activer / Désactiver**
- ✅ **Marquer** comme Beta
- ✅ **Voir statistiques** d'adoption

#### Formulaire Création Module
```typescript
interface CreateModuleForm {
  name: string;              // Ex: "Gestion des notes"
  slug: string;              // Ex: "grades"
  description: string;
  version: string;           // Ex: "1.2.0"
  categoryId: string;        // Catégorie parente
  icon: string;              // Ex: "FileText"
  status: 'active' | 'inactive' | 'beta';
  requiredPlan: SubscriptionPlan; // Plan minimum
  features: string[];        // Liste des fonctionnalités
}
```

#### Statistiques d'Adoption
```typescript
interface ModuleStats {
  totalGroups: number;       // Groupes ayant accès
  activeGroups: number;      // Groupes utilisant
  adoptionRate: number;      // % d'adoption
  trend: number;             // Tendance (+/-)
}
```

---

### 7. Communication
**URL** : `/dashboard/communication`  
**Statut** : 🚧 À implémenter

#### Fonctionnalités

##### 7.1 Notifications Globales
- **Envoyer** notification à tous les groupes
- **Cibler** par plan (ex: uniquement Plan Pro)
- **Programmer** envoi différé
- **Voir historique** des notifications

**Types de notifications :**
- 📢 Annonce système
- ⚠️ Maintenance programmée
- ✨ Nouvelle fonctionnalité
- 🐛 Correction de bug
- 📚 Mise à jour documentation

##### 7.2 Messages Directs
- **Envoyer** message à un groupe spécifique
- **Répondre** aux demandes
- **Voir historique** des conversations

##### 7.3 Support Technique
- **Voir tickets** de support
- **Répondre** aux demandes
- **Marquer** comme résolu
- **Statistiques** (temps de réponse, satisfaction)

##### 7.4 Newsletter
- **Créer** newsletter mensuelle
- **Envoyer** à tous les admins de groupe
- **Voir statistiques** (ouvertures, clics)

---

### 8. Rapports
**URL** : `/dashboard/reports`  
**Statut** : 🚧 À implémenter

#### Types de Rapports

##### 8.1 Rapports Financiers
- **MRR** (Monthly Recurring Revenue)
- **ARR** (Annual Recurring Revenue)
- **Churn Rate** (taux de désabonnement)
- **ARPU** (Average Revenue Per User)
- **Prévisions** de revenus

##### 8.2 Rapports d'Utilisation
- **Groupes actifs** vs inactifs
- **Modules** les plus utilisés
- **Taux d'adoption** par module
- **Connexions** par jour/semaine/mois

##### 8.3 Rapports Géographiques
- **Répartition** par région
- **Carte interactive** du Congo
- **Croissance** par ville

##### 8.4 Exports
- **PDF** (rapports imprimables)
- **Excel** (données brutes)
- **CSV** (import dans autres outils)

---

### 9. Journal d'Activité
**URL** : `/dashboard/activity-logs`  
**Statut** : 🚧 À implémenter

#### Fonctionnalités
- **Liste** de toutes les actions système
- **Recherche** (utilisateur, action, entité)
- **Filtres** :
  - Type d'action (création, modification, suppression)
  - Entité (groupe, utilisateur, abonnement, etc.)
  - Utilisateur
  - Date
- **Tri** (date, utilisateur)
- **Export** (CSV, PDF)

#### Informations Loggées
```typescript
interface ActivityLog {
  userName: string;          // Ex: "Jean Dupont"
  userRole: UserRole;        // Ex: "super_admin"
  action: string;            // Ex: "Création groupe scolaire"
  entity: string;            // Ex: "SchoolGroup"
  entityId: string;          // ID de l'entité
  details: string;           // Détails de l'action
  ipAddress: string;         // IP de l'utilisateur
  userAgent: string;         // Navigateur
  timestamp: string;         // Date et heure
}
```

#### Exemples d'Actions Loggées
- ✅ Création groupe scolaire
- ✅ Modification plan tarifaire
- ✅ Suppression utilisateur
- ✅ Activation module
- ✅ Renouvellement abonnement
- ✅ Connexion / Déconnexion
- ✅ Changement de mot de passe
- ✅ Export de données

---

### 10. Corbeille
**URL** : `/dashboard/trash`  
**Statut** : 🚧 À implémenter

#### Fonctionnalités
- **Liste** des éléments supprimés
- **Recherche** et filtres
- **Tri** (date suppression, type)

#### Actions
- ✅ **Restaurer** élément
- ✅ **Supprimer définitivement**
- ✅ **Vider** corbeille (tout supprimer)

#### Types d'Éléments
```typescript
type TrashEntityType = 
  | 'user'           // Utilisateurs
  | 'school_group'   // Groupes scolaires
  | 'subscription'   // Abonnements
  | 'module'         // Modules
  | 'category';      // Catégories
```

#### Informations Affichées
```typescript
interface TrashItem {
  entityType: TrashEntityType;
  entityName: string;        // Ex: "Groupe Horizon"
  deletedBy: string;         // Ex: "Admin Système"
  deletedAt: string;         // Date de suppression
  canRestore: boolean;       // Peut être restauré ?
}
```

#### Règles de Rétention
- **30 jours** : Rétention automatique
- **Après 30 jours** : Suppression définitive automatique
- **Restauration** : Possible dans les 30 jours

---

## 🎨 Widgets Dashboard

### Widgets Disponibles

#### 1. Aperçu Financier
**Fichier** : `FinancialOverviewWidget.tsx`

**Contenu :**
- Revenus mensuels (graphique)
- MRR actuel
- Croissance vs mois précédent
- Sélection de période (mois, trimestre, année)
- Filtres (plan, région)

#### 2. Alertes Système
**Fichier** : `SystemAlertsWidget.tsx`

**Contenu :**
- Liste des alertes critiques
- Filtres par type (sécurité, performance, abonnement)
- Recherche
- Actions (marquer comme lu, archiver)

**Types d'alertes :**
- 🔴 Critique (abonnement expiré)
- 🟠 Avertissement (expiration < 7 jours)
- 🔵 Info (nouvelle inscription)

#### 3. Adoption des Modules
**Fichier** : `ModuleStatusWidget.tsx`

**Contenu :**
- Liste des modules
- Taux d'adoption (%)
- Tendance (+/-)
- Tri dynamique
- Détails expandables

#### 4. Activité Temps Réel
**Fichier** : `RealtimeActivityWidget.tsx`

**Contenu :**
- Flux d'activité en direct
- Pause / Play
- Filtres par type
- Export (CSV, PDF)

**Types d'activités :**
- 👤 Connexion utilisateur
- ➕ Création groupe
- 💰 Paiement reçu
- 📝 Modification données
- 🗑️ Suppression

---

## 🔐 Sécurité

### Authentification
- **JWT** tokens
- **Refresh tokens** (7 jours)
- **Session timeout** (30 minutes d'inactivité)
- **2FA** (optionnel)

### Permissions
```typescript
const SUPER_ADMIN_PERMISSIONS = [
  'create:school_group',
  'read:school_group',
  'update:school_group',
  'delete:school_group',
  'create:admin_groupe',
  'read:admin_groupe',
  'update:admin_groupe',
  'delete:admin_groupe',
  'create:plan',
  'update:plan',
  'create:module',
  'update:module',
  'create:category',
  'update:category',
  'read:all_stats',
  'export:all_data',
];
```

### Audit Trail
- **Toutes les actions** sont loggées
- **IP tracking**
- **User agent** enregistré
- **Rétention** : 1 an

---

## 📊 Statistiques et KPI

### KPI Nationaux
```typescript
interface NationalStats {
  // Groupes
  totalSchoolGroups: number;
  activeSchoolGroups: number;
  inactiveSchoolGroups: number;
  suspendedSchoolGroups: number;
  
  // Écoles
  totalSchools: number;
  
  // Utilisateurs
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  
  // Élèves
  totalStudents: number;
  
  // Finance
  estimatedMRR: number;
  estimatedARR: number;
  churnRate: number;
  
  // Abonnements
  activeSubscriptions: number;
  criticalSubscriptions: number;
  
  // Tendances
  trends: {
    schoolGroups: number;    // %
    users: number;           // %
    mrr: number;             // %
    subscriptions: number;   // %
  }
}
```

### Graphiques
- **Croissance** (groupes, utilisateurs, revenus)
- **Répartition** par plan
- **Carte géographique** (régions)
- **Adoption** des modules
- **Activité** quotidienne

---

## 🚀 Prochaines Étapes

### Pages à Implémenter
1. ✅ **Dashboard Overview** (fait)
2. ✅ **Groupes Scolaires** (fait)
3. 🚧 **Utilisateurs** (en cours)
4. 🚧 **Catégories Métiers**
5. 🚧 **Plans & Tarification**
6. 🚧 **Abonnements**
7. 🚧 **Modules**
8. 🚧 **Communication**
9. 🚧 **Rapports**
10. 🚧 **Journal d'Activité**
11. 🚧 **Corbeille**

### Fonctionnalités Avancées
- [ ] **Carte interactive** du Congo
- [ ] **Notifications push** (WebSocket)
- [ ] **Export automatique** (rapports mensuels)
- [ ] **API publique** (pour intégrations)
- [ ] **Webhooks** (événements système)
- [ ] **Thème clair/sombre**
- [ ] **Multi-langue** (Français, Lingala)

---

## ✅ Résumé

Le **Super Admin E-Pilot** dispose de :

✅ **11 pages** de gestion  
✅ **4 widgets** personnalisables  
✅ **Dashboard** temps réel  
✅ **KPI nationaux** complets  
✅ **Gestion** multi-niveaux  
✅ **Sécurité** renforcée  
✅ **Audit trail** complet  

**C'est le centre de contrôle de toute la plateforme E-Pilot Congo ! 🇨🇬**
