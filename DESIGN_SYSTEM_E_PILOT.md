# 🎨 DESIGN SYSTEM E-PILOT CONGO

**Version:** 1.0  
**Date:** 20 novembre 2025  
**Status:** ✅ **OFFICIEL**

---

## 📋 TABLE DES MATIÈRES

1. [Palette de Couleurs](#palette-de-couleurs)
2. [Typographie](#typographie)
3. [Iconographie](#iconographie)
4. [Grille & Espacements](#grille--espacements)
5. [Composants UI](#composants-ui)
6. [Animations](#animations)
7. [Accessibilité](#accessibilité)
8. [Responsivité](#responsivité)
9. [Architecture](#architecture)
10. [Exemples](#exemples)

---

## 🎨 PALETTE DE COULEURS

### Couleurs Principales

```css
/* Primaire - Bleu Foncé */
--primary: #1D3557;
--primary-hover: #152a45;
--primary-light: #2d4a6f;

/* Background - Blanc Cassé */
--background: #F9F9F9;
--background-card: #FFFFFF;

/* Neutre - Gris Bleu Clair */
--neutral: #DCE3EA;
--neutral-dark: #b8c5d0;
--neutral-light: #eef2f5;

/* Success - Vert */
--success: #2A9D8F;
--success-hover: #238a7d;
--success-light: #d4f1ed;

/* Accentuation - Or */
--accent: #E9C46A;
--accent-hover: #e0b855;
--accent-light: #f9edd4;

/* Erreur - Rouge */
--error: #E63946;
--error-hover: #d32f3c;
--error-light: #fde8ea;
```

### Couleurs Sémantiques

```css
/* Informations */
--info: #3B82F6;
--info-light: #dbeafe;

/* Avertissement */
--warning: #F59E0B;
--warning-light: #fef3c7;

/* Texte */
--text-primary: #1e293b;
--text-secondary: #64748b;
--text-tertiary: #94a3b8;
--text-disabled: #cbd5e1;
```

### Utilisation

```typescript
// Tailwind CSS
className="bg-[#1D3557] text-white hover:bg-[#152a45]"

// CSS Variables
style={{ backgroundColor: 'var(--primary)' }}

// Composants shadcn/ui
<Button className="bg-primary hover:bg-primary-hover">
```

---

## 📝 TYPOGRAPHIE

### Police Principale

**Inter** (sans-serif) - Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### Échelle Typographique

```css
/* Headings */
--text-h1: 2.5rem;    /* 40px */
--text-h2: 2rem;      /* 32px */
--text-h3: 1.5rem;    /* 24px */
--text-h4: 1.25rem;   /* 20px */
--text-h5: 1.125rem;  /* 18px */
--text-h6: 1rem;      /* 16px */

/* Body */
--text-base: 1rem;    /* 16px */
--text-sm: 0.875rem;  /* 14px */
--text-xs: 0.75rem;   /* 12px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Utilisation

```typescript
// Headings
<h1 className="text-4xl font-bold text-slate-900">Titre Principal</h1>
<h2 className="text-3xl font-semibold text-slate-800">Sous-titre</h2>
<h3 className="text-2xl font-medium text-slate-700">Section</h3>

// Body
<p className="text-base text-slate-600">Texte normal</p>
<p className="text-sm text-slate-500">Texte secondaire</p>
<p className="text-xs text-slate-400">Texte tertiaire</p>
```

---

## 🎯 ICONOGRAPHIE

### Bibliothèque: **Lucide React**

Style: **Outline** (trait fin)

```bash
npm install lucide-react
```

### Tailles Standards

```typescript
// Small - 16px
<Icon className="w-4 h-4" />

// Medium - 20px (défaut)
<Icon className="w-5 h-5" />

// Large - 24px
<Icon className="w-6 h-6" />

// Extra Large - 32px
<Icon className="w-8 h-8" />
```

### Icons Courantes

```typescript
import {
  // Navigation
  Home, Menu, X, ChevronRight, ChevronDown,
  
  // Actions
  Plus, Edit, Trash2, Save, Download, Upload,
  
  // Status
  Check, CheckCircle2, AlertCircle, AlertTriangle, Info,
  
  // Utilisateurs
  User, Users, UserPlus, UserCheck,
  
  // Éducation
  GraduationCap, BookOpen, School, Building2,
  
  // Finances
  DollarSign, CreditCard, TrendingUp, TrendingDown,
  
  // Système
  Settings, Search, Filter, Calendar, Clock,
} from 'lucide-react';
```

### Utilisation

```typescript
// Avec couleur
<CheckCircle2 className="w-5 h-5 text-green-600" />

// Dans un bouton
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Ajouter
</Button>

// Status
{isSuccess ? (
  <CheckCircle2 className="w-5 h-5 text-green-600" />
) : (
  <AlertCircle className="w-5 h-5 text-red-600" />
)}
```

---

## 📐 GRILLE & ESPACEMENTS

### Grille de Base: **8px**

Tous les espacements doivent être des **multiples de 8**.

```css
/* Espacements Standards */
--spacing-1: 8px;    /* 0.5rem */
--spacing-2: 16px;   /* 1rem */
--spacing-3: 24px;   /* 1.5rem */
--spacing-4: 32px;   /* 2rem */
--spacing-5: 40px;   /* 2.5rem */
--spacing-6: 48px;   /* 3rem */
--spacing-8: 64px;   /* 4rem */
--spacing-10: 80px;  /* 5rem */
```

### Utilisation Tailwind

```typescript
// Padding
className="p-2"   // 16px
className="p-4"   // 32px
className="p-6"   // 48px

// Margin
className="m-2"   // 16px
className="m-4"   // 32px
className="m-6"   // 48px

// Gap (Flexbox/Grid)
className="gap-2" // 16px
className="gap-4" // 32px
className="gap-6" // 48px
```

### Rayon de Bordure

```css
/* Border Radius */
--radius-sm: 4px;    /* Petits éléments */
--radius-md: 8px;    /* Éléments moyens */
--radius-lg: 12px;   /* Grands éléments */
--radius-xl: 16px;   /* Cards */
--radius-2xl: 24px;  /* Modals */
--radius-full: 9999px; /* Badges, Pills */
```

### Utilisation

```typescript
// Boutons
<Button className="rounded-md">  {/* 8px */}

// Cards
<Card className="rounded-xl">    {/* 16px */}

// Badges
<Badge className="rounded-full"> {/* Cercle */}
```

---

## 🧩 COMPOSANTS UI

### Boutons

```typescript
// Primary
<Button className="bg-[#1D3557] hover:bg-[#152a45] text-white">
  Action Principale
</Button>

// Secondary
<Button variant="outline" className="border-[#1D3557] text-[#1D3557]">
  Action Secondaire
</Button>

// Success
<Button className="bg-[#2A9D8F] hover:bg-[#238a7d] text-white">
  <CheckCircle2 className="w-4 h-4 mr-2" />
  Valider
</Button>

// Danger
<Button className="bg-[#E63946] hover:bg-[#d32f3c] text-white">
  <Trash2 className="w-4 h-4 mr-2" />
  Supprimer
</Button>

// Ghost
<Button variant="ghost" className="text-slate-600 hover:text-slate-900">
  Annuler
</Button>
```

### Cards

```typescript
// Card Standard
<Card className="p-6 rounded-xl border-0 shadow-sm bg-white">
  <h3 className="text-lg font-semibold text-slate-900 mb-2">Titre</h3>
  <p className="text-sm text-slate-600">Contenu</p>
</Card>

// Card avec Gradient
<Card className="p-6 rounded-xl bg-gradient-to-br from-[#1D3557] to-[#152a45] text-white border-0 shadow-lg">
  <h3 className="text-xl font-bold mb-2">Titre</h3>
  <p className="text-white/80">Contenu</p>
</Card>

// Card Interactive
<Card className="p-6 rounded-xl border-0 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
  Contenu cliquable
</Card>
```

### Badges

```typescript
// Success
<Badge className="bg-[#2A9D8F] text-white border-0">
  Actif
</Badge>

// Warning
<Badge className="bg-[#F59E0B] text-white border-0">
  En attente
</Badge>

// Error
<Badge className="bg-[#E63946] text-white border-0">
  Erreur
</Badge>

// Neutral
<Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
  Brouillon
</Badge>

// Accent
<Badge className="bg-[#E9C46A] text-slate-900 border-0">
  <Crown className="w-3 h-3 mr-1" />
  Premium
</Badge>
```

### Inputs

```typescript
// Input Standard
<Input
  placeholder="Rechercher..."
  className="border-slate-300 focus:border-[#1D3557] focus:ring-[#1D3557]"
/>

// Input avec Icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <Input
    placeholder="Rechercher..."
    className="pl-10"
  />
</div>

// Select
<select className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D3557]">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Toasts

```typescript
import { toast } from 'sonner';

// Success
toast.success('Opération réussie', {
  description: 'Les données ont été enregistrées',
});

// Error
toast.error('Erreur', {
  description: 'Une erreur est survenue',
});

// Info
toast.info('Information', {
  description: 'Nouvelle notification',
});

// Warning
toast.warning('Attention', {
  description: 'Action requise',
});
```

---

## ✨ ANIMATIONS

### Principes

- **Durée:** 150ms à 250ms
- **Easing:** `ease-in-out`
- **Propriétés:** `opacity` et `transform` uniquement
- **Performance:** 60 FPS minimum

### Animations Courantes

```typescript
// Fade In
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  Contenu
</motion.div>

// Slide Up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25, ease: 'easeInOut' }}
>
  Contenu
</motion.div>

// Scale
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.15 }}
>
  Contenu
</motion.div>

// Rotate (Chevron)
<motion.div
  animate={{ rotate: isOpen ? 180 : 0 }}
  transition={{ duration: 0.2 }}
>
  <ChevronDown className="w-5 h-5" />
</motion.div>
```

### Transitions CSS

```css
/* Hover */
.button {
  transition: all 150ms ease-in-out;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Focus */
.input:focus {
  transition: border-color 150ms ease-in-out;
  border-color: var(--primary);
}
```

---

## ♿ ACCESSIBILITÉ

### Niveau: **AA W3C** minimum

### Contraste

```css
/* Texte sur fond clair */
--text-primary: #1e293b;   /* Ratio: 12.63:1 ✅ */
--text-secondary: #64748b; /* Ratio: 5.74:1 ✅ */

/* Texte sur fond foncé */
--text-on-dark: #ffffff;   /* Ratio: 15.52:1 ✅ */
```

### Navigation Clavier

```typescript
// Tous les éléments interactifs doivent être accessibles au clavier
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Action
</Button>

// Focus visible
className="focus:outline-none focus:ring-2 focus:ring-[#1D3557] focus:ring-offset-2"
```

### ARIA Labels

```typescript
// Boutons avec icons uniquement
<Button aria-label="Fermer">
  <X className="w-4 h-4" />
</Button>

// Status
<div role="status" aria-live="polite">
  {isLoading ? 'Chargement...' : 'Chargé'}
</div>

// Modals
<Dialog aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <DialogTitle id="dialog-title">Titre</DialogTitle>
  <DialogDescription id="dialog-description">Description</DialogDescription>
</Dialog>
```

### Screen Readers

```typescript
// Texte caché visuellement mais accessible
<span className="sr-only">Texte pour lecteurs d'écran</span>

// Skip to content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Aller au contenu principal
</a>
```

---

## 📱 RESPONSIVITÉ

### Approche: **Mobile-First**

### Breakpoints

```css
/* Mobile */
@media (min-width: 0px) { }

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }

/* Extra Large */
@media (min-width: 1536px) { }
```

### Utilisation Tailwind

```typescript
// Mobile-First
<div className="
  p-4           // Mobile: padding 16px
  md:p-6        // Tablet: padding 48px
  lg:p-8        // Desktop: padding 64px
">
  Contenu
</div>

// Grid Responsive
<div className="
  grid
  grid-cols-1      // Mobile: 1 colonne
  md:grid-cols-2   // Tablet: 2 colonnes
  lg:grid-cols-3   // Desktop: 3 colonnes
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>

// Text Responsive
<h1 className="
  text-2xl         // Mobile: 32px
  md:text-3xl      // Tablet: 48px
  lg:text-4xl      // Desktop: 56px
  font-bold
">
  Titre
</h1>
```

### Patterns Responsive

```typescript
// Sidebar Responsive
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

<div className="flex">
  {/* Mobile: Drawer */}
  <div className={`
    fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:relative lg:translate-x-0
  `}>
    Sidebar
  </div>
  
  {/* Content */}
  <div className="flex-1">
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="lg:hidden"
    >
      <Menu className="w-6 h-6" />
    </button>
    Content
  </div>
</div>

// Table Responsive
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>

// Cards Stack on Mobile
<div className="
  flex flex-col space-y-4
  md:flex-row md:space-y-0 md:space-x-4
">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</div>
```

---

## 🏗️ ARCHITECTURE

### Atomic Design

```
src/
├── components/
│   ├── atoms/           # Éléments de base (Button, Input, Badge)
│   ├── molecules/       # Combinaisons simples (SearchBar, Card)
│   ├── organisms/       # Composants complexes (Header, Sidebar, Table)
│   ├── templates/       # Layouts (DashboardLayout, AuthLayout)
│   └── pages/           # Pages complètes
│
├── features/            # Features par domaine
│   ├── auth/
│   ├── dashboard/
│   └── plans/
│
└── lib/                 # Utilitaires
    ├── utils.ts
    └── constants.ts
```

### Limites de Fichiers

```typescript
// ✅ BON - Composant < 300 lignes
export const UserCard = ({ user }: UserCardProps) => {
  // 150 lignes
  return <Card>...</Card>;
};

// ❌ MAUVAIS - Composant > 350 lignes
export const Dashboard = () => {
  // 500 lignes → À découper
};

// ✅ BON - Hook < 100 lignes
export const useUsers = () => {
  // 80 lignes
  return useQuery(...);
};
```

### Conventions de Nommage

```typescript
// Composants: PascalCase
export const UserCard = () => { };
export const DashboardLayout = () => { };

// Fonctions: camelCase
export const calculateTotal = () => { };
export const formatDate = () => { };

// Hooks: camelCase avec préfixe 'use'
export const useUsers = () => { };
export const useAuth = () => { };

// Constants: UPPER_SNAKE_CASE
export const API_URL = 'https://api.example.com';
export const MAX_USERS = 100;

// Types: PascalCase
export interface User { }
export type UserRole = 'admin' | 'user';
```

---

## 💡 EXEMPLES COMPLETS

### Card avec Gradient et Badge

```typescript
<Card className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#238a7d] text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
  {/* Effet de fond */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
  
  {/* Contenu */}
  <div className="relative z-10 p-6">
    <Badge className="mb-3 bg-white/20 text-white border-0">
      <Star className="w-3 h-3 mr-1" />
      Premium
    </Badge>
    
    <h3 className="text-2xl font-bold mb-2">Plan Premium</h3>
    <p className="text-white/80 text-sm mb-4">
      Accès complet à toutes les fonctionnalités
    </p>
    
    <div className="flex items-center justify-between">
      <div>
        <span className="text-3xl font-bold">250K</span>
        <span className="text-sm opacity-80 ml-1">FCFA/mois</span>
      </div>
      <Button className="bg-white text-[#2A9D8F] hover:bg-white/90">
        Choisir
      </Button>
    </div>
  </div>
</Card>
```

### Formulaire Complet

```typescript
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Input avec Label */}
  <div>
    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
      Email
    </Label>
    <Input
      id="email"
      type="email"
      placeholder="exemple@email.com"
      className="mt-1 border-slate-300 focus:border-[#1D3557] focus:ring-[#1D3557]"
    />
  </div>

  {/* Select */}
  <div>
    <Label htmlFor="role" className="text-sm font-medium text-slate-700">
      Rôle
    </Label>
    <select
      id="role"
      className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D3557]"
    >
      <option value="enseignant">Enseignant</option>
      <option value="comptable">Comptable</option>
    </select>
  </div>

  {/* Checkbox */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="terms"
      className="w-4 h-4 text-[#1D3557] border-slate-300 rounded focus:ring-[#1D3557]"
    />
    <Label htmlFor="terms" className="text-sm text-slate-600">
      J'accepte les conditions
    </Label>
  </div>

  {/* Boutons */}
  <div className="flex gap-3">
    <Button
      type="submit"
      className="flex-1 bg-[#1D3557] hover:bg-[#152a45] text-white"
    >
      <CheckCircle2 className="w-4 h-4 mr-2" />
      Valider
    </Button>
    <Button
      type="button"
      variant="outline"
      className="border-slate-300 text-slate-700"
      onClick={onCancel}
    >
      Annuler
    </Button>
  </div>
</form>
```

### Table Responsive

```typescript
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-slate-200">
    <thead className="bg-slate-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          Nom
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          Email
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          Rôle
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-slate-200">
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#1D3557] rounded-full flex items-center justify-center text-white font-medium">
                {user.name[0]}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-slate-900">
                  {user.name}
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
            {user.email}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge className="bg-[#2A9D8F] text-white border-0">
              {user.role}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 📋 CHECKLIST DESIGN

### Avant de Déployer

- [ ] ✅ Palette de couleurs respectée
- [ ] ✅ Police Inter utilisée
- [ ] ✅ Icons Lucide (Outline)
- [ ] ✅ Espacements multiples de 8px
- [ ] ✅ Border radius 4px-24px
- [ ] ✅ Animations 150-250ms
- [ ] ✅ Contraste AA W3C
- [ ] ✅ Navigation clavier
- [ ] ✅ ARIA labels
- [ ] ✅ Mobile-first
- [ ] ✅ Composants < 300 lignes
- [ ] ✅ Conventions de nommage

---

## 🎯 CONCLUSION

Ce design system garantit:
- ✅ **Cohérence** visuelle sur toute l'application
- ✅ **Accessibilité** niveau AA W3C
- ✅ **Performance** 60 FPS
- ✅ **Maintenabilité** avec Atomic Design
- ✅ **Responsivité** Mobile-First
- ✅ **Qualité** de code élevée

**Toute nouvelle fonctionnalité DOIT respecter ce design system!**

---

**Version:** 1.0  
**Dernière mise à jour:** 20 novembre 2025  
**Statut:** ✅ Officiel et obligatoire
