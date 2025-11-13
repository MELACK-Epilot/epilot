# 📊 ANALYSE - Espace Utilisateur École (Proviseur/Directeur)

## 🎯 Contexte

L'utilisateur école (proviseur, directeur, etc.) appartient à un **groupe scolaire** géré par un **admin de groupe**.

### Hiérarchie
```
Admin Groupe (admin_groupe)
      |
      | assigne modules/catégories
      v
Groupe Scolaire
      |
      | contient
      v
École
      |
      | contient
      v
Utilisateur École (proviseur, directeur, enseignant, etc.)
```

---

## 🔑 Fonctionnalités de Base Requises

### 1. **Modules Pédagogiques** 📚
- ✅ Voir les modules assignés par l'admin de groupe
- ✅ Filtrer par catégorie
- ✅ Rechercher un module
- ✅ Voir les détails d'un module
- ✅ Activer/Désactiver un module (si permissions)

### 2. **Catégories Métiers** 🏷️
- ✅ Voir les catégories assignées
- ✅ Voir les modules par catégorie
- ✅ Statistiques par catégorie

### 3. **Dashboard** 📊
- ✅ Widgets personnalisés selon le rôle
- ✅ Accès rapide aux modules actifs
- ✅ Statistiques d'utilisation

### 4. **Profil & Paramètres** ⚙️
- ✅ Informations personnelles
- ✅ Préférences
- ✅ Emploi du temps

---

## 🗄️ Modèle de Données

### Tables Supabase

#### 1. `modules`
```sql
- id (UUID)
- name (TEXT)
- slug (TEXT)
- description (TEXT)
- category_id (UUID) → business_categories
- icon (TEXT)
- color (TEXT)
- version (TEXT)
- plan_required (subscription_plan)
- status (status)
- is_core (BOOLEAN)
```

#### 2. `business_categories`
```sql
- id (UUID)
- name (TEXT)
- slug (TEXT)
- description (TEXT)
- icon (TEXT)
- color (TEXT)
- status (status)
```

#### 3. `school_group_modules` (à créer)
```sql
- id (UUID)
- school_group_id (UUID) → school_groups
- module_id (UUID) → modules
- is_active (BOOLEAN)
- activated_at (TIMESTAMP)
- activated_by (UUID) → users
```

---

## 🎨 Architecture React 19

### Hooks React Query (Best Practices)

#### 1. `useUserModules.ts`
```typescript
export const useUserModules = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['user-modules', user?.schoolGroupId],
    queryFn: async () => {
      // Récupérer les modules du groupe scolaire
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          category:business_categories(*)
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### 2. `useUserCategories.ts`
```typescript
export const useUserCategories = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['user-categories', user?.schoolGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_categories')
        .select(`
          *,
          modules:modules(count)
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 5 * 60 * 1000,
  });
};
```

---

## 📱 Pages à Implémenter

### 1. **Mes Modules** (`/user/modules`)

**Fonctionnalités** :
- Liste des modules disponibles
- Filtres : Catégorie, Statut, Plan
- Recherche par nom
- Vue grille/liste
- Détails module (dialog)

**Composants** :
```
MyModules.tsx
├── ModulesHeader (titre, recherche, filtres)
├── ModulesGrid (grille de cards)
│   └── ModuleCard (card individuelle)
└── ModuleDetailsDialog (détails complets)
```

### 2. **Mes Catégories** (`/user/categories`)

**Fonctionnalités** :
- Liste des catégories
- Nombre de modules par catégorie
- Filtrer modules par catégorie

**Composants** :
```
MyCategories.tsx
├── CategoriesGrid
│   └── CategoryCard
└── CategoryModulesDialog
```

### 3. **Dashboard Amélioré**

**Ajouts** :
- Widget "Modules Actifs"
- Widget "Catégories Disponibles"
- Accès rapide aux modules favoris

---

## 🎨 Design System

### Couleurs par Catégorie
```typescript
const CATEGORY_COLORS = {
  'gestion-scolaire': '#2A9D8F',      // Vert
  'ressources-humaines': '#1D3557',   // Bleu
  'finances': '#E9C46A',              // Or
  'communication': '#457B9D',         // Bleu clair
  'pedagogie': '#E63946',             // Rouge
  'vie-scolaire': '#9D4EDD',          // Violet
  'infrastructure': '#F77F00',        // Orange
  'reporting': '#06D6A0',             // Vert menthe
};
```

### Icônes par Catégorie
```typescript
import {
  GraduationCap,    // Gestion scolaire
  Users,            // RH
  DollarSign,       // Finances
  MessageSquare,    // Communication
  BookOpen,         // Pédagogie
  Heart,            // Vie scolaire
  Building,         // Infrastructure
  BarChart,         // Reporting
} from 'lucide-react';
```

---

## 🔐 Permissions & RLS

### Politiques Supabase

#### Modules
```sql
-- L'utilisateur voit les modules de son groupe
CREATE POLICY "user_view_group_modules"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.school_group_id IS NOT NULL
    )
  );
```

#### Catégories
```sql
-- L'utilisateur voit toutes les catégories actives
CREATE POLICY "user_view_categories"
  ON business_categories FOR SELECT
  USING (status = 'active');
```

---

## 🚀 Implémentation Progressive

### Phase 1 (Immédiat)
1. ✅ Créer hooks `useUserModules` et `useUserCategories`
2. ✅ Page "Mes Modules" avec liste et filtres
3. ✅ Ajouter navigation dans sidebar
4. ✅ Widget "Modules" dans dashboard

### Phase 2 (Court terme)
1. Page "Mes Catégories"
2. Détails module (dialog)
3. Favoris modules
4. Statistiques d'utilisation

### Phase 3 (Moyen terme)
1. Activation/Désactivation modules
2. Configuration modules
3. Historique d'utilisation
4. Notifications modules

---

## 📊 Métriques de Succès

### Performance
- Temps de chargement < 1s
- Cache React Query efficace
- Pagination si > 50 modules

### UX
- Recherche instantanée
- Filtres intuitifs
- Design cohérent avec dashboard admin

### Accessibilité
- WCAG 2.2 AA
- Navigation clavier
- Screen reader friendly

---

## 🎯 Différences avec Dashboard Admin

| Fonctionnalité | Dashboard Admin | Espace Utilisateur |
|----------------|-----------------|-------------------|
| **Modules** | CRUD complet | Lecture seule |
| **Catégories** | CRUD complet | Lecture seule |
| **Scope** | Tous les modules | Modules du groupe |
| **Actions** | Créer, Modifier, Supprimer | Voir, Utiliser |
| **Stats** | Globales (plateforme) | Locales (groupe) |

---

## 🔧 Stack Technique

### React 19 Best Practices
- ✅ Server Components (si Next.js)
- ✅ Suspense boundaries
- ✅ Error boundaries
- ✅ useTransition pour UI optimiste
- ✅ useDeferredValue pour recherche
- ✅ React Query pour cache

### TypeScript
- ✅ Types stricts
- ✅ Interfaces partagées
- ✅ Zod pour validation

### Performance
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Memoization (useMemo, useCallback)
- ✅ Virtual scrolling (si > 100 items)

---

## 📝 Prochaines Étapes

1. **Créer les hooks** (`useUserModules`, `useUserCategories`)
2. **Implémenter page Modules** avec filtres et recherche
3. **Ajouter navigation** dans sidebar
4. **Créer composants** réutilisables
5. **Tester** avec données réelles
6. **Documenter** l'utilisation

---

## ✅ Checklist

### Hooks
- [ ] `useUserModules.ts`
- [ ] `useUserCategories.ts`
- [ ] `useModuleDetails.ts`

### Pages
- [ ] `MyModules.tsx`
- [ ] `MyCategories.tsx`
- [ ] Dashboard widgets

### Composants
- [ ] `ModuleCard.tsx`
- [ ] `CategoryCard.tsx`
- [ ] `ModuleDetailsDialog.tsx`
- [ ] `ModulesFilters.tsx`

### Navigation
- [ ] Ajouter "Mes Modules" dans sidebar
- [ ] Ajouter "Mes Catégories" dans sidebar
- [ ] Routes `/user/modules` et `/user/categories`

---

## 🎉 Résultat Attendu

Un espace utilisateur école **complet et fonctionnel** où :
- ✅ L'utilisateur voit les modules de son groupe
- ✅ Navigation intuitive et rapide
- ✅ Filtres et recherche performants
- ✅ Design cohérent avec le reste de l'app
- ✅ Code maintenable et scalable

**Prêt pour l'implémentation !** 🚀🇨🇬
