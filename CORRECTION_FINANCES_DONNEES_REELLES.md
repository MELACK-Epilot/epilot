# 🔧 CORRECTION FINANCES - DONNÉES RÉELLES

**Problèmes identifiés** :
1. ❌ Design KPIs différent de la page Utilisateurs
2. ❌ Hook useFinancialStats utilise une vue SQL inexistante
3. ❌ Groupes abonnés ne s'affichent pas

**Solutions** :
1. ✅ Utiliser GlassmorphismStatCard (même design que Users)
2. ✅ Récupérer données directement depuis tables existantes
3. ✅ Afficher vraies données des groupes abonnés

---

## 📊 TABLES EXISTANTES

```sql
-- Tables disponibles
school_groups (id, name, plan, status, created_at)
subscriptions (id, school_group_id, plan_id, status, start_date, end_date)
payments (id, amount, status, created_at)
plans (id, name, price, status)
```

---

## ✅ CORRECTIONS À APPLIQUER

### 1. Remplacer les KPIs custom par GlassmorphismStatCard

**Avant** :
```tsx
<motion.div>
  <Card className="p-6 bg-white/90 backdrop-blur-xl">
    {/* KPI custom */}
  </Card>
</motion.div>
```

**Après** :
```tsx
<GlassmorphismStatCard
  title="Groupes Abonnés"
  value={activeGroups}
  subtitle="groupes actifs"
  icon={Users}
  gradient="from-[#2A9D8F] to-[#1D8A7E]"
  delay={0.1}
/>
```

---

### 2. Créer hook pour vraies données

```typescript
// useRealFinancialStats.ts
export const useRealFinancialStats = () => {
  return useQuery({
    queryKey: ['real-financial-stats'],
    queryFn: async () => {
      // 1. Compter groupes actifs
      const { count: activeGroups } = await supabase
        .from('school_groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 2. Compter abonnements actifs
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 3. Calculer revenus du mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 4. Compter plans actifs
      const { count: activePlans } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        activeGroups: activeGroups || 0,
        activeSubscriptions: activeSubscriptions || 0,
        monthlyRevenue,
        activePlans: activePlans || 0,
      };
    },
  });
};
```

---

### 3. Mettre à jour FinancesDashboard.tsx

**Import** :
```tsx
import { GlassmorphismStatCard } from '../components/GlassmorphismStatCard';
import { useRealFinancialStats } from '../hooks/useRealFinancialStats';
```

**KPIs** :
```tsx
const { data: stats, isLoading } = useRealFinancialStats();

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <GlassmorphismStatCard
    title="Groupes Abonnés"
    value={stats?.activeGroups || 0}
    subtitle="groupes actifs"
    icon={Users}
    gradient="from-[#2A9D8F] to-[#1D8A7E]"
    delay={0.1}
  />
  
  <GlassmorphismStatCard
    title="Abonnements"
    value={stats?.activeSubscriptions || 0}
    subtitle="abonnements actifs"
    icon={Package}
    gradient="from-[#1D3557] to-[#0F1F35]"
    delay={0.2}
  />
  
  <GlassmorphismStatCard
    title="Revenus du Mois"
    value={`${(stats?.monthlyRevenue || 0).toLocaleString()} FCFA`}
    subtitle="encaissements"
    icon={DollarSign}
    gradient="from-[#E9C46A] to-[#D4AF37]"
    delay={0.3}
  />
  
  <GlassmorphismStatCard
    title="Plans Actifs"
    value={stats?.activePlans || 0}
    subtitle="offres disponibles"
    icon={CreditCard}
    gradient="from-[#457B9D] to-[#2A5F7F]"
    delay={0.4}
  />
</div>
```

---

## 📝 FICHIERS À MODIFIER

1. **Créer** : `src/features/dashboard/hooks/useRealFinancialStats.ts`
2. **Modifier** : `src/features/dashboard/pages/FinancesDashboard.tsx`

---

## ✅ RÉSULTAT ATTENDU

- ✅ Design identique à la page Utilisateurs
- ✅ Données réelles depuis Supabase
- ✅ Groupes abonnés visibles
- ✅ Performance optimale
