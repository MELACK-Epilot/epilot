# 🚀 Guide Rapide - Vérification Supabase

## 📋 Étape 1 : Vérifier le fichier `.env.local`

Le fichier `.env.local` doit exister à la **racine du projet** (même niveau que `package.json`).

### ✅ Si le fichier existe déjà
Passez à l'étape 2.

### ❌ Si le fichier n'existe pas
Créez-le avec ce contenu :

```env
VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44
```

---

## 🔍 Étape 2 : Lancer le diagnostic

Exécutez cette commande dans le terminal :

```bash
npm run check-supabase
```

### Ce que le script va faire :
1. ✅ Vérifier les variables d'environnement
2. ✅ Tester la connexion à Supabase
3. ✅ Lister les 9 tables et leur statut
4. ✅ Afficher les données existantes
5. ✅ Donner des recommandations

---

## 📊 Interpréter les résultats

### ✅ Résultat IDÉAL
```
✅ Connexion établie avec succès !
✅ users                     → 1 enregistrement(s)
✅ school_groups             → 0 enregistrement(s)
✅ schools                   → 0 enregistrement(s)
✅ plans                     → 4 enregistrement(s)
...
Tables créées: 9/9
🟢 EXCELLENT: Base de données complète
```

**Action :** Rien à faire, tout est OK ! 🎉

---

### ⚠️ Résultat INCOMPLET
```
❌ users                     → Erreur: relation "users" does not exist
❌ school_groups             → Erreur: relation "school_groups" does not exist
...
Tables créées: 0/9
🔴 CRITIQUE: Aucune table n'existe
```

**Action :** Les tables n'ont pas été créées. Suivez l'étape 3.

---

## 🗃️ Étape 3 : Créer les tables (si nécessaire)

### 1. Ouvrez le dashboard Supabase
```
https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
```

### 2. Allez dans SQL Editor
- Menu latéral → **SQL Editor**
- Cliquez sur **New Query**

### 3. Copiez le schéma SQL
- Ouvrez le fichier `SUPABASE_SQL_SCHEMA.sql`
- Copiez **TOUT** le contenu (398 lignes)
- Collez dans le SQL Editor

### 4. Exécutez le script
- Cliquez sur **RUN** (ou Ctrl+Enter)
- Attendez la confirmation (peut prendre 10-20 secondes)

### 5. Vérifiez la création
- Menu latéral → **Table Editor**
- Vous devriez voir **9 tables** :
  - users
  - school_groups
  - schools
  - plans
  - subscriptions
  - business_categories
  - modules
  - activity_logs
  - notifications

---

## 🧪 Étape 4 : Tester la connexion

### Option A : Via le script
```bash
npm run check-supabase
```

Vous devriez maintenant voir :
```
✅ Connexion établie avec succès !
Tables créées: 9/9
🟢 EXCELLENT: Base de données complète
```

### Option B : Via l'application
```bash
npm run dev
```

1. Ouvrez la console du navigateur (F12)
2. Importez la fonction :
   ```javascript
   import { checkSupabaseConnection } from './src/lib/supabase';
   ```
3. Testez :
   ```javascript
   await checkSupabaseConnection();
   // Devrait afficher : ✅ Connexion Supabase établie
   ```

---

## 📈 Étape 5 : Vérifier les données initiales

Les données suivantes devraient être créées automatiquement :

### Plans d'abonnement (4)
- Gratuit (0 FCFA)
- Premium (50 000 FCFA)
- Pro (150 000 FCFA)
- Institutionnel (500 000 FCFA)

### Super Admin (1)
- Email : `admin@epilot.cg`
- Nom : Super Admin
- Rôle : super_admin

Pour vérifier dans le SQL Editor :
```sql
SELECT * FROM plans;
SELECT * FROM users WHERE role = 'super_admin';
```

---

## 🎯 Récapitulatif des commandes

```bash
# Vérifier l'état de Supabase
npm run check-supabase

# Lancer l'application
npm run dev

# Build production
npm run build
```

---

## ❓ Problèmes courants

### Problème 1 : "Variables Supabase manquantes"
**Solution :** Créez le fichier `.env.local` à la racine (voir Étape 1)

### Problème 2 : "relation does not exist"
**Solution :** Les tables n'existent pas, exécutez le SQL (voir Étape 3)

### Problème 3 : "row-level security policy"
**Solution :** Les politiques RLS sont actives. Pour les tests, vous pouvez temporairement désactiver :
```sql
ALTER TABLE nom_table DISABLE ROW LEVEL SECURITY;
```

### Problème 4 : Script ne s'exécute pas
**Solution :** Vérifiez que vous avez Node.js 18+ :
```bash
node --version
```

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- **SUPABASE_STATUS.md** - État détaillé de la connexion
- **SUPABASE_SETUP.md** - Guide complet d'utilisation
- **SUPABASE_SQL_SCHEMA.sql** - Schéma de la base de données

---

**© 2025 E-Pilot Congo • République du Congo 🇨🇬**
