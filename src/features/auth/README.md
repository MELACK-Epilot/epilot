# 🔐 Module d'Authentification E-Pilot

Module de connexion moderne et sécurisé pour la plateforme E-Pilot, développé avec React 19 et TypeScript.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Fonctionnalités](#fonctionnalités)
- [API](#api)
- [Sécurité](#sécurité)

## 🎯 Vue d'ensemble

Ce module fournit une solution complète d'authentification avec :

- ✅ Formulaire de connexion avec validation en temps réel
- ✅ Gestion d'état global avec Zustand
- ✅ Persistance locale avec IndexedDB (Dexie.js)
- ✅ Design moderne et responsive
- ✅ Support PWA
- ✅ Animations fluides (Framer Motion)
- ✅ Notifications toast
- ✅ Mode "Se souvenir de moi"

## 🏗️ Architecture

```
src/features/auth/
├── components/
│   └── LoginForm.tsx          # Formulaire de connexion avec validation
├── pages/
│   └── LoginPage.tsx          # Page de connexion complète
├── hooks/
│   └── useLogin.ts            # Hook de logique de connexion
├── store/
│   └── auth.store.ts          # Store Zustand pour l'état global
├── types/
│   └── auth.types.ts          # Types TypeScript
├── utils/
│   └── auth.db.ts             # Gestion IndexedDB avec Dexie
└── README.md                  # Documentation
```

## 📦 Installation

### 1. Installer les dépendances

```bash
npm install zustand dexie react-hook-form @hookform/resolvers/zod zod framer-motion lucide-react
```

### 2. Installer shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button input label checkbox toast
```

### 3. Configuration TypeScript

Créer ou mettre à jour `tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Configuration Vite

Ajouter l'alias dans `vite.config.ts` :

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 5. Configuration Tailwind CSS

Ajouter les animations dans `tailwind.config.js` :

```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        blob: 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
    },
  },
};
```

## 🚀 Utilisation

### 1. Ajouter la route dans React Router

```typescript
// src/App.tsx ou src/routes.tsx
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  // ... autres routes
]);
```

### 2. Utiliser le hook d'authentification

```typescript
import { useAuth } from '@/features/auth/store/auth.store';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <p>Bienvenue {user?.firstName} !</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### 3. Protéger les routes

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## ✨ Fonctionnalités

### Validation du formulaire

Le formulaire utilise **React Hook Form** + **Zod** pour une validation robuste :

- ✅ Email requis et format valide
- ✅ Mot de passe requis (minimum 6 caractères)
- ✅ Validation en temps réel
- ✅ Messages d'erreur clairs

### Gestion d'état

**Zustand** gère l'état d'authentification global :

```typescript
const { user, token, isAuthenticated, logout } = useAuthStore();
```

### Persistance locale

**Dexie.js** (IndexedDB) stocke les données si "Se souvenir de moi" est coché :

- Token JWT
- Informations utilisateur
- Date d'expiration
- Vérification automatique au chargement

### Sécurité

- 🔒 Tokens JWT stockés dans localStorage
- 🔒 Refresh tokens pour renouvellement automatique
- 🔒 Expiration des sessions
- 🔒 Nettoyage automatique des données expirées
- 🔒 Validation côté client et serveur

## 🔌 API

### Hook `useLogin`

```typescript
const { login, loginWithMock, isLoading, error, clearError } = useLogin();

// Connexion avec API réelle
await login({ email, password, rememberMe });

// Connexion avec mock (développement)
await loginWithMock({ email: 'admin@epilot.cg', password: 'admin123' });
```

### Store `useAuthStore`

```typescript
const {
  user,              // Utilisateur connecté
  token,             // Token JWT
  isAuthenticated,   // Statut de connexion
  isLoading,         // État de chargement
  error,             // Erreur éventuelle
  logout,            // Déconnexion
  setUser,           // Définir l'utilisateur
  setToken,          // Définir le token
  checkAuth,         // Vérifier l'authentification
} = useAuthStore();
```

### Types disponibles

```typescript
import type {
  User,
  UserRole,
  LoginCredentials,
  AuthResponse,
  AuthState,
} from '@/features/auth/types/auth.types';
```

## 🎨 Personnalisation

### Couleurs

Modifier la couleur primaire dans les composants :

```typescript
// Remplacer #00A3E0 par votre couleur
className="bg-[#00A3E0] hover:bg-[#0082b3]"
```

### Logo

Personnaliser le logo dans `LoginPage.tsx` :

```typescript
const EPilotLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-8">
    {/* Votre logo personnalisé */}
  </div>
);
```

## 🧪 Tests

### Identifiants de test

- **Email** : `admin@epilot.cg`
- **Mot de passe** : `admin123`

### Mock API

Le hook `useLogin` inclut une fonction `loginWithMock()` pour le développement sans backend.

## 🔧 Configuration API

Définir l'URL de l'API dans `.env` :

```env
VITE_API_URL=http://localhost:3000/api
```

## 📱 Support PWA

Le module est compatible PWA :

- ✅ Fonctionne hors ligne (avec cache)
- ✅ Installable sur mobile/desktop
- ✅ Persistance des données avec IndexedDB

## 🐛 Débogage

### Activer les logs

```typescript
// Dans auth.db.ts
console.log('✅ Auth saved to IndexedDB');
console.log('⚠️ Token expired');
```

### Vérifier le store

```typescript
// Dans la console du navigateur
window.__ZUSTAND_DEVTOOLS__
```

## 📝 TODO

- [ ] Connexion avec Google/Microsoft
- [ ] Authentification à deux facteurs (2FA)
- [ ] Récupération de mot de passe
- [ ] Limitation des tentatives de connexion
- [ ] Logs d'audit de connexion

## 📄 Licence

Propriété de E-Pilot - République du Congo 🇨🇬

---

**Développé avec ❤️ pour E-Pilot**
