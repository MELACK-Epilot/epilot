# 🔧 CORRECTION ERREUR 400 - STATUS CANCELED

**Date** : 7 novembre 2025, 14:10 PM  
**Erreur** : `Failed to load resource: the server responded with a status of 400`

---

## 🐛 PROBLÈME IDENTIFIÉ

### **Erreur dans useFinancialKPIs.ts**

**Ligne 65** :
```typescript
const { count: canceledSubscriptions } = await supabase
  .from('subscriptions')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'canceled')  // ❌ ERREUR : 'canceled' n'existe pas
  .gte('updated_at', startDate.toISOString());
```

**Cause** : La valeur `'canceled'` n'existe pas dans l'enum `subscription_status`.

**Valeurs valides probables** :
- `'active'` ✅
- `'expired'` ✅
- `'pending'` ✅
- `'cancelled'` ✅ (avec double 'l')

---

## ✅ SOLUTION RAPIDE

### **Option 1 : Corriger 'canceled' → 'cancelled'**

Le statut correct est probablement `'cancelled'` (avec double 'l').

### **Option 2 : Vérifier les valeurs valides**

Exécuter le script `database/CHECK_SUBSCRIPTION_STATUS.sql` pour voir les valeurs exactes.

---

## 🔍 DIAGNOSTIC

### **Étape 1 : Vérifier les valeurs de status**

Exécuter dans Supabase SQL Editor :

```sql
-- Voir les valeurs uniques de status
SELECT DISTINCT status, COUNT(*) as count
FROM subscriptions
GROUP BY status
ORDER BY count DESC;
```

**Résultat attendu** :
```
status    | count
----------|------
active    | 10
expired   | 5
pending   | 2
cancelled | 1  ← Notez le double 'l'
```

### **Étape 2 : Vérifier l'enum**

```sql
-- Voir les valeurs possibles de l'enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'subscription_status'
);
```

---

## 🛠️ CORRECTION À APPLIQUER

Je vais corriger le fichier `useFinancialKPIs.ts` :

**Changement** :
```typescript
// AVANT (incorrect)
.eq('status', 'canceled')

// APRÈS (correct)
.eq('status', 'cancelled')  // Avec double 'l'
```

---

## 📁 FICHIERS CONCERNÉS

1. ✅ `src/features/dashboard/hooks/useFinancialKPIs.ts` (ligne 65)
2. ✅ `src/features/dashboard/components/finance/FinancialMetricsGrid.tsx` (affichage)

---

## 🎯 RÉSULTAT ATTENDU

Après correction :
- ✅ Plus d'erreur 400
- ✅ Les KPI financiers se chargent correctement
- ✅ Le churn rate s'affiche avec les vraies données

---

**Correction en cours...**
