# 🚀 GUIDE D'INSTALLATION RAPIDE - E-PILOT CONGO

**Temps estimé** : 1 heure  
**Niveau** : Débutant

---

## ✅ PRÉREQUIS

- [x] Node.js 18+ installé
- [x] npm 9+ installé
- [x] Compte Supabase créé
- [x] Projet Supabase créé

---

## 📋 ÉTAPES D'INSTALLATION

### 1️⃣ Configuration Supabase (30 min)

#### A. Créer l'utilisateur de test

1. **Aller dans Supabase Dashboard**
   ```
   https://app.supabase.com/project/YOUR_PROJECT/auth/users
   ```

2. **Cliquer sur "Add user" → "Create new user"**

3. **Remplir le formulaire** :
   - Email : `admin@epilot.cg`
   - Password : `admin123`
   - ✅ Cocher "Auto Confirm User"
   - Cliquer sur "Create user"

4. **Copier l'ID de l'utilisateur** (format UUID)

#### B. Exécuter les migrations SQL

1. **Aller dans SQL Editor**
   ```
   https://app.supabase.com/project/YOUR_PROJECT/sql/new
   ```

2. **Exécuter Migration 1 : Table profiles**
   - Copier le contenu de `database/migrations/001_add_profiles_table.sql`
   - Coller dans SQL Editor
   - Cliquer sur "Run"
   - ✅ Vérifier : "Success. No rows returned"

3. **Exécuter Migration 2 : Profil super admin**
   - Copier le contenu de `database/migrations/002_create_test_user.sql`
   - Coller dans SQL Editor
   - Cliquer sur "Run"
   - ✅ Vérifier : Message "Profil super admin créé/mis à jour"

4. **Vérifier la table profiles**
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@epilot.cg';
   ```
   - ✅ Doit retourner 1 ligne avec role = 'super_admin'

#### C. Tester les politiques RLS

1. **Exécuter le script de test**
   - Copier le contenu de `database/test-rls.sql`
   - Coller dans SQL Editor
   - Cliquer sur "Run"

2. **Vérifier les résultats** :
   - ✅ RLS activé sur toutes les tables (rowsecurity = true)
   - ✅ Politiques créées pour chaque rôle
   - ✅ Aucune politique "TO public"

---

### 2️⃣ Configuration Locale (10 min)

#### A. Copier les variables d'environnement

```bash
# Dans le terminal, à la racine du projet
cp .env.example .env.local
```

#### B. Récupérer les clés Supabase

1. **Aller dans Settings > API**
   ```
   https://app.supabase.com/project/YOUR_PROJECT/settings/api
   ```

2. **Copier les valeurs** :
   - Project URL : `https://YOUR_PROJECT.supabase.co`
   - anon public key : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### C. Remplir .env.local

```env
# .env.local
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

VITE_APP_NAME=E-Pilot Congo
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

**⚠️ IMPORTANT** : Remplacer `YOUR_PROJECT` par votre vrai ID de projet

---

### 3️⃣ Installation des dépendances (5 min)

```bash
# Installer les dépendances npm
npm install

# Vérifier qu'il n'y a pas d'erreurs
npm run type-check
```

---

### 4️⃣ Lancer l'application (2 min)

```bash
# Démarrer le serveur de développement
npm run dev
```

**Résultat attendu** :
```
✅ Variables d'environnement validées avec succès
📦 Environnement: development
🔗 Supabase URL: https://YOUR_PROJECT.supabase.co

  VITE v6.4.1  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 5️⃣ Test de Connexion (5 min)

#### A. Ouvrir l'application

1. **Aller sur** : http://localhost:5173/
2. **Redirection automatique vers** : http://localhost:5173/login

#### B. Se connecter

1. **Remplir le formulaire** :
   - Email : `admin@epilot.cg`
   - Password : `admin123`
   - ✅ Cocher "Se souvenir de moi" (optionnel)

2. **Cliquer sur "Accéder au système"**

3. **Vérifications** :
   - ✅ Toast "Connexion réussie" s'affiche
   - ✅ Redirection vers `/dashboard`
   - ✅ Sidebar affiche "Super Admin E-Pilot"
   - ✅ Avatar avec initiales "SA"

#### C. Tester la navigation

1. **Cliquer sur "Groupes Scolaires"**
   - ✅ Page se charge sans erreur
   - ✅ Stats cards s'affichent

2. **Cliquer sur "Utilisateurs"**
   - ✅ Page se charge sans erreur
   - ✅ Tableau s'affiche

3. **Cliquer sur "Plans"**
   - ✅ 4 plans s'affichent (Gratuit, Premium, Pro, Institutionnel)

#### D. Tester la déconnexion

1. **Cliquer sur l'avatar en haut à droite**
2. **Cliquer sur "Déconnexion"**
3. **Vérifications** :
   - ✅ Redirection vers `/login`
   - ✅ localStorage vidé
   - ✅ Impossible d'accéder à `/dashboard` directement

---

## 🐛 DÉPANNAGE

### Erreur : "Variables d'environnement manquantes"

**Solution** :
1. Vérifier que `.env.local` existe
2. Vérifier que les valeurs ne contiennent pas "your-" ou "your_"
3. Redémarrer le serveur : `Ctrl+C` puis `npm run dev`

### Erreur : "Invalid login credentials"

**Solution** :
1. Vérifier que l'utilisateur existe dans Supabase Auth
2. Vérifier que le profil existe dans la table `profiles`
3. Exécuter la requête SQL :
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@epilot.cg';
   ```
4. Si aucune ligne, réexécuter `002_create_test_user.sql`

### Erreur : "Aucun profil trouvé"

**Solution** :
1. Vérifier que la migration `001_add_profiles_table.sql` a été exécutée
2. Vérifier que le trigger `on_auth_user_created` existe :
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Si le trigger n'existe pas, réexécuter la migration

### Erreur : "Accès refusé" sur une page

**Solution** :
1. Vérifier le rôle de l'utilisateur :
   ```sql
   SELECT email, role FROM profiles WHERE email = 'admin@epilot.cg';
   ```
2. Le rôle doit être `super_admin`
3. Si ce n'est pas le cas :
   ```sql
   UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@epilot.cg';
   ```

### Page blanche / Erreur React

**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier que ErrorBoundary s'affiche
4. Recharger la page (Ctrl+Shift+R)

---

## ✅ CHECKLIST DE VALIDATION

### Supabase
- [ ] Utilisateur `admin@epilot.cg` créé dans Auth
- [ ] Table `profiles` créée
- [ ] Profil super admin créé
- [ ] RLS activé sur toutes les tables
- [ ] Politiques RLS testées

### Configuration Locale
- [ ] `.env.local` créé
- [ ] Variables Supabase remplies
- [ ] Pas d'erreur au démarrage

### Tests Fonctionnels
- [ ] Connexion réussie
- [ ] Redirection vers dashboard
- [ ] Navigation entre pages
- [ ] Déconnexion réussie
- [ ] Protection des routes

---

## 🎉 FÉLICITATIONS !

Votre plateforme E-Pilot Congo est maintenant **opérationnelle** !

### Prochaines étapes recommandées :

1. **Créer des données de test**
   - Créer un groupe scolaire
   - Créer une école
   - Créer des utilisateurs

2. **Explorer les fonctionnalités**
   - Gestion des plans
   - Gestion des modules
   - Statistiques financières

3. **Personnaliser**
   - Ajouter votre logo
   - Modifier les couleurs (si nécessaire)
   - Configurer les emails

4. **Déployer en production**
   - Suivre le guide `DEPLOYMENT.md`
   - Configurer le domaine
   - Activer HTTPS

---

## 📞 BESOIN D'AIDE ?

- 📧 **Email** : support@epilot.cg
- 📚 **Documentation** : `/docs`
- 🐛 **Issues** : GitHub Issues
- 💬 **Discord** : [Lien Discord]

---

**Temps total** : ~1 heure  
**Statut** : ✅ Installation complète

Bon développement avec E-Pilot Congo ! 🇨🇬🚀
