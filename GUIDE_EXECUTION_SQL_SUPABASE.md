# 📘 Guide : Exécuter le script SQL dans Supabase

**Date** : 5 novembre 2025  
**Fichier SQL** : `database/migrations/create_plan_change_requests.sql`

---

## 🎯 Objectif

Créer la table `plan_change_requests` et toutes les fonctions nécessaires pour le système de demande d'upgrade de plan.

---

## 📋 Méthode 1 : Via l'interface Supabase (RECOMMANDÉ)

### Étape 1 : Ouvrir Supabase

1. Va sur **https://supabase.com**
2. Connecte-toi à ton compte
3. Sélectionne ton projet **e-pilot**

---

### Étape 2 : Accéder à l'éditeur SQL

1. Dans le menu de gauche, clique sur **"SQL Editor"** (icône </> )
2. Clique sur **"New query"** (Nouvelle requête)

---

### Étape 3 : Copier le script SQL

1. Ouvre le fichier `database/migrations/create_plan_change_requests.sql`
2. **Copie TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Colle** dans l'éditeur SQL de Supabase (Ctrl+V)

---

### Étape 4 : Exécuter le script

1. Clique sur le bouton **"Run"** (Exécuter) en bas à droite
   - OU appuie sur **Ctrl+Enter** (Windows/Linux)
   - OU appuie sur **Cmd+Enter** (Mac)

2. Attends quelques secondes...

3. ✅ **Résultat attendu** :
   ```
   Success. No rows returned
   ```

---

### Étape 5 : Vérifier la création

1. Dans le menu de gauche, clique sur **"Table Editor"**
2. Tu devrais voir la nouvelle table **`plan_change_requests`**
3. Clique dessus pour voir la structure

---

## 📋 Méthode 2 : Via psql (Ligne de commande)

### Prérequis

- PostgreSQL installé localement
- Accès aux credentials de ta base Supabase

---

### Étape 1 : Récupérer les credentials

1. Va sur Supabase → **Settings** → **Database**
2. Copie la **Connection string** :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

### Étape 2 : Exécuter le script

```bash
# Depuis le dossier racine du projet
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f database/migrations/create_plan_change_requests.sql
```

**OU** si tu as déjà une connexion configurée :

```bash
psql -h db.[YOUR-PROJECT-REF].supabase.co -U postgres -d postgres -f database/migrations/create_plan_change_requests.sql
```

---

## 📋 Méthode 3 : Via Supabase CLI (Moderne)

### Prérequis

```bash
# Installer Supabase CLI
npm install -g supabase
```

---

### Étape 1 : Se connecter

```bash
# Lier le projet
supabase link --project-ref [YOUR-PROJECT-REF]
```

---

### Étape 2 : Exécuter la migration

```bash
# Exécuter le script
supabase db push --file database/migrations/create_plan_change_requests.sql
```

---

## ✅ Vérification que tout fonctionne

### 1. Vérifier la table

Dans l'éditeur SQL de Supabase :

```sql
-- Vérifier que la table existe
SELECT * FROM plan_change_requests LIMIT 1;
```

**Résultat attendu** : `No rows` (normal, la table est vide)

---

### 2. Vérifier les fonctions

```sql
-- Lister les fonctions créées
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%plan_change%';
```

**Résultat attendu** :
```
create_plan_change_request
approve_plan_change_request
reject_plan_change_request
cancel_plan_change_request
```

---

### 3. Vérifier la vue

```sql
-- Vérifier que la vue existe
SELECT * FROM plan_change_requests_detailed LIMIT 1;
```

**Résultat attendu** : `No rows` (normal, aucune demande pour le moment)

---

### 4. Vérifier les policies RLS

```sql
-- Lister les policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'plan_change_requests';
```

**Résultat attendu** : 5 policies
```
Super Admin can view all requests
Admin Groupe can view own requests
Admin Groupe can create requests
Admin Groupe can cancel own requests
Super Admin can approve/reject requests
```

---

## 🧪 Test rapide (Optionnel)

### Créer une demande de test

```sql
-- Remplace les UUIDs par des vrais IDs de ta base
SELECT create_plan_change_request(
  'school-group-uuid-here'::uuid,  -- ID du groupe
  'user-uuid-here'::uuid,           -- ID de l'utilisateur
  'plan-uuid-here'::uuid,           -- ID du plan demandé
  'Test de demande',                -- Raison
  '2025-12-01'::date                -- Date souhaitée
);
```

**Résultat attendu** : Un UUID (l'ID de la demande créée)

---

### Vérifier la demande

```sql
SELECT * FROM plan_change_requests_detailed;
```

**Résultat attendu** : 1 ligne avec ta demande de test

---

### Nettoyer le test

```sql
DELETE FROM plan_change_requests WHERE reason = 'Test de demande';
```

---

## ❌ Problèmes courants

### Erreur : "permission denied"

**Solution** : Tu n'as pas les droits. Utilise l'interface Supabase (Méthode 1) qui utilise automatiquement le user `postgres`.

---

### Erreur : "relation already exists"

**Solution** : La table existe déjà. Tu peux :
1. Supprimer la table existante :
   ```sql
   DROP TABLE IF EXISTS plan_change_requests CASCADE;
   ```
2. Puis réexécuter le script complet

---

### Erreur : "function already exists"

**Solution** : Utilise `CREATE OR REPLACE FUNCTION` (déjà dans le script) ou supprime les fonctions :
```sql
DROP FUNCTION IF EXISTS create_plan_change_request CASCADE;
DROP FUNCTION IF EXISTS approve_plan_change_request CASCADE;
DROP FUNCTION IF EXISTS reject_plan_change_request CASCADE;
DROP FUNCTION IF EXISTS cancel_plan_change_request CASCADE;
```

---

### Erreur : "uuid_generate_v4() does not exist"

**Solution** : Active l'extension UUID :
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 📊 Résumé des objets créés

| Type | Nom | Description |
|------|-----|-------------|
| **Table** | `plan_change_requests` | Stocke les demandes |
| **Fonction** | `create_plan_change_request()` | Créer une demande |
| **Fonction** | `approve_plan_change_request()` | Approuver et mettre à jour |
| **Fonction** | `reject_plan_change_request()` | Refuser une demande |
| **Fonction** | `cancel_plan_change_request()` | Annuler (demandeur) |
| **Vue** | `plan_change_requests_detailed` | Vue avec jointures |
| **Trigger** | `trigger_update_plan_change_requests_updated_at` | Mise à jour auto |
| **Policies** | 5 policies RLS | Sécurité par rôle |

---

## 🎯 Prochaine étape

Une fois le script exécuté avec succès :

1. ✅ Recharge l'application : `Ctrl + Shift + R`
2. ✅ Connecte-toi en tant qu'**Admin Groupe**
3. ✅ Va sur **"Mes Modules"**
4. ✅ Clique sur **"Mettre à niveau"**
5. ✅ Le modal devrait s'ouvrir ! 🎉

---

## 📞 Besoin d'aide ?

Si tu rencontres un problème :

1. Vérifie les **logs** dans Supabase (onglet "Logs")
2. Vérifie que tu as bien copié **TOUT** le script
3. Vérifie que tu es connecté au bon projet
4. Essaie la **Méthode 1** (interface Supabase) qui est la plus simple

---

**🚀 Le script est prêt à être exécuté ! Utilise la Méthode 1 (interface Supabase) pour plus de simplicité.**
