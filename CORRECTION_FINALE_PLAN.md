# ✅ CORRECTION FINALE : CRÉATION DE PLAN

**Date** : 6 novembre 2025  
**Statut** : ✅ CORRIGÉ

---

## 🚨 PROBLÈME

**Erreur** : `violates foreign key constraint "plan_categories_plan_id_fkey"`

**Cause** : Le plan n'était pas créé en base de données car le champ `planType` n'était pas envoyé.

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Interface `CreatePlanInput` mise à jour**

**Fichier** : `src/features/dashboard/hooks/usePlans.ts`

```typescript
export interface CreatePlanInput {
  name: string;
  slug: string; // ✅ String libre
  planType?: SubscriptionPlan; // ✅ NOUVEAU
  description: string;
  price: number;
  currency?: 'FCFA' | 'EUR' | 'USD';
  billingPeriod: 'monthly' | 'quarterly' | 'biannual' | 'yearly'; // ✅ Étendu
  features: string[];
  maxSchools: number;
  maxStudents: number;
  maxStaff: number; // ✅ Renommé
  maxStorage: number; // ✅ Number au lieu de string
  supportLevel: 'email' | 'priority' | '24/7';
  customBranding?: boolean;
  apiAccess?: boolean;
  isPopular?: boolean;
  discount?: number;
  trialDays?: number;
}
```

---

### **2. Hook `useCreatePlan` corrigé**

**Fichier** : `src/features/dashboard/hooks/usePlans.ts`

```typescript
mutationFn: async (input: CreatePlanInput) => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({
      name: input.name,
      slug: input.slug,
      plan_type: input.planType, // ✅ AJOUTÉ
      description: input.description,
      price: input.price,
      currency: input.currency || 'FCFA',
      billing_period: input.billingPeriod, // ✅ Renommé
      features: input.features,
      max_schools: input.maxSchools,
      max_students: input.maxStudents,
      max_staff: input.maxStaff, // ✅ Renommé
      max_storage: input.maxStorage, // ✅ Renommé
      support_level: input.supportLevel,
      custom_branding: input.customBranding || false,
      api_access: input.apiAccess || false,
      is_popular: input.isPopular || false,
      discount: input.discount,
      trial_days: input.trialDays,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
},
```

---

### **3. Formulaire mis à jour**

**Fichier** : `src/features/dashboard/components/plans/PlanFormDialog.tsx`

```typescript
const input: CreatePlanInput = {
  name: values.name,
  slug: values.slug,
  planType: values.planType, // ✅ AJOUTÉ
  description: values.description,
  price: values.price,
  currency: values.currency,
  billingPeriod: values.billingPeriod,
  features: featuresArray,
  maxSchools: values.maxSchools,
  maxStudents: values.maxStudents,
  maxStaff: values.maxStaff,
  maxStorage: values.maxStorage,
  supportLevel: values.supportLevel,
  customBranding: values.customBranding,
  apiAccess: values.apiAccess,
  isPopular: values.isPopular,
  discount: values.discount,
  trialDays: values.trialDays,
};
```

---

## 🧪 TESTER MAINTENANT

1. **Rafraîchir l'application** (`F5`)
2. Aller sur `/dashboard/plans`
3. Cliquer sur **"Nouveau Plan"**
4. Remplir le formulaire :
   - **Nom** : "Plan Premium Test"
   - **Type de plan** : Premium
   - **Slug** : `plan-premium-test` (auto-généré)
   - **Description** : "Plan de test"
   - **Prix** : 50000
   - **Devise** : FCFA
   - **Période** : Mensuel
   - Sélectionner au moins 1 catégorie
   - Sélectionner au moins 1 module
5. Cliquer sur **"Créer le plan"**

**Résultat attendu** : ✅ "Plan créé avec X catégories et Y modules"

---

## 📊 VÉRIFIER EN BASE DE DONNÉES

```sql
-- Vérifier le plan créé
SELECT 
  id,
  name,
  slug,
  plan_type,
  billing_period,
  max_staff,
  max_storage,
  created_at
FROM subscription_plans
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu** :
```
name              | slug              | plan_type | billing_period
------------------|-------------------|-----------|----------------
Plan Premium Test | plan-premium-test | premium   | monthly
```

---

## ✅ RÉSULTAT

Maintenant le plan sera créé avec succès et les catégories/modules seront assignés correctement !

**Tout devrait fonctionner !** 🎉
