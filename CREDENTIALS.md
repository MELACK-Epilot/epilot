# 🔐 Identifiants de Connexion - E-Pilot Congo

## 🧪 Mode Développement (Mock)

### Super Admin

```
Email    : admin@epilot.cg
Password : admin123
Rôle     : Super Admin
```

**Accès** :
- ✅ Dashboard complet
- ✅ Gestion des groupes scolaires
- ✅ Gestion des utilisateurs
- ✅ Tous les modules

---

## 🚀 Comment se connecter

### 1. Lancer l'application

```bash
npm run dev
```

### 2. Accéder à la page de connexion

```
http://localhost:3000/login
```

ou

```
http://localhost:3001/login
```

### 3. Entrer les identifiants

- **Email** : `admin@epilot.cg`
- **Mot de passe** : `admin123`
- **Se souvenir de moi** : Optionnel (sauvegarde dans IndexedDB)

### 4. Cliquer sur "Accéder au système"

Vous serez automatiquement redirigé vers le Dashboard.

---

## 📍 URLs disponibles après connexion

### Dashboard
```
http://localhost:3000/dashboard
```
- Vue d'ensemble
- 4 StatCards
- 3 Graphiques interactifs
- Activité récente

### Groupes Scolaires
```
http://localhost:3000/dashboard/school-groups
```
- Liste complète
- Filtres (statut, plan)
- Actions CRUD
- Modal détails

---

## 🔧 Fonctionnement du système Mock

Le hook `useLogin` utilise `loginWithMock()` qui :

1. ✅ Simule un délai réseau (1 seconde)
2. ✅ Vérifie les identifiants
3. ✅ Crée un token JWT mock
4. ✅ Sauvegarde dans Zustand store
5. ✅ Sauvegarde dans IndexedDB (si "Se souvenir")
6. ✅ Redirige vers `/dashboard`

---

## 🎯 Ajouter d'autres utilisateurs Mock

Pour ajouter d'autres utilisateurs de test, modifiez :

**Fichier** : `src/features/auth/hooks/useLogin.ts`

```typescript
// Ligne 122 - Ajouter des conditions
if (credentials.email === 'admin@epilot.cg' && credentials.password === 'admin123') {
  // Super Admin
} else if (credentials.email === 'groupe@epilot.cg' && credentials.password === 'groupe123') {
  // Admin Groupe
  const mockUser = {
    id: '2',
    email: 'groupe@epilot.cg',
    firstName: 'Admin',
    lastName: 'Groupe',
    role: 'admin_groupe',
    // ...
  };
} else if (credentials.email === 'ecole@epilot.cg' && credentials.password === 'ecole123') {
  // Admin École
  const mockUser = {
    id: '3',
    email: 'ecole@epilot.cg',
    firstName: 'Admin',
    lastName: 'École',
    role: 'admin_ecole',
    // ...
  };
}
```

---

## 🔐 Sécurité

**⚠️ IMPORTANT** : Ces identifiants sont pour le développement uniquement !

En production :
- ❌ Ne jamais hardcoder les identifiants
- ✅ Utiliser une vraie API d'authentification
- ✅ Implémenter JWT avec refresh tokens
- ✅ Ajouter 2FA
- ✅ Rate limiting
- ✅ Logs d'audit

---

## 🧪 Tests

### Test de connexion réussie
```
Email    : admin@epilot.cg
Password : admin123
Résultat : ✅ Redirection vers /dashboard
```

### Test de connexion échouée
```
Email    : wrong@email.com
Password : wrongpass
Résultat : ❌ Message d'erreur "Email ou mot de passe incorrect"
```

### Test "Se souvenir de moi"
```
1. Cocher "Se souvenir de moi"
2. Se connecter
3. Fermer le navigateur
4. Rouvrir → Toujours connecté (données dans IndexedDB)
```

---

## 📚 Fichiers liés

- `src/features/auth/hooks/useLogin.ts` - Hook de connexion
- `src/features/auth/components/LoginForm.tsx` - Formulaire
- `src/features/auth/store/auth.store.ts` - Store Zustand
- `src/features/auth/utils/auth.db.ts` - IndexedDB

---

## 🚀 Prochaines étapes

1. ✅ Tester la connexion mock
2. ⏳ Implémenter l'API backend réelle
3. ⏳ Ajouter JWT avec refresh tokens
4. ⏳ Implémenter 2FA
5. ⏳ Ajouter la gestion des sessions
6. ⏳ Logs d'audit

---

**© 2025 E-Pilot Congo • République du Congo 🇨🇬**
