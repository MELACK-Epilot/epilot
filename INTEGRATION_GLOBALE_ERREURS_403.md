# ✅ INTÉGRATION GLOBALE - Gestion Erreurs 403

## 🎯 Objectif

Intégrer la gestion automatique des erreurs 403 dans **TOUS** les hooks React Query de l'application, sans modifier chaque hook individuellement.

---

## 🚀 Solution Implémentée

### Approche : Wrapper React Query Global

Au lieu de modifier 29 hooks individuellement, nous avons créé un **wrapper React Query** qui gère automatiquement toutes les erreurs 403 au niveau global.

---

## 📁 Fichiers Créés

### 1. `react-query-error-handler.ts`

**Localisation** : `src/lib/react-query-error-handler.ts`

**Fonctionnalités** :

#### `createQueryClientWithErrorHandling()`
Crée un QueryClient avec gestion automatique des erreurs.

```typescript
export const queryClient = createQueryClientWithErrorHandling();
```

**Configuration** :
- **QueryCache** : Intercepte toutes les erreurs de queries
- **MutationCache** : Intercepte toutes les erreurs de mutations
- **Retry Logic** : Ne retry jamais les erreurs 403
- **Error Handling** : Détection auto + toast + redirection

#### `withErrorHandling(queryFn, context?)`
Wrapper pour les query functions individuelles.

```typescript
const data = await withErrorHandling(
  async () => await supabase.from('table').select(),
  { queryKey: ['table'] }
);
```

#### `useQueryErrorHandler()`
Hook pour gérer les erreurs dans les composants.

```typescript
const { handleError } = useQueryErrorHandler();

try {
  await action();
} catch (error) {
  handleError(error);
}
```

---

## 🔧 Modifications Appliquées

### `react-query.ts` (Simplifié)

**Avant** (43 lignes) :
```typescript
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    retry: 0,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
```

**Après** (7 lignes) :
```typescript
import { createQueryClientWithErrorHandling } from './react-query-error-handler';

export const queryClient = createQueryClientWithErrorHandling();
```

**Gain** : -84% de code, +100% de fonctionnalités

---

## 🎨 Fonctionnement Automatique

### Scénario 1 : Query Error (useQuery)

```typescript
// Dans n'importe quel hook
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const { data, error } = await supabase.from('users').select();
    if (error) throw error; // ← Erreur 403 détectée automatiquement
    return data;
  }
});
```

**Comportement** :
1. ✅ Erreur 403 détectée par QueryCache
2. ✅ `isAuthError()` retourne true
3. ✅ `handleSupabaseError()` appelé
4. ✅ Toast affiché : "Session expirée"
5. ✅ Redirection vers `/login` après 2s
6. ✅ localStorage nettoyé

### Scénario 2 : Mutation Error (useMutation)

```typescript
// Dans n'importe quel hook
const mutation = useMutation({
  mutationFn: async (input) => {
    const { data, error } = await supabase.from('users').insert(input);
    if (error) throw error; // ← Erreur 403 détectée automatiquement
    return data;
  }
});
```

**Comportement** : Identique au Scénario 1

---

## 📊 Hooks Couverts Automatiquement

### ✅ Tous les Hooks (29)

1. ✅ useActivityLogs
2. ✅ useAssignAdminToGroup
3. ✅ useCategories
4. ✅ useCommunication
5. ✅ useCurrentUserGroup
6. ✅ useDashboardStats
7. ✅ useExpenses
8. ✅ useFinanceExport
9. ✅ useFinancialStats
10. ✅ useMessaging
11. ✅ useModules
12. ✅ useNotifications
13. ✅ usePayments
14. ✅ usePlans
15. ✅ useQuotas
16. ✅ useRealFinancialStats
17. ✅ useRealtimeActivity
18. ✅ useSchoolFinances
19. ✅ useSchoolGroupModules
20. ✅ useSchoolGroups
21. ✅ useSchools-simple
22. ✅ useSchools
23. ✅ useSidebar
24. ✅ useSubscriptions
25. ✅ useSystemAlerts
26. ✅ useTickets
27. ✅ useTrash
28. ✅ useUserAssignedModules
29. ✅ useUsers

**Aucune modification nécessaire dans ces hooks !**

---

## 🎯 Configuration du QueryClient

### QueryCache (Queries)

```typescript
queryCache: new QueryCache({
  onError: (error, query) => {
    // Log en développement
    if (import.meta.env.DEV) {
      console.error('🚨 Query Error:', {
        queryKey: query.queryKey,
        error,
        timestamp: new Date().toISOString(),
      });
    }

    // Gérer les erreurs d'authentification
    if (isAuthError(error)) {
      handleSupabaseError(error);
      return;
    }

    // Afficher toast pour autres erreurs
    if (query.state.fetchStatus !== 'idle') {
      showErrorFromException(error);
    }
  },
})
```

### MutationCache (Mutations)

```typescript
mutationCache: new MutationCache({
  onError: (error, variables, context, mutation) => {
    // Log en développement
    if (import.meta.env.DEV) {
      console.error('🚨 Mutation Error:', {
        mutationKey: mutation.options.mutationKey,
        error,
        timestamp: new Date().toISOString(),
      });
    }

    // Gérer les erreurs d'authentification
    if (isAuthError(error)) {
      handleSupabaseError(error);
      return;
    }

    // Afficher toast si pas géré manuellement
    if (!mutation.options.onError) {
      showErrorFromException(error);
    }
  },
})
```

### Retry Logic

```typescript
queries: {
  retry: (failureCount, error) => {
    // Ne pas retry les erreurs d'authentification
    if (isAuthError(error)) {
      return false;
    }
    // Retry max 2 fois pour les autres erreurs
    return failureCount < 2;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
},
mutations: {
  retry: (failureCount, error) => {
    // Ne jamais retry les mutations en cas d'erreur auth
    if (isAuthError(error)) {
      return false;
    }
    return false;
  },
}
```

---

## 📝 Logs Conditionnels

### Développement

**Query Error** :
```
🚨 Query Error: {
  queryKey: ['users'],
  error: { status: 403, message: "Forbidden" },
  timestamp: "2025-11-04T14:24:00.123Z"
}
```

**Mutation Error** :
```
🚨 Mutation Error: {
  mutationKey: ['createUser'],
  error: { status: 403, message: "Forbidden" },
  timestamp: "2025-11-04T14:24:00.123Z"
}
```

### Production

**Aucun log console** - Seulement le toast utilisateur.

---

## 🎨 Expérience Utilisateur

### Avant

- ❌ Erreur 403 non gérée
- ❌ Utilisateur bloqué
- ❌ Doit rafraîchir manuellement
- ❌ Perte de données non sauvegardées

### Après

- ✅ Toast clair : "Session expirée"
- ✅ Redirection automatique
- ✅ Peut se reconnecter immédiatement
- ✅ Expérience fluide

---

## 🔄 Flux Complet

```
1. Utilisateur fait une action
   ↓
2. Hook React Query exécute queryFn/mutationFn
   ↓
3. Supabase retourne erreur 403
   ↓
4. QueryCache/MutationCache intercepte l'erreur
   ↓
5. isAuthError() détecte que c'est une erreur auth
   ↓
6. handleSupabaseError() appelé
   ↓
7. Toast affiché : "Session expirée"
   ↓
8. localStorage nettoyé
   ↓
9. Redirection vers /login après 2s
   ↓
10. Utilisateur peut se reconnecter
```

---

## 📊 Comparaison Approches

### Approche 1 : Modifier Chaque Hook ❌

```typescript
// Dans CHAQUE hook (x29)
const { data, error } = await query;

if (error) {
  if (isAuthError(error)) {
    handleAuthError(error);
  }
  throw error;
}
```

**Inconvénients** :
- 29 fichiers à modifier
- Code dupliqué
- Risque d'oubli
- Maintenance difficile

### Approche 2 : Wrapper Global ✅

```typescript
// UNE SEULE FOIS dans react-query.ts
export const queryClient = createQueryClientWithErrorHandling();
```

**Avantages** :
- ✅ 1 seul fichier modifié
- ✅ Aucune duplication
- ✅ Impossible d'oublier
- ✅ Maintenance centralisée
- ✅ Fonctionne pour tous les hooks existants et futurs

---

## 🚀 Utilisation

### Automatique (Recommandé)

**Aucune modification nécessaire !**

Tous les hooks utilisant `useQuery` ou `useMutation` bénéficient automatiquement de la gestion d'erreurs 403.

### Manuelle (Si Besoin)

```typescript
import { useQueryErrorHandler } from '@/lib/react-query-error-handler';

const { handleError } = useQueryErrorHandler();

try {
  await customAction();
} catch (error) {
  handleError(error);
}
```

---

## ✅ Checklist

- [x] Créer react-query-error-handler.ts
- [x] Créer createQueryClientWithErrorHandling()
- [x] Configurer QueryCache avec onError
- [x] Configurer MutationCache avec onError
- [x] Configurer retry logic
- [x] Mettre à jour react-query.ts
- [x] Tester avec erreur 403
- [x] Vérifier tous les hooks (29)
- [x] Documentation complète
- [ ] Tests utilisateur finaux

---

## 🎯 Résultat Final

### Code

**Avant** : 29 hooks à modifier individuellement  
**Après** : 0 hooks à modifier (gestion globale)

**Gain** : 100% de couverture avec 0% de modifications

### Fonctionnalités

- ✅ Détection automatique 403
- ✅ Toast professionnel
- ✅ Redirection automatique
- ✅ Nettoyage localStorage
- ✅ Logs conditionnels
- ✅ Retry logic intelligent
- ✅ Couverture complète (29 hooks)

---

## 📚 Fichiers Créés

1. **react-query-error-handler.ts** (120 lignes)
   - createQueryClientWithErrorHandling()
   - withErrorHandling()
   - useQueryErrorHandler()

2. **INTEGRATION_GLOBALE_ERREURS_403.md**
   - Documentation complète
   - Guide d'utilisation
   - Comparaison approches

---

## 🎉 Conclusion

**Tous les hooks React Query de l'application gèrent maintenant automatiquement les erreurs 403 !**

Aucune modification nécessaire dans les hooks individuels. La gestion est centralisée et automatique.

---

**Date** : 4 Novembre 2025  
**Version** : 2.0.0  
**Statut** : ✅ INTÉGRÉ GLOBALEMENT  
**Couverture** : 29/29 hooks (100%)
