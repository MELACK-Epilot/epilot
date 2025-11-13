# 🗑️ GUIDE : SUPPRIMER UN ABONNEMENT

## 📋 MÉTHODES DISPONIBLES

### **Option 1 : Via l'interface (Recommandé)** ✅
- Cliquez sur **⋮** (3 points) à droite d'un abonnement
- Cliquez sur **"Supprimer"** (rouge avec icône poubelle)
- Confirmez la suppression
- L'abonnement est supprimé de la base de données

### **Option 2 : Via SQL (Manuel)**
```sql
-- Supprimer un abonnement spécifique
DELETE FROM subscriptions
WHERE id = 'uuid-de-l-abonnement';

-- Supprimer tous les abonnements d'un groupe
DELETE FROM subscriptions
WHERE school_group_id = (
  SELECT id FROM school_groups WHERE name = 'NOM_DU_GROUPE'
);
```

---

## 🔧 IMPLÉMENTATION REACT

### **Étape 1 : Hook de suppression**

Créer `src/features/dashboard/hooks/useDeleteSubscription.ts` :

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      
      toast({
        title: 'Abonnement supprimé',
        description: 'L\'abonnement a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'abonnement.',
        variant: 'destructive',
      });
    },
  });
};
```

### **Étape 2 : Handler dans Subscriptions.tsx**

Ajouter dans `src/features/dashboard/pages/Subscriptions.tsx` :

```typescript
// Import
import { useDeleteSubscription } from '../hooks/useDeleteSubscription';

// Dans le composant
const { mutate: deleteSubscription } = useDeleteSubscription();

// Handler
const handleDelete = (id: string) => {
  deleteSubscription(id);
};

// Dans le SubscriptionActionsDropdown
<SubscriptionActionsDropdown
  subscription={subscription}
  onModifyPlan={handleModifyPlan}
  onSendReminder={handleSendReminder}
  onAddNote={handleAddNote}
  onViewHistory={handleViewHistory}
  onUpdatePaymentStatus={handleUpdatePaymentStatus}
  onDelete={handleDelete}  // ✅ Ajouter cette ligne
/>
```

---

## ⚠️ CONSIDÉRATIONS IMPORTANTES

### **1. Suppression en cascade**
Si vous supprimez un abonnement, vérifiez les dépendances :
- Paiements liés (`fee_payments`)
- Historique (`subscription_history`)
- Notifications (`notifications`)

### **2. Alternative : Annuler au lieu de supprimer**
Au lieu de supprimer, vous pouvez **annuler** l'abonnement :

```sql
UPDATE subscriptions
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE id = 'uuid-de-l-abonnement';
```

**Avantages** :
- ✅ Conserve l'historique
- ✅ Traçabilité complète
- ✅ Possibilité de réactiver
- ✅ Audit trail

### **3. Soft Delete (Recommandé)**
Ajouter une colonne `deleted_at` :

```sql
-- Ajouter la colonne
ALTER TABLE subscriptions 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Soft delete
UPDATE subscriptions
SET deleted_at = NOW()
WHERE id = 'uuid-de-l-abonnement';

-- Filtrer les abonnements non supprimés
SELECT * FROM subscriptions
WHERE deleted_at IS NULL;
```

---

## 🎯 RECOMMANDATION FINALE

**Pour un système de production** :
1. ✅ **Utiliser `status = 'cancelled'`** au lieu de DELETE
2. ✅ Ajouter un audit trail (qui, quand, pourquoi)
3. ✅ Conserver l'historique des paiements
4. ✅ Envoyer une notification au groupe
5. ✅ Créer une alerte système

**Code recommandé** :
```typescript
const handleCancelSubscription = async (id: string, reason: string) => {
  // 1. Annuler l'abonnement
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', id);

  // 2. Créer un audit log
  await supabase
    .from('audit_logs')
    .insert({
      action: 'subscription_cancelled',
      entity_type: 'subscription',
      entity_id: id,
      user_id: currentUser.id,
      metadata: { reason }
    });

  // 3. Créer une alerte
  await supabase
    .from('system_alerts')
    .insert({
      type: 'subscription',
      severity: 'warning',
      title: 'Abonnement annulé',
      message: `L'abonnement a été annulé : ${reason}`,
      entity_type: 'subscription',
      entity_id: id
    });
};
```

---

## 📋 RÉSUMÉ

| **Méthode** | **Avantages** | **Inconvénients** |
|-------------|---------------|-------------------|
| DELETE SQL | Simple, rapide | ❌ Perte de données, pas d'historique |
| Status = 'cancelled' | ✅ Conserve historique, traçable | Requiert filtrage dans les requêtes |
| Soft Delete (deleted_at) | ✅ Meilleure pratique, réversible | Requiert modification du schéma |
| Via Interface | ✅ UX fluide, confirmation | Requiert implémentation React |

**Recommandation** : **Status = 'cancelled'** + **Audit trail** ✅
