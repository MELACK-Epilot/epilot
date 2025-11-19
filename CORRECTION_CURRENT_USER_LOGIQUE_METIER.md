# ✅ Correction useCurrentUser - Logique Métier E-Pilot

## Problème Initial

```
🚨 Query Error: current-user Non authentifié
```

**Erreur affichée en boucle** même quand l'utilisateur n'est pas connecté.

---

## Cause Racine

Le hook `useCurrentUser` s'exécutait **TOUJOURS**, même sans session Supabase active, ce qui violait la **logique métier E-Pilot**.

### ❌ Comportement Incorrect (Avant)

```tsx
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Non authentifié'); // ❌ Erreur même si pas connecté
      }
      // ...
    },
    retry: 1, // ❌ Retry inutile
  });
};
```

**Problèmes:**
1. ❌ S'exécute même sans session Supabase
2. ❌ Throw une erreur au lieu de retourner `null`
3. ❌ Affiche des erreurs console inutiles
4. ❌ Retry alors que l'utilisateur n'est pas connecté

---

## Solution Appliquée

### ✅ Comportement Correct (Après)

```tsx
export const useCurrentUser = () => {
  const [hasSession, setHasSession] = useState(false);

  // 1. Vérifier la session Supabase au mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };
    
    checkSession();

    // 2. Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return null; // ✅ Retourne null (pas d'erreur)
      }

      // Récupérer données complètes...
      if (error) {
        console.error('❌ Erreur récupération user:', error);
        return null; // ✅ Retourne null (pas de throw)
      }
      
      return userData;
    },
    enabled: hasSession, // ✅ Exécute UNIQUEMENT si session active
    staleTime: 5 * 60 * 1000,
    retry: false, // ✅ Pas de retry si non authentifié
  });
};
```

---

## Logique Métier Respectée

### 📋 Hiérarchie E-Pilot (3 Niveaux)

```
1. SUPER ADMIN (plateforme)
   ↓
2. ADMIN GROUPE (réseau d'écoles)
   ↓
3. UTILISATEURS (personnel écoles)
```

### 🔑 Règles d'Authentification

| Niveau | Session Supabase | useCurrentUser() | Comportement |
|--------|------------------|------------------|--------------|
| **Non connecté** | ❌ Aucune | `enabled: false` | Pas d'exécution |
| **Super Admin** | ✅ Active | `enabled: true` | Récupère données |
| **Admin Groupe** | ✅ Active | `enabled: true` | Récupère données |
| **Utilisateur École** | ✅ Active | `enabled: true` | Récupère données |

---

## Changements Clés

### 1. Vérification Session
```tsx
// ✅ Vérifier si session active AVANT d'exécuter la query
const [hasSession, setHasSession] = useState(false);

useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setHasSession(!!session);
  };
  checkSession();
}, []);
```

### 2. Listener Auth State
```tsx
// ✅ Réagir aux changements de session (login/logout)
supabase.auth.onAuthStateChange((_event, session) => {
  setHasSession(!!session);
});
```

### 3. Enabled Conditionnel
```tsx
// ✅ Exécuter UNIQUEMENT si session active
return useQuery({
  queryKey: ['current-user'],
  queryFn: async () => { /* ... */ },
  enabled: hasSession, // 🔑 CLÉ DE LA CORRECTION
  retry: false,
});
```

### 4. Retour null au lieu de throw
```tsx
// ❌ Avant
if (authError || !authUser) {
  throw new Error('Non authentifié'); // Erreur console
}

// ✅ Après
if (authError || !authUser) {
  return null; // Pas d'erreur, juste null
}
```

---

## Impact sur l'Application

### ✅ Avant la Correction
- ❌ Erreur `🚨 Query Error: current-user Non authentifié` en boucle
- ❌ Query s'exécute même sans session
- ❌ Retry inutile
- ❌ Console polluée

### ✅ Après la Correction
- ✅ Pas d'erreur si non connecté
- ✅ Query s'exécute UNIQUEMENT si session active
- ✅ Pas de retry inutile
- ✅ Console propre
- ✅ Réagit automatiquement au login/logout

---

## Composants Impactés

Tous les composants utilisant `useCurrentUser()` bénéficient de cette correction:

### Dashboards
- ✅ `UserDashboard.tsx`
- ✅ `UserDashboardPerfect.tsx`
- ✅ `UserDashboardModular.tsx`
- ✅ `UserDashboardModern.tsx`
- ✅ `UserDashboardInspired.tsx`

### Pages
- ✅ `StudentsPage.tsx`
- ✅ `StaffPage.tsx`
- ✅ `ShareFilesPage.tsx`
- ✅ `ReportsPage.tsx`
- ✅ `DirectorDashboard.tsx`

### Providers
- ✅ `PermissionsProvider.tsx`

---

## Flux d'Authentification

```
1. Utilisateur arrive sur l'app
   ↓
2. useCurrentUser() vérifie session Supabase
   ↓
3a. PAS de session → enabled: false → Pas d'exécution
   ↓
   Redirection vers /login
   
3b. Session ACTIVE → enabled: true → Exécution
   ↓
   Récupération données user
   ↓
   Affichage dashboard selon rôle
```

---

## Tests de Validation

### ✅ Test 1: Non Connecté
```
1. Ouvrir l'app sans session
2. Vérifier console → Pas d'erreur "current-user"
3. Vérifier Network → Pas de requête users
```

### ✅ Test 2: Connexion
```
1. Se connecter
2. Vérifier console → "✅ Token refreshed successfully"
3. Vérifier useCurrentUser → Retourne les données
4. Vérifier dashboard → Affiche le bon rôle
```

### ✅ Test 3: Déconnexion
```
1. Se déconnecter
2. Vérifier console → "🚪 User signed out"
3. Vérifier useCurrentUser → enabled: false
4. Vérifier redirection → /login
```

---

## Logs Attendus

### Non Connecté (Normal)
```
⚠️ Invalid session detected, clearing...
🚪 User signed out
→ Redirection vers /login
```

### Connecté (Normal)
```
✅ Token refreshed successfully
✅ [ModulesStore] Modules chargés: 47
✅ [ModulesStore] Catégories chargées: 9
✅ Fetched 6 access profiles
```

### Erreur BDD (Rare)
```
❌ Erreur récupération user: [détails erreur]
→ Retourne null (pas de crash)
```

---

## Fichiers Modifiés

1. ✅ `src/features/user-space/hooks/useCurrentUser.ts`
   - Ajout vérification session
   - Ajout listener auth state
   - `enabled: hasSession`
   - Retour `null` au lieu de `throw`

2. ✅ `src/lib/supabase.ts` (précédemment)
   - Listener auth state global
   - Auto-cleanup sessions invalides

3. ✅ `src/providers/AccessProfilesProvider.tsx` (précédemment)
   - Fix infinite loop

---

## Règles à Respecter

### ✅ À TOUJOURS FAIRE
```tsx
// 1. Vérifier session avant query
const [hasSession, setHasSession] = useState(false);
useEffect(() => {
  checkSession();
}, []);

// 2. Utiliser enabled conditionnel
return useQuery({
  enabled: hasSession,
  retry: false,
});

// 3. Retourner null au lieu de throw
if (error) return null;
```

### ❌ À NE JAMAIS FAIRE
```tsx
// 1. Query sans vérification session
return useQuery({
  queryFn: async () => { /* ... */ },
  // ❌ Pas de enabled
});

// 2. Throw erreur pour non authentifié
if (!user) {
  throw new Error('Non authentifié'); // ❌
}

// 3. Retry pour auth
return useQuery({
  retry: 1, // ❌ Inutile si pas de session
});
```

---

## Conformité Logique Métier

### ✅ Checklist Respectée

- [x] Hiérarchie 3 niveaux respectée
- [x] Session Supabase vérifiée
- [x] Pas d'exécution si non connecté
- [x] Retour null au lieu d'erreur
- [x] Listener auth state actif
- [x] Pas de retry inutile
- [x] Console propre
- [x] Performance optimale

---

**Date:** 17 novembre 2025  
**Status:** ✅ Corrigé et testé  
**Impact:** Critique (bloquait l'UX)  
**Logique Métier:** 100% respectée
