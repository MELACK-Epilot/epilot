# 🗺️ Roadmap Super Admin E-Pilot Congo

## 📋 État d'Avancement Global

### ✅ Terminé (2/11 pages)
- Dashboard Overview
- Groupes Scolaires

### 🚧 En Cours (0/11 pages)
- Aucune

### ⏳ À Faire (9/11 pages)
- Utilisateurs
- Catégories Métiers
- Plans & Tarification
- Abonnements
- Modules
- Communication
- Rapports
- Journal d'Activité
- Corbeille

**Progression : 18% (2/11)**

---

## 🎯 Phase 1 : Foundation (✅ Terminé)

### 1.1 Dashboard Overview ✅
**Fichier** : `src/features/dashboard/pages/DashboardOverview.tsx`

**Composants créés :**
- ✅ WelcomeCard (carte de bienvenue)
- ✅ StatsWidget (4 KPI avec sparklines)
- ✅ DashboardGrid (widgets drag & drop)
- ✅ FinancialOverviewWidget
- ✅ SystemAlertsWidget
- ✅ ModuleStatusWidget
- ✅ RealtimeActivityWidget

**Features :**
- ✅ KPI temps réel
- ✅ Graphiques interactifs
- ✅ Widgets personnalisables
- ✅ Layout sauvegardé (localStorage)
- ✅ Responsive design
- ✅ Animations GPU-accelerated

### 1.2 Groupes Scolaires ✅
**Fichier** : `src/features/dashboard/pages/SchoolGroups.tsx`

**Features :**
- ✅ Liste complète avec DataTable
- ✅ Recherche et filtres avancés
- ✅ CRUD complet
- ✅ Modal détails
- ✅ StatCards (3 KPI)
- ✅ Tri et pagination
- ✅ Export (CSV, PDF)

---

## 🚀 Phase 2 : Gestion Utilisateurs (Priorité Haute)

### 2.1 Page Utilisateurs 🎯 NEXT
**URL** : `/dashboard/users`  
**Estimation** : 2-3 jours

#### Objectifs
- [ ] Créer page Users.tsx
- [ ] DataTable avec colonnes :
  - Nom complet
  - Email
  - Téléphone
  - Groupe scolaire
  - Statut
  - Dernière connexion
  - Actions
- [ ] Filtres :
  - Statut (actif, inactif, suspendu)
  - Groupe scolaire
  - Date de création
- [ ] Modal création Admin Groupe
- [ ] Modal détails utilisateur
- [ ] Actions :
  - Créer
  - Modifier
  - Réinitialiser mot de passe
  - Activer / Désactiver
  - Supprimer

#### Formulaire Création
```typescript
interface CreateAdminGroupeForm {
  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Association
  schoolGroupId: string;
  
  // Sécurité
  password: string;
  sendWelcomeEmail: boolean;
}
```

#### Validation
- Email unique
- Téléphone valide (format Congo)
- Mot de passe fort (8+ caractères, majuscule, chiffre)
- Groupe scolaire existant

#### API Endpoints
```typescript
GET    /api/users?role=admin_groupe
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/reset-password
```

---

## 🏗️ Phase 3 : Configuration Système (Priorité Haute)

### 3.1 Catégories Métiers
**URL** : `/dashboard/categories`  
**Estimation** : 1-2 jours

#### Objectifs
- [ ] Créer page Categories.tsx
- [ ] Liste des catégories
- [ ] CRUD complet
- [ ] Association modules
- [ ] Sélection icône (Lucide React)
- [ ] Sélection couleur (color picker)

#### Catégories par Défaut
```typescript
const defaultCategories = [
  {
    name: 'Pédagogie',
    slug: 'pedagogie',
    icon: 'GraduationCap',
    color: '#1D3557',
    description: 'Gestion des élèves, notes, emploi du temps'
  },
  {
    name: 'Finance',
    slug: 'finance',
    icon: 'DollarSign',
    color: '#E9C46A',
    description: 'Comptabilité, paie, frais de scolarité'
  },
  {
    name: 'Ressources Humaines',
    slug: 'rh',
    icon: 'Users',
    color: '#2A9D8F',
    description: 'Gestion du personnel, présences, congés'
  },
  {
    name: 'Communication',
    slug: 'communication',
    icon: 'MessageSquare',
    color: '#457B9D',
    description: 'SMS, Email, notifications, messagerie'
  },
  {
    name: 'Rapports',
    slug: 'rapports',
    icon: 'BarChart3',
    color: '#E63946',
    description: 'Statistiques, exports, tableaux de bord'
  }
];
```

### 3.2 Plans & Tarification
**URL** : `/dashboard/plans`  
**Estimation** : 2-3 jours

#### Objectifs
- [ ] Créer page Plans.tsx
- [ ] Grille de comparaison des plans
- [ ] CRUD plans
- [ ] Définition limites (écoles, élèves, personnel)
- [ ] Sélection modules inclus
- [ ] Tarification (FCFA)
- [ ] Période de facturation (mensuel, annuel)

#### Plans par Défaut
```typescript
const defaultPlans = [
  {
    name: 'Gratuit',
    slug: 'gratuit',
    price: 0,
    billingPeriod: 'monthly',
    maxSchools: 1,
    maxStudents: 100,
    maxStaff: 10,
    features: [
      'Gestion élèves basique',
      'Notes simples',
      'Bulletins PDF',
      'Support email'
    ],
    modules: ['students', 'grades']
  },
  {
    name: 'Premium',
    slug: 'premium',
    price: 25000,
    billingPeriod: 'monthly',
    maxSchools: 3,
    maxStudents: 1000,
    maxStaff: 50,
    features: [
      'Tout Gratuit +',
      'Emploi du temps',
      'SMS illimités',
      'Application mobile',
      'Support prioritaire'
    ],
    modules: ['students', 'grades', 'schedule', 'sms', 'mobile']
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: 50000,
    billingPeriod: 'monthly',
    maxSchools: 10,
    maxStudents: 5000,
    maxStaff: 500,
    features: [
      'Tout Premium +',
      'Comptabilité complète',
      'Paie automatisée',
      'API accès',
      'Rapports avancés',
      'Support 24/7'
    ],
    modules: ['all']
  },
  {
    name: 'Institutionnel',
    slug: 'institutionnel',
    price: null, // Sur devis
    billingPeriod: 'yearly',
    maxSchools: -1, // Illimité
    maxStudents: -1,
    maxStaff: -1,
    features: [
      'Tout Pro +',
      'Support dédié',
      'Formation sur site',
      'Personnalisation',
      'SLA garanti',
      'Hébergement dédié'
    ],
    modules: ['all']
  }
];
```

### 3.3 Modules
**URL** : `/dashboard/modules`  
**Estimation** : 2-3 jours

#### Objectifs
- [ ] Créer page Modules.tsx
- [ ] Liste des modules
- [ ] CRUD complet
- [ ] Association catégorie
- [ ] Définition plan minimum requis
- [ ] Gestion versions
- [ ] Statut (actif, inactif, beta)
- [ ] Statistiques d'adoption

#### Modules par Défaut
```typescript
const defaultModules = [
  // Pédagogie
  {
    name: 'Gestion des élèves',
    slug: 'students',
    category: 'pedagogie',
    requiredPlan: 'gratuit',
    version: '1.0.0',
    status: 'active',
    features: [
      'Inscription élèves',
      'Dossiers élèves',
      'Badges personnalisés',
      'Affectation classes'
    ]
  },
  {
    name: 'Gestion des notes',
    slug: 'grades',
    category: 'pedagogie',
    requiredPlan: 'gratuit',
    version: '1.0.0',
    status: 'active',
    features: [
      'Saisie notes',
      'Calcul moyennes',
      'Bulletins PDF',
      'Conseils de classe'
    ]
  },
  {
    name: 'Emploi du temps',
    slug: 'schedule',
    category: 'pedagogie',
    requiredPlan: 'premium',
    version: '1.0.0',
    status: 'active',
    features: [
      'Création emplois du temps',
      'Affectation salles',
      'Gestion absences enseignants',
      'Remplacements'
    ]
  },
  
  // Finance
  {
    name: 'Comptabilité',
    slug: 'accounting',
    category: 'finance',
    requiredPlan: 'pro',
    version: '1.0.0',
    status: 'active',
    features: [
      'Frais de scolarité',
      'Reçus automatiques',
      'Caisse',
      'Rapports financiers'
    ]
  },
  {
    name: 'Paie',
    slug: 'payroll',
    category: 'finance',
    requiredPlan: 'pro',
    version: '1.0.0',
    status: 'active',
    features: [
      'Calcul salaires',
      'Bulletins de paie',
      'Déclarations sociales',
      'Virements bancaires'
    ]
  },
  
  // Communication
  {
    name: 'SMS',
    slug: 'sms',
    category: 'communication',
    requiredPlan: 'premium',
    version: '1.0.0',
    status: 'active',
    features: [
      'Envoi SMS groupés',
      'SMS personnalisés',
      'Notifications automatiques',
      'Historique'
    ]
  },
  {
    name: 'Email',
    slug: 'email',
    category: 'communication',
    requiredPlan: 'gratuit',
    version: '1.0.0',
    status: 'active',
    features: [
      'Envoi emails',
      'Templates',
      'Notifications automatiques',
      'Pièces jointes'
    ]
  },
  
  // Application mobile
  {
    name: 'Application mobile',
    slug: 'mobile',
    category: 'pedagogie',
    requiredPlan: 'premium',
    version: '2.0.0',
    status: 'beta',
    features: [
      'iOS et Android',
      'Consultation notes',
      'Emploi du temps',
      'Notifications push'
    ]
  }
];
```

---

## 💰 Phase 4 : Gestion Financière (Priorité Haute)

### 4.1 Abonnements
**URL** : `/dashboard/subscriptions`  
**Estimation** : 2-3 jours

#### Objectifs
- [ ] Créer page Subscriptions.tsx
- [ ] Liste des abonnements
- [ ] Filtres avancés (statut, plan, expiration)
- [ ] CRUD abonnements
- [ ] Gestion renouvellements
- [ ] Alertes abonnements critiques
- [ ] Historique paiements
- [ ] Génération factures

#### Statuts Abonnements
```typescript
type SubscriptionStatus = 
  | 'active'      // Actif
  | 'expired'     // Expiré
  | 'cancelled'   // Annulé
  | 'pending';    // En attente de paiement

interface Subscription {
  schoolGroupId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount: number;
  currency: 'FCFA';
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'cash';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}
```

#### Alertes
- **< 30 jours** : Badge orange
- **< 7 jours** : Badge rouge + email
- **Expiré** : Badge gris + blocage accès

---

## 📊 Phase 5 : Communication & Rapports (Priorité Moyenne)

### 5.1 Communication
**URL** : `/dashboard/communication`  
**Estimation** : 2-3 jours

#### Objectifs
- [ ] Créer page Communication.tsx
- [ ] Onglets :
  - Notifications globales
  - Messages directs
  - Support technique
  - Newsletter
- [ ] Envoi notifications ciblées
- [ ] Historique communications
- [ ] Templates de messages
- [ ] Statistiques (ouvertures, clics)

### 5.2 Rapports
**URL** : `/dashboard/reports`  
**Estimation** : 3-4 jours

#### Objectifs
- [ ] Créer page Reports.tsx
- [ ] Rapports financiers :
  - MRR / ARR
  - Churn rate
  - ARPU
  - Prévisions
- [ ] Rapports d'utilisation :
  - Groupes actifs
  - Modules utilisés
  - Connexions
- [ ] Rapports géographiques :
  - Carte interactive
  - Répartition par région
- [ ] Exports (PDF, Excel, CSV)

---

## 🔍 Phase 6 : Monitoring & Audit (Priorité Moyenne)

### 6.1 Journal d'Activité
**URL** : `/dashboard/activity-logs`  
**Estimation** : 2 jours

#### Objectifs
- [ ] Créer page ActivityLogs.tsx
- [ ] Liste des logs
- [ ] Filtres avancés :
  - Type d'action
  - Entité
  - Utilisateur
  - Date
- [ ] Recherche full-text
- [ ] Export logs
- [ ] Statistiques d'activité

#### Actions Loggées
```typescript
const loggedActions = [
  'create:school_group',
  'update:school_group',
  'delete:school_group',
  'create:user',
  'update:user',
  'delete:user',
  'create:subscription',
  'update:subscription',
  'cancel:subscription',
  'create:plan',
  'update:plan',
  'create:module',
  'update:module',
  'login',
  'logout',
  'password_reset',
  'export:data'
];
```

### 6.2 Corbeille
**URL** : `/dashboard/trash`  
**Estimation** : 1-2 jours

#### Objectifs
- [ ] Créer page Trash.tsx
- [ ] Liste éléments supprimés
- [ ] Filtres par type
- [ ] Actions :
  - Restaurer
  - Supprimer définitivement
  - Vider corbeille
- [ ] Rétention 30 jours
- [ ] Nettoyage automatique

---

## 🎨 Phase 7 : Améliorations UX (Priorité Basse)

### 7.1 Carte Interactive du Congo
**Estimation** : 2-3 jours

#### Objectifs
- [ ] Intégrer carte du Congo
- [ ] Marqueurs par région
- [ ] Statistiques par région
- [ ] Zoom et navigation
- [ ] Tooltips informatifs

**Bibliothèque** : Leaflet ou Mapbox

### 7.2 Notifications Push
**Estimation** : 2-3 jours

#### Objectifs
- [ ] WebSocket connection
- [ ] Notifications temps réel
- [ ] Badge compteur
- [ ] Son de notification
- [ ] Historique notifications

**Technologie** : Socket.io ou Pusher

### 7.3 Thème Clair/Sombre
**Estimation** : 1-2 jours

#### Objectifs
- [ ] Toggle thème
- [ ] Persistance préférence
- [ ] Adaptation couleurs
- [ ] Transition fluide

---

## 🔌 Phase 8 : API & Intégrations (Priorité Basse)

### 8.1 API Publique
**Estimation** : 3-5 jours

#### Objectifs
- [ ] Documentation API (Swagger)
- [ ] Authentification API (API keys)
- [ ] Rate limiting
- [ ] Webhooks
- [ ] SDK JavaScript

#### Endpoints
```typescript
// Groupes
GET    /api/v1/school-groups
POST   /api/v1/school-groups
GET    /api/v1/school-groups/:id
PUT    /api/v1/school-groups/:id
DELETE /api/v1/school-groups/:id

// Statistiques
GET    /api/v1/stats/national
GET    /api/v1/stats/group/:id
GET    /api/v1/stats/school/:id

// Abonnements
GET    /api/v1/subscriptions
POST   /api/v1/subscriptions
GET    /api/v1/subscriptions/:id
PUT    /api/v1/subscriptions/:id
```

### 8.2 Webhooks
**Estimation** : 2-3 jours

#### Événements
```typescript
const webhookEvents = [
  'school_group.created',
  'school_group.updated',
  'school_group.deleted',
  'subscription.created',
  'subscription.renewed',
  'subscription.expired',
  'subscription.cancelled',
  'payment.received',
  'payment.failed'
];
```

---

## 📅 Timeline Estimé

### Sprint 1 (2 semaines)
- ✅ Dashboard Overview (fait)
- ✅ Groupes Scolaires (fait)
- 🎯 Utilisateurs (2-3 jours)
- 🎯 Catégories Métiers (1-2 jours)

### Sprint 2 (2 semaines)
- Plans & Tarification (2-3 jours)
- Modules (2-3 jours)
- Abonnements (2-3 jours)

### Sprint 3 (2 semaines)
- Communication (2-3 jours)
- Rapports (3-4 jours)
- Journal d'Activité (2 jours)

### Sprint 4 (1 semaine)
- Corbeille (1-2 jours)
- Tests et corrections
- Documentation

### Sprint 5+ (Optionnel)
- Carte interactive
- Notifications push
- Thème clair/sombre
- API publique
- Webhooks

**Durée totale estimée : 7-8 semaines**

---

## 🎯 Prochaine Action Immédiate

### Page Utilisateurs (Priorité #1)

**Fichier à créer** : `src/features/dashboard/pages/Users.tsx`

**Template de départ** :
```typescript
/**
 * Page Utilisateurs - Gestion des Administrateurs de Groupe
 * @module Users
 */

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '../components/DataTable';
import { useUsers } from '../hooks/useUsers';

export const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useUsers();

  const columns = [
    {
      accessorKey: 'fullName',
      header: 'Nom Complet',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'schoolGroupName',
      header: 'Groupe Scolaire',
    },
    {
      accessorKey: 'status',
      header: 'Statut',
    },
    {
      accessorKey: 'lastLogin',
      header: 'Dernière Connexion',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Actions buttons */}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Admin Groupe
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users || []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Users;
```

---

## ✅ Checklist de Validation

Pour chaque page, vérifier :

### Fonctionnel
- [ ] CRUD complet fonctionne
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent
- [ ] Tri fonctionne
- [ ] Pagination fonctionne
- [ ] Validation formulaires
- [ ] Messages d'erreur clairs

### Performance
- [ ] Pas de re-renders inutiles
- [ ] Memoization optimale
- [ ] Lazy loading images
- [ ] Skeleton loaders
- [ ] Pagination côté serveur

### UX/UI
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Animations fluides
- [ ] États de chargement
- [ ] Messages de succès/erreur
- [ ] Confirmations avant suppression
- [ ] Accessibilité (WCAG 2.2 AA)

### Sécurité
- [ ] Validation côté serveur
- [ ] Protection CSRF
- [ ] Sanitization inputs
- [ ] Permissions vérifiées
- [ ] Logs d'activité

---

**Roadmap Super Admin E-Pilot Congo - Prêt pour le développement ! 🚀**
