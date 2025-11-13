# ✅ POPUPS MODERNES - Restauration & Suppression de Plans

**Date** : 9 novembre 2025, 22:15  
**Fonctionnalités** : Popups modernes pour restaurer et supprimer définitivement les plans

---

## 🎯 FONCTIONNALITÉS AJOUTÉES

### **1. Popup Moderne de Restauration** ✅

**Fichier** : `src/features/dashboard/components/plans/RestorePlanDialog.tsx`

**Design** :
- ✅ **Header gradient vert** : from-[#2A9D8F] to-[#1D8A7E]
- ✅ **Cercles décoratifs animés** : Glassmorphism
- ✅ **Icône RotateCcw** : Dans un badge avec backdrop-blur
- ✅ **Informations du plan** : Badge avec nom + prix
- ✅ **Message explicatif** : Ce qui va se passer après la restauration
- ✅ **Animations** : Framer Motion (scale, opacity, spring)
- ✅ **Loading state** : Spinner rotatif pendant la restauration

**Contenu** :
```
┌────────────────────────────────────────────┐
│ 🔄 Restaurer le Plan                      │ ← Header gradient vert
│ Réactiver ce plan d'abonnement            │
├────────────────────────────────────────────┤
│                                            │
│ ℹ️ Plan à restaurer                       │
│ ┌────────────────────────────────────────┐ │
│ │ Nom : [Premium]                        │ │
│ │ Prix : 50,000 FCFA                     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ✅ Que va-t-il se passer ?                │
│ • Le plan sera réactivé immédiatement     │
│ • Il apparaîtra dans la liste des plans   │
│ • Les groupes pourront souscrire          │
│                                            │
│ Cette action peut être annulée            │
│                                            │
│ [Annuler] [🔄 Restaurer le Plan]          │
└────────────────────────────────────────────┘
```

---

### **2. Popup Moderne de Suppression Définitive** ✅

**Fichier** : `src/features/dashboard/components/plans/DeletePlanDialog.tsx`

**Design** :
- ✅ **Header gradient rouge** : from-red-500 to-red-600
- ✅ **Avertissement principal** : Badge rouge avec AlertTriangle
- ✅ **Vérification des abonnements** : Bloque si des groupes sont abonnés
- ✅ **Conséquences détaillées** : Liste des impacts
- ✅ **Confirmation par texte** : Doit taper "SUPPRIMER"
- ✅ **Bouton désactivé** : Si confirmation invalide ou abonnements actifs

**Contenu** :
```
┌────────────────────────────────────────────┐
│ 🗑️ Supprimer le Plan                      │ ← Header gradient rouge
│ Action irréversible et définitive         │
├────────────────────────────────────────────┤
│                                            │
│ ⚠️ ATTENTION : Suppression Définitive     │
│ Cette action est IRRÉVERSIBLE.            │
│ Toutes les données seront perdues.        │
│                                            │
│ Plan à supprimer                           │
│ ┌────────────────────────────────────────┐ │
│ │ Nom : [Premium Old]                    │ │
│ │ Prix : 40,000 FCFA                     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Conséquences de la suppression :          │
│ ✗ Le plan sera supprimé définitivement    │
│ ✗ Toutes les configurations perdues       │
│ ✗ Modules et catégories supprimés         │
│ ✗ Cette action ne peut pas être annulée   │
│                                            │
│ Pour confirmer, tapez SUPPRIMER :         │
│ [___________________________]              │
│                                            │
│ [Annuler] [🗑️ Supprimer Définitivement]  │
└────────────────────────────────────────────┘
```

---

### **3. Hook de Suppression Définitive** ✅

**Fichier** : `src/features/dashboard/hooks/usePlans.ts`

```typescript
/**
 * Hook pour supprimer définitivement un plan
 */
export const usePermanentDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
};
```

---

### **4. Boutons d'Action Mis à Jour** ✅

**Plans Actifs** :
```tsx
<Button onClick={() => handleEdit(plan)}>
  <Edit /> Modifier
</Button>
<Button onClick={() => handleDelete(plan)}>
  <Archive /> Archiver
</Button>
```

**Plans Archivés** :
```tsx
<Button onClick={() => handleRestore(plan)}>
  <RotateCcw /> Restaurer
</Button>
<Button onClick={() => handlePermanentDelete(plan)}>
  <Trash2 /> Supprimer
</Button>
```

---

## 🔄 WORKFLOW COMPLET

### **Scénario 1 : Restaurer un Plan**

```
1. Super Admin clique sur "Plans Archivés"
   ↓
2. Voit le plan "Premium Old" archivé
   ↓
3. Clique sur "🔄 Restaurer"
   ↓
4. Popup moderne s'ouvre avec animation
   ↓
5. Affiche :
   - Nom du plan : Premium Old
   - Prix : 40,000 FCFA
   - Ce qui va se passer
   ↓
6. Super Admin clique "Restaurer le Plan"
   ↓
7. Loading state : Spinner rotatif
   ↓
8. UPDATE subscription_plans SET is_active = true
   ↓
9. Popup se ferme avec animation
   ↓
10. Toast : "✅ Plan restauré avec succès"
    ↓
11. Plan réapparaît dans "Plans Actifs"
```

---

### **Scénario 2 : Supprimer Définitivement (Sans Abonnements)**

```
1. Super Admin clique sur "Plans Archivés"
   ↓
2. Voit le plan "Starter" archivé
   ↓
3. Clique sur "🗑️" (icône poubelle)
   ↓
4. Popup moderne s'ouvre avec animation
   ↓
5. Affiche :
   - Avertissement rouge : "Action irréversible"
   - Nom du plan : Starter
   - Prix : 25,000 FCFA
   - Conséquences détaillées
   - Champ de confirmation
   ↓
6. Super Admin tape "SUPPRIMER"
   ↓
7. Bouton "Supprimer Définitivement" s'active
   ↓
8. Super Admin clique sur le bouton
   ↓
9. Loading state : Spinner rotatif
   ↓
10. DELETE FROM subscription_plans WHERE id = ...
    ↓
11. Popup se ferme avec animation
    ↓
12. Toast : "✅ Plan supprimé définitivement"
    ↓
13. Plan disparaît complètement
```

---

### **Scénario 3 : Suppression Bloquée (Avec Abonnements)**

```
1. Super Admin clique sur "Plans Archivés"
   ↓
2. Voit le plan "Premium" archivé
   ↓
3. Clique sur "🗑️" (icône poubelle)
   ↓
4. Popup moderne s'ouvre
   ↓
5. Affiche :
   - Avertissement orange : "🚫 Suppression Bloquée"
   - Message : "3 groupe(s) scolaire(s) sont abonnés"
   - Conseil : "Désactivez ou changez leurs abonnements"
   - Bouton "Supprimer" DÉSACTIVÉ
   ↓
6. Super Admin ne peut PAS supprimer
   ↓
7. Doit d'abord :
   - Désactiver les abonnements actifs
   - OU changer les groupes vers un autre plan
```

---

## 🎨 DESIGN DÉTAILLÉ

### **Popup Restauration**

**Couleurs** :
- Header : Gradient vert `from-[#2A9D8F] to-[#1D8A7E]`
- Informations : Fond bleu `from-blue-50 to-cyan-50`
- Conséquences : Fond vert `from-green-50 to-emerald-50`
- Bouton : Gradient vert avec hover

**Animations** :
```typescript
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Dialog
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 20 }}
transition={{ type: 'spring', duration: 0.5 }}

// Loading spinner
animate={{ rotate: 360 }}
transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
```

---

### **Popup Suppression**

**Couleurs** :
- Header : Gradient rouge `from-red-500 to-red-600`
- Avertissement : Fond rouge `from-red-50 to-orange-50` + bordure `border-red-200`
- Blocage : Fond orange `from-orange-50 to-yellow-50` + bordure `border-orange-200`
- Bouton : Gradient rouge avec disabled state

**Sécurité** :
```typescript
// Vérification de la saisie
const isConfirmValid = confirmText.toLowerCase() === 'supprimer';

// Bouton désactivé si :
disabled={isLoading || !isConfirmValid || hasActiveSubscriptions}
```

---

## 📊 DONNÉES AFFICHÉES

### **Popup Restauration**

```typescript
<RestorePlanDialog
  isOpen={restoreDialogOpen}
  onClose={() => setRestoreDialogOpen(false)}
  onConfirm={confirmRestore}
  planName="Premium Old"      // ← Nom du plan
  planPrice={40000}            // ← Prix
  planCurrency="FCFA"          // ← Devise
/>
```

### **Popup Suppression**

```typescript
<DeletePlanDialog
  isOpen={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  onConfirm={confirmPermanentDelete}
  planName="Starter"                    // ← Nom du plan
  planPrice={25000}                     // ← Prix
  planCurrency="FCFA"                   // ← Devise
  hasActiveSubscriptions={false}        // ← Abonnements actifs ?
  activeSubscriptionsCount={0}          // ← Nombre d'abonnements
/>
```

---

## 🔐 SÉCURITÉ

### **Vérifications**

1. ✅ **Rôle Super Admin** : Seul le Super Admin voit les boutons
2. ✅ **Confirmation par texte** : Doit taper "SUPPRIMER"
3. ✅ **Vérification des abonnements** : Bloque si des groupes sont abonnés
4. ✅ **Double confirmation** : Popup + saisie de texte
5. ✅ **RLS** : Row Level Security sur `subscription_plans`

### **Requête SQL - Vérification**

```sql
-- Vérifier les abonnements actifs
SELECT COUNT(*) as count
FROM school_group_subscriptions
WHERE plan_id = 'plan-premium'
  AND status = 'active';
```

**Si count > 0** → Suppression bloquée

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### **Nouveaux Composants**
1. ✅ `src/features/dashboard/components/plans/RestorePlanDialog.tsx`
2. ✅ `src/features/dashboard/components/plans/DeletePlanDialog.tsx`

### **Hooks Modifiés**
3. ✅ `src/features/dashboard/hooks/usePlans.ts`
   - Ajout de `usePermanentDeletePlan()`

### **Pages Modifiées**
4. ✅ `src/features/dashboard/pages/Plans.tsx`
   - Imports des dialogs
   - États pour gérer l'ouverture
   - Fonctions `handleRestore()` et `handlePermanentDelete()`
   - Fonctions `confirmRestore()` et `confirmPermanentDelete()`
   - Boutons mis à jour dans les cartes
   - Dialogs ajoutés à la fin du composant

---

## 🎯 RÉSUMÉ DES FONCTIONNALITÉS

### **✅ Popup Restauration**

1. ✅ **Design moderne** : Gradient vert, glassmorphism, animations
2. ✅ **Informations claires** : Nom, prix, conséquences
3. ✅ **Loading state** : Spinner rotatif
4. ✅ **Fermeture** : Clic sur backdrop ou bouton X
5. ✅ **Toast de confirmation** : "Plan restauré avec succès"

### **✅ Popup Suppression**

1. ✅ **Design d'avertissement** : Gradient rouge, messages d'alerte
2. ✅ **Vérification des abonnements** : Bloque si des groupes sont abonnés
3. ✅ **Confirmation par texte** : Doit taper "SUPPRIMER"
4. ✅ **Conséquences détaillées** : Liste des impacts
5. ✅ **Loading state** : Spinner rotatif
6. ✅ **Toast de confirmation** : "Plan supprimé définitivement"

### **✅ Boutons d'Action**

1. ✅ **Plans actifs** : Modifier + Archiver
2. ✅ **Plans archivés** : Restaurer + Supprimer définitivement
3. ✅ **Icônes claires** : RotateCcw (restaurer), Trash2 (supprimer)
4. ✅ **Couleurs distinctes** : Vert (restaurer), Rouge (supprimer)

---

## 🚀 RÉSULTAT FINAL

**Avant** :
- ❌ Confirmation native `confirm()` peu esthétique
- ❌ Pas de suppression définitive
- ❌ Pas d'informations détaillées

**Après** :
- ✅ **Popups modernes** avec design premium
- ✅ **Animations fluides** (Framer Motion)
- ✅ **Informations détaillées** sur le plan
- ✅ **Sécurité renforcée** (confirmation par texte)
- ✅ **Vérification des abonnements** avant suppression
- ✅ **Loading states** pendant les opérations
- ✅ **Suppression définitive** disponible
- ✅ **UX professionnelle** niveau mondial

**Les popups modernes sont maintenant opérationnels !** 🎉
