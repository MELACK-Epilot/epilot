# 🔧 Plan de Refactoring - Dashboard Proviseur

## 📊 Situation Actuelle
- **Fichier** : `DirectorDashboardOptimized.tsx`
- **Taille** : 930 lignes
- **Problème** : Trop long, difficile à maintenir

---

## 🎯 Objectif
Découper en composants modulaires de **< 200 lignes** chacun

---

## 📁 Nouvelle Structure

```
src/features/user-space/
├── pages/
│   └── DirectorDashboardOptimized.tsx (150 lignes) ← Orchestrateur
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx (100 lignes) ✅ CRÉÉ
│   │   ├── KPICard.tsx (60 lignes) ✅ CRÉÉ
│   │   ├── NiveauSection.tsx (150 lignes) 🔨 À CRÉER
│   │   ├── GlobalKPIsSection.tsx (100 lignes) 🔨 À CRÉER
│   │   └── EmptyState.tsx (80 lignes) 🔨 À CRÉER
│   │
│   ├── AlertSystem.tsx (358 lignes) ✅ EXISTE
│   ├── TrendChart.tsx ✅ EXISTE
│   ├── TemporalComparison.tsx ✅ EXISTE
│   ├── TemporalFilters.tsx ✅ EXISTE
│   └── NiveauDetailModal.tsx ✅ EXISTE
│
└── hooks/
    └── useDirectorDashboard.ts ✅ EXISTE
```

---

## 🔨 Composants à Créer

### 1. DashboardHeader.tsx ✅ CRÉÉ
**Responsabilité** : Header avec infos utilisateur et date  
**Taille** : ~100 lignes  
**Props** : Aucune (utilise useCurrentUser)

### 2. KPICard.tsx ✅ CRÉÉ
**Responsabilité** : Carte KPI individuelle  
**Taille** : ~60 lignes  
**Props** : title, value, icon, trend, gradient, iconBg, iconColor

### 3. NiveauSection.tsx 🔨 À CRÉER
**Responsabilité** : Section d'un niveau scolaire (Maternelle, Primaire, etc.)  
**Taille** : ~150 lignes  
**Props** : niveau, onNiveauClick

**Contenu** :
- Titre du niveau avec couleur
- 4 KPI cards (Élèves, Classes, Enseignants, Taux)
- Bouton "Voir détails"

### 4. GlobalKPIsSection.tsx 🔨 À CRÉER
**Responsabilité** : Section KPIs globaux de l'école  
**Taille** : ~100 lignes  
**Props** : kpiGlobaux

**Contenu** :
- Titre "Vue d'Ensemble"
- 6 KPI cards (Total élèves, classes, enseignants, taux, revenus, croissance)

### 5. EmptyState.tsx 🔨 À CRÉER
**Responsabilité** : État vide quand pas de niveaux  
**Taille** : ~80 lignes  
**Props** : onRefresh, onClearCache

**Contenu** :
- Message "Aucun niveau actif"
- Boutons Rafraîchir et Vider Cache
- Instructions

---

## 📝 Fichier Principal Refactorisé

### DirectorDashboardOptimized.tsx (150 lignes)

```typescript
import { memo, useMemo, useState } from 'react';
import { useDirectorDashboard } from '../hooks/useDirectorDashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { GlobalKPIsSection } from '../components/dashboard/GlobalKPIsSection';
import { NiveauSection } from '../components/dashboard/NiveauSection';
import { EmptyState } from '../components/dashboard/EmptyState';
import AlertSystem from '../components/AlertSystem';
import TrendChart from '../components/TrendChart';
import TemporalComparison from '../components/TemporalComparison';
import TemporalFilters from '../components/TemporalFilters';
import NiveauDetailModal from '../components/NiveauDetailModal';

export const DirectorDashboardOptimized = memo(() => {
  // Hook données
  const {
    schoolLevels,
    globalKPIs,
    trendData: realTrendData,
    isLoading,
    error,
    refreshData
  } = useDirectorDashboard();

  // États locaux
  const [selectedNiveau, setSelectedNiveau] = useState(null);
  const [isNiveauModalOpen, setIsNiveauModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedRange, setSelectedRange] = useState('2025-11');
  const [comparisonType, setComparisonType] = useState('previous');

  // Transformations données
  const niveauxEducatifs = useMemo(() => 
    schoolLevels.map(niveau => ({
      id: niveau.id,
      nom: niveau.name,
      couleur: niveau.color,
      icone: getIconComponent(niveau.icon),
      kpis: {
        eleves: niveau.students_count,
        classes: niveau.classes_count,
        enseignants: niveau.teachers_count,
        taux_reussite: niveau.success_rate,
        revenus: niveau.revenue,
        trend: niveau.trend
      }
    })), 
  [schoolLevels]);

  const kpiGlobaux = useMemo(() => ({
    eleves: globalKPIs.totalStudents,
    classes: globalKPIs.totalClasses,
    enseignants: globalKPIs.totalTeachers,
    taux_reussite: globalKPIs.averageSuccessRate,
    revenus: globalKPIs.totalRevenue
  }), [globalKPIs]);

  const trendData = useMemo(() => 
    realTrendData.map(data => ({
      period: data.period,
      eleves: data.students,
      taux_reussite: data.success_rate,
      revenus: data.revenue,
      enseignants: data.teachers
    })), [realTrendData]);

  // Handlers
  const handleNiveauClick = (niveau) => {
    setSelectedNiveau(niveau);
    setIsNiveauModalOpen(true);
  };

  const handleClearCache = () => {
    localStorage.removeItem('e-pilot-auth');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-refresh-token');
    window.location.reload();
  };

  // Rendu
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        <DashboardHeader />

        {niveauxEducatifs.length === 0 ? (
          <EmptyState 
            onRefresh={refreshData}
            onClearCache={handleClearCache}
          />
        ) : (
          <>
            <GlobalKPIsSection kpiGlobaux={kpiGlobaux} />

            {niveauxEducatifs.map(niveau => (
              <NiveauSection
                key={niveau.id}
                niveau={niveau}
                onNiveauClick={handleNiveauClick}
              />
            ))}

            <TemporalFilters
              selectedPeriod={selectedPeriod}
              selectedRange={selectedRange}
              onPeriodChange={setSelectedPeriod}
              onRangeChange={setSelectedRange}
              onRefresh={refreshData}
              onExport={() => {}}
            />

            <AlertSystem
              kpiData={kpiGlobaux}
              niveauxData={niveauxEducatifs}
              onDismissAlert={() => {}}
            />

            <TrendChart
              data={trendData}
              title="Évolution des Indicateurs Clés"
              period={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />

            <TemporalComparison
              currentPeriod={currentPeriodData}
              previousPeriod={previousPeriodData}
              comparisonType={comparisonType}
              onComparisonTypeChange={setComparisonType}
            />
          </>
        )}

        <NiveauDetailModal
          niveau={selectedNiveau}
          isOpen={isNiveauModalOpen}
          onClose={() => setIsNiveauModalOpen(false)}
        />
      </div>
    </div>
  );
});
```

---

## 🎯 Avantages du Refactoring

### Avant (930 lignes)
- ❌ Difficile à lire
- ❌ Difficile à maintenir
- ❌ Difficile à tester
- ❌ Réutilisation impossible

### Après (5 fichiers < 200 lignes)
- ✅ Facile à lire
- ✅ Facile à maintenir
- ✅ Facile à tester
- ✅ Composants réutilisables
- ✅ Séparation des responsabilités

---

## 📋 Plan d'Action

### Étape 1 : Créer Composants ✅ EN COURS
```
✅ DashboardHeader.tsx (100 lignes)
✅ KPICard.tsx (60 lignes)
🔨 NiveauSection.tsx (150 lignes)
🔨 GlobalKPIsSection.tsx (100 lignes)
🔨 EmptyState.tsx (80 lignes)
```

### Étape 2 : Refactoriser Fichier Principal
```
🔨 Importer nouveaux composants
🔨 Simplifier logique
🔨 Garder seulement orchestration
```

### Étape 3 : Tester
```
🔨 Vérifier que tout fonctionne
🔨 Tester tous les scénarios
🔨 Corriger bugs
```

### Étape 4 : Commit
```
🔨 git commit -m "refactor: split dashboard into modular components"
```

---

## ⏱️ Temps Estimé
- Créer composants : 1h
- Refactoriser principal : 30min
- Tester : 30min
- **TOTAL : 2h**

---

**Date** : 16 novembre 2025  
**Statut** : 🔨 EN COURS  
**Progression** : 2/5 composants créés
