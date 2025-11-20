# 🔍 ANALYSE DÉCOUPAGE & ERREURS - Analytics IA

**Date:** 20 novembre 2025  
**Workflows:** @[/decouper] + @[/correction-erreurs]  
**Fichiers analysés:** 3 fichiers

---

## 📏 ANALYSE DÉCOUPAGE (@[/decouper])

### Limites Strictes
- **Hook custom:** MAX 100 lignes
- **Fonction utilitaire:** MAX 50 lignes  
- **Composant:** MAX 250 lignes
- **Fichier React:** MAX 350 lignes

---

### 1. **usePlanAnalytics.ts** (250 lignes)

**Status:** ⚠️ **LIMITE ATTEINTE** (250/100 lignes pour un hook)

**Problème:** Hook trop long (250 lignes vs 100 max)

**Découpage recommandé:**

```
hooks/
├── usePlanAnalytics.ts (60 lignes)           # Hook principal
├── usePlanMetricsCalculator.ts (80 lignes)   # Calculs métriques
└── useInsightsGenerator.ts (70 lignes)       # Génération insights
```

#### Extraction 1: `usePlanMetricsCalculator.ts`
```typescript
/**
 * Hook pour calculer les métriques par plan
 */
export const usePlanMetricsCalculator = (plans: any[], subscriptions: any[]) => {
  return useMemo(() => {
    return plans.map(plan => {
      const planSubscriptions = plan.school_group_subscriptions || [];
      const activeSubscriptions = planSubscriptions.filter(
        (sub: any) => sub.status === 'active'
      );

      // Calculs MRR
      const monthlyPrice = plan.billing_period === 'yearly' 
        ? plan.price / 12 
        : plan.price;
      const planMRR = activeSubscriptions.length * monthlyPrice;

      // Calculs métriques
      const conversionRate = calculateMonthlyConversionRate(planSubscriptions);
      const churnRate = calculateMonthlyChurnRate(planSubscriptions);
      const retentionRate = calculateRetentionRate(churnRate);
      const growthRate30d = calculateGrowthRate(planSubscriptions, 30);

      return {
        planId: plan.id,
        planName: plan.name,
        planSlug: plan.slug,
        activeSubscriptions: activeSubscriptions.length,
        monthlyRevenue: planMRR,
        averageRevenuePerUser: activeSubscriptions.length > 0 
          ? planMRR / activeSubscriptions.length 
          : 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10,
        growthRate30d: Math.round(growthRate30d * 10) / 10,
      };
    });
  }, [plans, subscriptions]);
};
```

#### Extraction 2: `useInsightsGenerator.ts`
```typescript
/**
 * Hook pour générer les insights IA
 */
export const useInsightsGenerator = (planMetrics: any[]) => {
  return useMemo(() => {
    const insights: PlanAnalytics['insights'] = [];

    planMetrics.forEach(plan => {
      // Insight churn élevé
      if (plan.churnRate > 15) {
        insights.push({
          type: 'warning',
          title: `Churn élevé sur ${plan.planName}`,
          description: `Le taux d'attrition de ${plan.churnRate}% est préoccupant.`,
          impact: 'high',
          actionable: true,
          recommendation: 'Analyser les raisons d\'annulation.',
        });
      }

      // Insight croissance forte
      if (plan.growthRate30d > 20) {
        insights.push({
          type: 'success',
          title: `Forte croissance sur ${plan.planName}`,
          description: `Croissance de ${plan.growthRate30d}% ce mois.`,
          impact: 'high',
          actionable: true,
          recommendation: 'Capitaliser sur cette croissance.',
        });
      }

      // Autres insights...
    });

    return insights.slice(0, 5);
  }, [planMetrics]);
};
```

#### Hook Principal Simplifié: `usePlanAnalytics.ts`
```typescript
export const usePlanAnalytics = () => {
  return useQuery({
    queryKey: ['plan-analytics'],
    queryFn: async (): Promise<PlanAnalytics> => {
      // Récupérer données
      const [plansResult, subscriptionsResult, paymentsResult] = 
        await Promise.all([
          supabase.from('subscription_plans').select(...),
          supabase.from('school_group_subscriptions').select(...),
          supabase.from('fee_payments').select(...),
        ]);

      if (plansResult.error || subscriptionsResult.error || paymentsResult.error) {
        throw new Error('Erreur lors du calcul des analytics');
      }

      const plans = plansResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const payments = paymentsResult.data || [];

      // Utiliser les hooks de calcul
      const planMetrics = calculatePlanMetrics(plans, subscriptions);
      const insights = generateInsights(planMetrics);
      
      const totalMRR = planMetrics.reduce((sum, p) => sum + p.monthlyRevenue, 0);
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        totalRevenue: Math.round(totalRevenue),
        mrr: Math.round(totalMRR),
        arr: Math.round(totalMRR * 12),
        planMetrics,
        insights,
        marketComparison: null,
      };
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
};
```

**Bénéfice:** 250 lignes → 3 fichiers de 60-80 lignes ✅

---

### 2. **analytics.utils.ts** (192 lignes)

**Status:** ⚠️ **TROP LONG** (192/50 lignes pour utilitaire)

**Problème:** Fichier utilitaire trop long

**Découpage recommandé:**

```
utils/
├── analytics-dates.utils.ts (40 lignes)      # Fonctions dates
├── analytics-metrics.utils.ts (80 lignes)    # Calculs métriques
└── analytics-format.utils.ts (30 lignes)     # Formatage
```

#### Extraction 1: `analytics-dates.utils.ts`
```typescript
/**
 * Utilitaires pour les dates
 */
export const isInLastNDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
};

export const isInCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
};

export const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const getStartOfPreviousMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};
```

#### Extraction 2: `analytics-metrics.utils.ts`
```typescript
/**
 * Calculs de métriques SaaS
 */
export const calculateMonthlyConversionRate = (subscriptions: any[]): number => {
  // ... (code existant)
};

export const calculateMonthlyChurnRate = (subscriptions: any[]): number => {
  // ... (code existant)
};

export const calculateRetentionRate = (churnRate: number): number => {
  return 100 - churnRate;
};

export const calculateGrowthRate = (subscriptions: any[], days: number = 30): number => {
  // ... (code existant)
};

export const calculateMRR = (subscriptions: any[]): number => {
  // ... (code existant)
};

export const calculateARR = (mrr: number): number => {
  return mrr * 12;
};

export const calculateARPU = (totalRevenue: number, userCount: number): number => {
  if (userCount === 0) return 0;
  return totalRevenue / userCount;
};
```

#### Extraction 3: `analytics-format.utils.ts`
```typescript
/**
 * Formatage des données
 */
export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`;
  }
  return `${amount.toFixed(0)} ${currency}`;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
```

**Bénéfice:** 192 lignes → 3 fichiers de 30-80 lignes ✅

---

### 3. **PlanAnalyticsDashboard.tsx** (315 lignes)

**Status:** ✅ **CONFORME** (315/350 lignes)

**Commentaire:** Proche de la limite mais acceptable pour un dashboard complexe

**Recommandation:** Surveiller et extraire si dépasse 350 lignes

**Extraction possible (si nécessaire):**
```
components/
├── PlanAnalyticsDashboard.tsx (150 lignes)   # Orchestration
├── AnalyticsKPICards.tsx (80 lignes)         # KPIs
├── AnalyticsDistribution.tsx (60 lignes)     # Distribution
└── AnalyticsInsights.tsx (80 lignes)         # Insights
```

---

## 🔍 ANALYSE ERREURS (@[/correction-erreurs])

### ✅ POINTS POSITIFS

1. ✅ **React Query** - Gestion automatique des erreurs
2. ✅ **Gestion d'erreur UI** - Error states ajoutés
3. ✅ **Loading states** - Spinners ajoutés
4. ✅ **Types TypeScript** - Interfaces complètes
5. ✅ **Pas de console.log** en production
6. ✅ **Pas de useEffect** non nettoyés
7. ✅ **Keys dans map()** - Toutes présentes

---

### ❌ ERREURS DÉTECTÉES

#### 1. 🟡 **Types Génériques Non Explicites** - Lignes 67-99

**Problème:** Types `any` implicites dans les requêtes Supabase

**Impact:** Warnings TypeScript, perte de type safety

**Gravité:** 🟡 MOYENNE

**Code actuel:**
```typescript
const [plansResult, subscriptionsResult, paymentsResult] = await Promise.all([
  supabase.from('subscription_plans').select(...),
  // Types inférés comme 'never'
]);
```

**Code corrigé:**
```typescript
interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: string;
  school_group_subscriptions: Array<{
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  previous_status?: string;
  end_date?: string;
}

interface Payment {
  amount: number;
  created_at: string;
  subscription_id: string;
}

const [plansResult, subscriptionsResult, paymentsResult] = await Promise.all([
  supabase.from('subscription_plans').select<'*', Plan>(...),
  supabase.from('school_group_subscriptions').select<'*', Subscription>(...),
  supabase.from('fee_payments').select<'*', Payment>(...),
]);

const plans = plansResult.data as Plan[] || [];
const subscriptions = subscriptionsResult.data as Subscription[] || [];
const payments = paymentsResult.data as Payment[] || [];
```

**Explication:** Ajouter des types explicites évite les warnings TypeScript et améliore la type safety.

---

#### 2. 🟢 **Pas de Validation des Données** - Ligne 106-160

**Problème:** Pas de validation que les données ont la structure attendue

**Impact:** Erreurs runtime possibles si structure BD change

**Gravité:** 🟢 MINEURE

**Code actuel:**
```typescript
const plans = plansResult.data || [];
// Pas de validation
```

**Code corrigé:**
```typescript
const validatePlan = (plan: any): plan is Plan => {
  return (
    typeof plan.id === 'string' &&
    typeof plan.name === 'string' &&
    typeof plan.price === 'number' &&
    Array.isArray(plan.school_group_subscriptions)
  );
};

const plans = (plansResult.data || []).filter(validatePlan);

if (plans.length === 0 && plansResult.data && plansResult.data.length > 0) {
  console.warn('Certains plans ont été filtrés car invalides');
}
```

**Explication:** Valider les données évite les erreurs runtime si la structure BD change.

---

#### 3. 🟢 **Calculs Sans Protection Division par Zéro** - Ligne 147

**Problème:** Division sans vérification

**Impact:** Possible NaN ou Infinity

**Gravité:** 🟢 MINEURE (déjà protégé partiellement)

**Code actuel:**
```typescript
averageRevenuePerUser: activeSubscriptions.length > 0 
  ? planMRR / activeSubscriptions.length 
  : 0,
```

**Commentaire:** ✅ Déjà bien géré avec condition ternaire

---

#### 4. 🟢 **Pas de Debounce sur Refetch** - Ligne 188-189

**Problème:** Refetch toutes les 15 minutes sans debounce

**Impact:** Requêtes multiples si plusieurs instances

**Gravité:** 🟢 MINEURE

**Code actuel:**
```typescript
staleTime: 10 * 60 * 1000,
refetchInterval: 15 * 60 * 1000,
```

**Code amélioré:**
```typescript
staleTime: 10 * 60 * 1000,
refetchInterval: 15 * 60 * 1000,
refetchIntervalInBackground: false, // Ne pas refetch en arrière-plan
refetchOnMount: 'always', // Toujours refetch au montage
```

**Explication:** Éviter les refetch inutiles en arrière-plan.

---

## 📊 RÉSUMÉ

### Découpage (@[/decouper])

| Fichier | Lignes | Limite | Status | Action |
|---------|--------|--------|--------|--------|
| `usePlanAnalytics.ts` | 250 | 100 | ⚠️ TROP LONG | Découper en 3 hooks |
| `analytics.utils.ts` | 192 | 50 | ⚠️ TROP LONG | Découper en 3 fichiers |
| `PlanAnalyticsDashboard.tsx` | 315 | 350 | ✅ OK | Surveiller |

**Score:** 1/3 conforme (33%) ⚠️

---

### Erreurs (@[/correction-erreurs])

| # | Type | Gravité | Ligne | Status |
|---|------|---------|-------|--------|
| 1 | Types génériques | 🟡 Moyenne | 67-99 | À corriger |
| 2 | Validation données | 🟢 Mineure | 106-160 | Optionnel |
| 3 | Division par zéro | 🟢 Mineure | 147 | ✅ Déjà géré |
| 4 | Refetch config | 🟢 Mineure | 188-189 | Optionnel |

**Score:** 3/4 OK (75%) ✅

---

## 🎯 PLAN D'ACTION

### 🔴 PRIORITÉ HAUTE (Cette semaine)

#### 1. **Découper usePlanAnalytics.ts**
```bash
# Créer 3 nouveaux hooks
touch src/features/dashboard/hooks/usePlanMetricsCalculator.ts
touch src/features/dashboard/hooks/useInsightsGenerator.ts

# Refactoriser usePlanAnalytics.ts
# Temps estimé: 2 heures
```

#### 2. **Découper analytics.utils.ts**
```bash
# Créer 3 nouveaux fichiers
touch src/features/dashboard/utils/analytics-dates.utils.ts
touch src/features/dashboard/utils/analytics-metrics.utils.ts
touch src/features/dashboard/utils/analytics-format.utils.ts

# Refactoriser analytics.utils.ts
# Temps estimé: 1 heure
```

---

### 🟡 PRIORITÉ MOYENNE (Ce mois)

#### 3. **Ajouter types explicites**
```typescript
// Créer fichier de types
touch src/features/dashboard/types/analytics.types.ts

// Ajouter interfaces Plan, Subscription, Payment
// Temps estimé: 30 minutes
```

#### 4. **Ajouter validation données**
```typescript
// Créer fonctions de validation
// Temps estimé: 1 heure
```

---

### 🟢 PRIORITÉ BASSE (Optionnel)

#### 5. **Améliorer config React Query**
```typescript
// Ajouter refetchIntervalInBackground: false
// Temps estimé: 5 minutes
```

---

## ✅ CHECKLIST DE VALIDATION

### Découpage
- [ ] usePlanAnalytics.ts < 100 lignes
- [ ] analytics.utils.ts < 50 lignes
- [ ] Chaque fichier a UNE responsabilité
- [ ] Pas d'imports circulaires
- [ ] Tests possibles sur chaque partie

### Erreurs
- [ ] Tous les types explicites
- [ ] Toutes les données validées
- [ ] Pas de console.log en prod
- [ ] Pas de memory leaks
- [ ] Pas d'erreurs TypeScript

---

## 🎯 CONCLUSION

### État Actuel
**Découpage:** 1/3 conforme (33%) ⚠️  
**Erreurs:** 3/4 OK (75%) ✅

**Résumé:**
Le code est **fonctionnel** mais nécessite un **refactoring** pour respecter les limites de découpage. Les erreurs détectées sont **mineures** et n'empêchent pas le déploiement.

### Verdict
⚠️ **REFACTORING RECOMMANDÉ** avant d'ajouter de nouvelles features

**Raisons:**
1. Hook trop long (250 vs 100 lignes)
2. Utilitaires trop longs (192 vs 50 lignes)
3. Maintenabilité compromise

### Prochaines Étapes
1. **Cette semaine:** Découper usePlanAnalytics.ts et analytics.utils.ts (3h)
2. **Ce mois:** Ajouter types explicites et validation (1h30)
3. **Optionnel:** Améliorer config React Query (5min)

---

**Temps total estimé:** 4h35 pour rendre le code 100% conforme ✅
