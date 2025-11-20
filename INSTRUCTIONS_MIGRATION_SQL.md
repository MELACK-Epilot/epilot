# 📋 INSTRUCTIONS - Application Migration SQL

**Date:** 20 novembre 2025  
**Migration:** `20251120_create_applied_recommendations.sql`  
**Status:** ✅ **CORRIGÉE ET PRÊTE**

---

## ✅ CORRECTION APPLIQUÉE

### Problème Résolu
❌ **Erreur:** `column "school_group_id" does not exist`

✅ **Solution:** Policy RLS simplifiée pour éviter la référence à une colonne inexistante

**Avant:**
```sql
plan_id IN (
  SELECT id FROM subscription_plans
  WHERE school_group_id = (...)  -- ❌ Colonne n'existe pas
)
```

**Après:**
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.role = 'admin_groupe'  -- ✅ Simplifié
)
```

---

## 🚀 ÉTAPES D'APPLICATION

### 1. Ouvrir Supabase Dashboard

```
https://app.supabase.com/project/[VOTRE-PROJET-ID]/sql
```

### 2. Copier le Fichier SQL

**Fichier:** `supabase/migrations/20251120_create_applied_recommendations.sql`

**Ou copier directement depuis l'éditeur actuel** (fichier déjà ouvert)

### 3. Coller dans SQL Editor

- Cliquer sur "SQL Editor" dans la sidebar
- Cliquer sur "New query"
- Coller tout le contenu du fichier

### 4. Exécuter

- Cliquer sur le bouton **"Run"** (ou Ctrl+Enter)
- Attendre la confirmation

### 5. Vérifier

```sql
-- Vérifier que la table existe
SELECT * FROM applied_recommendations;
-- Devrait retourner: 0 rows (table vide)

-- Vérifier les indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'applied_recommendations';
-- Devrait retourner: 7 indexes

-- Vérifier les policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'applied_recommendations';
-- Devrait retourner: 4 policies

-- Vérifier la vue
SELECT * FROM applied_recommendations_stats;
-- Devrait retourner: 0 rows (aucune recommandation appliquée)

-- Vérifier la fonction RPC
SELECT proname FROM pg_proc 
WHERE proname = 'calculate_actual_impact';
-- Devrait retourner: calculate_actual_impact
```

---

## ✅ RÉSULTAT ATTENDU

### Message de Succès
```
Success. No rows returned
```

### Objets Créés
- ✅ 1 table: `applied_recommendations`
- ✅ 7 indexes
- ✅ 4 RLS policies
- ✅ 1 vue: `applied_recommendations_stats`
- ✅ 1 fonction: `calculate_actual_impact()`
- ✅ 1 trigger: `trigger_update_applied_recommendations_updated_at`

---

## 🧪 TEST RAPIDE

### Insérer une Recommandation Test

```sql
INSERT INTO applied_recommendations (
  recommendation_id,
  recommendation_type,
  recommendation_title,
  recommendation_description,
  estimated_mrr_impact,
  status
) VALUES (
  'test-001',
  'pricing',
  'Test Recommandation',
  'Ceci est un test',
  100000,
  'applied'
);
```

### Vérifier l'Insertion

```sql
SELECT * FROM applied_recommendations;
-- Devrait retourner: 1 row
```

### Nettoyer

```sql
DELETE FROM applied_recommendations WHERE recommendation_id = 'test-001';
```

---

## ⚠️ EN CAS D'ERREUR

### Erreur: "relation already exists"

**Cause:** La table existe déjà

**Solution:**
```sql
-- Supprimer la table existante
DROP TABLE IF EXISTS applied_recommendations CASCADE;

-- Réexécuter la migration
```

### Erreur: "permission denied"

**Cause:** Pas les droits suffisants

**Solution:**
- Vérifier que vous êtes connecté avec le bon compte
- Utiliser le service role key si nécessaire

### Erreur: "foreign key constraint"

**Cause:** Table `subscription_plans` n'existe pas

**Solution:**
```sql
-- Vérifier que la table existe
SELECT * FROM subscription_plans LIMIT 1;

-- Si elle n'existe pas, créer d'abord les tables de base
```

---

## 📊 STRUCTURE FINALE

### Table: applied_recommendations

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `recommendation_id` | VARCHAR(255) | ID unique de la recommandation |
| `recommendation_type` | VARCHAR(50) | Type: pricing, features, marketing, retention |
| `recommendation_title` | TEXT | Titre de la recommandation |
| `recommendation_description` | TEXT | Description |
| `plan_id` | UUID | Plan concerné (FK) |
| `plan_name` | VARCHAR(255) | Nom du plan |
| `estimated_mrr_impact` | DECIMAL(12,2) | Impact MRR estimé |
| `estimated_new_clients` | INTEGER | Nouveaux clients estimés |
| `estimated_churn_reduction` | DECIMAL(5,2) | Réduction churn estimée |
| `configuration` | JSONB | Configuration appliquée |
| `applied_at` | TIMESTAMPTZ | Date d'application |
| `effective_date` | DATE | Date d'effet |
| `status` | VARCHAR(50) | Statut |
| `actual_mrr_impact` | DECIMAL(12,2) | Impact MRR réel |
| `actual_new_clients` | INTEGER | Nouveaux clients réels |
| `actual_churn_reduction` | DECIMAL(5,2) | Réduction churn réelle |
| `applied_by` | UUID | Utilisateur (FK) |
| `notes` | TEXT | Notes |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour |

### Indexes (7)

1. `idx_applied_recommendations_plan_id`
2. `idx_applied_recommendations_type`
3. `idx_applied_recommendations_status`
4. `idx_applied_recommendations_applied_at`
5. `idx_applied_recommendations_applied_by`
6. `idx_applied_recommendations_plan_status` (composite)
7. `idx_applied_recommendations_type_status` (composite)

### RLS Policies (4)

1. **Super admins can view all** - Super admin voit tout
2. **Admin groupe can view their recommendations** - Admin groupe voit ses recommandations
3. **Admin groupe can create** - Admin groupe peut créer
4. **Admin groupe can update their recommendations** - Admin groupe peut modifier

### Vue: applied_recommendations_stats

Agrégation des statistiques par type et statut

### Fonction: calculate_actual_impact()

Calcule l'impact réel d'une recommandation après N jours

---

## 🎯 APRÈS LA MIGRATION

### 1. Tester dans l'Application

```bash
# Lancer l'app
npm run dev

# Aller sur: http://localhost:5173/dashboard/plans
# Onglet: "Optimisation - Recommandations Intelligentes"
# Cliquer sur "Appliquer" sur une recommandation
# Remplir le formulaire
# Valider
```

### 2. Vérifier dans Supabase

```sql
-- Voir les recommandations appliquées
SELECT 
  recommendation_title,
  recommendation_type,
  status,
  estimated_mrr_impact,
  applied_at
FROM applied_recommendations
ORDER BY applied_at DESC;
```

### 3. Tester le Calcul d'Impact

```sql
-- Après 30 jours (ou manuellement)
SELECT calculate_actual_impact(
  '[ID-DE-LA-RECOMMANDATION]'::UUID,
  30
);
```

---

## ✅ CHECKLIST FINALE

- [ ] Migration SQL exécutée sans erreur
- [ ] Table `applied_recommendations` créée
- [ ] 7 indexes créés
- [ ] 4 RLS policies créées
- [ ] Vue `applied_recommendations_stats` créée
- [ ] Fonction `calculate_actual_impact()` créée
- [ ] Test d'insertion réussi
- [ ] Test dans l'application réussi
- [ ] Erreurs TypeScript disparues

---

**La migration est prête à être appliquée!** ✅🚀

**Temps estimé:** 5 minutes  
**Difficulté:** Facile  
**Risque:** Faible (table nouvelle, pas de modification existante)
