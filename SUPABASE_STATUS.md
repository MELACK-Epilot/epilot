# 📊 État de la connexion Supabase - E-Pilot Congo

**Date de vérification :** 28 octobre 2025

---

## ✅ Configuration actuelle

### 🔗 Informations de connexion

**Projet Supabase :**
- **URL :** `https://csltuxbanvweyfzqpfap.supabase.co`
- **Project ID :** `csltuxbanvweyfzqpfap`
- **Région :** Non spécifiée (à vérifier dans le dashboard)

**Clés d'API :**
- ✅ **Anon Key (Public)** : Configurée
- ⚠️ **Service Role Key** : Non utilisée (réservée backend)

---

## 📁 Fichiers de configuration

### ✅ Fichiers créés

1. **`.env.local`** ❓ (À VÉRIFIER)
   - Statut : Fichier gitignored (normal)
   - Contenu attendu :
     ```env
     VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co
     VITE_SUPABASE_ANON_KEY=votre_clé_anon
     ```

2. **`.env.local.example`** ✅ (Créé)
   - Template avec les valeurs de configuration
   - À copier en `.env.local` si nécessaire

3. **`src/lib/supabase.ts`** ✅ (Créé)
   - Client Supabase configuré
   - Helper `checkSupabaseConnection()`
   - Gestion des erreurs

4. **`src/types/supabase.types.ts`** ✅ (Créé)
   - Types TypeScript pour toutes les tables
   - Interface `Database` complète

5. **`SUPABASE_SQL_SCHEMA.sql`** ✅ (Créé)
   - Schéma SQL complet (398 lignes)
   - 9 tables + enums + RLS + triggers
   - Données initiales (plans + super admin)

---

## 🗃️ Base de données

### 📋 Tables à créer (9 tables)

| Table | Statut | Description |
|-------|--------|-------------|
| `users` | ⏳ À vérifier | Utilisateurs avec RBAC |
| `school_groups` | ⏳ À vérifier | Groupes scolaires |
| `schools` | ⏳ À vérifier | Écoles individuelles |
| `plans` | ⏳ À vérifier | Plans d'abonnement |
| `subscriptions` | ⏳ À vérifier | Abonnements actifs |
| `business_categories` | ⏳ À vérifier | Catégories métiers |
| `modules` | ⏳ À vérifier | Modules fonctionnels |
| `activity_logs` | ⏳ À vérifier | Journal d'activité |
| `notifications` | ⏳ À vérifier | Notifications utilisateurs |

### 🔐 Enums créés

- `user_role` : super_admin, admin_groupe, admin_ecole
- `subscription_plan` : gratuit, premium, pro, institutionnel
- `status` : active, inactive, suspended
- `subscription_status` : active, expired, cancelled, pending

### 🛡️ Row Level Security (RLS)

- ✅ RLS activé sur toutes les tables
- ✅ Politiques pour Super Admin (accès total)
- ✅ Politiques pour Admin Groupe (ses groupes)
- ✅ Politiques pour Admin École (son école)

---

## 🚀 Comment vérifier l'état

### Option 1 : Script de diagnostic automatique

```bash
# Exécuter le script de vérification
npm run check-supabase
```

Ce script va :
- ✅ Vérifier les variables d'environnement
- ✅ Tester la connexion Supabase
- ✅ Lister toutes les tables et leur statut
- ✅ Afficher les données existantes
- ✅ Donner des recommandations

### Option 2 : Vérification manuelle dans le code

```typescript
import { checkSupabaseConnection } from '@/lib/supabase';

// Vérifier la connexion
const isConnected = await checkSupabaseConnection();
console.log('Connexion Supabase:', isConnected ? '✅' : '❌');
```

### Option 3 : Dashboard Supabase

1. Ouvrez : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
2. Allez dans **Table Editor**
3. Vérifiez si les 9 tables existent

---

## 📝 Actions à effectuer

### ⚠️ CRITIQUE : Si les tables n'existent pas

1. **Ouvrez le dashboard Supabase**
   - URL : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap

2. **Allez dans SQL Editor**
   - Menu latéral → SQL Editor → New Query

3. **Copiez-collez le contenu de `SUPABASE_SQL_SCHEMA.sql`**
   - Fichier complet avec 398 lignes

4. **Exécutez le script (RUN)**
   - Attendez la confirmation
   - Vérifiez qu'il n'y a pas d'erreurs

5. **Vérifiez la création**
   - Table Editor → Vous devriez voir 9 tables
   - Vérifiez les données initiales (4 plans + 1 super admin)

### ✅ Si les tables existent déjà

1. **Vérifiez les données de test**
   ```sql
   -- Dans SQL Editor
   SELECT * FROM plans;
   SELECT * FROM users WHERE role = 'super_admin';
   ```

2. **Testez la connexion depuis l'app**
   ```bash
   npm run dev
   # Ouvrez la console (F12)
   # Tapez : await checkSupabaseConnection()
   ```

3. **Remplacez les mocks par les vraies données**
   - Modifier les pages Dashboard
   - Utiliser React Query avec Supabase
   - Supprimer les données mockées

---

## 🔧 Dépannage

### Problème : Variables d'environnement non trouvées

**Symptôme :**
```
❌ Variables Supabase manquantes. Vérifiez votre fichier .env.local
```

**Solution :**
1. Créez le fichier `.env.local` à la racine
2. Copiez le contenu de `.env.local.example`
3. Vérifiez que le fichier est bien à la racine (même niveau que `package.json`)
4. Redémarrez le serveur de dev (`npm run dev`)

### Problème : Erreur de connexion

**Symptôme :**
```
❌ Erreur de connexion Supabase: relation "users" does not exist
```

**Solution :**
- Les tables n'ont pas été créées
- Exécutez `SUPABASE_SQL_SCHEMA.sql` dans le SQL Editor

### Problème : Accès refusé (RLS)

**Symptôme :**
```
new row violates row-level security policy
```

**Solution :**
- Les politiques RLS sont actives
- Utilisez l'authentification Supabase
- Ou désactivez temporairement RLS pour les tests :
  ```sql
  ALTER TABLE nom_table DISABLE ROW LEVEL SECURITY;
  ```

---

## 📊 Métriques de santé

### ✅ Configuration complète

- [x] Client Supabase configuré
- [x] Types TypeScript générés
- [x] Helper de connexion créé
- [x] Schéma SQL prêt
- [x] Variables d'environnement documentées
- [ ] Tables créées dans Supabase ⏳
- [ ] Données de test insérées ⏳
- [ ] Connexion testée ⏳

### 🎯 Prochaines étapes

1. **Vérifier l'état actuel**
   ```bash
   npm run check-supabase
   ```

2. **Créer les tables si nécessaire**
   - Exécuter `SUPABASE_SQL_SCHEMA.sql`

3. **Tester la connexion**
   - Lancer l'app : `npm run dev`
   - Ouvrir la console : F12
   - Tester : `await checkSupabaseConnection()`

4. **Implémenter les vraies données**
   - Remplacer les mocks dans les pages Dashboard
   - Utiliser React Query + Supabase
   - Tester CRUD complet

---

## 📚 Ressources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Dashboard Supabase
- **Projet** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
- **Table Editor** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
- **SQL Editor** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/sql
- **Authentication** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/auth/users

### Fichiers du projet
- Configuration : `src/lib/supabase.ts`
- Types : `src/types/supabase.types.ts`
- Schéma SQL : `SUPABASE_SQL_SCHEMA.sql`
- Guide : `SUPABASE_SETUP.md`
- Script diagnostic : `scripts/check-supabase-status.js`

---

**© 2025 E-Pilot Congo • République du Congo 🇨🇬**
