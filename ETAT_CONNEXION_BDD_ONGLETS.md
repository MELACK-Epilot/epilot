# 📊 ÉTAT CONNEXION BDD - TOUS LES ONGLETS

## 🎯 ANALYSE COMPLÈTE

**Date** : 30 Octobre 2025, 13h50  
**Page** : Finances (5 onglets)

---

## ✅ **ONGLETS CONNECTÉS À LA BDD**

### **1. Vue d'ensemble (FinancialDashboard)** ✅ **100% CONNECTÉ**

**Hooks utilisés** :
- ✅ `useFinancialStats()` - Stats globales depuis vue SQL
- ✅ `useRevenueByPeriod(period)` - Revenus par période
- ✅ `usePlanRevenue()` - Revenus par plan
- ✅ `usePaymentStats()` - Stats paiements

**Tables/Vues** :
- ✅ `financial_stats` (vue SQL)
- ✅ `plan_stats` (vue SQL)
- ✅ `payments` (table)
- ✅ `subscriptions` (table)

**Export** :
- ✅ **FONCTIONNEL** (CSV complet)

---

### **2. Plans & Tarifs** ✅ **100% CONNECTÉ**

**Hooks utilisés** :
- ✅ `usePlans({ query })` - Liste des plans
- ✅ `usePlanStats()` - Statistiques par plan
- ✅ `useDeletePlan()` - Suppression de plan

**Tables/Vues** :
- ✅ `subscription_plans` (table)
- ✅ `plan_stats` (vue SQL)
- ✅ `subscriptions` (table)

**Export** :
- ❌ **NON IMPLÉMENTÉ**

---

### **3. Abonnements** ✅ **100% CONNECTÉ**

**Hooks utilisés** :
- ✅ `useSubscriptions({ query, status, planSlug })` - Liste abonnements

**Tables** :
- ✅ `subscriptions` (table)
- ✅ `subscription_plans` (table via JOIN)
- ✅ `school_groups` (table via JOIN)

**Export** :
- ❌ **NON IMPLÉMENTÉ**

---

### **4. Paiements** ✅ **100% CONNECTÉ**

**Hooks utilisés** :
- ✅ `usePayments({ query, status, startDate, endDate })` - Liste paiements
- ✅ `usePaymentStats()` - Statistiques paiements

**Tables** :
- ✅ `payments` (table)
- ✅ `subscriptions` (table via JOIN)

**Export** :
- ❌ **NON IMPLÉMENTÉ**

---

### **5. Dépenses** ❌ **0% CONNECTÉ (MOCK DATA)**

**Hooks utilisés** :
- ❌ **AUCUN** - Utilise `mockExpenses` (données en dur)

**Tables** :
- ❌ **AUCUNE** - Table `expenses` n'existe pas

**Export** :
- ❌ **NON IMPLÉMENTÉ**

---

## 📊 **RÉCAPITULATIF**

| Onglet | Connexion BDD | Export | Statut |
|--------|---------------|--------|--------|
| **Vue d'ensemble** | ✅ 100% | ✅ CSV | 🟢 Complet |
| **Plans** | ✅ 100% | ❌ Non | 🟡 À faire |
| **Abonnements** | ✅ 100% | ❌ Non | 🟡 À faire |
| **Paiements** | ✅ 100% | ❌ Non | 🟡 À faire |
| **Dépenses** | ❌ 0% | ❌ Non | 🔴 À créer |

**Score global** : **4/5 onglets connectés (80%)**

---

## 🔴 **PROBLÈME : ONGLET DÉPENSES**

### **État actuel** :
```typescript
// Mock data (ligne 35-66)
const mockExpenses = [
  {
    id: '1',
    amount: 500000,
    category: 'salaires',
    description: 'Salaires enseignants - Octobre 2025',
    // ...
  },
  // ...
];

const mockStats = {
  total: 725000,
  thisMonth: 725000,
  pending: 150000,
  paid: 575000,
  count: 3,
};
```

### **Ce qui manque** :

1. **Table SQL `expenses`** :
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id),
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. **Hook `useExpenses`** :
```typescript
export const useExpenses = (filters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      return data;
    }
  });
};
```

3. **Hook `useExpenseStats`** :
```typescript
export const useExpenseStats = () => {
  return useQuery({
    queryKey: ['expense-stats'],
    queryFn: async () => {
      // Calcul des stats depuis la table expenses
    }
  });
};
```

---

## 🚀 **ACTIONS REQUISES**

### **PRIORITÉ 1 : Implémenter les exports** 🔴 URGENT

#### **Plans** :
```typescript
const handleExport = () => {
  if (!plans) return;
  
  const csvData = [
    ['PLANS D\'ABONNEMENT - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [],
    ['Plan', 'Prix (FCFA)', 'Abonnements', 'Statut'],
    ...plans.map(plan => [
      plan.name,
      plan.price.toLocaleString(),
      plan.subscriptionCount || 0,
      plan.status
    ])
  ];
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plans-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

#### **Abonnements** :
```typescript
const handleExport = () => {
  if (!subscriptions) return;
  
  const csvData = [
    ['ABONNEMENTS - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [],
    ['Groupe', 'Plan', 'Statut', 'Montant', 'Début', 'Fin'],
    ...subscriptions.map(sub => [
      sub.schoolGroupName,
      sub.planName,
      sub.status,
      sub.amount.toLocaleString(),
      format(new Date(sub.startDate), 'dd/MM/yyyy'),
      format(new Date(sub.endDate), 'dd/MM/yyyy')
    ])
  ];
  
  // ... export CSV
};
```

#### **Paiements** :
```typescript
const handleExport = () => {
  if (!payments) return;
  
  const csvData = [
    ['PAIEMENTS - E-PILOT CONGO'],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [],
    ['Référence', 'Montant', 'Statut', 'Date', 'Méthode'],
    ...payments.map(payment => [
      payment.reference,
      payment.amount.toLocaleString(),
      payment.status,
      format(new Date(payment.paidAt), 'dd/MM/yyyy'),
      payment.paymentMethod
    ])
  ];
  
  // ... export CSV
};
```

---

### **PRIORITÉ 2 : Connecter l'onglet Dépenses** 🟡 IMPORTANT

#### **Étape 1 : Créer la table SQL**
```sql
-- Exécuter dans Supabase SQL Editor
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id),
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'salaires', 'fournitures', 'infrastructure', 
    'utilities', 'transport', 'marketing', 
    'formation', 'autres'
  )),
  description TEXT,
  date DATE NOT NULL,
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_expenses_school_group ON expenses(school_group_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(date);

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
```

#### **Étape 2 : Créer les hooks**
```typescript
// src/features/dashboard/hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useExpenses = (filters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*, school_groups(name)')
        .order('date', { ascending: false });
      
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};

export const useExpenseStats = () => {
  return useQuery({
    queryKey: ['expense-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, status');
      
      if (error) throw error;
      
      return {
        total: data.reduce((sum, e) => sum + e.amount, 0),
        thisMonth: data.reduce((sum, e) => sum + e.amount, 0),
        pending: data.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        paid: data.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
        count: data.length,
      };
    }
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    }
  });
};
```

#### **Étape 3 : Mettre à jour Expenses.tsx**
```typescript
// Remplacer les mock data par les hooks
const { data: expenses, isLoading } = useExpenses({ 
  category: categoryFilter, 
  status: statusFilter 
});
const { data: stats } = useExpenseStats();
const createExpense = useCreateExpense();

// Utiliser expenses au lieu de mockExpenses
const filteredExpenses = expenses?.filter(expense => {
  // ... filtres
}) || [];
```

---

## 📋 **CHECKLIST FINALE**

### **Exports** :
- [ ] Implémenter export Plans (CSV)
- [ ] Implémenter export Abonnements (CSV)
- [ ] Implémenter export Paiements (CSV)
- [ ] Implémenter export Dépenses (CSV)

### **Onglet Dépenses** :
- [ ] Créer table `expenses` dans Supabase
- [ ] Créer hook `useExpenses`
- [ ] Créer hook `useExpenseStats`
- [ ] Créer hook `useCreateExpense`
- [ ] Mettre à jour `Expenses.tsx`
- [ ] Tester CRUD complet

---

## 🎯 **RÉSUMÉ**

**État actuel** :
- ✅ 4/5 onglets connectés à la BDD (80%)
- ✅ 1/5 exports fonctionnels (20%)
- ❌ Onglet Dépenses en mock data

**Prochaines étapes** :
1. 🔴 **URGENT** : Implémenter les 4 exports manquants
2. 🟡 **IMPORTANT** : Connecter l'onglet Dépenses à la BDD

**Temps estimé** :
- Exports : 1-2 heures
- Dépenses BDD : 2-3 heures

**Prêt à implémenter !** 🚀🇨🇬

---

**FIN DU DOCUMENT** 🎊
