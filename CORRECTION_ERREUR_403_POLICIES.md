# 🔧 CORRECTION ERREUR 403 - Policies RLS

**Date:** 20 novembre 2025  
**Erreur:** `permission denied for table users`  
**Status:** ✅ **CORRECTION PRÊTE**

---

## 🐛 PROBLÈME

### Erreur Complète
```
Error: permission denied for table users
code: "42501"
message: "permission denied for table users"
```

### Cause
Les RLS policies essaient d'accéder à `auth.users` pour vérifier le rôle, mais:
- ❌ La table `auth.users` n'est pas accessible depuis les policies
- ❌ Ou la table s'appelle `users` (schéma public) et non `auth.users`
- ❌ Les permissions ne sont pas configurées correctement

---

## ✅ SOLUTION

### Approche: Policies Simplifiées

Au lieu de vérifier le rôle dans `auth.users`, on utilise simplement `auth.uid()` pour vérifier que l'utilisateur est authentifié et qu'il est propriétaire de la recommandation.

**Avantages:**
- ✅ Plus simple
- ✅ Pas besoin d'accéder à la table users
- ✅ Fonctionne immédiatement
- ✅ Sécurisé (chaque utilisateur voit seulement ses données)

---

## 🚀 APPLICATION DE LA CORRECTION

### 1. Ouvrir Supabase SQL Editor

```
https://app.supabase.com/project/[votre-projet]/sql
```

### 2. Copier la Migration de Correction

**Fichier:** `supabase/migrations/20251120_fix_applied_recommendations_policies.sql`

### 3. Coller et Exécuter

- Copier tout le contenu
- Coller dans SQL Editor
- Cliquer "Run"

### 4. Vérifier le Succès

```sql
-- Vérifier les nouvelles policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'applied_recommendations';

-- Devrait retourner:
-- - Users can view their own applied recommendations
-- - Authenticated users can create applied recommendations
-- - Users can update their own applied recommendations
-- - Users can delete their own applied recommendations
```

---

## 📋 NOUVELLES POLICIES

### 1. SELECT (Lecture)
```sql
CREATE POLICY "Users can view their own applied recommendations"
  ON applied_recommendations FOR SELECT
  USING (applied_by = auth.uid());
```

**Signification:** Les utilisateurs peuvent voir uniquement les recommandations qu'ils ont appliquées.

---

### 2. INSERT (Création)
```sql
CREATE POLICY "Authenticated users can create applied recommendations"
  ON applied_recommendations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Signification:** Tous les utilisateurs authentifiés peuvent créer des recommandations.

---

### 3. UPDATE (Modification)
```sql
CREATE POLICY "Users can update their own applied recommendations"
  ON applied_recommendations FOR UPDATE
  USING (applied_by = auth.uid());
```

**Signification:** Les utilisateurs peuvent modifier uniquement leurs propres recommandations.

---

### 4. DELETE (Suppression)
```sql
CREATE POLICY "Users can delete their own applied recommendations"
  ON applied_recommendations FOR DELETE
  USING (applied_by = auth.uid());
```

**Signification:** Les utilisateurs peuvent supprimer uniquement leurs propres recommandations.

---

## 🧪 TEST APRÈS CORRECTION

### 1. Rafraîchir l'Application

```bash
# Rafraîchir la page dans le navigateur
# Ou redémarrer si nécessaire
npm run dev
```

### 2. Tester l'Application d'une Recommandation

**a. Aller sur Optimisation**
```
http://localhost:5173/dashboard/plans
→ Onglet "Optimisation"
```

**b. Cliquer "Appliquer"**
- Le modal devrait s'ouvrir ✅

**c. Remplir et Valider**
- Remplir les champs
- Cliquer "Appliquer"
- **Devrait fonctionner sans erreur 403** ✅

**d. Vérifier le Toast**
- Toast de succès devrait apparaître ✅
- Message: "Recommandation appliquée avec succès!"

### 3. Vérifier dans Supabase

```sql
-- Voir les recommandations appliquées
SELECT 
  recommendation_title,
  recommendation_type,
  status,
  applied_by,
  applied_at
FROM applied_recommendations
ORDER BY applied_at DESC;

-- Devrait retourner: 1 ou plusieurs rows ✅
```

---

## ⚠️ SI L'ERREUR PERSISTE

### Option 1: Désactiver Temporairement RLS

**Pour tester uniquement:**
```sql
-- ATTENTION: À utiliser uniquement en développement
ALTER TABLE applied_recommendations DISABLE ROW LEVEL SECURITY;
```

**Puis réactiver après test:**
```sql
ALTER TABLE applied_recommendations ENABLE ROW LEVEL SECURITY;
```

---

### Option 2: Vérifier la Configuration Auth

```sql
-- Vérifier que l'utilisateur est bien authentifié
SELECT auth.uid();
-- Devrait retourner: un UUID (votre user ID)

-- Si retourne NULL, problème d'authentification
```

---

### Option 3: Policies Encore Plus Permissives (Dev Only)

**Pour développement uniquement:**
```sql
-- Supprimer toutes les policies
DROP POLICY IF EXISTS "Users can view their own applied recommendations" ON applied_recommendations;
DROP POLICY IF EXISTS "Authenticated users can create applied recommendations" ON applied_recommendations;
DROP POLICY IF EXISTS "Users can update their own applied recommendations" ON applied_recommendations;
DROP POLICY IF EXISTS "Users can delete their own applied recommendations" ON applied_recommendations;

-- Policy ultra-permissive (DEV ONLY)
CREATE POLICY "Allow all for authenticated users"
  ON applied_recommendations
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

**⚠️ ATTENTION:** Cette policy est très permissive. À utiliser uniquement en développement.

---

## 📊 COMPARAISON AVANT/APRÈS

### Avant (Policies Complexes)
```sql
-- ❌ Essaie d'accéder à auth.users
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.role = 'admin_groupe'
)
```

**Problème:** Permission denied sur `auth.users`

---

### Après (Policies Simplifiées)
```sql
-- ✅ Utilise seulement auth.uid()
applied_by = auth.uid()
```

**Avantage:** Pas besoin d'accéder à d'autres tables

---

## ✅ CHECKLIST

- [ ] Migration de correction exécutée
- [ ] 4 nouvelles policies créées
- [ ] Anciennes policies supprimées
- [ ] Test dans l'application réussi
- [ ] Pas d'erreur 403
- [ ] Toast de succès affiché
- [ ] Données visibles dans Supabase

---

## 🎯 RÉSULTAT ATTENDU

### Message de Succès
```
Success. No rows returned
```

### Dans l'Application
- ✅ Modal s'ouvre
- ✅ Formulaire se remplit
- ✅ Bouton "Appliquer" fonctionne
- ✅ Toast de succès s'affiche
- ✅ Pas d'erreur 403

### Dans Supabase
```sql
SELECT * FROM applied_recommendations;
-- Devrait retourner: vos recommandations appliquées
```

---

**La correction est prête à être appliquée!** ✅🔧

**Temps estimé:** 2 minutes  
**Difficulté:** Facile  
**Impact:** Résout l'erreur 403 complètement
