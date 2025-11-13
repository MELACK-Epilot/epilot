# 🏆 Best Practices - Plateforme E-Pilot Congo

## 📋 Table des Matières

1. [Architecture React 19](#architecture-react-19)
2. [Gestion des États](#gestion-des-états)
3. [Performance](#performance)
4. [Sécurité](#sécurité)
5. [Accessibilité](#accessibilité)
6. [Tests](#tests)
7. [Documentation](#documentation)

---

## 🏗️ Architecture React 19

### Structure des Dossiers

```
src/
├── components/          # Composants UI réutilisables
│   └── ui/             # Shadcn/UI components
├── features/           # Features par domaine
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── routes/
│       └── types/
├── lib/                # Utilitaires et configs
│   ├── supabase.ts
│   ├── react-query.ts
│   └── utils.ts
├── hooks/              # Hooks globaux
├── types/              # Types globaux
└── styles/             # Styles globaux
```

### Principes de Base

#### 1. **Composition over Inheritance**

```typescript
// ✅ BON : Composition
const UserCard = ({ user }: { user: User }) => (
  <Card>
    <UserAvatar user={user} />
    <UserInfo user={user} />
    <UserActions user={user} />
  </Card>
);

// ❌ MAUVAIS : Héritage complexe
class UserCard extends BaseCard { ... }
```

#### 2. **Single Responsibility Principle**

```typescript
// ✅ BON : Une responsabilité par composant
const UserList = () => { ... };
const UserListItem = () => { ... };
const UserListFilters = () => { ... };

// ❌ MAUVAIS : Tout dans un composant
const UserManagement = () => {
  // Liste + Filtres + Formulaire + Actions
};
```

#### 3. **Props Drilling vs Context**

```typescript
// ✅ BON : Context pour données globales
const ThemeContext = createContext<Theme>(defaultTheme);

// ✅ BON : Props pour données locales
<UserCard user={user} onEdit={handleEdit} />

// ❌ MAUVAIS : Props drilling sur 5+ niveaux
<A><B><C><D><E user={user} /></D></C></B></A>
```

---

## 🎯 Gestion des États

### 1. **React Query pour Server State**

```typescript
// ✅ BON : React Query pour données serveur
export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin_groupe');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ❌ MAUVAIS : useState pour données serveur
const [users, setUsers] = useState([]);
useEffect(() => {
  fetchUsers().then(setUsers);
}, []);
```

### 2. **useState pour UI State**

```typescript
// ✅ BON : useState pour état UI local
const [isOpen, setIsOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState('overview');

// ❌ MAUVAIS : React Query pour état UI
const { data: isOpen } = useQuery(['modal-open'], ...);
```

### 3. **Zustand pour Global State**

```typescript
// ✅ BON : Zustand pour état global complexe
import { create } from 'zustand';

interface AppStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
}));
```

### 4. **useReducer pour État Complexe**

```typescript
// ✅ BON : useReducer pour logique complexe
type State = {
  step: number;
  data: FormData;
  errors: Record<string, string>;
};

type Action =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_DATA'; payload: Partial<FormData> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: state.step - 1 };
    case 'UPDATE_DATA':
      return { ...state, data: { ...state.data, ...action.payload } };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);
```

---

## ⚡ Performance

### 1. **Memoization**

```typescript
// ✅ BON : useMemo pour calculs coûteux
const filteredUsers = useMemo(() => {
  return users.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase())
  );
}, [users, query]);

// ✅ BON : useCallback pour fonctions
const handleSubmit = useCallback(async (values) => {
  await createUser.mutateAsync(values);
}, [createUser]);

// ❌ MAUVAIS : Recalcul à chaque render
const filteredUsers = users.filter(...);
const handleSubmit = async (values) => { ... };
```

### 2. **Code Splitting**

```typescript
// ✅ BON : Lazy loading des routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));

// ✅ BON : Suspense avec fallback
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/users" element={<Users />} />
  </Routes>
</Suspense>

// ❌ MAUVAIS : Import direct de tout
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
```

### 3. **Virtualization pour Longues Listes**

```typescript
// ✅ BON : Virtualisation avec react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={users.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <UserListItem user={users[index]} />
    </div>
  )}
</FixedSizeList>

// ❌ MAUVAIS : Render de 10000+ items
{users.map(user => <UserListItem key={user.id} user={user} />)}
```

### 4. **Debounce pour Recherche**

```typescript
// ✅ BON : Debounce pour éviter trop de requêtes
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, 500);

const { data: users } = useUsers({ query: debouncedQuery });

// ❌ MAUVAIS : Requête à chaque frappe
const { data: users } = useUsers({ query });
```

---

## 🔒 Sécurité

### 1. **Validation Stricte**

```typescript
// ✅ BON : Validation Zod stricte
const userSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Majuscule requise')
    .regex(/[0-9]/, 'Chiffre requis'),
  phone: z.string()
    .regex(/^(\+242|0)[0-9]{9}$/)
    .transform(val => val.replace(/\s/g, '')),
});

// ❌ MAUVAIS : Validation faible
const isValid = email.includes('@') && password.length > 5;
```

### 2. **Sanitization des Inputs**

```typescript
// ✅ BON : Sanitization automatique
const sanitizeInput = (input: string) => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Enlever < et >
    .slice(0, 1000); // Limiter longueur
};

// ✅ BON : Utiliser dans le schema
const schema = z.object({
  name: z.string().transform(sanitizeInput),
});
```

### 3. **Protection XSS**

```typescript
// ✅ BON : Utiliser dangerouslySetInnerHTML avec DOMPurify
import DOMPurify from 'dompurify';

<div 
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(userContent) 
  }} 
/>

// ❌ MAUVAIS : Injecter HTML brut
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### 4. **Gestion des Tokens**

```typescript
// ✅ BON : Stocker tokens de manière sécurisée
// Utiliser httpOnly cookies (backend)
// Ou Supabase qui gère automatiquement

// ❌ MAUVAIS : Stocker dans localStorage
localStorage.setItem('token', token); // Vulnérable XSS
```

---

## ♿ Accessibilité

### 1. **ARIA Labels**

```typescript
// ✅ BON : ARIA labels complets
<button 
  aria-label="Fermer le dialog"
  aria-describedby="dialog-description"
  onClick={onClose}
>
  <X className="w-4 h-4" />
</button>

<p id="dialog-description" className="sr-only">
  Cliquez pour fermer la fenêtre de dialogue
</p>

// ❌ MAUVAIS : Pas de label
<button onClick={onClose}>
  <X />
</button>
```

### 2. **Navigation Clavier**

```typescript
// ✅ BON : Support clavier complet
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') onClose();
  if (e.key === 'Enter') onSubmit();
  if (e.key === 'Tab') handleTabNavigation(e);
};

<div onKeyDown={handleKeyDown} tabIndex={0}>
  {/* Contenu */}
</div>

// ❌ MAUVAIS : Seulement souris
<div onClick={handleClick}>
  {/* Contenu */}
</div>
```

### 3. **Focus Management**

```typescript
// ✅ BON : Gérer le focus
import { useEffect, useRef } from 'react';

const DialogContent = ({ open }) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      firstInputRef.current?.focus();
    }
  }, [open]);

  return (
    <input ref={firstInputRef} />
  );
};
```

### 4. **Contrastes de Couleurs**

```typescript
// ✅ BON : Contrastes WCAG 2.2 AA
const colors = {
  primary: '#1D3557',    // Ratio 8.5:1 sur blanc
  success: '#2A9D8F',    // Ratio 4.5:1 sur blanc
  error: '#E63946',      // Ratio 4.8:1 sur blanc
};

// ❌ MAUVAIS : Contrastes insuffisants
const colors = {
  primary: '#CCCCCC',    // Ratio 1.5:1 ❌
};
```

---

## 🧪 Tests

### 1. **Tests Unitaires (Vitest)**

```typescript
// ✅ BON : Tests unitaires complets
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('affiche le nom de l\'utilisateur', () => {
    const user = { id: '1', name: 'Jean Dupont' };
    render(<UserCard user={user} />);
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
  });

  it('appelle onEdit au clic sur le bouton', async () => {
    const onEdit = vi.fn();
    const user = { id: '1', name: 'Jean' };
    
    render(<UserCard user={user} onEdit={onEdit} />);
    
    await userEvent.click(screen.getByRole('button', { name: /modifier/i }));
    
    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
```

### 2. **Tests d'Intégration**

```typescript
// ✅ BON : Tests d'intégration avec MSW
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'Jean' },
      { id: '2', name: 'Marie' },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('charge et affiche les utilisateurs', async () => {
  render(<UserList />);
  
  expect(await screen.findByText('Jean')).toBeInTheDocument();
  expect(screen.getByText('Marie')).toBeInTheDocument();
});
```

### 3. **Tests E2E (Playwright)**

```typescript
// ✅ BON : Tests E2E complets
import { test, expect } from '@playwright/test';

test('créer un utilisateur', async ({ page }) => {
  await page.goto('/dashboard/users');
  
  await page.click('button:has-text("Créer")');
  
  await page.fill('input[name="firstName"]', 'Jean');
  await page.fill('input[name="lastName"]', 'Dupont');
  await page.fill('input[name="email"]', 'jean@test.cg');
  
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=créé avec succès')).toBeVisible();
});
```

---

## 📚 Documentation

### 1. **JSDoc Comments**

```typescript
/**
 * Hook pour gérer les utilisateurs (Administrateurs de Groupe)
 * 
 * @param filters - Filtres de recherche optionnels
 * @returns Query object avec data, isLoading, error
 * 
 * @example
 * ```tsx
 * const { data: users, isLoading } = useUsers({ 
 *   status: 'active',
 *   query: 'jean' 
 * });
 * ```
 */
export const useUsers = (filters?: UserFilters) => {
  // ...
};
```

### 2. **README par Feature**

```markdown
# Feature: User Management

## Description
Gestion des Administrateurs de Groupe par le Super Admin.

## Composants
- `UserFormDialog` - Dialog de création/modification
- `UserList` - Liste des utilisateurs
- `UserCard` - Card d'un utilisateur

## Hooks
- `useUsers()` - Récupérer la liste
- `useCreateUser()` - Créer un utilisateur
- `useUpdateUser()` - Modifier un utilisateur

## Types
- `User` - Type principal
- `UserFilters` - Filtres de recherche

## Usage
\`\`\`tsx
import { UserList } from '@/features/dashboard/components/UserList';

<UserList />
\`\`\`
```

### 3. **Changelog**

```markdown
# Changelog

## [2.0.0] - 2025-10-28

### Added
- ✅ Validation Zod renforcée
- ✅ useTransition pour transitions
- ✅ useMemo/useCallback optimisations
- ✅ Accessibilité WCAG 2.2 AA

### Changed
- 🔄 Schémas Zod avec baseUserSchema
- 🔄 Gestion erreurs type-safe
- 🔄 Messages toast enrichis

### Fixed
- 🐛 Memory leaks dans useEffect
- 🐛 Re-renders inutiles
- 🐛 Focus management
```

---

## 🎯 Checklist Avant Commit

### Code Quality
- [ ] TypeScript sans erreurs
- [ ] ESLint sans warnings
- [ ] Prettier formaté
- [ ] JSDoc commentaires
- [ ] Tests passent

### Performance
- [ ] useMemo pour calculs
- [ ] useCallback pour fonctions
- [ ] Pas de re-renders inutiles
- [ ] Bundle size acceptable

### Accessibilité
- [ ] ARIA labels
- [ ] Navigation clavier
- [ ] Focus management
- [ ] Contrastes WCAG 2.2 AA

### Sécurité
- [ ] Validation stricte
- [ ] Sanitization inputs
- [ ] Pas de XSS
- [ ] Pas de données sensibles exposées

### UX
- [ ] Loading states
- [ ] Error messages
- [ ] Success feedback
- [ ] Responsive design

---

**Maintenu par** : Équipe E-Pilot Congo  
**Dernière mise à jour** : 28 octobre 2025  
**Version** : 2.0.0
