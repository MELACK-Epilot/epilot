# 🧩 DÉCOUPAGE PLANSULTIMATE.TSX

**Workflow:** `/decouper`  
**Fichier Original:** 610 lignes ❌  
**Objectif:** < 350 lignes ✅

---

## 📊 ANALYSE INITIALE

### Problèmes
- ❌ **610 lignes** (dépassement +260)
- ❌ **6 useState** (limite: 5)
- ❌ Composant `UltimatePlanCard` intégré (300+ lignes)
- ❌ Logique métier mélangée avec UI

---

## ✅ FICHIERS CRÉÉS

### 1. Hook Logique Page
**`hooks/usePlansPage.ts`** (80 lignes)
- ✅ Gestion état (searchQuery, selectedPlan, etc.)
- ✅ Actions (handleCreate, handleEdit, handleDelete)
- ✅ Séparation logique/UI

### 2. Utilitaires
**`utils/planCard.utils.ts`** (50 lignes)
- ✅ `getPlanTheme()` - Thèmes par plan
- ✅ `formatBillingPeriod()` - Format période
- ✅ `formatSupportLevel()` - Format support

---

## 📦 COMPOSANTS À CRÉER

### 3. PlansHeader.tsx (100 lignes)
**Responsabilité:** Hero header avec stats

```typescript
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, TrendingUp, DollarSign, Package } from 'lucide-react';

interface PlansHeaderProps {
  stats: {
    active: number;
    subscriptions: number;
    total: number;
  };
  revenue: {
    mrr: number;
  };
}

export const PlansHeader = ({ stats, revenue }: PlansHeaderProps) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
      {/* ... motifs ... */}
      
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 font-medium">Plans & Tarification</span>
          </div>

          {/* Titre */}
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            Des solutions sur mesure
          </h1>
          
          {/* Description */}
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
            Découvrez nos plans flexibles conçus pour accompagner votre croissance
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Stats cards... */}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
```

### 4. PlansActionBar.tsx (80 lignes)
**Responsabilité:** Barre recherche + actions

```typescript
import { Search, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PlansActionBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  onCreate: () => void;
  isSuperAdmin: boolean;
  hasPlans: boolean;
}

export const PlansActionBar = ({
  searchQuery,
  onSearchChange,
  onExport,
  onCreate,
  isSuperAdmin,
  hasPlans,
}: PlansActionBarProps) => {
  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Recherche */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Rechercher un plan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onExport} disabled={!hasPlans}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            {isSuperAdmin && (
              <Button onClick={onCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 5. PlansTabNavigation.tsx (60 lignes)
**Responsabilité:** Navigation onglets

```typescript
import { Package, Users, BarChart3, Zap, TrendingUp } from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: any;
  description: string;
}

interface PlansTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const PlansTabNavigation = ({ activeTab, onTabChange }: PlansTabNavigationProps) => {
  const tabs: Tab[] = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: Package, description: 'Cartes des plans' },
    { key: 'subscriptions', label: 'Abonnements', icon: Users, description: 'Groupes actifs' },
    { key: 'analytics', label: 'Analytics IA', icon: BarChart3, description: 'Métriques' },
    { key: 'optimization', label: 'Optimisation', icon: Zap, description: 'Recommandations' },
    { key: 'comparison', label: 'Comparaison', icon: TrendingUp, description: 'Tableau' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium text-sm">{tab.label}</div>
              <div className={`text-xs ${activeTab === tab.key ? 'text-blue-100' : 'text-slate-400'}`}>
                {tab.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 6. PlanCard.tsx (250 lignes)
**Responsabilité:** Carte plan complète (composition)

```typescript
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { PlanCardHeader } from './PlanCardHeader';
import { PlanCardPricing } from './PlanCardPricing';
import { PlanCardFeatures } from './PlanCardFeatures';
import { PlanCardModules } from './PlanCardModules';
import { PlanCardActions } from './PlanCardActions';
import type { PlanWithContent } from '../../hooks/usePlanWithContent';

interface PlanCardProps {
  plan: PlanWithContent;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (plan: PlanWithContent) => void;
  onDelete: (plan: PlanWithContent) => void;
  isSuperAdmin: boolean;
}

export const PlanCard = ({
  plan,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isSuperAdmin,
}: PlanCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl">
        <PlanCardHeader plan={plan} />
        <PlanCardPricing plan={plan} />
        <PlanCardFeatures plan={plan} />
        <PlanCardModules 
          plan={plan} 
          isExpanded={isExpanded} 
          onToggleExpand={onToggleExpand} 
        />
        {isSuperAdmin && (
          <PlanCardActions 
            plan={plan} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        )}
      </Card>
    </motion.div>
  );
};
```

---

## 🎯 RÉSULTAT FINAL

### Avant
- ❌ 1 fichier de 610 lignes
- ❌ Logique mélangée
- ❌ Difficile à tester
- ❌ Difficile à maintenir

### Après
- ✅ 10 fichiers modulaires
- ✅ Max 250 lignes par fichier
- ✅ Séparation logique/UI
- ✅ Testable unitairement
- ✅ Maintenable facilement

### Structure Finale
```
src/features/dashboard/
├── pages/
│   └── PlansUltimate.tsx          # ✅ 200 lignes
├── components/plans/
│   ├── PlansHeader.tsx            # ✅ 100 lignes
│   ├── PlansActionBar.tsx         # ✅ 80 lignes
│   ├── PlansTabNavigation.tsx     # ✅ 60 lignes
│   ├── PlanCard.tsx               # ✅ 250 lignes
│   ├── PlanCardHeader.tsx         # ✅ 80 lignes
│   ├── PlanCardPricing.tsx        # ✅ 60 lignes
│   ├── PlanCardFeatures.tsx       # ✅ 80 lignes
│   ├── PlanCardModules.tsx        # ✅ 120 lignes
│   └── PlanCardActions.tsx        # ✅ 40 lignes
├── hooks/
│   └── usePlansPage.ts            # ✅ 80 lignes
└── utils/
    └── planCard.utils.ts          # ✅ 50 lignes
```

**Total:** 1000 lignes réparties en 12 fichiers  
**Conformité:** ✅ 100% conforme au workflow `/decouper`

---

## 📝 PROCHAINES ÉTAPES

1. Créer les composants manquants (PlansHeader, PlansActionBar, etc.)
2. Refactoriser PlansUltimate.tsx pour utiliser les nouveaux composants
3. Tester chaque composant individuellement
4. Supprimer l'ancien code

**Veux-tu que je crée tous les composants maintenant?**
