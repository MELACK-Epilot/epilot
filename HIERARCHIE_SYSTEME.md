# 🏛️ Hiérarchie du Système E-Pilot Congo

## 📋 Vue d'Ensemble

E-Pilot Congo est une plateforme SaaS multi-niveaux conçue pour gérer l'écosystème éducatif congolais. Le système est organisé en **3 niveaux hiérarchiques** avec des rôles et permissions distincts.

---

## 🎯 Niveau 1 — Super Admin E-Pilot (Plateforme SaaS)

### 👤 Rôle
**`super_admin`** - Administrateur de la plateforme nationale

### 🌍 Vision
**Vue globale nationale** - Gestion de tout l'écosystème E-Pilot au Congo

### ⚡ Pouvoirs et Responsabilités

#### 1. Gestion des Groupes Scolaires
- ✅ **Créer** de nouveaux groupes scolaires
- ✅ **Activer / Désactiver** des groupes
- ✅ **Suspendre** temporairement un groupe
- ✅ **Supprimer** (soft delete vers corbeille)
- ✅ **Voir statistiques** de tous les groupes
- ✅ **Exporter données** des groupes

**Exemples de groupes :**
- Les Lycées Saint-Pierre
- Groupe Éducatif Horizon
- Complexe La Sagesse
- Institut Technique du Congo

#### 2. Gestion des Licences et Abonnements
- ✅ **Créer plans tarifaires** (Gratuit, Premium, Pro, Institutionnel)
- ✅ **Définir grille tarifaire** (prix en FCFA)
- ✅ **Attribuer abonnements** aux groupes
- ✅ **Gérer renouvellements** automatiques
- ✅ **Suivre paiements** et factures
- ✅ **Appliquer promotions** et réductions
- ✅ **Gérer abonnements critiques** (expiration proche)

**Plans disponibles :**
```typescript
type SubscriptionPlan = 'gratuit' | 'premium' | 'pro' | 'institutionnel';

interface Plan {
  name: string;
  price: number;           // FCFA
  billingPeriod: 'monthly' | 'yearly';
  maxSchools: number;      // Nombre d'écoles autorisées
  maxStudents: number;     // Nombre d'élèves total
  maxStaff: number;        // Nombre de personnel
  modules: string[];       // Modules inclus
}
```

#### 3. Statistiques Globales
- ✅ **Dashboard national** avec KPI temps réel
- ✅ **Nombre total de groupes scolaires**
- ✅ **Utilisateurs actifs** (tous niveaux)
- ✅ **MRR (Monthly Recurring Revenue)** estimé
- ✅ **Taux de croissance** (groupes, utilisateurs, revenus)
- ✅ **Abonnements critiques** (à renouveler)
- ✅ **Carte géographique** (répartition par région)

**KPI Super Admin :**
```typescript
interface DashboardStats {
  totalSchoolGroups: number;      // Ex: 245 groupes
  activeUsers: number;            // Ex: 12,450 utilisateurs
  estimatedMRR: number;           // Ex: 45,000,000 FCFA
  criticalSubscriptions: number;  // Ex: 12 abonnements
  trends: {
    schoolGroups: number;         // Ex: +12.5%
    users: number;                // Ex: +8.3%
    mrr: number;                  // Ex: +15.2%
  }
}
```

#### 4. Gestion des Modules
- ✅ **Créer modules** (Gestion élèves, Notes, Comptabilité, etc.)
- ✅ **Activer / Désactiver** modules
- ✅ **Définir versions** (stable, beta)
- ✅ **Associer aux plans** (quel module pour quel plan)
- ✅ **Gérer catégories métiers** (Pédagogie, Finance, RH, etc.)
- ✅ **Suivre adoption** des modules

**Exemples de modules :**
- 📚 Gestion des élèves
- 📝 Gestion des notes
- 💰 Comptabilité et paie
- 📅 Emploi du temps
- 📊 Rapports et statistiques
- 📱 Application mobile
- 🔔 Notifications SMS/Email

#### 5. Gestion des Catégories Métiers
- ✅ **Créer catégories** (Pédagogie, Finance, RH, Communication)
- ✅ **Associer modules** aux catégories
- ✅ **Définir icônes et couleurs**
- ✅ **Gérer visibilité** par plan

**Exemples de catégories :**
```typescript
const categories = [
  {
    name: 'Pédagogie',
    modules: ['Gestion élèves', 'Notes', 'Emploi du temps'],
    icon: 'GraduationCap',
    color: '#1D3557'
  },
  {
    name: 'Finance',
    modules: ['Comptabilité', 'Paie', 'Frais de scolarité'],
    icon: 'DollarSign',
    color: '#E9C46A'
  },
  {
    name: 'Ressources Humaines',
    modules: ['Gestion personnel', 'Présences', 'Congés'],
    icon: 'Users',
    color: '#2A9D8F'
  }
];
```

#### 6. Suivi de l'Activité Système
- ✅ **Journal d'activité global** (tous les groupes)
- ✅ **Logs de connexion** (qui, quand, d'où)
- ✅ **Actions critiques** (création, suppression, modification)
- ✅ **Alertes de sécurité** (tentatives d'intrusion)
- ✅ **Performance système** (temps de réponse, erreurs)
- ✅ **Rapports d'utilisation** (modules les plus utilisés)

#### 7. Communication Globale
- ✅ **Envoyer notifications** à tous les groupes
- ✅ **Annonces système** (maintenance, nouvelles fonctionnalités)
- ✅ **Support technique** (tickets, chat)
- ✅ **Newsletter** (actualités E-Pilot)

#### 8. Gestion des Utilisateurs Système
- ✅ **Créer Administrateurs de Groupe** uniquement
- ✅ **Réinitialiser mots de passe**
- ✅ **Suspendre comptes** (en cas d'abus)
- ✅ **Voir statistiques** par rôle

**Règle importante :**
> ⚠️ Le Super Admin **NE GÈRE PAS** directement les écoles ni les utilisateurs des écoles (enseignants, CPE, etc.). Il gère uniquement les **Groupes Scolaires** et leurs **Administrateurs de Groupe**.

### 📊 Dashboard Super Admin

**Pages disponibles :**
1. **Vue d'ensemble** (`/dashboard`)
   - KPI nationaux
   - Graphiques de croissance
   - Alertes critiques
   - Activité récente

2. **Groupes Scolaires** (`/dashboard/school-groups`)
   - Liste de tous les groupes
   - CRUD complet
   - Filtres (région, statut, plan)
   - Statistiques par groupe

3. **Utilisateurs** (`/dashboard/users`)
   - Liste des Administrateurs de Groupe uniquement
   - Création de nouveaux admins
   - Gestion des rôles

4. **Catégories Métiers** (`/dashboard/categories`)
   - CRUD catégories
   - Association modules

5. **Plans & Tarification** (`/dashboard/plans`)
   - CRUD plans d'abonnement
   - Grille tarifaire
   - Fonctionnalités par plan

6. **Abonnements** (`/dashboard/subscriptions`)
   - Liste de tous les abonnements
   - Filtres (statut, plan, expiration)
   - Renouvellements
   - Factures

7. **Modules** (`/dashboard/modules`)
   - CRUD modules
   - Versions et statuts
   - Statistiques d'adoption

8. **Communication** (`/dashboard/communication`)
   - Notifications globales
   - Messages aux groupes
   - Support technique

9. **Rapports** (`/dashboard/reports`)
   - Rapports financiers
   - Rapports d'utilisation
   - Exports PDF/Excel

10. **Journal d'Activité** (`/dashboard/activity-logs`)
    - Logs système
    - Filtres avancés
    - Recherche

11. **Corbeille** (`/dashboard/trash`)
    - Éléments supprimés
    - Restauration
    - Suppression définitive

---

## 🏢 Niveau 2 — Groupe Scolaire

### 👤 Rôle
**`admin_groupe`** - Administrateur d'un groupe scolaire

### 🌍 Vision
**Vue macro de toutes les écoles du groupe** - Gestion d'un réseau d'établissements

### 📚 Définition
Un **Groupe Scolaire** est une entité qui regroupe plusieurs écoles sous une même direction. C'est une entreprise éducative.

**Exemples concrets :**
- **Les Lycées Saint-Pierre** (3 écoles : Maternelle, Primaire, Lycée)
- **Groupe Éducatif Horizon** (5 écoles : 2 primaires, 2 collèges, 1 lycée)
- **Complexe La Sagesse** (4 écoles : Maternelle, Primaire, Collège, Lycée)

### ⚡ Pouvoirs et Responsabilités

#### 1. Gestion des Écoles
- ✅ **Ajouter écoles** au groupe (dans la limite du plan)
- ✅ **Modifier informations** des écoles
- ✅ **Désactiver / Réactiver** écoles
- ✅ **Supprimer écoles** (soft delete)
- ✅ **Voir statistiques** de chaque école

**Structure d'une école :**
```typescript
interface School {
  id: string;
  name: string;              // Ex: "Lycée Saint-Pierre - Site Brazzaville"
  type: SchoolType;          // maternelle, primaire, collège, lycée
  code: string;              // Ex: "LSP-BZV-001"
  address: string;
  city: string;
  region: string;
  directorId: string;        // Admin école
  studentCount: number;
  staffCount: number;
  status: 'active' | 'inactive';
}

type SchoolType = 'maternelle' | 'primaire' | 'collège' | 'lycée' | 'technique' | 'professionnel';
```

#### 2. Gestion du Personnel Global
- ✅ **Créer Administrateurs d'École**
- ✅ **Créer utilisateurs** (enseignants, CPE, comptables, etc.)
- ✅ **Affecter personnel** aux écoles
- ✅ **Gérer mutations** entre écoles du groupe
- ✅ **Voir statistiques RH** du groupe

**Utilisateurs gérables :**
- Administrateur d'École (`admin_ecole`)
- Enseignants (`enseignant`)
- CPE (`cpe`)
- Comptables (`comptable`)
- Documentalistes, surveillants, etc.

#### 3. Politique Éducative Interne
- ✅ **Définir règlement intérieur** du groupe
- ✅ **Harmoniser programmes** entre écoles
- ✅ **Gérer calendrier scolaire** commun
- ✅ **Définir barèmes de notation**
- ✅ **Créer modèles de documents** (bulletins, certificats)

#### 4. Rapports Consolidés
- ✅ **Statistiques globales** (toutes écoles)
- ✅ **Effectifs totaux** (élèves, personnel)
- ✅ **Résultats scolaires** agrégés
- ✅ **Comparaison** entre écoles
- ✅ **Exports** (PDF, Excel)

#### 5. Gestion Financière Interne
- ✅ **Voir revenus** de toutes les écoles
- ✅ **Gérer budget** du groupe
- ✅ **Répartir ressources** entre écoles
- ✅ **Suivre paiements** des frais de scolarité
- ✅ **Gérer paie** du personnel

#### 6. Modules Actifs
- ✅ **Activer modules** (selon le plan souscrit)
- ✅ **Désactiver modules** non utilisés
- ✅ **Voir statistiques** d'utilisation

**Règle importante :**
> ⚠️ L'Admin Groupe **NE PEUT PAS** créer de modules. Il peut uniquement activer/désactiver les modules fournis par le Super Admin selon son plan d'abonnement.

### 📊 Dashboard Admin Groupe

**Pages disponibles :**
1. **Vue d'ensemble** - KPI du groupe
2. **Écoles** - Liste et gestion des écoles
3. **Personnel** - Tous les utilisateurs du groupe
4. **Élèves** - Effectifs consolidés
5. **Finance** - Budget et revenus
6. **Rapports** - Statistiques consolidées
7. **Paramètres** - Configuration du groupe

---

## 🏫 Niveau 3 — École

### 👤 Rôle
**`admin_ecole`** - Directeur / Administrateur d'une école

### 🌍 Vision
**Vue locale, centrée sur son établissement** - Gestion quotidienne d'une école

### 📚 Définition
Une **École** est un établissement éducatif unique appartenant à un groupe scolaire.

**Exemples :**
- Maternelle Saint-Pierre (Brazzaville)
- Primaire Horizon 1 (Pointe-Noire)
- Lycée La Sagesse (Dolisie)
- Collège Technique du Congo (Brazzaville)

### ⚡ Pouvoirs et Responsabilités

#### 1. Gestion des Élèves
- ✅ **Inscrire nouveaux élèves**
- ✅ **Gérer dossiers élèves** (infos personnelles, parents)
- ✅ **Créer badges personnalisés**
- ✅ **Affecter élèves aux classes**
- ✅ **Gérer transferts** (entre classes)
- ✅ **Archiver élèves** (fin de scolarité)

#### 2. Gestion des Classes
- ✅ **Créer classes** (6ème A, 5ème B, etc.)
- ✅ **Affecter enseignants** aux classes
- ✅ **Définir effectifs** maximum
- ✅ **Gérer salles** de classe
- ✅ **Créer groupes** (TP, TD)

#### 3. Emploi du Temps
- ✅ **Créer emplois du temps** par classe
- ✅ **Affecter salles** aux cours
- ✅ **Gérer absences** enseignants
- ✅ **Remplacements** automatiques
- ✅ **Exporter emplois du temps** (PDF)

#### 4. Gestion des Notes
- ✅ **Saisir notes** (devoirs, contrôles, examens)
- ✅ **Calculer moyennes** automatiques
- ✅ **Générer bulletins** de notes
- ✅ **Conseils de classe**
- ✅ **Délibérations**

#### 5. Admissions
- ✅ **Gérer demandes** d'inscription
- ✅ **Valider dossiers**
- ✅ **Générer listes d'admission** automatiques
- ✅ **Envoyer notifications** aux parents

#### 6. Discipline
- ✅ **Enregistrer sanctions**
- ✅ **Gérer conseils de discipline**
- ✅ **Suivre comportement** élèves
- ✅ **Notifier parents**

#### 7. Présences
- ✅ **Pointer présences** quotidiennes
- ✅ **Gérer absences** (justifiées, non justifiées)
- ✅ **Alertes absences** répétées
- ✅ **Statistiques** de présence

#### 8. Finance Locale
- ✅ **Gérer frais de scolarité** de l'école
- ✅ **Enregistrer paiements**
- ✅ **Générer reçus** automatiques
- ✅ **Suivre impayés**
- ✅ **Relances** automatiques

#### 9. Communication
- ✅ **Envoyer SMS/Email** aux parents
- ✅ **Notifications** automatiques (notes, absences)
- ✅ **Circulaires** et annonces
- ✅ **Messagerie interne**

### 📊 Dashboard Admin École

**Pages disponibles :**
1. **Vue d'ensemble** - KPI de l'école
2. **Élèves** - Liste et gestion
3. **Classes** - Organisation pédagogique
4. **Enseignants** - Personnel de l'école
5. **Emploi du temps** - Planning
6. **Notes** - Saisie et bulletins
7. **Finance** - Frais et paiements
8. **Présences** - Pointage quotidien
9. **Discipline** - Sanctions et conseils
10. **Rapports** - Statistiques de l'école

---

## 🔐 Matrice des Permissions

| Action | Super Admin | Admin Groupe | Admin École |
|--------|-------------|--------------|-------------|
| **Créer Groupe Scolaire** | ✅ | ❌ | ❌ |
| **Créer Plan Tarifaire** | ✅ | ❌ | ❌ |
| **Créer Module** | ✅ | ❌ | ❌ |
| **Créer Catégorie Métier** | ✅ | ❌ | ❌ |
| **Gérer Abonnements** | ✅ | ❌ | ❌ |
| **Créer École** | ❌ | ✅ | ❌ |
| **Créer Admin Groupe** | ✅ | ❌ | ❌ |
| **Créer Admin École** | ❌ | ✅ | ❌ |
| **Créer Enseignant** | ❌ | ✅ | ✅ (son école) |
| **Créer Élève** | ❌ | ❌ | ✅ |
| **Gérer Notes** | ❌ | ❌ | ✅ |
| **Gérer Présences** | ❌ | ❌ | ✅ |
| **Voir Stats Nationales** | ✅ | ❌ | ❌ |
| **Voir Stats Groupe** | ✅ | ✅ | ❌ |
| **Voir Stats École** | ✅ | ✅ | ✅ (son école) |

---

## 📊 Flux de Données

### Propagation Verticale
```
Super Admin (Plateforme)
      |
      | crée / attribue
      v
Groupe Scolaire
      |
      | crée / gère
      v
École
      |
      | contient
      v
Utilisateurs (Enseignants, CPE, etc.)
      |
      | gèrent
      v
Élèves
```

### Exemple Concret
```
Super Admin E-Pilot
  └─ Crée "Groupe Éducatif Horizon" (Plan Pro)
      └─ Admin Groupe crée 3 écoles :
          ├─ Primaire Horizon 1 (Brazzaville)
          │   └─ Admin École gère :
          │       ├─ 450 élèves
          │       ├─ 25 enseignants
          │       └─ 15 classes
          ├─ Collège Horizon (Pointe-Noire)
          │   └─ Admin École gère :
          │       ├─ 380 élèves
          │       ├─ 30 enseignants
          │       └─ 12 classes
          └─ Lycée Horizon (Dolisie)
              └─ Admin École gère :
                  ├─ 520 élèves
                  ├─ 40 enseignants
                  └─ 18 classes
```

---

## 🎯 Règles Métier Importantes

### 1. Création d'Utilisateurs
- **Super Admin** → Crée uniquement **Admin Groupe**
- **Admin Groupe** → Crée **Admin École** + **Personnel** (enseignants, CPE, etc.)
- **Admin École** → Crée **Personnel** de son école uniquement

### 2. Visibilité des Données
- **Super Admin** → Voit **TOUT** (national)
- **Admin Groupe** → Voit **ses écoles** uniquement
- **Admin École** → Voit **son école** uniquement

### 3. Modules et Fonctionnalités
- **Super Admin** → Crée et gère les modules
- **Admin Groupe** → Active/désactive selon son plan
- **Admin École** → Utilise les modules activés

### 4. Abonnements
- **Super Admin** → Attribue plans aux groupes
- **Admin Groupe** → Paie l'abonnement
- **Admin École** → Bénéficie des modules du plan

---

## 🚀 Implémentation Technique

### Types TypeScript
```typescript
// Rôles utilisateurs
export type UserRole = 
  | 'super_admin'      // Niveau 1
  | 'admin_groupe'     // Niveau 2
  | 'admin_ecole'      // Niveau 3
  | 'enseignant'       // Personnel
  | 'cpe'              // Personnel
  | 'comptable';       // Personnel

// Utilisateur
export interface User {
  id: string;
  role: UserRole;
  schoolGroupId?: string;  // Pour admin_groupe et niveaux inférieurs
  schoolId?: string;       // Pour admin_ecole et niveaux inférieurs
}

// Groupe scolaire
export interface SchoolGroup {
  id: string;
  name: string;
  adminId: string;         // Admin Groupe
  schoolCount: number;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'suspended';
}

// École
export interface School {
  id: string;
  name: string;
  schoolGroupId: string;   // Appartient à un groupe
  directorId: string;      // Admin École
  type: SchoolType;
  studentCount: number;
  status: 'active' | 'inactive';
}
```

### Filtres par Rôle
```typescript
// Dans les pages de gestion
const getUserFilter = (user: User) => {
  switch (user.role) {
    case 'super_admin':
      return {}; // Voit tout
    case 'admin_groupe':
      return { schoolGroupId: user.schoolGroupId }; // Ses écoles
    case 'admin_ecole':
      return { schoolId: user.schoolId }; // Son école
    default:
      return { id: user.id }; // Lui-même uniquement
  }
};
```

---

## ✅ Conclusion

Cette hiérarchie à 3 niveaux permet :

1. **Scalabilité** - Gérer des milliers d'écoles au niveau national
2. **Autonomie** - Chaque niveau gère son périmètre
3. **Sécurité** - Permissions strictes par rôle
4. **Flexibilité** - Adaptation aux besoins locaux
5. **Centralisation** - Vue globale pour le Super Admin

**C'est exactement le modèle utilisé par les grands SaaS éducatifs comme Pronote, Google Classroom, ou Blackboard.**

---

**Fichier créé pour clarifier la hiérarchie du système E-Pilot Congo 🇨🇬**
