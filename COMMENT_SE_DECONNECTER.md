# 🚪 Comment se déconnecter de E-Pilot

## 🎯 Problème
Quand tu lances la plateforme, elle ouvre directement le dashboard au lieu de la page de connexion car tu es déjà connecté (session sauvegardée).

---

## ✅ Solution 1 : Se déconnecter via l'interface (RECOMMANDÉ)

### Étapes

1. **Ouvrir le menu utilisateur** (en haut à droite)
   - Clique sur ton avatar/nom d'utilisateur
   - OU clique sur l'icône de profil

2. **Cliquer sur "Déconnexion"**
   - Le bouton devrait être dans le dropdown menu
   - Icône : 🚪 ou LogOut

3. **Tu seras redirigé vers `/login`**

---

## ✅ Solution 2 : Accéder directement à la route de déconnexion

### Dans le navigateur

Tape cette URL :
```
http://localhost:3000/logout
```

Ou si le port est différent :
```
http://localhost:5173/logout
```

**Résultat** : Déconnexion automatique + redirection vers `/login`

---

## ✅ Solution 3 : Vider le cache manuellement

### Méthode A : Via la console du navigateur

1. Ouvrir la console (F12)
2. Onglet **"Console"**
3. Taper ces commandes :

```javascript
// Supprimer toutes les données d'authentification
localStorage.removeItem('e-pilot-auth');
localStorage.removeItem('auth-token');
localStorage.removeItem('auth-refresh-token');

// Supprimer IndexedDB
indexedDB.deleteDatabase('auth-db');

// Recharger la page
location.reload();
```

### Méthode B : Via DevTools Application

1. Ouvrir DevTools (F12)
2. Onglet **"Application"**
3. Dans le menu de gauche :
   - **Storage** → **Local Storage** → `http://localhost:xxxx`
   - Supprimer les clés :
     - `e-pilot-auth`
     - `auth-token`
     - `auth-refresh-token`
4. **IndexedDB** → Supprimer `auth-db`
5. Recharger la page (F5)

---

## ✅ Solution 4 : Vider tout le cache du navigateur

### Chrome/Edge

1. `Ctrl + Shift + Delete` (Windows/Linux)
2. `Cmd + Shift + Delete` (Mac)
3. Sélectionner :
   - ✅ Cookies et autres données de site
   - ✅ Images et fichiers en cache
4. Période : **Toutes les périodes**
5. Cliquer sur **"Effacer les données"**
6. Recharger la page

---

## 🔍 Vérifier que tu es déconnecté

Après avoir suivi une des solutions ci-dessus :

### 1. Vérifier le localStorage

Console (F12) :
```javascript
console.log(localStorage.getItem('e-pilot-auth'));
// Résultat attendu : null
```

### 2. Vérifier l'URL

Tu devrais être redirigé vers :
```
http://localhost:3000/login
```

### 3. Vérifier la page

Tu devrais voir :
- ✅ Formulaire de connexion
- ✅ Logo E-Pilot
- ✅ Champs Email + Mot de passe
- ✅ Bouton "Se connecter"

---

## 🎯 Ajouter un bouton de déconnexion visible

Si le bouton de déconnexion n'est pas visible dans l'interface, voici où il devrait être :

### Emplacement standard

**Header** (en haut à droite) :
```
[Logo] [Menu] ... [Notifications] [Avatar ▼]
                                      └─ Profil
                                      └─ Paramètres
                                      └─ 🚪 Déconnexion
```

### Si le bouton n'existe pas

Je peux t'aider à l'ajouter. Dis-moi si tu veux que je :
1. Vérifie si le bouton existe dans le code
2. L'ajoute s'il manque
3. Le rende plus visible

---

## 🔐 Comprendre la persistance de session

### Pourquoi tu restes connecté ?

L'application utilise **Zustand** avec **persistance localStorage** :

```typescript
// auth.store.ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'e-pilot-auth',  // ← Clé localStorage
    storage: createJSONStorage(() => localStorage),
  }
)
```

**Données sauvegardées** :
- `user` : Infos utilisateur (nom, email, rôle)
- `token` : Token JWT
- `refreshToken` : Token de rafraîchissement
- `isAuthenticated` : État de connexion

**Durée** : Jusqu'à déconnexion manuelle ou expiration du token

---

## 🚀 Raccourcis rapides

| Action | Méthode |
|--------|---------|
| **Déconnexion rapide** | Aller sur `/logout` |
| **Vider le cache** | `Ctrl + Shift + Delete` |
| **Console rapide** | F12 → `localStorage.clear()` → F5 |
| **Forcer le login** | Supprimer `e-pilot-auth` du localStorage |

---

## 📝 Pour tester la page de connexion

Après déconnexion, tu peux te reconnecter avec :

### Compte Super Admin (mock)
```
Email : admin@epilot.cg
Mot de passe : admin123
```

### Compte réel (Supabase)
```
Email : [ton email]
Mot de passe : [ton mot de passe]
```

---

## 🔧 Si ça ne fonctionne toujours pas

### Vérifier les routes

Dans `src/App.tsx`, vérifie que ces routes existent :

```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/logout" element={<LogoutHandler />} />
```

### Vérifier la redirection

Dans `src/components/ProtectedRoute.tsx` :

```tsx
if (!isAuthenticated || !user) {
  return <Navigate to="/login" replace />;
}
```

---

**Essaie la Solution 2 (aller sur `/logout`) ou la Solution 3 (console) et dis-moi si ça fonctionne !** 🚀
