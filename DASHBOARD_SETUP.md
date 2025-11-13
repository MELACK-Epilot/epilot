# 🚀 Installation et Configuration du Dashboard Super Admin E-Pilot

## 📦 Installation des dépendances

```bash
# Dépendances principales
npm install @tanstack/react-query @tanstack/react-table
npm install framer-motion
npm install recharts
npm install lucide-react
npm install react-router-dom
npm install date-fns

# Shadcn/UI (si pas déjà installé)
npx shadcn-ui@latest init

# Composants Shadcn/UI nécessaires
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add toast

# Dev dependencies
npm install -D @types/node
```

## ⚙️ Configuration

### 1. Tailwind CSS (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs officielles E-Pilot Congo
        'e-pilot': {
          blue: '#1D3557',
          green: '#2A9D8F',
          gold: '#E9C46A',
          red: '#E63946',
          'gray-light': '#DCE3EA',
          'white-off': '#F9F9F9',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}
```

### 2. App.tsx - Configuration des routes

```tsx
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/react-query';
import { dashboardRoutes } from '@/features/dashboard/routes/dashboard.routes';

// Pages publiques
import { LoginPage } from '@/features/auth/pages/LoginPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div>Chargement...</div>}>
          <Routes>
            {/* Route de connexion */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Routes du dashboard */}
            <Route path="/dashboard/*" element={dashboardRoutes.element}>
              {dashboardRoutes.children?.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  index={route.index}
                  element={route.element}
                />
              ))}
            </Route>
            
            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        
        {/* Toast notifications */}
        <Toaster />
      </BrowserRouter>
      
      {/* React Query DevTools (dev only) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
```

### 3. main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 4. index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Animation shimmer pour skeleton loaders */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    to right,
    #f3f4f6 0%,
    #e5e7eb 20%,
    #f3f4f6 40%,
    #f3f4f6 100%
  );
  background-size: 1000px 100%;
}
```

## 🗂️ Structure des fichiers créés

```
src/
├── features/
│   └── dashboard/
│       ├── components/
│       │   ├── DashboardLayout.tsx       ✅ Créé
│       │   └── DataTable.tsx             ✅ Créé
│       ├── pages/
│       │   ├── DashboardOverview.tsx     ✅ Créé
│       │   ├── SchoolGroups.tsx          ✅ Créé
│       │   ├── Users.tsx                 ⏳ À créer
│       │   ├── Categories.tsx            ⏳ À créer
│       │   ├── Plans.tsx                 ⏳ À créer
│       │   ├── Subscriptions.tsx         ⏳ À créer
│       │   ├── Modules.tsx               ⏳ À créer
│       │   ├── Communication.tsx         ⏳ À créer
│       │   ├── Reports.tsx               ⏳ À créer
│       │   ├── ActivityLogs.tsx          ⏳ À créer
│       │   └── Trash.tsx                 ⏳ À créer
│       ├── types/
│       │   └── dashboard.types.ts        ✅ Créé
│       ├── routes/
│       │   └── dashboard.routes.tsx      ✅ Créé
│       └── README.md                     ✅ Créé
├── lib/
│   └── react-query.ts                    ✅ Créé
└── components/
    └── ui/                               ⏳ Shadcn/UI components
```

## 🎯 Prochaines étapes

### 1. Créer les pages manquantes

Utilisez le template de `SchoolGroups.tsx` pour créer les autres pages :

- **Users.tsx** - Gestion des utilisateurs avec RBAC
- **Categories.tsx** - CRUD catégories métiers
- **Plans.tsx** - Gestion des plans d'abonnement
- **Subscriptions.tsx** - Suivi des abonnements
- **Modules.tsx** - Gestion des modules
- **Communication.tsx** - Messagerie et notifications
- **Reports.tsx** - Rapports et exports
- **ActivityLogs.tsx** - Journal d'activité
- **Trash.tsx** - Corbeille

### 2. Implémenter les API calls

Créer un fichier `src/features/dashboard/api/dashboard.api.ts` :

```typescript
import axios from 'axios';
import type { SchoolGroup, User, Plan } from '../types/dashboard.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const dashboardApi = {
  // School Groups
  getSchoolGroups: () => axios.get<SchoolGroup[]>(`${API_URL}/school-groups`),
  getSchoolGroup: (id: string) => axios.get<SchoolGroup>(`${API_URL}/school-groups/${id}`),
  createSchoolGroup: (data: Partial<SchoolGroup>) => axios.post(`${API_URL}/school-groups`, data),
  updateSchoolGroup: (id: string, data: Partial<SchoolGroup>) => axios.put(`${API_URL}/school-groups/${id}`, data),
  deleteSchoolGroup: (id: string) => axios.delete(`${API_URL}/school-groups/${id}`),
  
  // Users
  getUsers: () => axios.get<User[]>(`${API_URL}/users`),
  // ... autres endpoints
};
```

### 3. Ajouter l'authentification

Créer un contexte d'authentification :

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 4. Ajouter les guards de routes

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

### 5. Configurer IndexedDB pour PWA

```typescript
// src/lib/indexeddb.ts
import { openDB, DBSchema } from 'idb';

interface DashboardDB extends DBSchema {
  'school-groups': {
    key: string;
    value: SchoolGroup;
  };
  'users': {
    key: string;
    value: User;
  };
}

export const db = await openDB<DashboardDB>('e-pilot-dashboard', 1, {
  upgrade(db) {
    db.createObjectStore('school-groups', { keyPath: 'id' });
    db.createObjectStore('users', { keyPath: 'id' });
  },
});
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E avec Playwright
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Lancement

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## 📊 Métriques de performance visées

- **Lighthouse Score** : 95+
- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Bundle Size** : < 200KB (gzipped)
- **Code Coverage** : > 80%

## 🔧 Troubleshooting

### Erreur : Module not found

```bash
# Vérifier les imports
npm install
npm run build
```

### Erreur : React Query

```bash
# Vérifier la version
npm list @tanstack/react-query
# Doit être >= 5.0.0
```

### Erreur : Tailwind classes not working

```bash
# Rebuild Tailwind
npx tailwindcss -i ./src/index.css -o ./dist/output.css --watch
```

## 📚 Documentation

- [React Query](https://tanstack.com/query/latest)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Support

Pour toute question ou problème, contactez l'équipe E-Pilot Congo.

---

**© 2025 E-Pilot Congo • République du Congo 🇨🇬**
