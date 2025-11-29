# 🎯 Cohérence des Données - Abonnements

**Date**: 26 Novembre 2025  
**Status**: ✅ **TOUTES LES DONNÉES SONT DYNAMIQUES**

---

## 📊 Principe de Cohérence

### Source de Vérité : `subscription_plans.price`

Tous les montants affichés dans les modales et le tableau utilisent **TOUJOURS** le prix actuel du plan (`planPrice`) provenant de la table `subscription_plans`, et **NON** le champ `amount` de la table `subscriptions` (qui peut être un prix historique ou un acompte).

**Pourquoi ?**
- Si vous changez le prix d'un plan dans "Plans & Tarification", tous les abonnements de ce plan doivent refléter le nouveau prix.
- Le champ `amount` dans `subscriptions` peut contenir un prix négocié, un acompte ou un prix historique.
- Pour la cohérence, on affiche toujours le prix actuel du plan.

---

## 🔧 Corrections Appliquées

### 1. ✅ `UpdatePaymentStatusModal` (Modifier le Statut de Paiement)

**Avant** :
```typescript
<strong>Montant :</strong> {subscription.amount ? subscription.amount.toLocaleString() : (subscription.planPrice || 0).toLocaleString()} FCFA
```

**Après** :
```typescript
<strong>Plan :</strong> {subscription.planName} • <strong>Montant :</strong> {(subscription.planPrice || 0).toLocaleString()} FCFA
```

**Ajout** :
```typescript
{subscription.billingPeriod && (
  <p className="text-blue-600 text-xs mt-1">
    Période : {subscription.billingPeriod === 'monthly' ? 'Mensuel' : subscription.billingPeriod === 'yearly' ? 'Annuel' : subscription.billingPeriod}
  </p>
)}
```

**Résultat** :
- Affiche toujours le prix actuel du plan
- Affiche la période de facturation (Mensuel/Annuel)

---

### 2. ✅ `SendReminderModal` (Envoyer une Relance)

**Code actuel** :
```typescript
Ce groupe a un paiement en retard de <span className="font-bold text-orange-700">{(subscription.planPrice || subscription.amount || 0).toLocaleString()} FCFA</span>.
```

**Résultat** :
- Utilise `planPrice` en priorité ✅
- Fallback sur `amount` si `planPrice` n'existe pas

---

### 3. ✅ `ModifyPlanModal` (Modifier le Plan)

**Code actuel** :
```typescript
const currentPrice = currentPlan?.price || subscription.planPrice || subscription.amount || 0;
```

**Résultat** :
- Utilise le prix du plan actuel depuis `availablePlans` (qui vient de `usePlans`)
- Fallback sur `subscription.planPrice` si le plan n'est pas trouvé dans `availablePlans`
- Fallback final sur `subscription.amount`

---

### 4. ✅ Tableau des Abonnements (`Subscriptions.tsx`)

**Code actuel** :
```typescript
{(subscription.planPrice === 0 || subscription.planName?.toLowerCase().includes('gratuit')) ? (
  <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">Gratuit</Badge>
) : (
  <>
    <div className="text-sm font-semibold text-gray-900">
      {(subscription.planPrice || 0).toLocaleString()} {subscription.currency || 'FCFA'}
    </div>
    <div className="text-xs text-gray-500">
      {subscription.billingPeriod === 'monthly' ? '/mois' : '/an'}
    </div>
  </>
)}
```

**Résultat** :
- Affiche "Gratuit" pour les plans gratuits
- Affiche le prix actuel du plan (`planPrice`) pour les plans payants
- Affiche la période de facturation

---

## 📋 Flux de Données Complet

### Récupération des Données (`useSubscriptions`)

```typescript
const subscriptions = (data || []).map((sub: any) => ({
  id: sub.id,
  schoolGroupId: sub.school_group_id,
  schoolGroupName: sub.school_groups?.name || 'N/A',
  schoolGroupCode: sub.school_groups?.code || '',
  planId: sub.plan_id,
  planName: sub.subscription_plans?.name || 'N/A',
  planSlug: sub.subscription_plans?.slug || '',
  planPrice: sub.subscription_plans?.price || 0, // ✅ Prix actuel du plan
  status: sub.status,
  startDate: sub.start_date,
  endDate: sub.end_date,
  autoRenew: sub.auto_renew,
  amount: sub.amount || sub.subscription_plans?.price || 0, // Prix historique ou négocié
  currency: sub.currency,
  billingPeriod: sub.subscription_plans?.billing_period || sub.billing_period, // ✅ Période du plan
  paymentMethod: sub.payment_method,
  paymentStatus: sub.payment_status,
  lastPaymentDate: sub.last_payment_date,
  nextPaymentDate: sub.next_payment_date,
  schoolsCount: schoolCountMap.get(sub.school_group_id) || 0,
  createdAt: sub.created_at,
  updatedAt: sub.updated_at,
}))
```

**Jointure SQL** :
```sql
SELECT 
  subscriptions.*,
  subscription_plans.name,
  subscription_plans.slug,
  subscription_plans.price,
  subscription_plans.billing_period,
  school_groups.name,
  school_groups.code
FROM subscriptions
INNER JOIN subscription_plans ON subscriptions.plan_id = subscription_plans.id
INNER JOIN school_groups ON subscriptions.school_group_id = school_groups.id
```

---

## 🎯 Exemple Concret

### Scénario : Abonnement "LAMARELLE" au plan "Pro"

**Données en Base** :
- `subscriptions.amount` = 25 000 FCFA (prix négocié ou historique)
- `subscription_plans.price` = 50 000 FCFA (prix actuel du plan Pro)

**Affichage dans les Modales** :
- ✅ **UpdatePaymentStatusModal** : "Plan : Pro • Montant : 50 000 FCFA"
- ✅ **ModifyPlanModal** : "Plan actuel : Pro • 50 000 FCFA"
- ✅ **SendReminderModal** : "Paiement en retard de 50 000 FCFA"
- ✅ **Tableau** : "50 000 FCFA /mois"

**Pourquoi 50 000 et pas 25 000 ?**
- Parce qu'on affiche le prix **actuel** du plan, pas le prix historique
- Si le Super Admin change le prix du plan Pro à 60 000, tous les affichages se mettront à jour automatiquement

---

## 🔄 Cas d'Usage Spéciaux

### Cas 1 : Plan Gratuit
- `planPrice` = 0
- Affichage : Badge "Gratuit" (pas de montant)

### Cas 2 : Prix Négocié
- `planPrice` = 50 000 (prix du plan)
- `amount` = 40 000 (prix négocié)
- **Affichage** : 50 000 FCFA (prix du plan actuel)
- **Note** : Si vous voulez afficher le prix négocié, il faut créer un champ `custom_price` dans `subscriptions` et l'utiliser en priorité

### Cas 3 : Changement de Prix du Plan
- **Avant** : Plan Pro = 50 000 FCFA
- **Action** : Super Admin change le prix à 60 000 FCFA
- **Après** : Tous les abonnements Pro affichent 60 000 FCFA (mise à jour automatique)

---

## 📊 Type TypeScript `Subscription`

```typescript
export interface Subscription {
  id: string;
  schoolGroupId: string;
  schoolGroupName: string;
  schoolGroupCode: string;
  planId: string;
  planName: string;
  planSlug: SubscriptionPlan;
  planPrice?: number; // ✅ Prix actuel du plan (depuis subscription_plans)
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial' | 'suspended';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  amount: number; // Prix historique ou négocié (depuis subscriptions)
  currency: 'FCFA' | 'EUR' | 'USD';
  billingPeriod: 'monthly' | 'yearly'; // ✅ Période du plan
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'card' | 'cash';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'failed';
  invoiceNumber?: string;
  notes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  schoolsCount?: number; // ✅ Nombre d'écoles dans le groupe
  createdAt: string;
  updatedAt: string;
}
```

---

## ✅ Checklist de Cohérence

- [x] `planPrice` récupéré depuis `subscription_plans.price`
- [x] `billingPeriod` récupéré depuis `subscription_plans.billing_period`
- [x] `schoolsCount` calculé dynamiquement
- [x] Toutes les modales utilisent `planPrice` en priorité
- [x] Tableau utilise `planPrice` pour l'affichage
- [x] Type `Subscription` inclut `planPrice`, `billingPeriod` et `schoolsCount`
- [x] Affichage "Gratuit" pour les plans à 0 FCFA
- [x] Période de facturation affichée (Mensuel/Annuel)

---

## 🚀 Résultat

**TOUTES les données affichées sont maintenant dynamiques et cohérentes** :
- ✅ Prix toujours à jour (source : `subscription_plans`)
- ✅ Période de facturation affichée
- ✅ Nombre d'écoles calculé dynamiquement
- ✅ Pas de données hardcodées

Si vous changez un prix de plan dans "Plans & Tarification", tous les abonnements de ce plan refléteront le nouveau prix instantanément ! 🎉
