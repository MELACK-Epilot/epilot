# 🔒 GESTION DES ERREURS 403 - Authentification

## 🎯 Problème Résolu

**Erreur Console** :
```
csltuxbanvweyfzqpfap.supabase.co/auth/v1/user:1 Failed to load resource: the server responded with a status of 403 ()
```

**Cause** : Session expirée ou token invalide

---

## ✅ Solutions Implémentées

### 1. **Détection Automatique 403 dans error-toast.tsx**

```typescript
// Erreur 403 (Forbidden) - Session expirée
if (lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
  showAuthError('Votre session a expiré. Veuillez vous reconnecter.');
  // Rediriger vers la page de connexion après 2 secondes
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
  return;
}
```

**Comportement** :
1. ✅ Détecte l'erreur 403
2. ✅ Affiche un toast clair
3. ✅ Redirige automatiquement vers `/login` après 2s
4. ✅ Nettoie le localStorage

---

### 2. **Gestionnaire Centralisé (supabase-error-handler.ts)**

**Fichier créé** : `src/lib/supabase-error-handler.ts`

**Fonctions Principales** :

#### `isAuthError(error)`
Détecte si une erreur est liée à l'authentification.

```typescript
isAuthError(error) // true si 401, 403, ou message auth
```

#### `handleAuthError(error?)`
Gère une erreur d'authentification complètement.

```typescript
handleAuthError(error);
// 1. Affiche toast
// 2. Log en dev
// 3. Nettoie localStorage
// 4. Redirige vers /login
```

#### `handleSupabaseError(error)`
Intercepteur pour les requêtes Supabase.

```typescript
try {
  const data = await supabase.from('table').select();
} catch (error) {
  handleSupabaseError(error); // Gère auto si auth error
}
```

#### `withAuthErrorHandling(queryFn)`
Wrapper pour les requêtes avec gestion automatique.

```typescript
const data = await withAuthErrorHandling(async () => {
  return await supabase.from('table').select();
});
```

#### `requireAuth()`
Vérifie si l'utilisateur est authentifié.

```typescript
if (!requireAuth()) {
  // Redirigé automatiquement vers /login
  return;
}
```

---

### 3. **Réduction des Logs de Debug**

**Avant** :
```
🚀 useSchoolGroups: Hook appelé avec filtres: undefined
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: Object
✅ Nouveau groupe scolaire ajouté
```

**Après** :
```
(Logs uniquement si filtres appliqués et en mode dev)
```

**Modifications** :
- Logs conditionnels : `if (import.meta.env.DEV && filters)`
- Suppression des logs temps réel inutiles
- Conservation des logs d'erreur uniquement

---

## 🎨 Expérience Utilisateur

### Scénario : Session Expirée

**1. Utilisateur fait une action**
```
Clic sur "Créer un utilisateur"
```

**2. Erreur 403 détectée**
```
🔒 Erreur d'authentification
Votre session a expiré. Veuillez vous reconnecter.
```

**3. Redirection automatique**
```
Redirection vers /login dans 2 secondes...
```

**4. Page de connexion**
```
Utilisateur peut se reconnecter
```

---

## 📊 Comparaison Avant/Après

### Avant

**Console** :
```
csltuxbanvweyfzqpfap.supabase.co/auth/v1/user:1 Failed to load resource: 403
🚀 useSchoolGroups: Hook appelé avec filtres: undefined
🚀 useSchoolGroups: Hook appelé avec filtres: undefined
🚀 useSchoolGroups: Hook appelé avec filtres: undefined
error-toast.tsx:138 🚨 Exception capturée: Object
```

**Utilisateur** :
- ❌ Aucune indication claire
- ❌ Reste bloqué sur la page
- ❌ Doit rafraîchir manuellement

### Après

**Console** :
```
🔒 Erreur d'authentification détectée: {
  status: 403,
  message: "Forbidden",
  timestamp: "2025-11-04T14:20:00.123Z"
}
```

**Utilisateur** :
- ✅ Toast clair : "Votre session a expiré"
- ✅ Redirection automatique vers login
- ✅ Peut se reconnecter immédiatement

---

## 🔧 Intégration dans les Hooks

### Exemple : useSchoolGroups

**Avant** :
```typescript
const { data, error } = await query;

if (error) {
  console.error('❌ Erreur:', error);
  throw error;
}
```

**Après** :
```typescript
const { data, error } = await query;

if (error) {
  console.error('❌ Erreur:', error);
  handleSupabaseError(error); // Gère auto si 403
  throw error;
}
```

### Exemple : Composant avec Protection

```typescript
import { requireAuth } from '@/lib/supabase-error-handler';

export const ProtectedComponent = () => {
  useEffect(() => {
    if (!requireAuth()) {
      return; // Redirigé automatiquement
    }
    // Code protégé
  }, []);
  
  return <div>Contenu protégé</div>;
};
```

---

## 📁 Fichiers Créés/Modifiés

### Créés ✨

1. **supabase-error-handler.ts** (120 lignes)
   - `isAuthError()`
   - `handleAuthError()`
   - `handleSupabaseError()`
   - `withAuthErrorHandling()`
   - `requireAuth()`

2. **GESTION_ERREUR_403_AUTH.md**
   - Documentation complète

### Modifiés 🔧

1. **error-toast.tsx**
   - Détection 403 avec redirection
   - Messages d'erreur améliorés

2. **useSchoolGroups.ts**
   - Logs réduits (conditionnels)
   - Suppression spam console

---

## 🚀 Utilisation

### Simple (Recommandé)

```typescript
import { showErrorFromException } from '@/components/ui/error-toast';

try {
  await someAction();
} catch (error) {
  showErrorFromException(error); // Gère 403 automatiquement
}
```

### Avec Wrapper

```typescript
import { withAuthErrorHandling } from '@/lib/supabase-error-handler';

const data = await withAuthErrorHandling(async () => {
  return await supabase.from('users').select();
});
```

### Vérification Manuelle

```typescript
import { requireAuth } from '@/lib/supabase-error-handler';

if (!requireAuth()) {
  return; // Redirigé automatiquement
}
```

---

## 🎯 Prochaines Étapes

### À Intégrer

- [ ] useUsers.ts
- [ ] useCategories.ts
- [ ] useModules.ts
- [ ] Tous les autres hooks Supabase

### Amélioration Future

- [ ] Refresh token automatique avant expiration
- [ ] Notification avant expiration (countdown)
- [ ] Sauvegarde de l'état avant redirection
- [ ] Restauration après reconnexion

---

## ✅ Checklist

- [x] Détection 403 dans error-toast
- [x] Redirection automatique vers login
- [x] Nettoyage localStorage
- [x] Gestionnaire centralisé créé
- [x] Logs de debug réduits
- [x] Documentation complète
- [ ] Tests utilisateur
- [ ] Intégration dans tous les hooks

---

**Date** : 4 Novembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ IMPLÉMENTÉ  
**Prêt pour** : Tests et intégration complète
