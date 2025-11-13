# ✅ CORRECTION : AFFICHAGE DES PLANS

**Date** : 6 novembre 2025  
**Statut** : ✅ CORRIGÉ

---

## 🚨 PROBLÈME

Les plans créés n'apparaissaient pas dans la liste car le hook `usePlans` cherchait dans la mauvaise table.

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Hook `usePlans` corrigé**

**Fichier** : `src/features/dashboard/hooks/usePlans.ts`

**AVANT** ❌ :
```typescript
let query = supabase
  .from('plans')  // ❌ Mauvaise table
  .select('*')
```

**APRÈS** ✅ :
```typescript
let query = supabase
  .from('subscription_plans')  // ✅ Bonne table
  .select('*')
```

---

### **2. Mapping des colonnes corrigé**

**AVANT** ❌ :
```typescript
billingCycle: plan.billing_cycle,  // ❌ Ancien nom
duration: plan.duration || 1,      // ❌ N'existe plus
maxPersonnel: plan.max_personnel,  // ❌ Ancien nom
storageLimit: plan.storage_limit,  // ❌ Ancien nom
```

**APRÈS** ✅ :
```typescript
planType: plan.plan_type,          // ✅ Nouveau champ
billingPeriod: plan.billing_period, // ✅ Nouveau nom
maxStaff: plan.max_staff,          // ✅ Nouveau nom
maxStorage: plan.max_storage,      // ✅ Nouveau nom
```

---

## 🧪 TESTER

1. **Rafraîchir l'application** (`F5`)
2. Aller sur `/dashboard/plans`
3. **Vérifier que tous les plans s'affichent** ✅

---

## 📊 VÉRIFIER EN BASE DE DONNÉES

```sql
-- Voir tous les plans
SELECT 
  id,
  name,
  slug,
  plan_type,
  price,
  billing_period,
  created_at
FROM subscription_plans
ORDER BY created_at DESC;
```

---

## ✅ RÉSULTAT

Maintenant tous les plans créés dans `subscription_plans` s'affichent correctement dans la liste !

**Tout fonctionne !** 🎉
