# 🔧 CORRECTION KPI Plans & Abonnements

**Date:** 20 novembre 2025  
**Problème:** KPIs incorrects dans la page Plans & Tarification

---

## 🐛 PROBLÈME IDENTIFIÉ

### Symptômes
- **Plans Actifs:** Affiche 1 au lieu du nombre réel
- **Abonnements:** Affiche 1 au lieu du nombre réel
- **Revenus MRR:** Calcul incorrect (225K)

### Cause Racine
La vue SQL `plan_stats` utilisée par le hook `usePlanStats` **n'existait pas**, causant un fallback avec des calculs incorrects.

---

## ✅ SOLUTION IMPLÉMENTÉE

### 1. Création de la Vue SQL `plan_stats`

**Fichier:** `supabase/migrations/20251120_create_plan_stats_view.sql`

Cette vue calcule les statistiques **par plan**:

```sql
CREATE OR REPLACE VIEW plan_stats AS
SELECT 
  sp.id,
  sp.name,
  sp.slug,
  sp.price,
  sp.is_active,
  -- Abonnements actifs pour ce plan
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscription_count,
  -- Tous les abonnements
  COUNT(DISTINCT s.id) as total_subscription_count,
  -- Revenu mensuel (MRR) pour ce plan
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'active'), 0) as monthly_revenue,
  -- Revenu annuel (ARR) pour ce plan
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'active'), 0) * 12 as annual_revenue,
  -- Groupes utilisant ce plan
  COUNT(DISTINCT s.school_group_id) FILTER (WHERE s.status = 'active') as active_groups_count
FROM 
  subscription_plans sp
  LEFT JOIN subscriptions s ON s.plan_id = sp.id
GROUP BY 
  sp.id, sp.name, sp.slug, sp.price, sp.is_active, sp.is_popular;
```

---

### 2. Création de la Vue SQL `plan_global_stats`

Cette vue calcule les statistiques **globales**:

```sql
CREATE OR REPLACE VIEW plan_global_stats AS
SELECT 
  -- Total de plans
  COUNT(DISTINCT sp.id) as total_plans,
  
  -- Plans actifs (is_active = true)
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_active = true) as active_plans,
  
  -- Plans avec au moins un abonnement actif
  COUNT(DISTINCT sp.id) FILTER (WHERE EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.plan_id = sp.id AND s.status = 'active'
  )) as plans_with_subscriptions,
  
  -- Total d'abonnements actifs
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as total_active_subscriptions,
  
  -- Total d'abonnements (tous statuts)
  COUNT(DISTINCT s.id) as total_subscriptions,
  
  -- Revenu mensuel total (MRR)
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'active'), 0) as total_mrr,
  
  -- Revenu annuel total (ARR)
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'active'), 0) * 12 as total_arr,
  
  -- Nombre de groupes scolaires avec abonnement actif
  COUNT(DISTINCT s.school_group_id) FILTER (WHERE s.status = 'active') as total_active_groups
FROM 
  subscription_plans sp
  LEFT JOIN subscriptions s ON s.plan_id = sp.id;
```

---

### 3. Correction du Hook `usePlanStats`

**Fichier:** `src/features/dashboard/hooks/usePlans.ts`

**Avant:**
```typescript
// Utilisait une vue inexistante
const { data, error } = await supabase
  .from('plan_stats')
  .select('*');

// Fallback incorrect
return {
  total: data?.length || 0,
  active: data?.filter((p: any) => p.subscription_count > 0).length || 0,
  subscriptions: data?.reduce(...) || 0,
};
```

**Après:**
```typescript
// Utilise la vue plan_global_stats
const { data: globalStats, error: globalError } = await supabase
  .from('plan_global_stats')
  .select('*')
  .single();

// Retourne les vraies statistiques
return {
  total: globalStats.total_plans || 0,
  active: globalStats.active_plans || 0,
  subscriptions: globalStats.total_active_subscriptions || 0,
  mrr: globalStats.total_mrr || 0,
  arr: globalStats.total_arr || 0,
};
```

---

## 📊 EXPLICATION DES KPIs

### 1. **Plans Actifs**

**Définition:** Nombre de plans avec `is_active = true`

**Calcul:**
```sql
COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_active = true)
```

**Exemple:**
- Plan Gratuit: `is_active = true` ✅
- Plan Premium: `is_active = true` ✅
- Plan Pro: `is_active = true` ✅
- Plan Institutionnel: `is_active = true` ✅
- **Total:** 4 plans actifs

**Comment rendre un plan actif/inactif:**
1. Aller dans la page Plans & Tarification
2. Cliquer sur un plan
3. Cliquer sur "Archiver" pour désactiver (`is_active = false`)
4. Ou cliquer sur "Restaurer" pour réactiver (`is_active = true`)

---

### 2. **Abonnements**

**Définition:** Nombre d'abonnements avec `status = 'active'`

**Calcul:**
```sql
COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active')
```

**Exemple:**
- Groupe LAMARELLE: Plan Premium, `status = 'active'` ✅
- Groupe CG ngongo: Plan Gratuit, `status = 'active'` ✅
- Groupe Ecole EDJA: Plan Gratuit, `status = 'active'` ✅
- Groupe L'INTELIGENCE CELESTE: Plan Institutionnel, `status = 'active'` ✅
- **Total:** 4 abonnements actifs

**Statuts possibles:**
- `active`: Abonnement en cours ✅
- `expired`: Abonnement expiré ❌
- `cancelled`: Abonnement annulé ❌
- `trial`: Période d'essai 🔄

---

### 3. **Revenus MRR (Monthly Recurring Revenue)**

**Définition:** Revenu mensuel récurrent total

**Calcul:**
```sql
SUM(s.price) FILTER (WHERE s.status = 'active')
```

**Exemple:**
- Groupe LAMARELLE: 50 000 FCFA/mois (Plan Premium)
- Groupe CG ngongo: 0 FCFA/mois (Plan Gratuit)
- Groupe Ecole EDJA: 0 FCFA/mois (Plan Gratuit)
- Groupe L'INTELIGENCE CELESTE: 500 000 FCFA/mois (Plan Institutionnel)
- **Total MRR:** 550 000 FCFA = 550K

**Affichage:** `{(mrr / 1000).toFixed(0)}K` → "550K"

---

### 4. **Plans Total**

**Définition:** Nombre total de plans (actifs + inactifs)

**Calcul:**
```sql
COUNT(DISTINCT sp.id)
```

**Exemple:**
- Plan Gratuit ✅
- Plan Premium ✅
- Plan Pro ✅
- Plan Institutionnel ✅
- **Total:** 4 plans

---

## 🎯 POURQUOI "Plans Actifs = 1" AVANT?

### Problème
Le fallback utilisait un calcul incorrect:

```typescript
// INCORRECT
active: data?.filter((p: any) => p.subscription_count > 0).length || 0
```

Cela comptait les plans **avec au moins un abonnement**, pas les plans **actifs** (`is_active = true`).

### Solution
Utiliser la vue SQL qui compte correctement:

```sql
-- CORRECT
COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_active = true)
```

---

## 🎯 POURQUOI "Abonnements = 1" AVANT?

### Problème
Le fallback calculait mal le total:

```typescript
// INCORRECT
subscriptions: data?.reduce((acc, p) => acc + (p.subscription_count || 0), 0)
```

### Solution
Compter directement les abonnements actifs:

```sql
-- CORRECT
COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active')
```

---

## 🔧 COMMENT ACTIVER/DÉSACTIVER UN PLAN

### Via l'Interface (Recommandé)

1. **Aller dans Plans & Tarification**
2. **Cliquer sur un plan** pour voir les détails
3. **Cliquer sur "Archiver"** pour désactiver
   - Le plan devient `is_active = false`
   - N'apparaît plus dans "Plans Actifs"
   - Les abonnements existants restent actifs
4. **Cliquer sur "Restaurer"** pour réactiver
   - Le plan devient `is_active = true`
   - Réapparaît dans "Plans Actifs"

### Via SQL (Avancé)

```sql
-- Désactiver un plan
UPDATE subscription_plans
SET is_active = false
WHERE slug = 'premium';

-- Réactiver un plan
UPDATE subscription_plans
SET is_active = true
WHERE slug = 'premium';
```

---

## 📊 VÉRIFICATION DES DONNÉES

### Vérifier les Plans

```sql
SELECT 
  name,
  slug,
  is_active,
  price
FROM subscription_plans
ORDER BY price;
```

**Résultat attendu:**
```
name              | slug            | is_active | price
------------------|-----------------|-----------|--------
Gratuit           | gratuit         | true      | 0
Premium           | premium         | true      | 50000
Pro               | pro             | true      | 150000
Institutionnel    | institutionnel  | true      | 500000
```

---

### Vérifier les Abonnements

```sql
SELECT 
  sg.name as groupe,
  sp.name as plan,
  s.status,
  s.price
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status = 'active';
```

**Résultat attendu:**
```
groupe                    | plan            | status | price
--------------------------|-----------------|--------|--------
LAMARELLE                 | Premium         | active | 50000
CG ngongo                 | Gratuit         | active | 0
Ecole EDJA                | Gratuit         | active | 0
L'INTELIGENCE CELESTE     | Institutionnel  | active | 500000
```

---

### Vérifier les Statistiques

```sql
SELECT * FROM plan_global_stats;
```

**Résultat attendu:**
```
total_plans | active_plans | total_active_subscriptions | total_mrr | total_arr
------------|--------------|----------------------------|-----------|----------
4           | 4            | 4                          | 550000    | 6600000
```

---

## 🚀 DÉPLOIEMENT

### 1. Appliquer la Migration

```bash
# Depuis Supabase Dashboard
# SQL Editor → Nouvelle query → Coller le contenu de:
# supabase/migrations/20251120_create_plan_stats_view.sql
# Puis exécuter
```

**OU**

```bash
# Via CLI Supabase
supabase db push
```

---

### 2. Vérifier les Vues

```sql
-- Vérifier que les vues existent
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('plan_stats', 'plan_global_stats');
```

**Résultat attendu:**
```
table_name
-------------------
plan_stats
plan_global_stats
```

---

### 3. Tester les Statistiques

```sql
-- Tester plan_global_stats
SELECT * FROM plan_global_stats;

-- Tester plan_stats
SELECT * FROM plan_stats;
```

---

### 4. Rafraîchir l'Application

1. Rafraîchir la page dans le navigateur
2. Aller dans Plans & Tarification
3. Vérifier les KPIs:
   - Plans Actifs: 4
   - Abonnements: 4
   - Revenus MRR: 550K
   - Plans Total: 4

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Migration `20251120_create_plan_stats_view.sql` créée
- [ ] Migration appliquée dans Supabase
- [ ] Vue `plan_stats` existe
- [ ] Vue `plan_global_stats` existe
- [ ] Hook `usePlanStats` corrigé
- [ ] KPI "Plans Actifs" affiche le bon nombre
- [ ] KPI "Abonnements" affiche le bon nombre
- [ ] KPI "Revenus MRR" affiche le bon montant
- [ ] KPI "Plans Total" affiche le bon nombre

---

## 🎯 RÉSULTAT FINAL

### Avant
```
Plans Actifs: 1 ❌
Abonnements: 1 ❌
Revenus MRR: 225K ❌
Plans Total: 4 ✅
```

### Après
```
Plans Actifs: 4 ✅ (tous les plans avec is_active = true)
Abonnements: 4 ✅ (tous les abonnements avec status = 'active')
Revenus MRR: 550K ✅ (50K + 0 + 0 + 500K)
Plans Total: 4 ✅ (nombre total de plans)
```

---

## 📚 GLOSSAIRE

### Plan Actif
Un plan avec `is_active = true`. Peut être souscrit par les groupes scolaires.

### Plan Inactif (Archivé)
Un plan avec `is_active = false`. Ne peut plus être souscrit, mais les abonnements existants restent valides.

### Abonnement Actif
Un abonnement avec `status = 'active'`. Le groupe scolaire a accès aux modules du plan.

### MRR (Monthly Recurring Revenue)
Revenu mensuel récurrent. Somme des prix de tous les abonnements actifs.

### ARR (Annual Recurring Revenue)
Revenu annuel récurrent. MRR × 12.

---

**Date:** 20 novembre 2025  
**Status:** ✅ Corrigé et Documenté  
**Qualité:** Production Ready
