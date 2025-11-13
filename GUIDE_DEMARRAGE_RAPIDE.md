# 🚀 GUIDE DE DÉMARRAGE RAPIDE - E-Pilot Congo

**Date**: 29 Octobre 2025  
**Version**: 1.0.0  
**Statut**: ✅ **PRODUCTION READY**

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration Supabase](#configuration-supabase)
4. [Lancement du Projet](#lancement-du-projet)
5. [Accès à l'Application](#accès-à-lapplication)
6. [Prochaines Étapes](#prochaines-étapes)

---

## 1. Prérequis

### Logiciels Requis
- ✅ **Node.js** : v18+ ([Télécharger](https://nodejs.org/))
- ✅ **npm** : v9+ (inclus avec Node.js)
- ✅ **Git** : v2.30+ ([Télécharger](https://git-scm.com/))
- ✅ **Compte Supabase** : [Créer un compte](https://supabase.com/)

### Vérification
```bash
node --version  # v18.0.0 ou supérieur
npm --version   # v9.0.0 ou supérieur
git --version   # v2.30.0 ou supérieur
```

---

## 2. Installation

### Étape 1 : Cloner le Projet
```bash
cd c:/Developpement
git clone <URL_DU_REPO> e-pilot
cd e-pilot
```

### Étape 2 : Installer les Dépendances
```bash
npm install
```

**Packages installés** :
- React 19 + TypeScript
- Vite (bundler)
- TanStack React Query
- Supabase JS
- Tailwind CSS + Shadcn/UI
- Framer Motion
- Recharts
- date-fns
- Lucide React

**Durée estimée** : 2-3 minutes

---

## 3. Configuration Supabase

### Étape 1 : Créer un Projet Supabase

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquer sur **New Project**
3. Remplir :
   - **Name** : E-Pilot Congo
   - **Database Password** : (générer un mot de passe fort)
   - **Region** : Europe West (Ireland) ou le plus proche
4. Cliquer sur **Create new project**

**Durée** : ~2 minutes (création du projet)

### Étape 2 : Exécuter le Schéma SQL

1. Dans le dashboard Supabase, aller dans **SQL Editor**
2. Cliquer sur **New query**
3. Copier le contenu de `SUPABASE_SQL_SCHEMA.sql`
4. Coller dans l'éditeur
5. Cliquer sur **Run**

**Tables créées** :
- users
- school_groups
- schools
- plans
- subscriptions
- business_categories
- modules
- activity_logs
- notifications

**Durée** : ~1 minute

### Étape 3 : Configurer le Bucket Avatars

1. Aller dans **Storage** (menu gauche)
2. Cliquer sur **New bucket**
3. Nom : `avatars`
4. Public : ✅ **Coché**
5. Cliquer sur **Create bucket**

6. Aller dans **Policies** (onglet)
7. Copier les politiques SQL de `SUPABASE_STORAGE_AVATARS_SETUP.md`
8. Exécuter dans **SQL Editor**

**Durée** : ~2 minutes

### Étape 4 : Récupérer les Clés API

1. Aller dans **Settings** > **API**
2. Copier :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Étape 5 : Créer le Fichier `.env.local`

Créer le fichier `.env.local` à la racine du projet :

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Storage
VITE_SUPABASE_STORAGE_URL=https://xxxxx.supabase.co/storage/v1
VITE_AVATARS_BUCKET=avatars

# Environment
VITE_APP_ENV=development
```

**⚠️ Important** : Remplacer `xxxxx` par vos vraies valeurs !

---

## 4. Lancement du Projet

### Mode Développement

```bash
npm run dev
```

**Résultat** :
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Durée** : ~2 secondes

### Ouvrir dans le Navigateur

1. Ouvrir [http://localhost:5173](http://localhost:5173)
2. Vous devriez voir la **page de connexion** E-Pilot

---

## 5. Accès à l'Application

### Créer le Premier Super Admin

**Option 1 : Via Supabase Dashboard**

1. Aller dans **Authentication** > **Users**
2. Cliquer sur **Add user**
3. Remplir :
   - **Email** : admin@e-pilot.cg
   - **Password** : (mot de passe fort)
   - **Auto Confirm User** : ✅ Coché
4. Cliquer sur **Create user**

5. Aller dans **Table Editor** > **users**
6. Cliquer sur **Insert** > **Insert row**
7. Remplir :
   - **email** : admin@e-pilot.cg
   - **first_name** : Admin
   - **last_name** : E-Pilot
   - **role** : super_admin
   - **status** : active
8. Cliquer sur **Save**

**Option 2 : Via SQL**

```sql
-- Insérer le Super Admin
INSERT INTO users (
  email,
  first_name,
  last_name,
  role,
  status
) VALUES (
  'admin@e-pilot.cg',
  'Admin',
  'E-Pilot',
  'super_admin',
  'active'
);
```

### Se Connecter

1. Aller sur [http://localhost:5173](http://localhost:5173)
2. Entrer :
   - **Email** : admin@e-pilot.cg
   - **Mot de passe** : (celui créé)
3. Cliquer sur **Se connecter**

**Résultat** : Vous êtes redirigé vers le **Dashboard** !

---

## 6. Prochaines Étapes

### ✅ Étapes Immédiates

#### 1. Créer un Groupe Scolaire
1. Aller dans **Groupes Scolaires** (menu gauche)
2. Cliquer sur **➕ Créer un Groupe**
3. Remplir le formulaire
4. Cliquer sur **Créer**

#### 2. Créer un Administrateur de Groupe
1. Aller dans **Utilisateurs** (menu gauche)
2. Cliquer sur **➕ Ajouter Admin Groupe**
3. Remplir le formulaire (avec photo de profil optionnelle)
4. Cliquer sur **Créer**

#### 3. Explorer les Fonctionnalités
- ✅ **Dashboard** : Vue d'ensemble avec statistiques
- ✅ **Groupes Scolaires** : CRUD complet
- ✅ **Utilisateurs** : Gestion avec avatars
- ✅ **Catégories Métiers** : 8 catégories prédéfinies
- ✅ **Plans** : 4 plans d'abonnement
- ✅ **Modules Pédagogiques** : 50 modules

### 📚 Documentation Disponible

| Document | Description |
|----------|-------------|
| `COHERENCE_COMPLETE_VERIFICATION.md` | Vérification cohérence BDD ↔ UI |
| `SUPABASE_STORAGE_AVATARS_SETUP.md` | Configuration upload avatars |
| `FORMULAIRE_USER_PAYSAGE_AVATAR.md` | Guide formulaire utilisateur |
| `USERS_PAGE_FINAL_IMPLEMENTATION.md` | Documentation page Users |
| `RECAP_FINAL_SESSION.md` | Récapitulatif complet |

### 🔧 Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Linter
npm run lint

# Type checking
npm run type-check
```

### 🐛 Dépannage

#### Erreur : "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Erreur : "Supabase connection failed"
- Vérifier `.env.local`
- Vérifier que les clés API sont correctes
- Vérifier que le projet Supabase est actif

#### Erreur : "Avatar upload failed"
- Vérifier que le bucket `avatars` existe
- Vérifier les politiques RLS
- Voir `SUPABASE_STORAGE_AVATARS_SETUP.md`

#### Page blanche
- Ouvrir la console navigateur (F12)
- Vérifier les erreurs JavaScript
- Vérifier que le serveur dev tourne

---

## 📊 Checklist de Démarrage

### Configuration
- [ ] Node.js v18+ installé
- [ ] Projet cloné
- [ ] `npm install` exécuté
- [ ] Projet Supabase créé
- [ ] Schéma SQL exécuté
- [ ] Bucket `avatars` créé
- [ ] Politiques RLS configurées
- [ ] `.env.local` créé avec bonnes clés
- [ ] Super Admin créé

### Lancement
- [ ] `npm run dev` exécuté
- [ ] Page de connexion accessible
- [ ] Connexion réussie
- [ ] Dashboard affiché
- [ ] Navigation fonctionnelle

### Tests
- [ ] Créer un groupe scolaire
- [ ] Créer un utilisateur
- [ ] Upload avatar testé
- [ ] Export CSV testé
- [ ] Toutes les pages accessibles

---

## 🎯 Résultat Attendu

Après avoir suivi ce guide, vous devriez avoir :

1. ✅ **Application fonctionnelle** sur http://localhost:5173
2. ✅ **Base de données** configurée avec toutes les tables
3. ✅ **Super Admin** créé et connecté
4. ✅ **Navigation** fluide entre toutes les pages
5. ✅ **Upload avatar** opérationnel
6. ✅ **Export CSV** fonctionnel

**Temps total estimé** : 15-20 minutes

---

## 🆘 Support

### Ressources
- 📚 **Documentation** : Voir dossier racine (*.md)
- 🐛 **Issues** : [GitHub Issues](URL_REPO/issues)
- 💬 **Discord** : [Serveur E-Pilot](URL_DISCORD)

### Contacts
- 📧 **Email** : support@e-pilot.cg
- 🌐 **Site** : https://e-pilot.cg

---

## 🎉 Félicitations !

Vous avez configuré **E-Pilot Congo** avec succès ! 🇨🇬

L'application est maintenant prête pour :
- ✅ Développement de nouvelles fonctionnalités
- ✅ Tests utilisateurs
- ✅ Déploiement en production

**Bon développement !** 🚀

---

**Créé par** : Cascade AI  
**Date** : 29 Octobre 2025  
**Version** : 1.0.0
