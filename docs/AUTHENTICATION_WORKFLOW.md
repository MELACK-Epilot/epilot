# 🔐 Workflow d'Authentification E-Pilot Congo

## Architecture de niveau NASA 🚀

Ce document décrit le flux d'authentification complet, optimisé pour 8000+ utilisateurs.

---

## 📊 Diagramme du Flux

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONNEXION UTILISATEUR                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐ │
│  │   LoginPage  │────►│ Supabase Auth│────►│ Récupérer profil utilisateur │ │
│  │  (email/pwd) │     │  signIn()    │     │ + access_profile_code        │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────────┘ │
│                                                       │                      │
│                                                       ▼                      │
│                              ┌────────────────────────────────────────┐      │
│                              │        VÉRIFICATION DU RÔLE            │      │
│                              └────────────────────────────────────────┘      │
│                                              │                               │
│                    ┌─────────────────────────┼─────────────────────────┐     │
│                    ▼                         ▼                         ▼     │
│           ┌───────────────┐         ┌───────────────┐         ┌───────────┐ │
│           │  super_admin  │         │ admin_groupe  │         │ USER_ROLE │ │
│           │               │         │               │         │           │ │
│           └───────┬───────┘         └───────┬───────┘         └─────┬─────┘ │
│                   │                         │                       │       │
│                   ▼                         ▼                       ▼       │
│           ┌───────────────┐         ┌───────────────┐    ┌─────────────────┐│
│           │  /dashboard   │         │  /dashboard   │    │ A un profil ?   ││
│           │ (Accès total) │         │ (Gère groupe) │    └────────┬────────┘│
│           └───────────────┘         └───────────────┘             │         │
│                                                          ┌────────┴────────┐│
│                                                          ▼                 ▼│
│                                                   ┌──────────┐    ┌────────┐│
│                                                   │   OUI    │    │  NON   ││
│                                                   └────┬─────┘    └───┬────┘│
│                                                        ▼              ▼     │
│                                                   ┌──────────┐  ┌──────────┐│
│                                                   │  /user   │  │ Profile  ││
│                                                   │ (Modules │  │ Pending  ││
│                                                   │ du profil│  │  Page    ││
│                                                   └──────────┘  └──────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Règles d'Accès

| Rôle | Profil d'accès | Destination | Modules |
|------|----------------|-------------|---------|
| `super_admin` | ❌ Non requis | `/dashboard` | Tous (gestion plateforme) |
| `admin_groupe` | ❌ Non requis | `/dashboard` | Tous (gestion groupe) |
| `enseignant`, `comptable`, etc. | ✅ **OBLIGATOIRE** | `/user` | Selon profil assigné |
| `eleve`, `parent` | ✅ **OBLIGATOIRE** | `/user` | Consultation selon profil |
| Utilisateur sans profil | ❌ Absent | `ProfilePendingPage` | Aucun |

---

## 🗂️ Fichiers Clés

### Frontend

| Fichier | Rôle |
|---------|------|
| `useLogin.ts` | Hook de connexion avec redirection intelligente |
| `auth.store.ts` | Store Zustand avec persistance localStorage |
| `auth.types.ts` | Types TypeScript (User avec accessProfileCode) |
| `RoleBasedRedirect.tsx` | Composant de redirection selon rôle/profil |
| `ProfilePendingPage.tsx` | Page d'attente avec écoute temps réel |
| `ProtectedRoute.tsx` | Protection des routes par rôle |
| `ProtectedModuleRoute.tsx` | Protection des routes par module |

### Backend (Supabase)

| Élément | Rôle |
|---------|------|
| `get_current_user_role()` | Fonction SECURITY DEFINER pour RLS |
| `get_current_user_school_group_id()` | Fonction SECURITY DEFINER pour RLS |
| `sync_user_modules_from_profile()` | Trigger de synchronisation modules |
| Politiques RLS sur `users` | Contrôle d'accès granulaire |

---

## 🔒 Sécurité

### Politiques RLS (Row Level Security)

```sql
-- Utilisateurs lisent leur propre profil
users_read_own_profile: id = auth.uid()

-- Super Admin accès total
users_super_admin_all: get_current_user_role() = 'super_admin'

-- Admin groupe gère son groupe
admin_groupe_*: get_current_user_role() = 'admin_groupe' 
               AND school_group_id = get_current_user_school_group_id()
```

### Fonctions SECURITY DEFINER

Ces fonctions contournent les politiques RLS pour éviter la récursion infinie :

```sql
-- Retourne le rôle sans déclencher RLS
CREATE FUNCTION get_current_user_role() RETURNS user_role
SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;
```

---

## ⚡ Performance (8000+ utilisateurs)

### Index Optimisés

```sql
idx_users_access_profile          -- Recherche par profil
idx_users_group_profile_active    -- Composite optimisé
idx_users_role_status             -- Filtrage par rôle
idx_users_email                   -- Connexion rapide
```

### Cache React Query

```typescript
{
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,      // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
}
```

---

## 🔄 Temps Réel

### Écoute des changements de profil

La `ProfilePendingPage` écoute en temps réel les modifications :

```typescript
supabase
  .channel(`user-profile-${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users',
    filter: `id=eq.${userId}`,
  }, (payload) => {
    if (payload.new?.access_profile_code) {
      // Profil assigné ! Rediriger vers /user
    }
  })
  .subscribe();
```

### Synchronisation automatique des modules

Quand un profil est assigné, le trigger `sync_user_modules_from_profile` :
1. Supprime les anciens modules du profil précédent
2. Ajoute les nouveaux modules du nouveau profil
3. Respecte les permissions (can_read, can_write, etc.)

---

## 🧪 Scénarios de Test

### ✅ Cas Nominaux

1. **Super Admin se connecte** → Redirigé vers `/dashboard`
2. **Admin Groupe se connecte** → Redirigé vers `/dashboard`
3. **Enseignant avec profil se connecte** → Redirigé vers `/user`
4. **Enseignant sans profil se connecte** → Voit `ProfilePendingPage`
5. **Admin assigne un profil** → L'utilisateur est notifié en temps réel

### ⚠️ Edge Cases

1. **Session expirée** → Toast + redirection vers `/login`
2. **Profil supprimé après connexion** → Géré par `RoleBasedRedirect`
3. **Changement de profil en cours de session** → Modules mis à jour via trigger
4. **Utilisateur désactivé** → Erreur "Compte non actif"

---

## 📋 Checklist de Déploiement

- [ ] Migrations SQL appliquées
- [ ] Fonctions SECURITY DEFINER créées
- [ ] Triggers actifs
- [ ] Politiques RLS en place
- [ ] Index créés
- [ ] Tests de connexion validés
- [ ] Tests de performance validés

---

## 🆘 Dépannage

### Erreur "infinite recursion detected"

**Cause** : Politique RLS qui fait un SELECT sur la même table.

**Solution** : Utiliser des fonctions `SECURITY DEFINER` pour les vérifications.

### Erreur "Aucun profil trouvé"

**Cause** : L'utilisateur n'existe pas dans la table `users`.

**Solution** : Vérifier que l'utilisateur a été créé dans `users` après `auth.users`.

### Page blanche après connexion

**Cause** : Erreur JavaScript non catchée.

**Solution** : Vérifier la console, probablement un problème de types ou de données nulles.

---

*Document généré le 29/11/2025 - E-Pilot Congo 🇨🇬*
