# 🔧 CORRECTION - Erreur Type Cast

**Date** : 7 novembre 2025, 23:12 PM  
**Statut** : ✅ CORRIGÉ

---

## ❌ ERREUR

```
ERROR: 42883: operator does not exist: character varying = subscription_plan
LINE 16: JOIN subscription_plans sp ON sp.slug = sg.plan
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.
```

---

## 🔍 CAUSE

**Conflit de types** :
- `sp.slug` → Type `TEXT` (ou `VARCHAR`)
- `sg.plan` → Type `ENUM subscription_plan`

PostgreSQL ne peut pas comparer directement un `TEXT` avec un `ENUM`.

---

## ✅ CORRECTION

### **Avant** ❌

```sql
JOIN subscription_plans sp ON sp.slug = sg.plan
```

### **Après** ✅

```sql
JOIN subscription_plans sp ON sp.slug = sg.plan::text
```

**Explication** : `sg.plan::text` convertit l'enum en texte pour la comparaison.

---

## 🚀 SCRIPT CORRIGÉ

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
JOIN subscription_plans sp ON sp.slug = sg.plan::text  -- ✅ Cast ajouté
WHERE NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions sgs
    WHERE sgs.school_group_id = sg.id 
      AND sgs.status = 'active'
  )
  AND sg.status = 'active';
```

---

## ✅ RÉSULTAT ATTENDU

```
INSERT 0 2
✅ 2 abonnements créés
```

---

**Date** : 7 novembre 2025, 23:12 PM  
**Correction par** : Cascade AI  
**Statut** : ✅ SCRIPT CORRIGÉ

**Réexécutez maintenant !** 🚀
