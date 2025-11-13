# 🚨 PROBLÈME DE CONNEXION - REDIRECTION VERS LOGIN

**Date** : 4 Novembre 2025 22h32  
**Symptôme** : Connexion réussie mais redirection vers `/login` au lieu de `/dashboard`

---

## 🔍 DIAGNOSTIC

### Problème Identifié

Le flux de connexion est :
```
1. useLogin.ts → Connexion Supabase ✅
2. useLogin.ts → setUser(user) + setToken(token) ✅
3. useLogin.ts → navigate('/dashboard') ✅
4. ProtectedRoute → Vérifie isAuthenticated ❌
5. ProtectedRoute → Redirige vers /login ❌
```

**Cause** : Le store Zustand n'est pas synchronisé immédiatement après `setUser()`.

---

## 🐛 CAUSES POSSIBLES

### 1. Store Zustand Non Synchronisé

```typescript
// useLogin.ts ligne 120-122
const { setUser, setToken } = useAuthStore.getState();
setToken(authData.session?.access_token || '', authData.session?.refresh_token);
setUser(user);

// ⚠️ La navigation se fait IMMÉDIATEMENT après
navigate('/dashboard', { replace: true });

// ❌ Mais le store n'est pas encore mis à jour !
```

### 2. ProtectedRoute Vérifie Trop Tôt

```typescript
// ProtectedRoute.tsx ligne 34-36
if (!isAuthenticated || !user) {
  return <Navigate to="/login" replace />;
}

// ⚠️ isAuthenticated peut être false pendant 1 frame
```

---

## ✅ SOLUTIONS

### Solution 1 : Attendre la Mise à Jour du Store (RECOMMANDÉE)

**Fichier** : `src/features/auth/hooks/useLogin.ts`

```typescript
// Après setUser() et setToken()
setToken(authData.session?.access_token || '', authData.session?.refresh_token);
setUser(user);

// ✅ Attendre que le store soit mis à jour
await new Promise(resolve => setTimeout(resolve, 100));

// ✅ Vérifier que l'utilisateur est bien dans le store
const storeState = useAuthStore.getState();
console.log('🔍 Store après connexion:', {
  user: storeState.user,
  isAuthenticated: storeState.isAuthenticated,
  token: storeState.token ? 'présent' : 'absent',
});

// Redirection
navigate('/dashboard', { replace: true });
```

---

### Solution 2 : Utiliser un Flag de Connexion

**Fichier** : `src/features/auth/store/auth.store.ts`

Ajouter un flag `isLoggingIn` :

```typescript
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingIn: false, // ✅ Nouveau flag
      error: null,

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          isLoggingIn: false, // ✅ Fin de connexion
          error: null 
        });
      },

      startLogin: () => {
        set({ isLoggingIn: true }); // ✅ Début de connexion
      },
    }),
    // ...
  )
);
```

**Fichier** : `src/components/ProtectedRoute.tsx`

```typescript
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isLoggingIn } = useAuth();
  
  // ✅ Attendre la fin de la connexion
  if (isLoading || isLoggingIn) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // ...
}
```

---

### Solution 3 : Vérifier localStorage (DEBUG)

Le problème peut venir de la persistance Zustand.

**Test à faire** :

1. Ouvrir Console (F12)
2. Après connexion, taper :
   ```javascript
   localStorage.getItem('e-pilot-auth')
   ```
3. Vérifier si les données sont présentes

**Si vide** : Le store ne persiste pas correctement.

---

## 🧪 TESTS DE DIAGNOSTIC

### Test 1 : Logs Console

Ajouter des logs dans `useLogin.ts` :

```typescript
// Après setUser()
console.log('🔐 Avant navigation - Store state:', useAuthStore.getState());
console.log('🔐 User:', useAuthStore.getState().user);
console.log('🔐 isAuthenticated:', useAuthStore.getState().isAuthenticated);
console.log('🔐 Token:', useAuthStore.getState().token ? 'présent' : 'absent');

navigate('/dashboard', { replace: true });
```

### Test 2 : Logs ProtectedRoute

Ajouter des logs dans `ProtectedRoute.tsx` :

```typescript
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log('🛡️ ProtectedRoute Check:', {
    user: user ? 'présent' : 'absent',
    isAuthenticated,
    isLoading,
    path: window.location.pathname,
  });
  
  // ...
}
```

---

## 🚀 ACTION IMMÉDIATE

### Étape 1 : Ajouter Logs de Debug

Je vais ajouter des logs pour identifier le problème exact.

### Étape 2 : Vérifier localStorage

Après connexion, vérifie dans la console :
```javascript
localStorage.getItem('e-pilot-auth')
```

### Étape 3 : Appliquer Solution

Selon les logs, j'appliquerai la solution appropriée.

---

## 📋 CHECKLIST

- [ ] Ajouter logs dans useLogin.ts
- [ ] Ajouter logs dans ProtectedRoute.tsx
- [ ] Tester connexion
- [ ] Vérifier console logs
- [ ] Vérifier localStorage
- [ ] Appliquer solution
- [ ] Re-tester connexion

---

**PROCHAINE ÉTAPE** : Ajouter les logs de debug pour identifier le problème exact.
