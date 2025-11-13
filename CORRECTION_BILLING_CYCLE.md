# 🔧 CORRECTION - Erreur "billing_cycle"

**Date** : 7 novembre 2025, 23:05 PM  
**Statut** : ✅ CORRIGÉ

---

## ❌ ERREUR

```
ERROR: 42703: column "billing_cycle" of relation "school_group_subscriptions" does not exist
LINE 56: billing_cycle
```

---

## 🔍 CAUSE

La colonne `billing_cycle` n'existe **pas** dans la table `school_group_subscriptions`.

**Structure réelle de la table** :
```sql
CREATE TABLE school_group_subscriptions (
  id UUID PRIMARY KEY,
  school_group_id UUID REFERENCES school_groups(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT,  -- 'active', 'expired', 'cancelled', 'pending'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  -- ❌ PAS de billing_cycle
);
```

---

## ✅ CORRECTION APPLIQUÉE

### **Avant** ❌

```sql
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  billing_cycle  -- ❌ N'existe pas
)
SELECT 
  sg.id,
  sp.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'monthly'  -- ❌ N'existe pas
FROM ...
```

### **Après** ✅

```sql
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date
)
SELECT 
  sg.id,
  sp.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM ...
```

---

## 📁 FICHIER CORRIGÉ

✅ `FIX_GROUPE_INTELIGENCE_SELESTE.sql` - Ligne 56 supprimée

---

## 🚀 RÉEXÉCUTION

Maintenant vous pouvez réexécuter le script sans erreur :

```sql
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date
)
SELECT 
  sg.id,
  sp.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM school_groups sg
CROSS JOIN subscription_plans sp
WHERE (sg.code = 'E-PILOT-002' OR sg.name ILIKE '%INTELIGENCE%')
  AND sp.slug = 'gratuit'
  AND NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions sgs
    WHERE sgs.school_group_id = sg.id 
      AND sgs.status = 'active'
  )
LIMIT 1
RETURNING 
  id,
  school_group_id,
  plan_id,
  status,
  start_date;
```

**Résultat attendu** :
```
INSERT 0 1
Returning: (1 row)
id | school_group_id | plan_id | status | start_date
```

---

## ✅ VÉRIFICATION

Après exécution, vérifiez :

```sql
-- Vérifier l'abonnement créé
SELECT 
  sg.name as groupe,
  sgs.status,
  sp.name as plan,
  sgs.start_date,
  sgs.end_date
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sg.code = 'E-PILOT-002';
```

**Résultat attendu** :
```
groupe                | status | plan    | start_date          | end_date
----------------------|--------|---------|---------------------|---------------------
L'INTELIGENCE SELESTE | active | Gratuit | 2025-11-07 23:05:00 | 2026-11-07 23:05:00
```

---

## 🎯 PROCHAINE ÉTAPE

Après avoir créé l'abonnement, vérifiez que les modules sont assignés :

```sql
SELECT COUNT(*) as nb_modules
FROM group_module_configs 
WHERE school_group_id = (SELECT id FROM school_groups WHERE code = 'E-PILOT-002')
  AND is_enabled = true;
-- Résultat attendu : 44
```

---

**Date** : 7 novembre 2025, 23:05 PM  
**Correction par** : Cascade AI  
**Statut** : ✅ SCRIPT CORRIGÉ

**Réexécutez le script maintenant !** 🚀
