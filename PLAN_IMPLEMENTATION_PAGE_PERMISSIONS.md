# 🚀 PLAN D'IMPLÉMENTATION - PAGE PERMISSIONS & MODULES

## 🎯 OBJECTIF

Créer une page dédiée complète pour la gestion des permissions et modules, accessible depuis le Sidebar.

---

## 📋 ÉTAPES D'IMPLÉMENTATION

### Phase 1: Structure de Base ✅

#### 1.1 Créer la Page Principale
```typescript
// src/features/dashboard/pages/PermissionsModulesPage.tsx

Structure:
├─ Header avec titre et description
├─ KPIs (statistiques)
├─ Système d'onglets
├─ Filtres et actions
└─ Contenu dynamique selon onglet
```

#### 1.2 Créer les Composants d'Onglets
```typescript
// src/features/dashboard/components/permissions/
├─ UsersPermissionsView.tsx      (Vue utilisateurs)
├─ MatrixPermissionsView.tsx     (Vue matricielle)
├─ ProfilesPermissionsView.tsx   (Profils prédéfinis)
└─ HistoryPermissionsView.tsx    (Historique)
```

#### 1.3 Ajouter la Route
```typescript
// src/App.tsx
<Route path="permissions-modules" element={
  <ProtectedRoute roles={['admin_groupe']}>
    <PermissionsModulesPage />
  </ProtectedRoute>
} />
```

#### 1.4 Ajouter au Sidebar
```typescript
// src/features/dashboard/components/Sidebar/SidebarNav.tsx
{
  title: 'Permissions & Modules',
  icon: Shield,
  href: '/dashboard/permissions-modules',
  badge: usersWithoutModulesCount,
  roles: ['admin_groupe'],
}
```

---

### Phase 2: Onglet 1 - Vue Utilisateurs ✅

#### Réutiliser Composants Existants
```typescript
// Migrer depuis AssignModules.tsx
├─ AssignModulesKPIs
├─ AssignModulesFilters
├─ UserTableView
└─ UserModulesDialog.v2
```

#### Améliorations
```typescript
✅ Meilleure intégration visuelle
✅ Actions rapides inline
✅ Prévisualisation modules au survol
✅ Indicateurs visuels clairs
```

---

### Phase 3: Onglet 2 - Vue Matricielle 🆕

#### Structure
```typescript
interface MatrixView {
  rows: User[];
  columns: Category[];
  cells: {
    userId: string;
    categoryId: string;
    modulesCount: number;
    totalModules: number;
    hasAccess: boolean;
  }[];
}
```

#### Composant
```typescript
// MatrixPermissionsView.tsx
├─ En-tête avec catégories
├─ Lignes avec utilisateurs
├─ Cellules interactives
│  ├─ Clic: Toggle catégorie
│  ├─ Hover: Détails modules
│  └─ Couleurs: Statut assignation
└─ Actions en masse par colonne/ligne
```

#### Features
```typescript
✅ Clic cellule: Assigner/Retirer catégorie
✅ Hover: Tooltip avec modules
✅ Sélection ligne: Tous les users
✅ Sélection colonne: Toutes les catégories
✅ Couleurs: Vert (complet), Orange (partiel), Gris (aucun)
```

---

### Phase 4: Onglet 3 - Profils Prédéfinis 🆕

#### Structure BDD
```sql
-- Table pour profils d'assignation
CREATE TABLE assignment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID REFERENCES school_groups(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  role VARCHAR(50),
  modules JSONB NOT NULL, -- Array de module IDs
  categories JSONB, -- Array de category IDs
  permissions JSONB, -- {canRead, canWrite, canDelete, canExport}
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_assignment_profiles_group ON assignment_profiles(school_group_id);
CREATE INDEX idx_assignment_profiles_role ON assignment_profiles(role);
```

#### Profils par Défaut
```typescript
const DEFAULT_PROFILES = {
  proviseur: {
    name: 'Profil Proviseur Complet',
    categories: [
      'Pédagogie & Évaluations',
      'Finances & Comptabilité',
      'Scolarité & Admissions',
      'Vie Scolaire & Discipline',
      'Communication',
      'Documents & Rapports'
    ],
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canExport: true
    }
  },
  enseignant: {
    name: 'Profil Enseignant Standard',
    modules: [
      'Cahier de textes',
      'Notes & évaluations',
      'Emplois du temps',
      'Messagerie',
      'Hub Documentaire'
    ],
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: false,
      canExport: false
    }
  },
  // ... autres profils
};
```

#### Composant
```typescript
// ProfilesPermissionsView.tsx
├─ Liste des profils
│  ├─ Carte par profil
│  ├─ Modules/Catégories inclus
│  ├─ Permissions
│  └─ Actions (Appliquer, Modifier, Dupliquer, Supprimer)
├─ Formulaire création/édition
└─ Modal application à utilisateurs
```

#### Features
```typescript
✅ Créer profil personnalisé
✅ Modifier profil existant
✅ Dupliquer profil
✅ Appliquer à un/plusieurs users
✅ Définir profil par défaut par rôle
✅ Import/Export profils
```

---

### Phase 5: Onglet 4 - Historique 🆕

#### Structure BDD
```sql
-- Table pour historique assignations
CREATE TABLE assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID REFERENCES school_groups(id),
  user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'assign_module', 'remove_module', 'assign_category', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'module', 'category', 'profile'
  entity_id UUID,
  entity_name VARCHAR(255),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_assignment_history_group ON assignment_history(school_group_id);
CREATE INDEX idx_assignment_history_target ON assignment_history(target_user_id);
CREATE INDEX idx_assignment_history_date ON assignment_history(created_at DESC);
```

#### Composant
```typescript
// HistoryPermissionsView.tsx
├─ Timeline des actions
├─ Filtres (date, user, type action)
├─ Détails par action
└─ Actions (Annuler, Exporter)
```

#### Features
```typescript
✅ Timeline chronologique
✅ Filtres avancés
✅ Détails complets par action
✅ Annulation possible (undo)
✅ Export historique
✅ Recherche full-text
```

---

## 🎨 DESIGN SYSTEM

### Couleurs
```typescript
const COLORS = {
  primary: '#2A9D8F',      // Vert E-Pilot
  secondary: '#1D3557',    // Bleu institutionnel
  success: '#10B981',      // Vert succès
  warning: '#F59E0B',      // Orange warning
  danger: '#EF4444',       // Rouge danger
  info: '#3B82F6',         // Bleu info
};
```

### Icônes
```typescript
import {
  Shield,        // Permissions
  Package,       // Modules
  Grid3x3,       // Matrice
  UserCog,       // Profils
  History,       // Historique
  CheckCircle2,  // Assigné
  XCircle,       // Non assigné
  AlertCircle,   // Partiel
} from 'lucide-react';
```

---

## 📊 HOOKS NÉCESSAIRES

### Existants (Réutiliser)
```typescript
✅ useSchoolGroupModules
✅ useSchoolGroupCategories
✅ useUserAssignedModules
✅ useAssignMultipleModules
✅ useAssignCategory
✅ useAssignmentStats
```

### Nouveaux (Créer)
```typescript
// src/features/dashboard/hooks/

1. useMatrixPermissions.ts
   - Récupère matrice complète
   - Toggle assignation rapide

2. useAssignmentProfiles.ts
   - CRUD profils
   - Application profils

3. useAssignmentHistory.ts
   - Récupère historique
   - Annulation actions

4. useBulkAssignment.ts
   - Assignation en masse
   - Validation bulk
```

---

## 🔧 COMPOSANTS RÉUTILISABLES

### Créer Library
```typescript
// src/features/dashboard/components/permissions/shared/

1. PermissionBadge.tsx
   - Badge avec statut permission
   - Couleurs selon niveau

2. ModuleCard.tsx
   - Carte module avec détails
   - Actions rapides

3. CategoryAccordion.tsx
   - Accordéon catégorie
   - Liste modules

4. UserAvatar.tsx
   - Avatar utilisateur
   - Tooltip infos

5. AssignmentStats.tsx
   - Statistiques assignation
   - Graphiques mini
```

---

## 📱 RESPONSIVE

### Breakpoints
```typescript
// Mobile: < 768px
- Onglets en dropdown
- Tableau en cartes
- Matrice scrollable

// Tablet: 768px - 1024px
- Onglets compacts
- Tableau réduit
- Matrice avec scroll horizontal

// Desktop: > 1024px
- Vue complète
- Tous les onglets visibles
- Matrice full width
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1: Base
```
☐ Créer PermissionsModulesPage.tsx
☐ Ajouter route dans App.tsx
☐ Ajouter lien Sidebar
☐ Créer structure onglets
☐ Migrer KPIs
```

### Phase 2: Vue Utilisateurs
```
☐ Migrer UserTableView
☐ Migrer UserModulesDialog
☐ Améliorer filtres
☐ Ajouter actions rapides
☐ Tests
```

### Phase 3: Vue Matricielle
```
☐ Créer MatrixPermissionsView
☐ Hook useMatrixPermissions
☐ Cellules interactives
☐ Tooltips détails
☐ Actions bulk
☐ Tests
```

### Phase 4: Profils
```
☐ Migration BDD (assignment_profiles)
☐ Créer ProfilesPermissionsView
☐ Hook useAssignmentProfiles
☐ CRUD profils
☐ Application profils
☐ Profils par défaut
☐ Tests
```

### Phase 5: Historique
```
☐ Migration BDD (assignment_history)
☐ Créer HistoryPermissionsView
☐ Hook useAssignmentHistory
☐ Timeline
☐ Filtres
☐ Annulation
☐ Tests
```

### Phase 6: Polish
```
☐ Animations
☐ Loading states
☐ Error handling
☐ Responsive
☐ Accessibility
☐ Documentation
```

---

## 🧪 TESTS

### Tests Unitaires
```typescript
// Hooks
✅ useMatrixPermissions
✅ useAssignmentProfiles
✅ useAssignmentHistory

// Composants
✅ MatrixPermissionsView
✅ ProfilesPermissionsView
✅ HistoryPermissionsView
```

### Tests E2E
```typescript
✅ Assignation module via matrice
✅ Création profil
✅ Application profil à user
✅ Annulation assignation
✅ Export permissions
```

---

## 📚 DOCUMENTATION

### Pour Admins
```markdown
1. Guide d'utilisation
2. Vidéos tutoriels
3. Best practices
4. FAQ
```

### Pour Développeurs
```markdown
1. Architecture
2. Hooks API
3. Composants
4. Migrations BDD
```

---

## 🎯 TIMELINE

### Semaine 1
```
Jour 1-2: Phase 1 (Base + Route + Sidebar)
Jour 3-4: Phase 2 (Vue Utilisateurs)
Jour 5: Tests et ajustements
```

### Semaine 2
```
Jour 1-2: Phase 3 (Vue Matricielle)
Jour 3-4: Phase 4 (Profils - BDD + UI)
Jour 5: Tests et ajustements
```

### Semaine 3
```
Jour 1-2: Phase 5 (Historique - BDD + UI)
Jour 3-4: Phase 6 (Polish + Responsive)
Jour 5: Tests finaux + Documentation
```

---

## ✅ CRITÈRES DE SUCCÈS

### Fonctionnels
```
✅ Toutes les fonctionnalités actuelles préservées
✅ Vue matricielle opérationnelle
✅ Profils créables et applicables
✅ Historique complet et exploitable
✅ Performance maintenue
```

### UX
```
✅ Navigation intuitive
✅ Moins de 3 clics pour assigner
✅ Feedback visuel clair
✅ Responsive sur tous devices
✅ Accessible (WCAG AA)
```

### Technique
```
✅ Code maintenable
✅ Composants réutilisables
✅ Tests > 80% coverage
✅ Performance < 2s load
✅ Documentation complète
```

---

## 🚀 PRÊT À DÉMARRER?

**Prochaine étape:** Créer la structure de base de la page!

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 6.1 Plan Implémentation  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Plan Validé - Prêt à Implémenter
