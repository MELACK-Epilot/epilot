# 🏗️ ARCHITECTURE PLANS & ABONNEMENTS - E-PILOT

**Date:** 17 novembre 2025  
**Version:** 2.0 - Système Dynamique Unifié

---

## ❌ PROBLÈME IDENTIFIÉ

### Incohérence Plan Affiché vs Contenu

**Symptôme:**
- Interface affiche: "Plan Pro" 
- Mais contenu (modules/catégories): Plan Premium (6 catégories au lieu de 9)

**Cause:**
Deux sources de vérité pour le plan:
1. **`school_groups.plan`** (colonne statique) → Affichage UI
2. **`subscriptions.plan_id`** (dynamique) → Contenu réel

---

## ✅ SOLUTION IMPLÉMENTÉE

### Architecture Unifiée

```
┌─────────────────────────────────────────┐
│  SOURCE UNIQUE DE VÉRITÉ                │
│  Table: subscriptions                   │
│  Colonne: plan_id (DYNAMIQUE)           │
└─────────────────────────────────────────┘
           ↓ Synchronisation Auto
┌─────────────────────────────────────────┐
│  CACHE POUR AFFICHAGE                   │
│  Table: school_groups                   │
│  Colonne: plan (STATIQUE - Sync)        │
└─────────────────────────────────────────┘
```

### Principe

1. **`subscriptions.plan_id`** = Source de vérité
   - Défini par Super Admin
   - Changeable dynamiquement
   - Détermine modules/catégories accessibles

2. **`school_groups.plan`** = Cache synchronisé
   - Mis à jour automatiquement par trigger
   - Utilisé pour affichage rapide
   - Toujours cohérent avec subscription

---

## 🔧 IMPLÉMENTATION

### 1. Trigger Auto-Synchronisation

**Fichier:** `database/FIX_PLAN_SYNC.sql`

```sql
CREATE OR REPLACE FUNCTION sync_school_group_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_slug VARCHAR;
BEGIN
  -- Récupérer le slug du nouveau plan
  SELECT slug INTO v_plan_slug
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Mettre à jour school_groups.plan
  UPDATE school_groups
  SET plan = v_plan_slug
  WHERE id = NEW.school_group_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_sync_plan
AFTER INSERT OR UPDATE OF plan_id ON subscriptions
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION sync_school_group_plan();
```

**Comportement:**
- Quand Super Admin change `subscriptions.plan_id`
- Trigger met à jour automatiquement `school_groups.plan`
- **Cohérence garantie!**

### 2. Hooks Frontend

**Toujours utiliser `subscriptions` comme source:**

```typescript
// ✅ CORRECT
const { data: schoolGroup } = await supabase
  .from('school_groups')
  .select(`
    id,
    name,
    subscriptions!inner(
      plan_id,
      subscription_plans!inner(
        id,
        name,
        slug
      )
    )
  `)
  .eq('subscriptions.status', 'active')
  .single();

const planId = schoolGroup.subscriptions[0].plan_id;
const planSlug = schoolGroup.subscriptions[0].subscription_plans.slug;
```

```typescript
// ❌ INCORRECT (ancien système)
const { data: schoolGroup } = await supabase
  .from('school_groups')
  .select('plan')
  .single();

const plan = schoolGroup.plan; // Peut être désynchronisé!
```

---

## 📊 FLUX COMPLET

### Scénario: Super Admin Change le Plan

```
1. SUPER ADMIN
   ↓ Change plan via interface
   UPDATE subscriptions 
   SET plan_id = 'pro_plan_id'
   WHERE school_group_id = 'lamarelle_id'

2. TRIGGER sync_school_group_plan()
   ↓ Détecte changement
   ↓ Récupère slug du plan
   SELECT slug FROM subscription_plans WHERE id = 'pro_plan_id'
   ↓ Met à jour school_groups
   UPDATE school_groups SET plan = 'pro' WHERE id = 'lamarelle_id'

3. TRIGGER notify_plan_change()
   ↓ Envoie notification Realtime
   pg_notify('plan_changed', {...})

4. FRONTEND (Realtime)
   ↓ Reçoit notification
   ↓ Invalide cache React Query
   queryClient.invalidateQueries(['school-group-modules'])
   ↓ Refetch données
   GET /subscriptions, /plan_modules, /plan_categories

5. UI MISE À JOUR
   ✅ Plan affiché: Pro (depuis school_groups.plan)
   ✅ Modules: 47 (depuis plan_modules via subscriptions.plan_id)
   ✅ Catégories: 9 (depuis plan_categories via subscriptions.plan_id)
   ✅ COHÉRENCE TOTALE!
```

---

## 🎯 RÈGLES À RESPECTER

### ✅ À FAIRE

1. **Toujours lire depuis `subscriptions`** pour le contenu
2. **Utiliser `school_groups.plan`** uniquement pour affichage rapide
3. **Laisser le trigger** synchroniser automatiquement
4. **Vérifier `status = 'active'`** dans les requêtes

### ❌ À NE PAS FAIRE

1. ❌ Modifier `school_groups.plan` manuellement
2. ❌ Utiliser `school_groups.plan` pour filtrer modules/catégories
3. ❌ Créer plusieurs subscriptions actives pour un groupe
4. ❌ Bypasser le système de subscriptions

---

## 🧪 TESTS

### Test 1: Vérifier Cohérence

```sql
SELECT 
  sg.name,
  sg.plan as plan_cache,
  sp.slug as plan_reel,
  CASE 
    WHEN sg.plan = sp.slug THEN '✅ OK'
    ELSE '❌ INCOHÉRENT'
  END as status
FROM school_groups sg
JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
JOIN subscription_plans sp ON sp.id = s.plan_id;
```

**Résultat attendu:** Tous les groupes avec status = '✅ OK'

### Test 2: Changement Plan

```sql
-- Changer vers Premium
UPDATE subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'premium')
WHERE school_group_id = (SELECT id FROM school_groups WHERE name = 'LAMARELLE');

-- Vérifier synchronisation
SELECT plan FROM school_groups WHERE name = 'LAMARELLE';
-- Résultat attendu: 'premium'
```

### Test 3: Vérifier Contenu

```sql
SELECT 
  sg.name,
  sg.plan,
  COUNT(DISTINCT pc.category_id) as categories,
  COUNT(DISTINCT pm.module_id) as modules
FROM school_groups sg
JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
WHERE sg.name = 'LAMARELLE'
GROUP BY sg.id, sg.name, sg.plan;
```

**Résultat attendu pour plan Pro:**
- Plan: `pro`
- Catégories: `9`
- Modules: `47`

---

## 📋 TABLES IMPLIQUÉES

### 1. subscription_plans
```sql
id          | name      | slug      | max_schools | max_students | ...
uuid        | Premium   | premium   | 3           | 500          | ...
uuid        | Pro       | pro       | 10          | 2000         | ...
```

### 2. subscriptions
```sql
id   | school_group_id | plan_id | status  | start_date | end_date
uuid | lamarelle_id    | pro_id  | active  | 2025-01-01 | 2026-01-01
```

### 3. school_groups
```sql
id           | name      | plan  | student_count | ...
lamarelle_id | LAMARELLE | pro   | 0             | ...
```
↑ Cette colonne `plan` est **synchronisée automatiquement** par trigger

### 4. plan_categories
```sql
plan_id | category_id
pro_id  | cat_1_id
pro_id  | cat_2_id
...     | ...
```
9 lignes pour plan Pro

### 5. plan_modules
```sql
plan_id | module_id
pro_id  | mod_1_id
pro_id  | mod_2_id
...     | ...
```
47 lignes pour plan Pro

---

## 🚀 MIGRATION

### Étape 1: Exécuter le Script

```bash
# Dans Supabase SQL Editor
# Copier/coller: database/FIX_PLAN_SYNC.sql
```

### Étape 2: Vérifier

```sql
-- Tous les groupes doivent être cohérents
SELECT * FROM school_groups sg
JOIN subscriptions s ON s.school_group_id = sg.id
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sg.plan != sp.slug;
-- Résultat attendu: 0 lignes
```

---

## ✅ AVANTAGES DU SYSTÈME

1. **Cohérence Garantie** - Trigger auto-sync
2. **Performance** - Cache dans school_groups.plan
3. **Flexibilité** - Changement plan instantané
4. **Temps Réel** - Notifications WebSocket
5. **Simplicité** - Une seule source de vérité

---

## 🎯 RÉSUMÉ

**Avant:**
- ❌ Deux sources de vérité
- ❌ Incohérences possibles
- ❌ Synchronisation manuelle

**Après:**
- ✅ Une source: `subscriptions.plan_id`
- ✅ Cache auto-sync: `school_groups.plan`
- ✅ Cohérence garantie par trigger
- ✅ Temps réel avec Realtime

**Le système est maintenant 100% cohérent et dynamique!** 🎉
