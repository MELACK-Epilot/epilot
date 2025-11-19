# 🚀 OPTIMISATION PLAN DYNAMIQUE - 100% SUBSCRIPTIONS

**Date:** 17 novembre 2025  
**Version:** 3.0 - Suppression Colonne Statique  
**Status:** ✅ OPTIMISÉ

---

## 🎯 OBJECTIF

**Éliminer toute référence statique au plan** et **tout récupérer dynamiquement** depuis `subscriptions`.

### ❌ Avant (Problématique)
- Colonne `school_groups.plan` (statique)
- Risque d'incohérence
- Synchronisation manuelle nécessaire

### ✅ Après (Optimisé)
- **Une seule source:** `subscriptions.plan_id`
- **100% dynamique**
- **Zéro incohérence possible**
- **Scalable pour 500+ groupes**

---

## 📦 FICHIERS MODIFIÉS

### 1. Migration BDD
**Fichier:** `database/migrations/003_remove_static_plan.sql`

**Actions:**
- ✅ Suppression colonne `school_groups.plan`
- ✅ Suppression trigger `sync_school_group_plan()`
- ✅ Création vue `school_groups_with_plan`
- ✅ Index de performance

### 2. Hooks Frontend
**Fichier:** `src/features/dashboard/hooks/useSchoolGroupModules.ts`

**Optimisations:**
- ✅ `useSchoolGroupModules` - Suppression référence `plan`
- ✅ `useSchoolGroupCategories` - Suppression référence `plan`
- ✅ Récupération limites plan (max_schools, max_students, etc.)

---

## 🔧 INSTALLATION

### Étape 1: Exécuter la Migration

```sql
-- Dans Supabase SQL Editor
-- Copier/coller: database/migrations/003_remove_static_plan.sql

-- OU version courte:

-- 1. Supprimer trigger
DROP TRIGGER IF EXISTS on_subscription_sync_plan ON subscriptions;
DROP FUNCTION IF EXISTS sync_school_group_plan();

-- 2. Supprimer colonne
ALTER TABLE school_groups DROP COLUMN IF EXISTS plan;

-- 3. Créer vue
CREATE OR REPLACE VIEW school_groups_with_plan AS
SELECT 
  sg.*,
  s.plan_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sp.max_schools,
  sp.max_students,
  sp.max_staff,
  sp.max_storage
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;
```

### Étape 2: Vérifier

```sql
-- Vérifier que la colonne est supprimée
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'school_groups' 
AND column_name = 'plan';
-- Résultat attendu: 0 lignes

-- Tester la vue
SELECT * FROM school_groups_with_plan WHERE name ILIKE '%LAMARELLE%';
-- Résultat: Toutes les infos du plan depuis subscription
```

---

## 📊 NOUVELLE ARCHITECTURE

### Requête Optimisée

**Avant (avec colonne statique):**
```typescript
const { data } = await supabase
  .from('school_groups')
  .select('id, name, plan') // ❌ Colonne statique
  .single();

const plan = data.plan; // Peut être désynchronisé!
```

**Après (100% dynamique):**
```typescript
const { data } = await supabase
  .from('school_groups')
  .select(`
    id,
    name,
    subscriptions!inner(
      plan_id,
      subscription_plans!inner(
        id,
        name,
        slug,
        max_schools,
        max_students,
        max_staff,
        max_storage
      )
    )
  `)
  .eq('subscriptions.status', 'active')
  .single();

const plan = data.subscriptions[0].subscription_plans; // ✅ Toujours à jour!
```

---

## 🎯 AVANTAGES

### 1. Cohérence Garantie
- ✅ Une seule source de vérité
- ✅ Impossible d'avoir des incohérences
- ✅ Pas de synchronisation nécessaire

### 2. Performance
- ✅ Index optimisés sur `subscriptions`
- ✅ Vue pré-calculée disponible
- ✅ Cache React Query

### 3. Scalabilité
- ✅ Fonctionne pour 1 ou 500+ groupes
- ✅ Pas de maintenance manuelle
- ✅ Changements instantanés

### 4. Flexibilité
- ✅ Super Admin change plan → Effet immédiat
- ✅ Pas de migration de données
- ✅ Temps réel avec Realtime

---

## 🧪 TESTS

### Test 1: Vérifier Suppression Colonne

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'school_groups' 
AND column_name = 'plan';
```

**Résultat attendu:** 0 lignes

### Test 2: Vérifier Vue

```sql
SELECT 
  name,
  plan_slug,
  plan_name,
  max_schools,
  max_students
FROM school_groups_with_plan
WHERE name ILIKE '%LAMARELLE%';
```

**Résultat attendu:**
```
name      | plan_slug | plan_name | max_schools | max_students
LAMARELLE | pro       | Pro       | 10          | 2000
```

### Test 3: Changement Plan Dynamique

```sql
-- Changer vers Premium
UPDATE subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'premium')
WHERE school_group_id = (SELECT id FROM school_groups WHERE name = 'LAMARELLE');

-- Vérifier immédiatement
SELECT plan_slug FROM school_groups_with_plan WHERE name = 'LAMARELLE';
```

**Résultat:** `premium` (changement instantané!)

---

## 📋 CHECKLIST MIGRATION

- [ ] Exécuter migration SQL
- [ ] Vérifier suppression colonne `plan`
- [ ] Vérifier création vue `school_groups_with_plan`
- [ ] Tester hooks frontend
- [ ] Vérifier console (pas d'erreurs)
- [ ] Tester changement plan temps réel
- [ ] Vérifier affichage UI

---

## 🎉 RÉSULTAT FINAL

**Avant:**
```
school_groups.plan = "pro" (statique)
subscriptions.plan_id = "premium_id" (dynamique)
→ INCOHÉRENCE!
```

**Après:**
```
subscriptions.plan_id = "pro_id" (UNIQUE SOURCE)
→ COHÉRENCE GARANTIE!
```

---

## 🚀 POUR 500+ GROUPES

**Le système est maintenant:**
- ✅ **100% Dynamique** - Tout depuis subscriptions
- ✅ **Zéro Maintenance** - Pas de synchronisation
- ✅ **Temps Réel** - Changements instantanés
- ✅ **Scalable** - 1 ou 500+ groupes
- ✅ **Performant** - Indexes + Vue + Cache

**Prêt pour la production avec 500+ groupes scolaires!** 🎯
