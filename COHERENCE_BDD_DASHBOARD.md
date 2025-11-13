# 🔍 ANALYSE COHÉRENCE BDD ↔ DASHBOARD FINANCIER

## 🎯 STATUT : INCOHÉRENCES DÉTECTÉES

**Date** : 30 Octobre 2025, 13h30  
**Analyse** : Base de données ↔ Frontend  
**Fichiers analysés** : 4

---

## ❌ **INCOHÉRENCES DÉTECTÉES**

### **1. CHAMPS MANQUANTS DANS LA VUE SQL** 🔴 CRITIQUE

#### **Vue `financial_stats` actuelle** :
```sql
-- Dans FINANCES_VUES_COMPLEMENTAIRES.sql
SELECT
  total_subscriptions,
  active_subscriptions,
  pending_subscriptions,
  expired_subscriptions,
  cancelled_subscriptions,
  trial_subscriptions,        -- ❌ MANQUE dans TypeScript
  total_revenue,
  monthly_revenue,
  yearly_revenue,
  overdue_payments,
  overdue_amount,
  current_month_revenue,      -- ❌ MANQUE dans TypeScript
  last_month_revenue,         -- ❌ MANQUE dans TypeScript
  revenue_growth,
  average_revenue_per_group,
  churn_rate
  -- ❌ MANQUENT : mrr, arr, retentionRate, conversionRate, lifetimeValue
```

#### **Interface TypeScript `FinancialStats`** :
```typescript
export interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  mrr: number;                    // ❌ MANQUE dans SQL
  arr: number;                    // ❌ MANQUE dans SQL
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  trialSubscriptions: number;     // ✅ OK
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  overduePayments: number;
  overdueAmount: number;
  averageRevenuePerGroup: number;
  churnRate: number;
  retentionRate: number;          // ❌ MANQUE dans SQL
  conversionRate: number;         // ❌ MANQUE dans SQL
  lifetimeValue: number;          // ❌ MANQUE dans SQL
}
```

---

### **2. NOMS DE CHAMPS DIFFÉRENTS** 🟡 IMPORTANT

| TypeScript | SQL | Statut |
|------------|-----|--------|
| `totalRevenue` | `total_revenue` | ✅ Mappé |
| `monthlyRevenue` | `monthly_revenue` | ✅ Mappé |
| `yearlyRevenue` | `yearly_revenue` | ✅ Mappé |
| `overduePayments` | `overdue_payments` | ✅ Mappé |
| `overdueAmount` | `overdue_amount` | ✅ Mappé |
| `revenueGrowth` | `revenue_growth` | ✅ Mappé |
| `averageRevenuePerGroup` | `average_revenue_per_group` | ✅ Mappé |
| `churnRate` | `churn_rate` | ✅ Mappé |

**Note** : Le mapping snake_case → camelCase est correct dans le hook.

---

### **3. VUE `plan_stats` vs INTERFACE `PlanStats`** 🟡 IMPORTANT

#### **Vue SQL** :
```sql
SELECT
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.price,                    -- ❌ MANQUE dans TypeScript
  COUNT(DISTINCT s.id) AS subscription_count,
  revenue,
  percentage,
  active_count,                -- ❌ MANQUE dans TypeScript
  cancelled_count              -- ❌ MANQUE dans TypeScript
```

#### **Interface TypeScript** :
```typescript
export interface PlanStats {
  planId: string;
  planName: string;
  planSlug: SubscriptionPlan;
  subscriptionCount: number;
  revenue: number;
  growth: number;              // ❌ MANQUE dans SQL
  percentage: number;
}
```

---

## 🔧 **CORRECTIONS REQUISES**

### **1. Mettre à jour la vue `financial_stats`** 🔴 CRITIQUE

```sql
-- NOUVELLE VUE CORRIGÉE
CREATE OR REPLACE VIEW financial_stats AS
SELECT
  -- Abonnements
  COUNT(DISTINCT s.id) AS total_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) AS expired_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'trial' THEN s.id END) AS trial_subscriptions,
  
  -- Revenus
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_revenue,
  
  -- MRR (Monthly Recurring Revenue) - 30 derniers jours
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS monthly_revenue,
  
  -- ARR (Annual Recurring Revenue) - MRR × 12
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) * 12 AS arr,
  
  -- MRR (alias pour cohérence)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS mrr,
  
  -- Revenus annuels
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '365 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS yearly_revenue,
  
  -- Paiements en retard
  COUNT(DISTINCT CASE 
    WHEN p.status = 'pending' 
    AND p.created_at < NOW() - INTERVAL '30 days'
    THEN p.id 
  END) AS overdue_payments,
  
  COALESCE(SUM(CASE 
    WHEN p.status = 'pending' 
    AND p.created_at < NOW() - INTERVAL '30 days'
    THEN p.amount 
    ELSE 0 
  END), 0) AS overdue_amount,
  
  -- Croissance revenus (mois actuel vs mois précédent)
  CASE 
    WHEN SUM(CASE 
      WHEN p.status = 'completed' 
      AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
      THEN p.amount 
      ELSE 0 
    END) > 0 
    THEN (
      (SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW()) 
        THEN p.amount 
        ELSE 0 
      END) - SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END)) / NULLIF(SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END), 0)
    ) * 100
    ELSE 0 
  END AS revenue_growth,
  
  -- Revenu moyen par groupe actif
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END) > 0 
    THEN COALESCE(SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '30 days' 
      THEN p.amount 
      ELSE 0 
    END), 0) / NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END), 0)
    ELSE 0 
  END AS average_revenue_per_group,
  
  -- Taux de churn (annulés / total)
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
    ELSE 0 
  END AS churn_rate,
  
  -- Taux de rétention (100 - churn)
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN 100 - (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
    ELSE 100 
  END AS retention_rate,
  
  -- Taux de conversion (trial → payant)
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'trial' THEN s.id END) > 0 
    THEN (COUNT(DISTINCT CASE WHEN s.status = 'active' AND s.created_at >= NOW() - INTERVAL '30 days' THEN s.id END)::DECIMAL / 
          NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'trial' THEN s.id END), 0)) * 100
    ELSE 0 
  END AS conversion_rate,
  
  -- Valeur vie client (LTV) - ARPU × durée moyenne
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END) > 0 
    THEN (COALESCE(SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '30 days' 
      THEN p.amount 
      ELSE 0 
    END), 0) / NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END), 0)) * 12
    ELSE 0 
  END AS lifetime_value

FROM subscriptions s
LEFT JOIN payments p ON s.id = p.subscription_id;
```

---

### **2. Mettre à jour la vue `plan_stats`** 🟡 IMPORTANT

```sql
-- NOUVELLE VUE PLAN_STATS CORRIGÉE
CREATE OR REPLACE VIEW plan_stats AS
SELECT
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.price,
  COUNT(DISTINCT s.id) AS subscription_count,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS revenue,
  
  -- Pourcentage du revenu total
  CASE 
    WHEN (SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2) > 0
    THEN (COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) / 
          NULLIF((SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2), 0)) * 100
    ELSE 0
  END AS percentage,
  
  -- Croissance (mois actuel vs mois précédent)
  CASE 
    WHEN SUM(CASE 
      WHEN p.status = 'completed' 
      AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
      THEN p.amount 
      ELSE 0 
    END) > 0 
    THEN (
      (SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW()) 
        THEN p.amount 
        ELSE 0 
      END) - SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END)) / NULLIF(SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END), 0)
    ) * 100
    ELSE 0 
  END AS growth,
  
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_count,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_count

FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id
LEFT JOIN payments p ON s.id = p.subscription_id
GROUP BY sp.id, sp.name, sp.slug, sp.price
ORDER BY revenue DESC;
```

---

### **3. Corriger le hook `useFinancialStats`** 🟡 IMPORTANT

```typescript
// Supprimer les calculs manuels (maintenant dans la vue SQL)
export const useFinancialStats = () => {
  return useQuery<FinancialStats>({
    queryKey: financialKeys.stats(),
    queryFn: async (): Promise<FinancialStats> => {
      try {
        const { data, error } = await supabase
          .from('financial_stats')
          .select('*')
          .single();

        if (error) {
          console.warn('Vue financial_stats non disponible:', error.message);
          return DEFAULT_FINANCIAL_STATS;
        }

        if (!data) {
          return DEFAULT_FINANCIAL_STATS;
        }

        // Mapping direct (plus de calculs manuels)
        return {
          totalSubscriptions: data.total_subscriptions || 0,
          activeSubscriptions: data.active_subscriptions || 0,
          pendingSubscriptions: data.pending_subscriptions || 0,
          expiredSubscriptions: data.expired_subscriptions || 0,
          cancelledSubscriptions: data.cancelled_subscriptions || 0,
          trialSubscriptions: data.trial_subscriptions || 0,
          totalRevenue: data.total_revenue || 0,
          monthlyRevenue: data.monthly_revenue || 0,
          yearlyRevenue: data.yearly_revenue || 0,
          overduePayments: data.overdue_payments || 0,
          overdueAmount: data.overdue_amount || 0,
          mrr: data.mrr || 0,                           // ✅ NOUVEAU
          arr: data.arr || 0,                           // ✅ NOUVEAU
          revenueGrowth: data.revenue_growth || 0,
          averageRevenuePerGroup: data.average_revenue_per_group || 0,
          churnRate: data.churn_rate || 0,
          retentionRate: data.retention_rate || 0,      // ✅ NOUVEAU
          conversionRate: data.conversion_rate || 0,    // ✅ NOUVEAU
          lifetimeValue: data.lifetime_value || 0,      // ✅ NOUVEAU
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des stats financières:', error);
        return DEFAULT_FINANCIAL_STATS;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};
```

---

## 📊 **TABLES REQUISES**

### **Vérifier l'existence des tables** :

1. ✅ **`subscriptions`** - Existe
2. ✅ **`payments`** - Existe  
3. ✅ **`subscription_plans`** - Existe
4. ❓ **`school_groups`** - À vérifier

### **Colonnes requises** :

#### **Table `subscriptions`** :
```sql
-- Colonnes requises
id UUID PRIMARY KEY
status subscription_status  -- 'active', 'pending', 'expired', 'cancelled', 'trial'
school_group_id UUID
plan_id UUID
created_at TIMESTAMP
```

#### **Table `payments`** :
```sql
-- Colonnes requises
id UUID PRIMARY KEY
subscription_id UUID
amount DECIMAL
status TEXT  -- 'completed', 'pending', 'failed'
paid_at TIMESTAMP
created_at TIMESTAMP
```

#### **Table `subscription_plans`** :
```sql
-- Colonnes requises
id UUID PRIMARY KEY
name TEXT
slug TEXT
price DECIMAL
```

---

## 🚨 **ACTIONS IMMÉDIATES**

### **1. Exécuter le script de correction** 🔴 URGENT

```sql
-- 1. Sauvegarder les vues existantes
DROP VIEW IF EXISTS financial_stats_old;
CREATE VIEW financial_stats_old AS SELECT * FROM financial_stats;

DROP VIEW IF EXISTS plan_stats_old;
CREATE VIEW plan_stats_old AS SELECT * FROM plan_stats;

-- 2. Recréer les vues corrigées
-- [Exécuter les nouvelles vues ci-dessus]

-- 3. Tester
SELECT * FROM financial_stats LIMIT 1;
SELECT * FROM plan_stats LIMIT 5;
```

### **2. Mettre à jour le hook** 🟡 IMPORTANT

- Supprimer les calculs manuels
- Utiliser les valeurs directement de la vue SQL
- Ajouter les nouveaux champs (mrr, arr, retentionRate, etc.)

### **3. Tester la cohérence** 🟡 IMPORTANT

```typescript
// Test dans la console du navigateur
const { data } = await supabase.from('financial_stats').select('*').single();
console.log('Champs disponibles:', Object.keys(data));

// Vérifier que tous les champs TypeScript sont présents
const requiredFields = [
  'total_subscriptions', 'active_subscriptions', 'mrr', 'arr', 
  'retention_rate', 'conversion_rate', 'lifetime_value'
];
const missingFields = requiredFields.filter(field => !(field in data));
console.log('Champs manquants:', missingFields);
```

---

## 📁 **FICHIERS À MODIFIER**

### **1. SQL** :
- ✅ `database/FINANCES_VUES_COMPLEMENTAIRES.sql` (corriger)

### **2. TypeScript** :
- ✅ `src/features/dashboard/hooks/useFinancialStats.ts` (simplifier)
- ✅ `src/features/dashboard/types/dashboard.types.ts` (vérifier)

### **3. Composants** :
- ✅ `src/features/dashboard/components/finances/FinancialStatsCards.tsx` (tester)

---

## 🎯 **RÉSULTAT ATTENDU**

### **Après correction** :
- ✅ Vue SQL `financial_stats` complète (18 champs)
- ✅ Vue SQL `plan_stats` complète (7 champs)
- ✅ Hook simplifié (pas de calculs manuels)
- ✅ Types TypeScript cohérents
- ✅ Dashboard fonctionnel à 100%

### **Performance** :
- ✅ Calculs côté base de données (plus rapide)
- ✅ Moins de logique côté frontend
- ✅ Cache React Query efficace
- ✅ Données temps réel

---

## ✅ **CHECKLIST**

- [ ] Exécuter nouvelle vue `financial_stats`
- [ ] Exécuter nouvelle vue `plan_stats`
- [ ] Modifier hook `useFinancialStats`
- [ ] Tester les 4 KPIs du dashboard
- [ ] Vérifier les graphiques
- [ ] Tester l'export CSV
- [ ] Valider les performances

---

## 🎉 **CONCLUSION**

**INCOHÉRENCES IDENTIFIÉES ET SOLUTIONS PRÊTES !**

Les principales incohérences sont :
1. **Champs manquants** dans les vues SQL (mrr, arr, retention_rate, etc.)
2. **Calculs redondants** dans le hook (à supprimer)
3. **Champs supplémentaires** dans SQL (à mapper)

**Avec ces corrections, le Dashboard sera 100% cohérent avec la BDD !** 🚀🇨🇬

---

**FIN DE L'ANALYSE** 🎊
