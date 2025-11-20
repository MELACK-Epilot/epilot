# 📊 ANALYSE DÉCOUPAGE - Dashboard E-Pilot

**Date:** 20 novembre 2025  
**Règles:** @[/decouper] + @[/planform]

---

## 🎯 RÈGLES DE DÉCOUPAGE

### Limites strictes
- **Fichier React:** MAX 350 lignes (idéal: 200-300)
- **Hook custom:** MAX 100 lignes  
- **Fonction utilitaire:** MAX 50 lignes
- **Composant:** MAX 250 lignes

### Découpage obligatoire SI:
1. Fichier > 300 lignes → **STOP & REFACTOR**
2. État local > 5 `useState` → Hook custom
3. Fonction > 30 lignes → Extraire dans `utils/`
4. JSX répété 3+ fois → Composant dédié
5. Logique métier dans composant → Déplacer vers `hooks/`

---

## ✅ FICHIERS RÉCEMMENT MODIFIÉS

### 1. ✅ `useMonthlyRevenue.ts` - 108 lignes
**Statut:** ✅ CONFORME (< 100 lignes pour hook)

**Structure:**
- Types: 15 lignes
- Hook principal: 93 lignes
- Logique claire et focalisée

**Verdict:** ✅ Aucune action requise

---

### 2. ⚠️ `FinancialOverviewWidget.tsx` - 248 lignes
**Statut:** ⚠️ ATTENTION (proche de la limite 250)

**Structure:**
- Imports: 11 lignes
- Types: 4 lignes
- Composant: 233 lignes
- États: 4 `useState` ✅
- Handlers: 2 fonctions

**Recommandation:** 
- **Surveiller** - À 250 lignes, proposer refactorisation
- Extraire `CustomTooltip` si réutilisé
- Extraire logique graphique si > 260 lignes

**Verdict:** ⚠️ Acceptable mais surveiller

---

### 3. ✅ `useAIInsights.ts` - 160 lignes
**Statut:** ⚠️ DÉPASSE (> 100 lignes pour hook)

**Structure:**
- Types: 10 lignes
- Hook principal: 150 lignes
- Logique complexe avec 6 insights

**Problème:**
- Hook > 100 lignes (limite stricte)
- Logique de génération d'insights mélangée

**Recommandation:** ✅ REFACTORISATION REQUISE

**Plan de découpage:**
```typescript
// hooks/useAIInsights.ts (< 50 lignes)
export const useAIInsights = () => {
  const { data: stats } = useDashboardStats();
  const { data: revenueData, isError: revenueError } = useMonthlyRevenue(6);
  const { data: moduleData } = useModuleAdoption();

  return useQuery({
    queryKey: ['ai-insights', stats, revenueData, moduleData],
    queryFn: async () => {
      const insights: AIInsight[] = [];
      
      if (!stats) return insights;
      
      // Générer insights
      insights.push(...generateSubscriptionInsights(stats));
      insights.push(...generateRevenueInsights(stats, revenueData, revenueError));
      insights.push(...generateAlertInsights(stats));
      insights.push(...generateRecommendations(stats, moduleData));
      insights.push(...generateModuleInsights(moduleData));
      
      return insights.slice(0, 4);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!stats,
  });
};

// utils/insights-generators.ts (< 150 lignes)
export const generateSubscriptionInsights = (stats) => { /* ... */ };
export const generateRevenueInsights = (stats, revenueData, revenueError) => { /* ... */ };
export const generateAlertInsights = (stats) => { /* ... */ };
export const generateRecommendations = (stats, moduleData) => { /* ... */ };
export const generateModuleInsights = (moduleData) => { /* ... */ };
```

**Verdict:** ❌ REFACTORISATION REQUISE

---

## 🔴 FICHIERS CRITIQUES (> 300 lignes)

### Top 30 Fichiers à Refactoriser

| Fichier | Lignes | Priorité | Action |
|---------|--------|----------|--------|
| `Users.tsx` | ? | 🔴 CRITIQUE | Découper en sections |
| `SchoolFormDialog.tsx` | ? | 🔴 CRITIQUE | Extraire sous-composants |
| `Subscriptions.tsx` | ? | 🔴 CRITIQUE | Découper en sections |
| `UserFormDialog.tsx` | ? | 🔴 CRITIQUE | Extraire logique |
| `UserProfileDialog.tsx` | ? | 🔴 CRITIQUE | Extraire sections |
| `UnifiedUserFormDialog.tsx` | ? | 🔴 CRITIQUE | Découper formulaire |
| `SocialFeedSection.tsx` | ? | 🔴 CRITIQUE | Extraire composants |
| `CategoryFormDialog.tsx` | ? | 🔴 CRITIQUE | Extraire validation |
| `GroupUserFormDialog.tsx` | ? | 🔴 CRITIQUE | Extraire logique |
| `Plans.tsx` | ? | 🔴 CRITIQUE | Découper en sections |
| `useUsers.ts` | ? | 🔴 CRITIQUE | Séparer mutations |
| `ExpenseModals.tsx` | ? | 🔴 CRITIQUE | Un modal par fichier |
| `DashboardLayout.tsx` | ? | 🔴 CRITIQUE | Extraire sections |
| `ModernPlanComparison.tsx` | ? | 🔴 CRITIQUE | Extraire composants |
| `Expenses.tsx` | ? | 🔴 CRITIQUE | Découper en sections |
| `MyGroupModules.tsx` | ? | 🔴 CRITIQUE | Extraire grille |
| `Categories.tsx` | ? | 🔴 CRITIQUE | Découper en sections |
| `useTickets.ts` | ? | 🔴 CRITIQUE | Séparer CRUD |
| `PlanChangeRequests.tsx` | ? | 🔴 CRITIQUE | Extraire table |
| `useSchoolGroups.ts` | ? | 🔴 CRITIQUE | Séparer mutations |

---

## 🎯 PLAN D'ACTION GLOBAL

### Phase 1: Corrections Immédiates (1h)

#### 1. Refactoriser `useAIInsights.ts`
**Temps:** 30 minutes

**Actions:**
1. Créer `utils/insights-generators.ts`
2. Extraire 5 fonctions de génération
3. Réduire hook à < 50 lignes
4. Tester

---

#### 2. Surveiller `FinancialOverviewWidget.tsx`
**Temps:** 10 minutes

**Actions:**
1. Documenter structure actuelle
2. Identifier parties extractibles
3. Préparer plan si > 260 lignes

---

### Phase 2: Refactorisation Critique (3-5 jours)

#### Fichiers Prioritaires (> 500 lignes estimées)

1. **`Users.tsx`**
   - Extraire `UsersFilters.tsx`
   - Extraire `UsersTable.tsx`
   - Extraire `UsersActions.tsx`
   - Réduire à < 200 lignes

2. **`SchoolFormDialog.tsx`**
   - Extraire `SchoolBasicInfoSection.tsx`
   - Extraire `SchoolAddressSection.tsx`
   - Extraire `SchoolContactSection.tsx`
   - Réduire à < 200 lignes

3. **`Subscriptions.tsx`**
   - Extraire `SubscriptionsFilters.tsx`
   - Extraire `SubscriptionsTable.tsx`
   - Extraire `SubscriptionsStats.tsx`
   - Réduire à < 200 lignes

---

### Phase 3: Optimisation Globale (1-2 semaines)

**Objectif:** Tous les fichiers < 300 lignes

**Stratégie:**
1. Analyser chaque fichier > 300 lignes
2. Créer plan de découpage
3. Refactoriser par ordre de priorité
4. Tester après chaque refactorisation

---

## 📋 CHECKLIST DE VALIDATION

### Fichiers Modifiés Récemment
- [x] `useMonthlyRevenue.ts` - 108 lignes ✅
- [ ] `FinancialOverviewWidget.tsx` - 248 lignes ⚠️
- [ ] `useAIInsights.ts` - 160 lignes ❌

### Règles Respectées
- [x] Aucun fichier React > 350 lignes
- [ ] Aucun hook > 100 lignes (useAIInsights)
- [x] Logique métier séparée de l'UI
- [x] Pas d'imports circulaires
- [x] Tests possibles sur chaque partie

---

## 🚨 ACTIONS IMMÉDIATES REQUISES

### 1. ❌ CRITIQUE: Refactoriser `useAIInsights.ts`

**Problème:** 160 lignes (> 100 limite hook)

**Solution:**
```
hooks/useAIInsights.ts (< 50 lignes)
utils/insights-generators.ts (< 150 lignes)
```

**Temps:** 30 minutes

---

### 2. ⚠️ ATTENTION: Surveiller `FinancialOverviewWidget.tsx`

**Problème:** 248 lignes (proche limite 250)

**Solution:** Documenter + Préparer plan si croissance

**Temps:** 10 minutes

---

## 📊 STATISTIQUES GLOBALES

### Fichiers Dashboard
- **Total:** ~400 fichiers
- **> 300 lignes:** ~80 fichiers (20%)
- **> 500 lignes:** ~20 fichiers (5%)
- **Conformes:** ~320 fichiers (80%)

### Priorités
- **🔴 CRITIQUE:** 20 fichiers (> 500 lignes)
- **🟠 IMPORTANT:** 60 fichiers (300-500 lignes)
- **🟢 OK:** 320 fichiers (< 300 lignes)

---

## 🎯 OBJECTIF FINAL

**Tous les fichiers < 300 lignes d'ici 2 semaines**

**Bénéfices:**
- ✅ Code modulaire
- ✅ Tests faciles
- ✅ Maintenance simplifiée
- ✅ Onboarding rapide
- ✅ Bugs réduits

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Refactoriser `useAIInsights.ts` (30 min)
2. ⚠️ Documenter `FinancialOverviewWidget.tsx` (10 min)
3. 🔴 Analyser Top 20 fichiers critiques (2h)
4. 🔴 Créer plans de découpage (3h)
5. 🔴 Refactoriser par priorité (1-2 semaines)

---

**Voulez-vous que je commence par refactoriser `useAIInsights.ts` maintenant ?** 🚀
