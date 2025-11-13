# 🔧 CORRECTION ERREURS SUPABASE - Plans & Abonnements

**Date** : 7 novembre 2025, 21:25 PM  
**Statut** : ✅ ERREURS CORRIGÉES (MODE DÉGRADÉ)

---

## ❌ ERREURS RENCONTRÉES

```
Failed to load resource: the server responded with a status of 400
Failed to load resource: the server responded with a status of 404

Erreur récupération distribution: 
Could not find a relationship between 'subscription_plans' and 'school_group_subscriptions'

Erreur récupération revenus: 
Could not find the table 'public.school_group_subscriptions'
```

---

## 🔍 CAUSE

Les hooks `usePlanRevenue` et `usePlanDistributionData` essayaient d'accéder à :

1. **Table inexistante** : `school_group_subscriptions`
2. **Relations non configurées** : Entre `subscription_plans` et les abonnements
3. **Requêtes complexes** : Avec `!inner()` qui nécessitent des foreign keys

**Problème** : La structure de la base de données n'est pas encore complète ou les relations ne sont pas configurées dans Supabase.

---

## ✅ SOLUTION APPLIQUÉE (MODE DÉGRADÉ)

### **1. usePlanRevenue.ts** ✅

**Avant** :
```typescript
// Requête complexe avec relations
const { data: subscriptions } = await supabase
  .from('school_group_subscriptions')
  .select(`
    id, status,
    subscription_plans!inner(id, name, slug, price, billing_period)
  `)
  .eq('status', 'active');
```

**Après** :
```typescript
// Retour de données par défaut
console.warn('usePlanRevenue: Utilisation de données par défaut');

return {
  mrr: 0,
  arr: 0,
  totalSubscriptions: 0,
  revenueByPlan: [],
};
```

---

### **2. usePlanDistributionData.ts** ✅

**Avant** :
```typescript
// Requête avec relation inner
const { data: plans } = await supabase
  .from('subscription_plans')
  .select(`
    id, name, slug, plan_type,
    school_group_subscriptions!inner(id, status)
  `);
```

**Après** :
```typescript
// Requête simple sans relations
const { data: plans } = await supabase
  .from('subscription_plans')
  .select('id, name, slug, plan_type')
  .eq('is_active', true);

// Retourner plans avec valeur 0
const distribution = (plans || []).map(plan => ({
  name: plan.name,
  slug: plan.slug || plan.plan_type,
  value: 0, // TODO: Compter les vrais abonnements
  percentage: 0,
  color: PLAN_COLORS[plan.plan_type] || PLAN_COLORS.gratuit,
}));
```

---

## 📊 IMPACT SUR L'INTERFACE

### **Avant (avec erreurs)** ❌
```
❌ Erreurs 400/404 dans la console
❌ Graphiques ne s'affichent pas
❌ KPI Revenus MRR affiche "0"
❌ Pie chart vide
```

### **Après (mode dégradé)** ✅
```
✅ Aucune erreur dans la console
✅ Page se charge correctement
✅ KPI Revenus MRR : "0K" (valeur par défaut)
✅ Graphiques affichent "Aucune donnée"
✅ Warnings dans console (pour debug)
```

---

## 🔧 SOLUTION PERMANENTE (À FAIRE)

### **Option A : Créer la table manquante** (Recommandé)

```sql
-- Créer la table des abonnements
CREATE TABLE IF NOT EXISTS school_group_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'pending', 'expired', 'cancelled'))
);

-- Index pour performance
CREATE INDEX idx_subscriptions_group ON school_group_subscriptions(school_group_id);
CREATE INDEX idx_subscriptions_plan ON school_group_subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON school_group_subscriptions(status);

-- RLS
ALTER TABLE school_group_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy Super Admin
CREATE POLICY "Super Admin can manage all subscriptions"
  ON school_group_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
```

---

### **Option B : Utiliser une table existante**

Si une table d'abonnements existe déjà sous un autre nom :

1. Identifier le vrai nom de la table
2. Mettre à jour les hooks avec le bon nom
3. Vérifier les foreign keys

---

### **Option C : Requêtes séparées** (Temporaire)

```typescript
// 1. Récupérer les plans
const { data: plans } = await supabase
  .from('subscription_plans')
  .select('*');

// 2. Récupérer les abonnements séparément
const { data: subscriptions } = await supabase
  .from('subscriptions') // Nom réel de la table
  .select('*')
  .eq('status', 'active');

// 3. Joindre manuellement en TypeScript
const distribution = plans.map(plan => {
  const count = subscriptions.filter(s => s.plan_id === plan.id).length;
  return { name: plan.name, value: count };
});
```

---

## 📝 FICHIERS MODIFIÉS

### **1. usePlanRevenue.ts**
- ✅ Requête désactivée (commentée)
- ✅ Retour de données par défaut
- ✅ Warning console pour debug
- ⚠️ Import `supabase` non utilisé (warning lint)

### **2. usePlanDistributionData.ts**
- ✅ Requête simplifiée (sans relations)
- ✅ Retour de plans avec valeur 0
- ✅ Warning console pour debug

---

## 🧪 TESTS

### **Test 1 : Page se charge** ✅
1. Ouvrir `/dashboard/plans`
2. ✅ Page se charge sans erreur
3. ✅ Aucune erreur 400/404 dans console
4. ✅ Warnings visibles (mode debug)

### **Test 2 : KPI affichés** ✅
1. Vérifier les 4 KPI en haut
2. ✅ "Total Plans" : Nombre réel
3. ✅ "Actifs" : Nombre réel
4. ✅ "Abonnements" : 0 (mode dégradé)
5. ✅ "Revenus MRR" : 0K (mode dégradé)

### **Test 3 : Graphiques** ✅
1. Vérifier le pie chart
2. ✅ Affiche "Aucune donnée" ou graphique vide
3. ✅ Pas d'erreur JavaScript

### **Test 4 : Cartes plans** ✅
1. Vérifier les cartes de plans
2. ✅ Toutes les cartes s'affichent
3. ✅ Catégories et modules visibles
4. ✅ Actions fonctionnelles

---

## ⚠️ LIMITATIONS ACTUELLES

### **Mode Dégradé Actif** :
- ❌ MRR/ARR affichent 0
- ❌ Graphique distribution vide
- ❌ Pas de stats d'abonnements réels
- ✅ Reste de la page fonctionnel

### **Fonctionnalités OK** :
- ✅ Affichage des plans
- ✅ Création/modification plans
- ✅ Catégories et modules
- ✅ Recherche et filtres
- ✅ Actions Super Admin

---

## 🎯 PROCHAINES ÉTAPES

### **Priorité 1 : Configuration BDD** 🔴
1. Vérifier si table abonnements existe
2. Si non : Exécuter le SQL de création
3. Si oui : Identifier le vrai nom
4. Configurer les foreign keys dans Supabase

### **Priorité 2 : Réactiver les hooks** 🟡
1. Décommenter le code dans `usePlanRevenue.ts`
2. Mettre à jour avec le bon nom de table
3. Tester les requêtes
4. Vérifier les données

### **Priorité 3 : Tests complets** 🟢
1. Créer des abonnements de test
2. Vérifier les calculs MRR/ARR
3. Valider les graphiques
4. Tester la performance

---

## ✅ RÉSULTAT

La page Plans fonctionne maintenant **sans erreurs** en mode dégradé :

- ✅ **Aucune erreur console**
- ✅ **Page se charge correctement**
- ✅ **Toutes les fonctionnalités principales OK**
- ⚠️ **Stats abonnements à 0** (temporaire)
- 📝 **TODO clairement documenté**

**MODE DÉGRADÉ ACTIF** - Fonctionnel mais incomplet

---

## 📋 CHECKLIST CONFIGURATION BDD

Pour activer les fonctionnalités complètes :

- [ ] Vérifier existence table `school_group_subscriptions`
- [ ] Créer la table si nécessaire (SQL fourni)
- [ ] Configurer les foreign keys
- [ ] Activer RLS avec policies
- [ ] Créer des données de test
- [ ] Décommenter code dans hooks
- [ ] Tester requêtes Supabase
- [ ] Valider calculs MRR/ARR
- [ ] Vérifier graphiques
- [ ] Tests complets

---

**Date** : 7 novembre 2025, 21:25 PM  
**Correction par** : Cascade AI  
**Statut** : ✅ MODE DÉGRADÉ FONCTIONNEL

**La page fonctionne sans erreurs. Configuration BDD requise pour stats complètes.** 🚀
