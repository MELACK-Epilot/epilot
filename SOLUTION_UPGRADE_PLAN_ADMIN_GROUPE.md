# 🎯 Solution : Upgrade de plan pour Admin Groupe

**Problème** : Admin Groupe voit "Accès refusé" sur la page Plans (réservée au Super Admin)  
**Contexte** : Bouton "Mettre à niveau" sur la page Modules

---

## 📋 Analyse du problème

### Situation actuelle

```
Page Modules (Admin Groupe)
├── Bouton "Mettre à niveau" ✅
└── Redirige vers /dashboard/plans ❌
    └── Accès refusé (Super Admin uniquement)
```

**Message d'erreur** :
```
Accès refusé
Vous n'avez pas les permissions nécessaires pour accéder à cette page.
Rôle requis: Super Admin
Votre rôle: Admin Groupe
```

---

## 🎯 Meilleures pratiques mondiales

### 1. **SaaS B2B Standard** (Recommandé ✅)

**Exemples** : Slack, Microsoft 365, Google Workspace, Notion

**Workflow** :
```
Admin Groupe clique "Mettre à niveau"
    ↓
Modal/Page dédiée "Demande d'upgrade"
    ↓
Formulaire de demande
    ├── Plan souhaité
    ├── Raison du changement
    ├── Budget estimé
    └── Date souhaitée
    ↓
Notification au Super Admin
    ↓
Super Admin approuve/refuse
    ↓
Notification à l'Admin Groupe
```

**Avantages** :
- ✅ Contrôle centralisé (Super Admin)
- ✅ Traçabilité des demandes
- ✅ Workflow clair
- ✅ Pas de changement non autorisé

---

### 2. **Self-Service avec validation** (Moderne)

**Exemples** : Stripe, Shopify, Salesforce

**Workflow** :
```
Admin Groupe clique "Mettre à niveau"
    ↓
Page comparaison des plans
    ↓
Sélection du nouveau plan
    ↓
Simulation du coût
    ↓
Demande d'approbation envoyée
    ↓
Super Admin reçoit notification
    ↓
Validation → Changement automatique
```

**Avantages** :
- ✅ UX fluide
- ✅ Transparence des prix
- ✅ Simulation en temps réel
- ✅ Validation finale par Super Admin

---

### 3. **Contact direct** (Simple mais moins optimal)

**Exemples** : Petites plateformes

**Workflow** :
```
Admin Groupe clique "Mettre à niveau"
    ↓
Modal "Contactez l'administrateur"
    ├── Email du Super Admin
    ├── Formulaire de contact
    └── Bouton "Envoyer la demande"
    ↓
Email envoyé au Super Admin
    ↓
Traitement manuel
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Pas de workflow complexe

**Inconvénients** :
- ❌ Pas de traçabilité
- ❌ Processus manuel
- ❌ Pas de suivi

---

## 🏆 Solution recommandée : Hybride (Best of Both)

### Workflow complet

```
┌─────────────────────────────────────────────────────────┐
│  Page "Mes Modules" (Admin Groupe)                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Plan actuel : Premium                             │ │
│  │ [🚀 Mettre à niveau]                              │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓ Clic
┌─────────────────────────────────────────────────────────┐
│  Modal "Demande de changement de plan"                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 📊 Comparaison des plans                          │ │
│  │                                                    │ │
│  │ Actuel : Premium (50 000 FCFA/mois)              │ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │ │ Premium  │ │   Pro    │ │ Institut │          │ │
│  │ │ 50K FCFA │ │ 100K FCFA│ │ 200K FCFA│          │ │
│  │ │ Actuel ✓ │ │ [Choisir]│ │ [Choisir]│          │ │
│  │ └──────────┘ └──────────┘ └──────────┘          │ │
│  │                                                    │ │
│  │ ✨ Avantages du plan Pro :                        │ │
│  │ • +50 modules supplémentaires                     │ │
│  │ • Support prioritaire 24/7                        │ │
│  │ • API complète                                    │ │
│  │                                                    │ │
│  │ 📝 Raison du changement (optionnel)              │ │
│  │ [Besoin de plus de modules pour...]              │ │
│  │                                                    │ │
│  │ 📅 Date souhaitée : [01/12/2025]                 │ │
│  │                                                    │ │
│  │ [Annuler] [📤 Envoyer la demande]                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓ Envoi
┌─────────────────────────────────────────────────────────┐
│  Notification au Super Admin                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🔔 Nouvelle demande de changement de plan        │ │
│  │                                                    │ │
│  │ Groupe : Complexe Scolaire Saint-Joseph          │ │
│  │ Demandeur : Jean Dupont (Admin Groupe)           │ │
│  │ Plan actuel : Premium (50K FCFA/mois)            │ │
│  │ Plan souhaité : Pro (100K FCFA/mois)             │ │
│  │ Raison : Besoin de plus de modules               │ │
│  │ Date souhaitée : 01/12/2025                      │ │
│  │                                                    │ │
│  │ [❌ Refuser] [✅ Approuver]                       │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓ Approbation
┌─────────────────────────────────────────────────────────┐
│  Notification à l'Admin Groupe                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ✅ Demande approuvée !                            │ │
│  │                                                    │ │
│  │ Votre demande de passage au plan Pro a été       │ │
│  │ approuvée par le Super Admin.                     │ │
│  │                                                    │ │
│  │ Changement effectif : 01/12/2025                 │ │
│  │ Nouveau tarif : 100 000 FCFA/mois                │ │
│  │                                                    │ │
│  │ [Voir les détails]                                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Implémentation technique

### 1. Créer une table `plan_change_requests`

```sql
CREATE TABLE plan_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id) NOT NULL,
  requested_by UUID REFERENCES users(id) NOT NULL,
  current_plan_id UUID REFERENCES plans(id) NOT NULL,
  requested_plan_id UUID REFERENCES plans(id) NOT NULL,
  reason TEXT,
  desired_date DATE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Créer le composant `PlanUpgradeRequestDialog`

```tsx
// src/features/dashboard/components/plans/PlanUpgradeRequestDialog.tsx

interface PlanUpgradeRequestDialogProps {
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    price: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const PlanUpgradeRequestDialog = ({ 
  currentPlan, 
  isOpen, 
  onClose 
}: PlanUpgradeRequestDialogProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  
  const { data: availablePlans } = usePlans();
  const createRequest = useCreatePlanChangeRequest();
  
  const handleSubmit = async () => {
    if (!selectedPlan) return;
    
    try {
      await createRequest.mutateAsync({
        requestedPlanId: selectedPlan,
        reason,
        desiredDate,
      });
      
      toast.success('Demande envoyée !', {
        description: 'Le Super Admin a été notifié de votre demande.',
      });
      
      onClose();
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible d\'envoyer la demande.',
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Demande de changement de plan</DialogTitle>
          <DialogDescription>
            Sélectionnez le plan souhaité et envoyez votre demande au Super Admin
          </DialogDescription>
        </DialogHeader>
        
        {/* Comparaison des plans */}
        <div className="grid grid-cols-3 gap-4">
          {availablePlans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              isCurrent={plan.id === currentPlan.id}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </div>
        
        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <Label>Raison du changement (optionnel)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Besoin de plus de modules pour nos nouvelles écoles..."
            />
          </div>
          
          <div>
            <Label>Date souhaitée</Label>
            <Input
              type="date"
              value={desiredDate}
              onChange={(e) => setDesiredDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlan || createRequest.isPending}
          >
            {createRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer la demande
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### 3. Modifier le bouton "Mettre à niveau"

```tsx
// src/features/dashboard/pages/MyGroupModules.tsx

const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

// Au lieu de navigate('/dashboard/plans')
<Button
  onClick={() => setIsUpgradeDialogOpen(true)}  // ← Ouvrir le dialog
  variant="outline"
  className="border-purple-300 text-purple-700 hover:bg-purple-50"
>
  <TrendingUp className="h-4 w-4 mr-2" />
  Mettre à niveau
</Button>

{/* Dialog de demande */}
<PlanUpgradeRequestDialog
  currentPlan={currentGroup.plan}
  isOpen={isUpgradeDialogOpen}
  onClose={() => setIsUpgradeDialogOpen(false)}
/>
```

---

### 4. Page de gestion pour le Super Admin

```tsx
// src/features/dashboard/pages/PlanChangeRequests.tsx

export const PlanChangeRequests = () => {
  const { data: requests } = usePlanChangeRequests();
  const approveRequest = useApprovePlanChangeRequest();
  const rejectRequest = useRejectPlanChangeRequest();
  
  return (
    <div className="space-y-6 p-6">
      <h1>Demandes de changement de plan</h1>
      
      {requests?.map((request) => (
        <Card key={request.id} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3>{request.schoolGroupName}</h3>
              <p>Demandeur : {request.requestedBy.name}</p>
              <p>Plan actuel : {request.currentPlan.name}</p>
              <p>Plan souhaité : {request.requestedPlan.name}</p>
              <p>Raison : {request.reason}</p>
              <p>Date souhaitée : {request.desiredDate}</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => rejectRequest.mutate(request.id)}
              >
                Refuser
              </Button>
              <Button
                onClick={() => approveRequest.mutate(request.id)}
              >
                Approuver
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

---

## 📧 Notifications

### Email au Super Admin (demande)

```
Objet : Nouvelle demande de changement de plan

Bonjour,

Le groupe scolaire "Complexe Scolaire Saint-Joseph" souhaite changer de plan.

Détails de la demande :
- Demandeur : Jean Dupont (Admin Groupe)
- Plan actuel : Premium (50 000 FCFA/mois)
- Plan souhaité : Pro (100 000 FCFA/mois)
- Raison : Besoin de plus de modules pour nos nouvelles écoles
- Date souhaitée : 01/12/2025

[Voir la demande] [Approuver] [Refuser]
```

### Email à l'Admin Groupe (approbation)

```
Objet : Demande de changement de plan approuvée ✅

Bonjour Jean,

Bonne nouvelle ! Votre demande de passage au plan Pro a été approuvée.

Détails :
- Nouveau plan : Pro
- Nouveau tarif : 100 000 FCFA/mois
- Date d'activation : 01/12/2025
- Modules supplémentaires : +50 modules
- Support : Prioritaire 24/7

[Voir les détails du nouveau plan]
```

---

## 🎯 Avantages de cette solution

### Pour l'Admin Groupe
- ✅ Processus clair et guidé
- ✅ Comparaison visuelle des plans
- ✅ Transparence des prix
- ✅ Suivi de la demande
- ✅ Notifications automatiques

### Pour le Super Admin
- ✅ Contrôle total
- ✅ Traçabilité complète
- ✅ Validation centralisée
- ✅ Historique des demandes
- ✅ Workflow automatisé

### Pour la plateforme
- ✅ Processus standardisé
- ✅ Données structurées
- ✅ Analytics possibles
- ✅ Scalable
- ✅ Conforme aux best practices SaaS

---

## 📊 Tableau de bord des demandes

```
┌─────────────────────────────────────────────────────────┐
│  Demandes de changement de plan                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🟡 En attente (3)  ✅ Approuvées (12)  ❌ Refusées│ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🟡 Complexe Saint-Joseph                              │
│     Premium → Pro | 01/12/2025 | Jean Dupont          │
│     [Approuver] [Refuser]                              │
│                                                         │
│  🟡 École Moderne                                      │
│     Gratuit → Premium | 15/12/2025 | Marie Martin     │
│     [Approuver] [Refuser]                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines étapes

1. ✅ Créer la table `plan_change_requests`
2. ✅ Créer le composant `PlanUpgradeRequestDialog`
3. ✅ Modifier le bouton "Mettre à niveau"
4. ✅ Créer la page de gestion pour Super Admin
5. ✅ Implémenter les notifications
6. ✅ Tester le workflow complet

---

**Cette solution combine les meilleures pratiques SaaS avec un workflow adapté au contexte éducatif congolais !** 🎓✨
