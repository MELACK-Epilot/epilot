# 🎨 AMÉLIORATION PAGE PLANS & TARIFICATION

**Date** : 7 novembre 2025, 14:20 PM  
**Objectif** : Moderniser et enrichir la page avec des données réelles

---

## 📊 ANALYSE ACTUELLE

### **✅ Points Forts**
1. Design moderne avec cartes glassmorphism
2. Formulaire complet avec validation Zod
3. Sélection modules/catégories intégrée
4. Animations Framer Motion
5. Export CSV fonctionnel
6. Breadcrumb et navigation claire

### **❌ Points à Améliorer**
1. **KPI MRR** : Affiche "0K" (hardcodé)
2. **Graphique** : Données à 0 (pas de vraies données)
3. **Pas de tableau comparatif** des plans
4. **Limites** : Affichage basique
5. **Pas de vue détaillée** par plan
6. **Pas de gestion des modules** assignés visibles

---

## 🎯 AMÉLIORATIONS PROPOSÉES

### **1. KPI avec Données Réelles**

**Créer un hook `usePlanRevenue`** :
```typescript
// src/features/dashboard/hooks/usePlanRevenue.ts
export const usePlanRevenue = () => {
  return useQuery({
    queryKey: ['plan-revenue'],
    queryFn: async () => {
      // Calculer MRR depuis school_group_subscriptions
      const { data } = await supabase
        .from('school_group_subscriptions')
        .select(`
          subscription_plans!inner(price, billing_period)
        `)
        .eq('status', 'active');

      const mrr = (data || []).reduce((sum, sub: any) => {
        const plan = sub.subscription_plans;
        const monthlyPrice = plan.billing_period === 'yearly' 
          ? plan.price / 12 
          : plan.price;
        return sum + monthlyPrice;
      }, 0);

      return {
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
      };
    },
  });
};
```

**Utiliser dans Plans.tsx** :
```typescript
const { data: revenue } = usePlanRevenue();

const statsData: ModernStatCardData[] = [
  // ... autres stats
  {
    title: "Revenus MRR",
    value: revenue?.mrr ? `${(revenue.mrr / 1000).toFixed(0)}K` : "0",
    subtitle: "FCFA mensuel",
    icon: DollarSign,
    color: 'gold',
    trend: revenue?.mrr > 0 ? 'up' : 'neutral',
  },
];
```

---

### **2. Graphique avec Vraies Données**

**Créer un hook `usePlanDistributionData`** :
```typescript
export const usePlanDistributionData = () => {
  return useQuery({
    queryKey: ['plan-distribution-data'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select(`
          id,
          name,
          slug,
          school_group_subscriptions!inner(id, status)
        `);

      return (data || []).map((plan: any) => ({
        name: plan.name,
        value: plan.school_group_subscriptions?.filter(
          (s: any) => s.status === 'active'
        ).length || 0,
        slug: plan.slug,
      }));
    },
  });
};
```

**Utiliser dans le graphique** :
```typescript
const { data: distributionData } = usePlanDistributionData();

<Pie
  data={distributionData || []}
  // ... reste du code
/>
```

---

### **3. Tableau Comparatif des Plans**

**Créer un composant `PlanComparisonTable`** :
```typescript
// src/features/dashboard/components/plans/PlanComparisonTable.tsx
export const PlanComparisonTable = ({ plans }: { plans: Plan[] }) => {
  const features = [
    { key: 'maxSchools', label: 'Écoles', icon: Building2 },
    { key: 'maxStudents', label: 'Élèves', icon: Users },
    { key: 'maxStaff', label: 'Personnel', icon: Users },
    { key: 'maxStorage', label: 'Stockage', icon: HardDrive },
    { key: 'supportLevel', label: 'Support', icon: Headphones },
    { key: 'customBranding', label: 'Branding', icon: Palette },
    { key: 'apiAccess', label: 'API', icon: Zap },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Comparaison des Plans</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Fonctionnalité</th>
              {plans.map(plan => (
                <th key={plan.id} className="text-center p-3">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold">{plan.name}</span>
                    <Badge>{plan.price} FCFA/mois</Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map(feature => (
              <tr key={feature.key} className="border-b hover:bg-gray-50">
                <td className="p-3 flex items-center gap-2">
                  <feature.icon className="w-4 h-4 text-gray-500" />
                  {feature.label}
                </td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center p-3">
                    {renderFeatureValue(plan, feature.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
```

---

### **4. Vue Détaillée par Plan**

**Créer un composant `PlanDetailDialog`** :
```typescript
// Afficher :
// - Modules assignés (avec badges)
// - Catégories assignées
// - Statistiques d'utilisation
// - Liste des groupes abonnés
// - Graphique d'évolution
```

---

### **5. Affichage des Modules Assignés**

**Dans les cartes de plans** :
```typescript
<div className="p-4 bg-gray-50">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-700">Modules inclus</span>
    <Badge variant="outline">{modulesCount} modules</Badge>
  </div>
  <div className="flex flex-wrap gap-1">
    {modules.slice(0, 3).map(module => (
      <Badge key={module.id} variant="secondary" className="text-xs">
        {module.name}
      </Badge>
    ))}
    {modules.length > 3 && (
      <Badge variant="outline" className="text-xs">
        +{modules.length - 3}
      </Badge>
    )}
  </div>
</div>
```

---

### **6. Filtres Avancés**

**Ajouter des filtres** :
```typescript
const [filters, setFilters] = useState({
  planType: 'all', // gratuit, premium, pro, institutionnel
  priceRange: 'all', // 0-50k, 50k-150k, 150k+
  hasSubscriptions: 'all', // yes, no
});
```

---

### **7. Actions en Masse**

**Pour Super Admin** :
```typescript
<Button onClick={handleBulkActivate}>
  Activer sélection
</Button>
<Button onClick={handleBulkDeactivate}>
  Désactiver sélection
</Button>
<Button onClick={handleBulkDuplicate}>
  Dupliquer plan
</Button>
```

---

## 📁 FICHIERS À CRÉER/MODIFIER

### **Nouveaux Fichiers**
1. ✅ `src/features/dashboard/hooks/usePlanRevenue.ts`
2. ✅ `src/features/dashboard/hooks/usePlanDistributionData.ts`
3. ✅ `src/features/dashboard/components/plans/PlanComparisonTable.tsx`
4. ✅ `src/features/dashboard/components/plans/PlanDetailDialog.tsx`
5. ✅ `src/features/dashboard/components/plans/PlanModulesBadges.tsx`

### **Fichiers à Modifier**
1. ✅ `src/features/dashboard/pages/Plans.tsx`
   - Intégrer les nouveaux hooks
   - Ajouter tableau comparatif
   - Afficher modules dans les cartes

2. ✅ `src/features/dashboard/hooks/usePlans.ts`
   - Ajouter `usePlanWithModules()`
   - Ajouter `useDuplicatePlan()`

---

## 🎨 DESIGN AMÉLIORÉ

### **Palette de Couleurs par Plan**
```typescript
const PLAN_COLORS = {
  gratuit: {
    gradient: 'from-gray-500 to-gray-600',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  premium: {
    gradient: 'from-[#2A9D8F] to-[#1D8A7E]',
    bg: 'bg-[#2A9D8F]/10',
    text: 'text-[#2A9D8F]',
    border: 'border-[#2A9D8F]',
  },
  pro: {
    gradient: 'from-[#1D3557] to-[#0F1F35]',
    bg: 'bg-[#1D3557]/10',
    text: 'text-[#1D3557]',
    border: 'border-[#1D3557]',
  },
  institutionnel: {
    gradient: 'from-[#E9C46A] to-[#D4AF37]',
    bg: 'bg-[#E9C46A]/10',
    text: 'text-[#E9C46A]',
    border: 'border-[#E9C46A]',
  },
};
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Créer les hooks** pour données réelles
2. **Créer le tableau comparatif**
3. **Ajouter affichage modules** dans les cartes
4. **Créer la vue détaillée** par plan
5. **Ajouter filtres avancés**
6. **Tester avec vraies données**

---

**Voulez-vous que je commence l'implémentation de ces améliorations ?** 🤔
