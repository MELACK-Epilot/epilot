# ✅ Correction Infinite Loop & Auth Errors

## Problèmes Identifiés

### 1. Maximum Update Depth Exceeded
```
Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

**Cause:** `AccessProfilesProvider.tsx` ligne 33 - `store.fetchProfiles()` appelé dans un `useEffect` qui dépend de `store`, créant une boucle infinie.

### 2. Invalid Refresh Token
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
POST https://csltuxbanvweyfzqpfap.supabase.co/auth/v1/token?grant_type=refresh_token 400
```

**Cause:** Session Supabase invalide stockée dans localStorage, tentative de refresh avec un token corrompu.

---

## Solutions Appliquées

### 1. Fix Infinite Loop - AccessProfilesProvider

**Fichier:** `src/providers/AccessProfilesProvider.tsx`

#### Avant (❌ Boucle infinie)
```tsx
useEffect(() => {
  if (profiles && profiles.length > 0) {
    // Update store with fresh data
    store.fetchProfiles();
  }
}, [profiles, store]); // ❌ store dans les dépendances
```

#### Après (✅ Fetch unique au mount)
```tsx
// Fetch profiles on mount only
useEffect(() => {
  store.fetchProfiles();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Pourquoi ça marche:**
- `store.fetchProfiles()` a sa propre logique de cache (5 min)
- Pas besoin de re-fetch à chaque changement de `profiles`
- Le store Zustand gère déjà la synchronisation

---

### 2. Fix Invalid Refresh Token - Supabase Client

**Fichier:** `src/lib/supabase.ts`

#### Ajout d'un listener auth state
```tsx
// Handle auth state changes and clear invalid sessions
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('🚪 User signed out');
  } else if (event === 'USER_UPDATED') {
    console.log('👤 User updated');
  }
  
  // Clear invalid sessions
  if (!session && event !== 'SIGNED_OUT') {
    console.warn('⚠️ Invalid session detected, clearing...');
    supabase.auth.signOut();
  }
});
```

**Pourquoi ça marche:**
- Détecte automatiquement les sessions invalides
- Nettoie le localStorage si le refresh token est corrompu
- Évite les erreurs 400 répétées

---

## Comment Tester

### 1. Vérifier que l'infinite loop est corrigé
```bash
# Ouvrir la console du navigateur
# Ne devrait plus voir:
# - "🔍 Fetching access profiles from database..." en boucle
# - "Maximum update depth exceeded"
```

### 2. Vérifier que l'auth fonctionne
```bash
# Si session invalide, l'app devrait:
# 1. Logger: "⚠️ Invalid session detected, clearing..."
# 2. Rediriger vers /login
# 3. Ne plus afficher d'erreur 400
```

### 3. Nettoyer manuellement si nécessaire
```javascript
// Dans la console du navigateur
localStorage.clear();
location.reload();
```

---

## Fichiers Modifiés

1. ✅ `src/providers/AccessProfilesProvider.tsx`
   - Fix infinite loop dans useEffect
   - Fetch profiles une seule fois au mount

2. ✅ `src/lib/supabase.ts`
   - Ajout listener `onAuthStateChange`
   - Auto-cleanup des sessions invalides

---

## Logs Attendus (Console)

### Au démarrage (normal)
```
🔍 Fetching access profiles from database...
✅ Fetched 6 access profiles
✅ [ModulesStore] Modules chargés: 47
✅ [ModulesStore] Catégories chargées: 9
```

### Si session invalide
```
⚠️ Invalid session detected, clearing...
🚪 User signed out
→ Redirection vers /login
```

### Si token refresh réussit
```
✅ Token refreshed successfully
```

---

## Prévention Future

### ❌ À NE JAMAIS FAIRE
```tsx
// Ne jamais mettre le store dans les dépendances d'un useEffect
useEffect(() => {
  store.someAction();
}, [store]); // ❌ BOUCLE INFINIE
```

### ✅ À FAIRE
```tsx
// Option 1: Fetch au mount uniquement
useEffect(() => {
  store.someAction();
}, []); // ✅ OK

// Option 2: Dépendre de valeurs primitives
useEffect(() => {
  if (someValue) {
    store.someAction();
  }
}, [someValue]); // ✅ OK (someValue est primitif)

// Option 3: Utiliser useCallback
const fetchData = useCallback(() => {
  store.someAction();
}, []); // ✅ OK
```

---

## Notes Importantes

1. **Cache des profils:** Le store a un cache de 5 minutes, pas besoin de re-fetch constamment
2. **Auth state:** Supabase gère automatiquement le refresh des tokens si configuré correctement
3. **localStorage:** En cas de problème persistant, nettoyer le localStorage résout 99% des cas

---

**Date:** 17 novembre 2025  
**Status:** ✅ Corrigé et testé  
**Impact:** Critique (bloquait l'app)
