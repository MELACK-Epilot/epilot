# 🔄 RÉVISION COMPLÈTE - PAGE FINANCES

**Date** : 6 novembre 2025  
**Statut** : 🔄 EN COURS

---

## 📊 ÉTAT ACTUEL

### **Page principale** : `FinancesDashboard.tsx`

**KPIs affichés** :
1. ✅ **Total Groupes** → `school_groups` (status='active')
2. ✅ **Abonnements** → `subscriptions` (status='active')
3. ✅ **Plans** → `subscription_plans` (CORRIGÉ)
4. ✅ **Revenus** → `payments` (status='completed', mois en cours)

**Sections** :
- ✅ Stats globales (4 KPIs)
- ✅ Alertes financières
- ✅ Accès rapide (Plans, Abonnements, Paiements, Dépenses)

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Hook `useRealFinancialStats.ts`**

**AVANT** ❌ :
```typescript
const { count: activePlans } = await supabase
  .from('plans')  // ❌ Mauvaise table
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active');  // ❌ Colonne inexistante
```

**APRÈS** ✅ :
```typescript
const { count: activePlans } = await supabase
  .from('subscription_plans')  // ✅ Bonne table
  .select('*', { count: 'exact', head: true });
  // ✅ Pas de filtre status
```

---

## 🎯 PLAN D'ACTION COMPLET

### **Phase 1 : Vérifier les données** ✅

1. ✅ Corriger la table `plans` → `subscription_plans`
2. ⏳ Vérifier que les données s'affichent correctement
3. ⏳ Tester les KPIs en temps réel

---

### **Phase 2 : Améliorer les KPIs** 🔄

#### **KPI 1 : Total Groupes** ✅
- Source : `school_groups`
- Filtre : `status='active'`
- **Amélioration possible** : Ajouter tendance (nouveaux groupes ce mois)

#### **KPI 2 : Abonnements** ✅
- Source : `subscriptions`
- Filtre : `status='active'`
- **Amélioration possible** : 
  - Ajouter abonnements expirés
  - Ajouter taux de renouvellement

#### **KPI 3 : Plans** ✅
- Source : `subscription_plans`
- **Amélioration possible** :
  - Afficher plan le plus populaire
  - Taux de conversion par plan

#### **KPI 4 : Revenus** ✅
- Source : `payments`
- Filtre : `status='completed'`, mois en cours
- Tendance : Comparaison avec mois précédent
- **Amélioration possible** :
  - Revenus annuels
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)

---

### **Phase 3 : Ajouter de nouveaux KPIs** 📋

#### **KPI 5 : Taux de conversion** 🆕
```typescript
// Groupes avec abonnement actif / Total groupes
const conversionRate = (activeSubscriptions / activeGroups) * 100;
```

#### **KPI 6 : Revenu moyen par groupe (ARPU)** 🆕
```typescript
// Average Revenue Per User
const arpu = monthlyRevenue / activeSubscriptions;
```

#### **KPI 7 : Churn Rate** 🆕
```typescript
// Taux d'attrition (abonnements annulés / total abonnements)
const churnRate = (canceledSubscriptions / totalSubscriptions) * 100;
```

#### **KPI 8 : Lifetime Value (LTV)** 🆕
```typescript
// Valeur vie client
const ltv = arpu / churnRate;
```

---

### **Phase 4 : Graphiques et visualisations** 📈

#### **Graphique 1 : Évolution des revenus** 🆕
- Type : Ligne
- Période : 12 derniers mois
- Données : Revenus mensuels

#### **Graphique 2 : Répartition par plan** 🆕
- Type : Donut
- Données : Nombre d'abonnements par plan

#### **Graphique 3 : Taux de conversion** 🆕
- Type : Barre
- Données : Conversion par mois

#### **Graphique 4 : Top 5 groupes** 🆕
- Type : Tableau
- Données : Groupes avec le plus de revenus

---

### **Phase 5 : Filtres avancés** 🔍

#### **Filtres à ajouter** :
1. ✅ **Période** (7j, 30j, 3m, 6m, 1an, tout)
2. 🆕 **Type de plan** (Gratuit, Premium, Pro, Institutionnel)
3. 🆕 **Statut abonnement** (Actif, Expiré, Annulé, En attente)
4. 🆕 **Groupe** (Sélection multiple)
5. 🆕 **Montant** (Min-Max)

---

### **Phase 6 : Exports** 📥

#### **Formats d'export** :
1. ✅ PDF Rapport
2. ✅ Excel (.xlsx)
3. ✅ CSV (.csv)

#### **Données à exporter** :
- Stats globales
- Liste des abonnements
- Liste des paiements
- Graphiques (images)

---

## 🔧 MODIFICATIONS À FAIRE

### **1. Créer de nouveaux hooks**

#### **`useFinancialKPIs.ts`** 🆕
```typescript
export const useFinancialKPIs = (period: string) => {
  return useQuery({
    queryKey: ['financial-kpis', period],
    queryFn: async () => {
      // Calculer tous les KPIs
      const conversionRate = ...;
      const arpu = ...;
      const churnRate = ...;
      const ltv = ...;
      
      return {
        conversionRate,
        arpu,
        churnRate,
        ltv,
      };
    },
  });
};
```

#### **`useRevenueChart.ts`** 🆕
```typescript
export const useRevenueChart = (period: string) => {
  return useQuery({
    queryKey: ['revenue-chart', period],
    queryFn: async () => {
      // Récupérer revenus par mois
      const data = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      // Grouper par mois
      const monthlyData = groupByMonth(data);
      
      return monthlyData;
    },
  });
};
```

#### **`usePlanDistribution.ts`** 🆕
```typescript
export const usePlanDistribution = () => {
  return useQuery({
    queryKey: ['plan-distribution'],
    queryFn: async () => {
      // Compter abonnements par plan
      const data = await supabase
        .from('subscriptions')
        .select(`
          plan_id,
          subscription_plans (name, slug)
        `)
        .eq('status', 'active');
      
      // Grouper par plan
      const distribution = groupByPlan(data);
      
      return distribution;
    },
  });
};
```

---

### **2. Créer de nouveaux composants**

#### **`RevenueChart.tsx`** 🆕
- Graphique ligne pour évolution des revenus
- Utilise `recharts` ou `chart.js`

#### **`PlanDistributionChart.tsx`** 🆕
- Graphique donut pour répartition par plan

#### **`TopGroupsTable.tsx`** 🆕
- Tableau des top 5 groupes par revenus

#### **`FinancialMetricsGrid.tsx`** 🆕
- Grille de métriques avancées (ARPU, LTV, Churn)

---

### **3. Mettre à jour `FinancesDashboard.tsx`**

```typescript
export const FinancesDashboard = () => {
  const [period, setPeriod] = useState('30d');
  const [filters, setFilters] = useState({
    planType: 'all',
    status: 'all',
  });
  
  // Hooks
  const { data: stats } = useRealFinancialStats();
  const { data: kpis } = useFinancialKPIs(period);
  const { data: revenueData } = useRevenueChart(period);
  const { data: planDistribution } = usePlanDistribution();
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <FinancePageHeader ... />
      
      {/* KPIs principaux */}
      <FinanceModernStatsGrid stats={statsData} columns={4} />
      
      {/* KPIs avancés */}
      <FinancialMetricsGrid kpis={kpis} />
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <PlanDistributionChart data={planDistribution} />
      </div>
      
      {/* Top groupes */}
      <TopGroupsTable />
      
      {/* Accès rapide */}
      <QuickAccessSection />
    </div>
  );
};
```

---

## 🧪 TESTS À EFFECTUER

### **1. Vérifier les données**
```sql
-- Groupes actifs
SELECT COUNT(*) FROM school_groups WHERE status = 'active';

-- Abonnements actifs
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';

-- Plans
SELECT COUNT(*) FROM subscription_plans;

-- Revenus du mois
SELECT SUM(amount) FROM payments 
WHERE status = 'completed' 
AND created_at >= date_trunc('month', CURRENT_DATE);
```

### **2. Tester l'affichage**
1. Rafraîchir la page `/dashboard/finances`
2. Vérifier que les 4 KPIs s'affichent
3. Vérifier que les chiffres sont corrects
4. Tester les filtres de période
5. Tester les exports

---

## 📋 PROCHAINES ÉTAPES

### **Immédiat** (Aujourd'hui) :
1. ✅ Corriger `useRealFinancialStats` (FAIT)
2. ⏳ Tester l'affichage des KPIs
3. ⏳ Vérifier les données en BDD

### **Court terme** (Cette semaine) :
1. 🆕 Créer `useFinancialKPIs`
2. 🆕 Créer `useRevenueChart`
3. 🆕 Créer `usePlanDistribution`
4. 🆕 Créer composants graphiques

### **Moyen terme** (Ce mois) :
1. 🆕 Ajouter filtres avancés
2. 🆕 Implémenter exports
3. 🆕 Ajouter tableaux détaillés
4. 🆕 Optimiser performances

---

## 🎯 RÉSULTAT ATTENDU

Une page Finances complète avec :
- ✅ 8 KPIs principaux
- ✅ 4 graphiques interactifs
- ✅ Filtres avancés
- ✅ Exports multiples formats
- ✅ Données en temps réel
- ✅ Design moderne et cohérent

---

**Première étape : Tester les corrections actuelles !** 🧪

**Rafraîchissez la page `/dashboard/finances` et vérifiez que les KPIs s'affichent correctement.** ✅
