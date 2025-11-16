# 📋 PROPOSITION - Menu "Actions & Communication"

## 🎯 Objectif

Créer une section dédiée dans la sidebar avec un **sous-menu déroulant** pour organiser toutes les actions et communications de manière professionnelle.

---

## 🎨 Design Proposé

### Structure du Menu

```
📊 Tableau de bord
🏢 Mon Établissement
📚 Mes Modules

▼ 🎯 Actions & Communication  ← NOUVEAU (déroulant)
  ├── 📧 Contacter l'Admin
  ├── 🏫 Contacter les Écoles
  ├── 📤 Partager des Fichiers
  ├── 📄 Hub Documentaire
  ├── 📋 État des Besoins
  ├── 🌐 Réseau des Écoles
  └── 📅 Demande de Réunion

⚙️ Paramètres
🚪 Déconnexion
```

---

## 💻 Implémentation Proposée

### Option 1: Sous-menu Déroulant (Recommandé)

#### Avantages ✅
- Navigation organisée et claire
- Économise de l'espace dans la sidebar
- Effet visuel moderne (animation dropdown)
- Groupement logique des actions

#### Structure
```typescript
{
  title: 'Actions & Communication',
  icon: Zap, // ou MessageSquareMore
  badge: null,
  roles: ['admin_groupe', 'proviseur', 'directeur'],
  subItems: [
    {
      title: 'Contacter l\'Admin',
      icon: Mail,
      href: '/user-space/contact-admin',
    },
    {
      title: 'Contacter les Écoles',
      icon: School,
      href: '/user-space/contact-schools',
    },
    {
      title: 'Partager des Fichiers',
      icon: Share2,
      href: '/user-space/share-files',
    },
    {
      title: 'Hub Documentaire',
      icon: FileText,
      href: '/user-space/documents',
      badge: 3, // Nouveaux documents
    },
    {
      title: 'État des Besoins',
      icon: ClipboardList,
      href: '/user-space/resource-requests',
    },
    {
      title: 'Réseau des Écoles',
      icon: Users,
      href: '/user-space/school-network',
    },
    {
      title: 'Demande de Réunion',
      icon: Calendar,
      href: '/user-space/meeting-requests',
    },
  ],
}
```

---

### Option 2: Pages Séparées (Alternative)

#### Avantages ✅
- Chaque action a sa propre URL
- Navigation directe
- Meilleur pour le SEO

#### Structure
```typescript
// Items directs dans la sidebar
{
  title: 'Contacter l\'Admin',
  icon: Mail,
  href: '/user-space/contact-admin',
  roles: ['admin_groupe', 'proviseur'],
},
{
  title: 'Hub Documentaire',
  icon: FileText,
  href: '/user-space/documents',
  badge: 3,
  roles: ['admin_groupe', 'proviseur', 'directeur'],
},
// ... etc
```

---

## 🎨 Design du Sous-menu (Option 1)

### Visuel

```
┌─────────────────────────────────────┐
│ 📊 Tableau de bord                  │
│ 🏢 Mon Établissement                │
│ 📚 Mes Modules                      │
│                                     │
│ ▼ 🎯 Actions & Communication        │ ← Cliquable
│   ├─ 📧 Contacter l'Admin          │
│   ├─ 🏫 Contacter les Écoles       │
│   ├─ 📤 Partager des Fichiers      │
│   ├─ 📄 Hub Documentaire      [3]  │
│   ├─ 📋 État des Besoins           │
│   ├─ 🌐 Réseau des Écoles          │
│   └─ 📅 Demande de Réunion         │
│                                     │
│ ⚙️ Paramètres                       │
└─────────────────────────────────────┘
```

### Comportement

1. **Fermé par défaut**
   - Affiche uniquement "▶ Actions & Communication"
   - Icône chevron vers la droite

2. **Au clic**
   - Animation de rotation du chevron (90°)
   - Slide down des sous-items
   - Indentation des sous-items

3. **Sous-item actif**
   - Highlight de l'item parent ET du sous-item
   - Badge visible sur le parent si sous-item a badge

---

## 📁 Structure des Fichiers

### Nouveaux Composants

```
src/features/dashboard/components/Sidebar/
├── SidebarNavItem.tsx           (existant - à modifier)
├── SidebarNavItemWithSubmenu.tsx  (nouveau)
└── types.ts                     (existant - à modifier)
```

### Nouvelles Pages

```
src/features/user-space/pages/
├── ContactAdminPage.tsx         (nouveau)
├── ContactSchoolsPage.tsx       (nouveau)
├── ShareFilesPage.tsx           (nouveau)
├── DocumentHubPage.tsx          (nouveau)
├── ResourceRequestsPage.tsx     (nouveau)
├── SchoolNetworkPage.tsx        (nouveau)
└── MeetingRequestsPage.tsx      (nouveau)
```

### Routes

```typescript
// src/routes/userSpaceRoutes.tsx
{
  path: '/user-space',
  element: <DashboardLayout />,
  children: [
    { path: 'establishment', element: <EstablishmentPage /> },
    { path: 'contact-admin', element: <ContactAdminPage /> },
    { path: 'contact-schools', element: <ContactSchoolsPage /> },
    { path: 'share-files', element: <ShareFilesPage /> },
    { path: 'documents', element: <DocumentHubPage /> },
    { path: 'resource-requests', element: <ResourceRequestsPage /> },
    { path: 'school-network', element: <SchoolNetworkPage /> },
    { path: 'meeting-requests', element: <MeetingRequestsPage /> },
  ],
}
```

---

## 🎯 Recommandation

### ✅ Option 1: Sous-menu Déroulant

**Pourquoi?**
1. **Organisation claire** - Toutes les actions au même endroit
2. **Économie d'espace** - Sidebar pas surchargée
3. **UX moderne** - Effet dropdown professionnel
4. **Évolutif** - Facile d'ajouter de nouvelles actions

**Quand utiliser?**
- Quand on a 5+ actions liées
- Quand on veut grouper logiquement
- Quand l'espace sidebar est limité

---

## 🚀 Plan d'Implémentation

### Phase 1: Types & Structure
1. Modifier `types.ts` pour supporter les sous-menus
2. Créer `NavigationItemWithSubmenu` interface

### Phase 2: Composants
1. Créer `SidebarNavItemWithSubmenu.tsx`
2. Ajouter animation dropdown
3. Gérer l'état ouvert/fermé

### Phase 3: Pages
1. Créer les 7 nouvelles pages
2. Migrer le contenu des modals vers les pages
3. Ajouter breadcrumbs

### Phase 4: Routes
1. Ajouter les routes dans `userSpaceRoutes.tsx`
2. Tester la navigation
3. Gérer les permissions par rôle

### Phase 5: Migration
1. Retirer les boutons de `EstablishmentPage`
2. Garder uniquement les KPIs et infos
3. Rediriger vers les nouvelles pages

---

## 📊 Comparaison Avant/Après

### ❌ Avant
```
EstablishmentPage:
- Infos groupe scolaire
- 7 boutons d'action éparpillés
- Modals qui s'ouvrent
- Pas de navigation claire
```

### ✅ Après
```
Sidebar:
- Menu "Actions & Communication"
- 7 sous-items organisés
- Navigation claire

Pages dédiées:
- URL propre pour chaque action
- Contenu complet
- Breadcrumbs
- Meilleure UX
```

---

## 🎨 Exemple de Code

### NavigationItem avec Sous-menu

```typescript
interface NavigationItemWithSubmenu extends NavigationItem {
  subItems?: NavigationItem[];
  defaultOpen?: boolean;
}

const NAVIGATION_ITEMS: NavigationItemWithSubmenu[] = [
  // ... autres items
  {
    title: 'Actions & Communication',
    icon: Zap,
    href: '#', // Pas de lien direct
    roles: ['admin_groupe', 'proviseur', 'directeur'],
    subItems: [
      {
        title: 'Contacter l\'Admin',
        icon: Mail,
        href: '/user-space/contact-admin',
      },
      {
        title: 'Hub Documentaire',
        icon: FileText,
        href: '/user-space/documents',
        badge: 3,
      },
      // ... autres sous-items
    ],
  },
];
```

### Composant avec Dropdown

```tsx
const [isOpen, setIsOpen] = useState(false);

return (
  <div>
    {/* Item parent */}
    <button onClick={() => setIsOpen(!isOpen)}>
      <ChevronRight className={cn(
        "transition-transform",
        isOpen && "rotate-90"
      )} />
      <Icon />
      <span>Actions & Communication</span>
    </button>

    {/* Sous-items */}
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          {subItems.map(item => (
            <Link to={item.href} className="pl-8">
              <item.icon />
              <span>{item.title}</span>
            </Link>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
```

---

## ✅ Avantages de cette Approche

### Pour l'Utilisateur
- ✅ Navigation claire et organisée
- ✅ Toutes les actions au même endroit
- ✅ URLs propres et partageables
- ✅ Breadcrumbs pour se repérer

### Pour le Développeur
- ✅ Code mieux organisé
- ✅ Composants réutilisables
- ✅ Facile à maintenir
- ✅ Évolutif

### Pour l'Application
- ✅ Architecture propre
- ✅ Routing cohérent
- ✅ Permissions centralisées
- ✅ SEO-friendly

---

## 🎯 Prochaines Étapes

1. **Valider l'approche** avec toi
2. **Créer les types** et interfaces
3. **Développer le composant** dropdown
4. **Créer les pages** une par une
5. **Migrer le contenu** des modals
6. **Tester** la navigation
7. **Documenter** l'architecture

---

## 💡 Questions à Décider

1. **Option 1 ou 2?** Sous-menu déroulant ou items directs?
2. **Ordre des items?** Quel ordre dans le sous-menu?
3. **Icônes?** Valider les icônes proposées?
4. **Permissions?** Qui peut voir quoi?
5. **Badges?** Quels items ont des notifications?

---

**Qu'en penses-tu? On part sur l'Option 1 avec le sous-menu déroulant?** 🤔
