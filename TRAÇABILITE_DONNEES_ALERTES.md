# 🔍 Traçabilité des Données - Alertes & Recommandations

## 📊 Flux Complet des Données

### Vue d'Ensemble

```
Supabase (Tables)
    ↓
useDirectorDashboard (Hook)
    ↓
DirectorDashboardOptimized (Page)
    ↓
AlertSystem (Composant)
    ↓
Alertes affichées
```

---

## 🗄️ Étape 1 : Sources de Données (Supabase)

### Tables Utilisées

#### 1. `students` (Élèves)
```sql
SELECT COUNT(*) 
FROM students 
WHERE school_id = 'xxx' 
AND status = 'active'
AND level = 'primaire';
```
**Résultat** : Nombre d'élèves par niveau

#### 2. `classes` (Classes)
```sql
SELECT COUNT(*) 
FROM classes 
WHERE school_id = 'xxx' 
AND level ILIKE '%primaire%';
```
**Résultat** : Nombre de classes par niveau

#### 3. `users` (Enseignants)
```sql
SELECT COUNT(*) 
FROM users 
WHERE school_id = 'xxx' 
AND role = 'enseignant' 
AND status = 'active';
```
**Résultat** : Nombre d'enseignants

#### 4. `grades` (Notes)
```sql
SELECT AVG(grade) 
FROM grades 
WHERE student_id IN (SELECT id FROM students WHERE school_id = 'xxx');
```
**Résultat** : Moyenne des notes → Taux de réussite

#### 5. `fee_payments` (Paiements)
```sql
SELECT SUM(amount) 
FROM fee_payments 
WHERE school_id = 'xxx' 
AND status IN ('paid', 'completed');
```
**Résultat** : Revenus totaux

---

## ⚙️ Étape 2 : Hook `useDirectorDashboard`

### Fichier : `useDirectorDashboard.ts`

#### A. Chargement des Niveaux Scolaires

**Fonction** : `loadSchoolLevels()`  
**Fichier** : `dashboard/loadSchoolLevels.ts`

```typescript
// Pour chaque niveau actif (Maternelle, Primaire, Collège, Lycée)
const schoolLevels = [
  {
    id: 'primaire',
    name: 'Primaire',
    students_count: 0,      // ← Table students
    classes_count: 0,       // ← Table classes
    teachers_count: 0,      // ← Table users
    success_rate: 0,        // ← Tables grades/report_cards
    revenue: 0,             // ← Table fee_payments
    trend: 'stable'         // ← Comparaison avec mois dernier
  },
  // ... autres niveaux
];
```

**Source** : 100% Supabase

---

#### B. Calcul des KPIs Globaux

**Fonction** : `loadGlobalKPIs(schoolLevels)`  
**Ligne** : 263-310

```typescript
const loadGlobalKPIs = async (schoolLevels) => {
  // 1. Additionner les données de tous les niveaux
  const totals = schoolLevels.reduce((acc, level) => ({
    totalStudents: acc.totalStudents + level.students_count,    // ✅ RÉEL
    totalClasses: acc.totalClasses + level.classes_count,       // ✅ RÉEL
    totalTeachers: acc.totalTeachers + level.teachers_count,    // ✅ RÉEL
    totalRevenue: acc.totalRevenue + level.revenue,             // ✅ RÉEL
  }), { totalStudents: 0, totalClasses: 0, totalTeachers: 0, totalRevenue: 0 });

  // 2. Calculer la moyenne des taux de réussite
  const averageSuccessRate = schoolLevels.length > 0
    ? Math.round(
        schoolLevels.reduce((sum, level) => sum + level.success_rate, 0) 
        / schoolLevels.length
      )
    : 0;  // ✅ RÉEL

  // 3. Calculer la croissance mensuelle
  const { count: lastMonthTotal } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .lt('created_at', currentMonth);  // ✅ RÉEL

  const monthlyGrowth = lastMonthTotal > 0
    ? Math.round(((totals.totalStudents - lastMonthTotal) / lastMonthTotal) * 100)
    : 0;  // ✅ RÉEL

  return {
    totalStudents,        // ✅ RÉEL
    totalClasses,         // ✅ RÉEL
    totalTeachers,        // ✅ RÉEL
    totalRevenue,         // ✅ RÉEL
    averageSuccessRate,   // ✅ RÉEL
    monthlyGrowth         // ✅ RÉEL
  };
};
```

**Source** : 100% calculé depuis `schoolLevels` (qui vient de Supabase)

---

## 🎨 Étape 3 : Page `DirectorDashboardOptimized`

### Fichier : `DirectorDashboardOptimized.tsx`

#### A. Récupération des Données du Hook

**Ligne** : 503-511

```typescript
const {
  schoolLevels,      // ← Données réelles de loadSchoolLevels()
  globalKPIs,        // ← Données réelles de loadGlobalKPIs()
  trendData,         // ← Données réelles de loadTrendData()
  isLoading,
  error,
  refreshData
} = useDirectorDashboard();
```

---

#### B. Transformation pour AlertSystem

**Ligne** : 549-555

```typescript
const kpiGlobaux = useMemo(() => ({
  eleves: globalKPIs.totalStudents,           // ✅ RÉEL
  classes: globalKPIs.totalClasses,           // ✅ RÉEL
  enseignants: globalKPIs.totalTeachers,      // ✅ RÉEL
  taux_reussite: globalKPIs.averageSuccessRate, // ✅ RÉEL
  revenus: globalKPIs.totalRevenue            // ✅ RÉEL
}), [globalKPIs]);
```

**Source** : Simple renommage des propriétés, données identiques

---

#### C. Transformation des Niveaux

**Ligne** : 523-546

```typescript
const niveauxEducatifs = useMemo(() => 
  schoolLevels.map(niveau => ({
    id: niveau.id,
    nom: niveau.name,
    couleur: niveau.color,
    icone: getIconComponent(niveau.icon),
    kpis: {
      eleves: niveau.students_count,          // ✅ RÉEL
      classes: niveau.classes_count,          // ✅ RÉEL
      enseignants: niveau.teachers_count,     // ✅ RÉEL
      taux_reussite: niveau.success_rate,     // ✅ RÉEL
      revenus: niveau.revenue,                // ✅ RÉEL
      trend: niveau.trend                     // ✅ RÉEL
    }
  })), 
[schoolLevels]);
```

**Source** : Simple transformation de format, données identiques

---

#### D. Passage au Composant AlertSystem

**Ligne** : 903-907

```typescript
<AlertSystem
  kpiData={kpiGlobaux}           // ✅ RÉEL
  niveauxData={niveauxEducatifs} // ✅ RÉEL
  onDismissAlert={handleDismissAlert}
/>
```

---

## 🔔 Étape 4 : Composant `AlertSystem`

### Fichier : `AlertSystem.tsx`

#### A. Réception des Props

**Ligne** : 40-60

```typescript
interface AlertSystemProps {
  kpiData: {
    eleves: number;           // ✅ RÉEL depuis globalKPIs.totalStudents
    taux_reussite: number;    // ✅ RÉEL depuis globalKPIs.averageSuccessRate
    revenus: number;          // ✅ RÉEL depuis globalKPIs.totalRevenue
    enseignants: number;      // ✅ RÉEL depuis globalKPIs.totalTeachers
  };
  niveauxData: Array<{
    id: string;
    nom: string;
    kpis: {
      eleves: number;         // ✅ RÉEL depuis niveau.students_count
      taux_reussite: number;  // ✅ RÉEL depuis niveau.success_rate
      revenus: number;        // ✅ RÉEL depuis niveau.revenue
      enseignants: number;    // ✅ RÉEL depuis niveau.teachers_count
      trend: 'up' | 'down' | 'stable';  // ✅ RÉEL
    };
  }>;
}
```

---

#### B. Génération des Alertes

**Ligne** : 70-200

```typescript
const alerts = useMemo((): Alert[] => {
  const generatedAlerts: Alert[] = [];

  // ✅ Alerte basée sur les VRAIES données
  if (kpiData.taux_reussite < 75) {
    generatedAlerts.push({
      type: 'warning',
      title: 'Taux de réussite global en baisse',
      message: `Le taux de réussite global est de ${kpiData.taux_reussite}%`,
      // ↑ Utilise la vraie valeur depuis Supabase
      value: kpiData.taux_reussite,
      threshold: 75,
      suggestions: [
        'Organiser des séances de soutien scolaire',
        'Analyser les matières en difficulté',
        'Renforcer l\'accompagnement pédagogique'
      ]
    });
  }

  // ✅ Alerte par niveau
  niveauxData.forEach(niveau => {
    if (niveau.kpis.taux_reussite < 70) {
      generatedAlerts.push({
        type: 'error',
        title: `${niveau.nom} : Résultats préoccupants`,
        message: `Taux de réussite de ${niveau.kpis.taux_reussite}%`,
        // ↑ Utilise la vraie valeur du niveau depuis Supabase
        niveau: niveau.nom,
        value: niveau.kpis.taux_reussite
      });
    }
  });

  return generatedAlerts;
}, [kpiData, niveauxData]);
```

**Source** : 100% basé sur les props (qui viennent de Supabase)

---

## 📊 Schéma Complet de Traçabilité

```
┌─────────────────────────────────────────────────┐
│ SUPABASE (Base de Données)                     │
├─────────────────────────────────────────────────┤
│ • students (élèves)                             │
│ • classes (classes)                             │
│ • users (enseignants)                           │
│ • grades (notes)                                │
│ • fee_payments (paiements)                      │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│ loadSchoolLevels() - Module                    │
├─────────────────────────────────────────────────┤
│ Récupère pour chaque niveau:                   │
│ • students_count (COUNT students)               │
│ • classes_count (COUNT classes)                 │
│ • teachers_count (COUNT users)                  │
│ • success_rate (AVG grades)                     │
│ • revenue (SUM fee_payments)                    │
│ • trend (comparaison mois)                      │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│ loadGlobalKPIs(schoolLevels) - Fonction        │
├─────────────────────────────────────────────────┤
│ Calcule:                                        │
│ • totalStudents (SUM students_count)            │
│ • totalClasses (SUM classes_count)              │
│ • totalTeachers (SUM teachers_count)            │
│ • averageSuccessRate (AVG success_rate)         │
│ • totalRevenue (SUM revenue)                    │
│ • monthlyGrowth (comparaison mois)              │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│ useDirectorDashboard() - Hook                  │
├─────────────────────────────────────────────────┤
│ Retourne:                                       │
│ • schoolLevels (données par niveau)             │
│ • globalKPIs (données globales)                 │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│ DirectorDashboardOptimized - Page              │
├─────────────────────────────────────────────────┤
│ Transforme:                                     │
│ • globalKPIs → kpiGlobaux                       │
│ • schoolLevels → niveauxEducatifs               │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│ AlertSystem - Composant                         │
├─────────────────────────────────────────────────┤
│ Analyse:                                        │
│ • kpiData.taux_reussite < 75 ? → Alerte        │
│ • niveau.kpis.taux_reussite < 70 ? → Alerte    │
│ • kpiData.eleves < seuil ? → Alerte            │
│                                                  │
│ Génère:                                         │
│ • Alertes contextuelles                         │
│ • Recommandations                               │
│ • Suggestions d'actions                         │
└─────────────────────────────────────────────────┘
```

---

## ✅ Conclusion

### Toutes les Données sont RÉELLES

| Donnée | Source Finale | Tables Supabase |
|--------|---------------|-----------------|
| `kpiData.eleves` | `globalKPIs.totalStudents` | `students` |
| `kpiData.classes` | `globalKPIs.totalClasses` | `classes` |
| `kpiData.enseignants` | `globalKPIs.totalTeachers` | `users` |
| `kpiData.taux_reussite` | `globalKPIs.averageSuccessRate` | `grades`, `report_cards` |
| `kpiData.revenus` | `globalKPIs.totalRevenue` | `fee_payments` |
| `niveauxData[].kpis.*` | `schoolLevels[].xxx_count` | Toutes les tables ci-dessus |

**Résultat** : **100% des données des alertes proviennent de Supabase** ! 🎉

---

## 🔍 Vérification

Pour vérifier la traçabilité, suivez les logs dans la console :

```javascript
// 1. Chargement des niveaux
🔄 Chargement dashboard pour école: 427cf3b6-9087-4d47-b699-1e0861042aba
🏫 Niveaux actifs de l'école: { has_preschool: true, has_primary: true, has_middle: true }
✅ 3 niveau(x) actif(s): Maternelle, Primaire, Collège

// 2. Calcul des KPIs par niveau
📊 Taux réussite Maternelle: 0% (0 notes)
📊 Taux réussite Primaire: 0% (0 notes)
📊 Taux réussite Collège: 0% (0 notes)

// 3. KPIs globaux calculés
✅ Niveaux chargés: 3
📊 KPIs Globaux: { totalStudents: 0, averageSuccessRate: 0, ... }

// 4. Alertes générées
⚠️ Alerte: Taux de réussite global en baisse (0%)
```

**Chaque valeur est traçable jusqu'à sa table Supabase d'origine ! ✅**

---

**Date** : 15 novembre 2025  
**Version** : 3.2.0 - Traçabilité Complète  
**Statut** : 📊 DOCUMENTÉ
