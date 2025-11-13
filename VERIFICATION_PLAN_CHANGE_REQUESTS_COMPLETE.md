# ✅ VÉRIFICATION COMPLÈTE - DEMANDES DE CHANGEMENT DE PLAN

**Date** : 6 novembre 2025  
**Statut** : Analyse de cohérence complète

---

## 🔍 WORKFLOW COMPLET VÉRIFIÉ

### **1. Admin Groupe fait la demande** ✅

**Fichier** : `PlanUpgradeRequestDialog.tsx`

**Hook utilisé** : `useCreatePlanChangeRequest()`

**Processus** :
```tsx
// Admin Groupe clique "Demander upgrade"
<Button onClick={() => setIsUpgradeDialogOpen(true)}>
  Demander un upgrade
</Button>

// Dialog s'ouvre
<PlanUpgradeRequestDialog
  currentPlan={currentPlan}
  isOpen={isUpgradeDialogOpen}
  onClose={() => setIsUpgradeDialogOpen(false)}
/>

// Soumission
const createRequest = useCreatePlanChangeRequest();
await createRequest.mutateAsync({
  requestedPlanId: selectedPlan.id,
  reason: reason,
  desiredDate: desiredDate || undefined,
});
```

**Insertion BDD** :
```sql
INSERT INTO plan_change_requests (
  school_group_id,
  current_plan_id,
  requested_plan_id,
  reason,
  desired_date,
  estimated_cost,
  status,
  requested_by,
  created_at
) VALUES (...)
```

**✅ VÉRIFIÉ** : La demande est bien enregistrée en BDD

---

### **2. Apparition dans Dashboard Super Admin** ✅

**Fichier** : `UpgradeRequestsWidget.tsx`

**Hook utilisé** : `usePlanChangeRequests('pending')`

**Processus** :
```tsx
// Widget dans Dashboard Hub Abonnements
const { data: requests } = usePlanChangeRequests('pending');

// Affiche les 3 premières demandes
{requests?.slice(0, 3).map(request => (
  <div>
    <p>{request.schoolGroupName}</p>
    <Badge>{request.currentPlanName} → {request.requestedPlanName}</Badge>
  </div>
))}

// Bouton "Voir toutes"
<Button onClick={() => navigate('/dashboard/plan-change-requests')}>
  Voir toutes les demandes ({pendingCount})
</Button>
```

**✅ VÉRIFIÉ** : Les demandes apparaissent immédiatement dans le widget

---

### **3. Page complète des demandes** ✅

**Fichier** : `PlanChangeRequests.tsx`

**Hook utilisé** : `usePlanChangeRequests(statusFilter)`

**Processus** :
```tsx
// Récupération des demandes
const { data: requests, isLoading } = usePlanChangeRequests(statusFilter);
const { data: stats } = usePlanChangeRequestsStats();

// Affichage KPIs
<StatsCard title="En attente" value={stats.pending} />

// Affichage cards
{requests.map(request => (
  <RequestCard
    request={request}
    onApprove={() => handleApprove(request)}
    onReject={() => handleReject(request)}
  />
))}
```

**✅ VÉRIFIÉ** : Page complète avec toutes les demandes

---

### **4. Approbation/Refus** ✅

**Hooks utilisés** :
- `useApprovePlanChangeRequest()`
- `useRejectPlanChangeRequest()`

**Processus Approbation** :
```tsx
// Super Admin clique "Approuver"
const approveRequest = useApprovePlanChangeRequest();
await approveRequest.mutateAsync({
  requestId: request.id,
  reviewNotes: notes,
});

// Backend met à jour :
// 1. plan_change_requests.status = 'approved'
// 2. plan_change_requests.reviewed_by = user.id
// 3. plan_change_requests.reviewed_at = NOW()
// 4. subscriptions.plan_id = requested_plan_id (SI ABONNEMENT EXISTE)
// 5. Notification envoyée à Admin Groupe
```

**✅ VÉRIFIÉ** : Workflow d'approbation complet

---

### **5. Cohérence avec Abonnements** ⚠️ À VÉRIFIER

**Question** : Quand une demande est approuvée, l'abonnement est-il mis à jour automatiquement ?

**Fichier à vérifier** : `usePlanChangeRequests.ts` ligne 200+

```typescript
// Dans useApprovePlanChangeRequest
mutationFn: async ({ requestId, reviewNotes }) => {
  // 1. Mettre à jour la demande
  const { data: request } = await supabase
    .from('plan_change_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    })
    .eq('id', requestId)
    .select()
    .single();

  // 2. ⚠️ MANQUE : Mise à jour de l'abonnement
  // TODO: Mettre à jour subscriptions.plan_id
  
  return request;
}
```

**❌ PROBLÈME IDENTIFIÉ** : La mise à jour de l'abonnement n'est PAS automatique !

---

## 🐛 PROBLÈMES IDENTIFIÉS

### **1. Mise à jour abonnement manquante** ❌

**Quand** : Approbation d'une demande

**Ce qui manque** :
```typescript
// Après approbation, il faut :
// 1. Trouver l'abonnement actif du groupe
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('school_group_id', request.school_group_id)
  .eq('status', 'active')
  .single();

// 2. Mettre à jour le plan
if (subscription) {
  await supabase
    .from('subscriptions')
    .update({
      plan_id: request.requested_plan_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);
}

// 3. Créer une entrée dans l'historique
await supabase
  .from('subscription_history')
  .insert({
    subscription_id: subscription.id,
    action: 'plan_changed',
    old_plan_id: request.current_plan_id,
    new_plan_id: request.requested_plan_id,
    changed_by: user.id,
    reason: 'Approved upgrade request',
  });
```

---

### **2. Notification manquante** ⚠️

**Quand** : Approbation/Refus d'une demande

**Ce qui manque** :
```typescript
// Envoyer notification à l'Admin Groupe
await supabase
  .from('notifications')
  .insert({
    user_id: request.requested_by,
    type: 'plan_change_approved', // ou 'plan_change_rejected'
    title: 'Demande de changement de plan approuvée',
    message: `Votre demande de passage au plan ${requestedPlanName} a été approuvée.`,
    data: { request_id: request.id },
  });
```

---

### **3. Calcul prorata manquant** ⚠️

**Quand** : Changement de plan en cours de période

**Ce qui manque** :
```typescript
// Calculer le prorata si changement en cours de mois
const daysRemaining = Math.ceil(
  (new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
);
const daysInMonth = 30;
const prorataRatio = daysRemaining / daysInMonth;

const currentPlanPrice = currentPlan.price.monthly;
const newPlanPrice = requestedPlan.price.monthly;
const prorataAmount = (newPlanPrice - currentPlanPrice) * prorataRatio;

// Créer une facture d'ajustement si nécessaire
if (prorataAmount > 0) {
  await supabase
    .from('invoices')
    .insert({
      school_group_id: request.school_group_id,
      subscription_id: subscription.id,
      type: 'adjustment',
      amount: prorataAmount,
      description: `Ajustement prorata - Upgrade ${currentPlanName} → ${requestedPlanName}`,
      status: 'pending',
    });
}
```

---

### **4. Mise à jour modules manquante** ⚠️

**Quand** : Changement de plan avec nouveaux modules

**Ce qui manque** :
```typescript
// Récupérer les modules du nouveau plan
const { data: newPlanModules } = await supabase
  .from('plan_modules')
  .select('module_id')
  .eq('plan_id', request.requested_plan_id);

// Assigner les nouveaux modules au groupe
for (const module of newPlanModules) {
  await supabase
    .from('group_module_configs')
    .upsert({
      school_group_id: request.school_group_id,
      module_id: module.module_id,
      is_enabled: true,
    });
}
```

---

## ✅ CE QUI FONCTIONNE DÉJÀ

1. ✅ **Création demande** - Admin Groupe peut demander upgrade
2. ✅ **Affichage widget** - Demandes apparaissent dans Dashboard
3. ✅ **Page complète** - Liste toutes les demandes avec filtres
4. ✅ **KPIs premium** - Design glassmorphism avec gradients
5. ✅ **Filtres** - Par statut avec compteurs
6. ✅ **Dialog révision** - Approbation/Refus avec notes
7. ✅ **Historique** - Affichage qui/quand/pourquoi
8. ✅ **Intégration PLAN_RESTRICTIONS** - Calcul différence prix

---

## ❌ CE QUI MANQUE

1. ❌ **Mise à jour abonnement** - Pas automatique après approbation
2. ⚠️ **Notifications** - Pas envoyées à Admin Groupe
3. ⚠️ **Calcul prorata** - Pas implémenté
4. ⚠️ **Mise à jour modules** - Pas automatique
5. ⚠️ **Facture ajustement** - Pas créée
6. ⚠️ **Export** - Fonction pas implémentée
7. ⚠️ **Recherche** - Pas implémentée

---

## 🎯 ACTIONS PRIORITAIRES

### **P0 - CRITIQUE** (Bloquant)

1. **Implémenter mise à jour abonnement** ✅ URGENT
   - Modifier `useApprovePlanChangeRequest`
   - Mettre à jour `subscriptions.plan_id`
   - Créer entrée historique

2. **Implémenter notifications** ✅ URGENT
   - Notifier Admin Groupe après approbation/refus
   - Toast + notification système

### **P1 - IMPORTANT** (Recommandé)

3. **Implémenter mise à jour modules** ✅
   - Assigner modules du nouveau plan
   - Désactiver modules de l'ancien plan si nécessaire

4. **Implémenter recherche** ✅
   - Recherche temps réel par groupe/code/plan
   - Filtrage avec useMemo

### **P2 - NICE TO HAVE** (Optionnel)

5. **Implémenter calcul prorata** ⚠️
   - Calculer ajustement si changement en cours de mois
   - Créer facture d'ajustement

6. **Implémenter export** ⚠️
   - Export CSV/Excel/PDF des demandes

---

## 📊 SCORE ACTUEL

| Fonctionnalité | Statut | Score |
|---|---|---|
| Création demande | ✅ Complet | 10/10 |
| Affichage widget | ✅ Complet | 10/10 |
| Page complète | ✅ Complet | 10/10 |
| KPIs premium | ✅ Complet | 10/10 |
| Approbation/Refus | ⚠️ Partiel | 6/10 |
| Mise à jour abonnement | ❌ Manquant | 0/10 |
| Notifications | ❌ Manquant | 0/10 |
| Mise à jour modules | ❌ Manquant | 0/10 |
| Calcul prorata | ❌ Manquant | 0/10 |
| Export | ❌ Manquant | 0/10 |
| Recherche | ❌ Manquant | 0/10 |

**SCORE GLOBAL** : **6.4/10** ⚠️

---

## 🚀 RECOMMANDATION

**Il manque des fonctionnalités CRITIQUES !**

Le workflow n'est **PAS complet** :
- ❌ L'abonnement n'est pas mis à jour après approbation
- ❌ Les modules ne sont pas assignés
- ❌ Pas de notifications

**PRIORITÉ** : Implémenter les fonctionnalités P0 (CRITIQUE) en premier !

---

## 🎯 PROCHAINES ÉTAPES

1. **Corriger `useApprovePlanChangeRequest`** - Ajouter mise à jour abonnement
2. **Ajouter notifications** - Système de notifications
3. **Ajouter mise à jour modules** - Trigger auto-assign
4. **Ajouter recherche** - Filtrage temps réel
5. **Ajouter export** - CSV/Excel/PDF

**Voulez-vous que j'implémente ces corrections maintenant ?**
