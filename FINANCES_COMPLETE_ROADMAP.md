# 🎯 Roadmap Complète - Module Finances E-Pilot Congo

## 📊 Analyse de l'Existant

### ✅ Ce qui existe déjà

**Page Finances (Hub principal) :**
- ✅ Structure en onglets (Vue d'ensemble, Plans, Abonnements, Paiements)
- ✅ Navigation fluide
- ✅ Design cohérent

**Page Plans :**
- ✅ CRUD complet (Création, Lecture, Mise à jour, Suppression)
- ✅ Affichage en cartes avec gradients
- ✅ 4 statistiques (Total, Abonnements, Plans actifs, Groupes)
- ✅ Recherche et filtres
- ✅ Hooks React Query (`usePlans`, `usePlanStats`, `useDeletePlan`)
- ✅ Formulaire de création/édition (`PlanFormDialog`)
- ✅ Connexion à Supabase (`subscription_plans`)

**Page Abonnements :**
- ✅ Liste des abonnements avec statistiques
- ✅ Filtres (statut, plan, paiement)
- ✅ Badges de statut colorés
- ✅ Hook `useSubscriptions`
- ✅ Connexion à Supabase (`subscriptions`)

**Page Paiements :**
- ✅ Existe (à analyser)

**Page FinancialDashboard :**
- ✅ Existe (à analyser)

---

## 🚀 Plan d'Action - 5 Phases

### **Phase 1 : Analyse et Corrections** ✅ EN COURS
**Objectif :** Identifier ce qui manque et corriger les pages existantes

**Actions :**
1. ✅ Analyser la page Finances actuelle
2. ✅ Analyser la page Plans (déjà complète)
3. ⏳ Analyser la page Subscriptions
4. ⏳ Analyser la page Payments
5. ⏳ Analyser la page FinancialDashboard
6. ⏳ Identifier les connexions manquantes à Supabase

---

### **Phase 2 : Page Plans - Améliorations** 🎯
**Objectif :** Compléter et enrichir la gestion des plans

**✅ Déjà implémenté :**
- CRUD complet
- Affichage en cartes
- Statistiques
- Recherche

**🔧 À ajouter :**

#### **2.1. Historique des modifications**
```typescript
// Table SQL
CREATE TABLE plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id),
  action VARCHAR(20), -- 'created', 'updated', 'deleted'
  changes JSONB, -- Détails des changements
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Hook
export const usePlanHistory = (planId: string) => {
  return useQuery({
    queryKey: ['plan-history', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_history')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};
```

#### **2.2. Duplication de plan**
```typescript
// Bouton dans la carte de plan
<Button onClick={() => handleDuplicate(plan)}>
  <Copy className="w-4 h-4 mr-2" />
  Dupliquer
</Button>

// Fonction
const handleDuplicate = async (plan: Plan) => {
  const newPlan = {
    ...plan,
    name: `${plan.name} (Copie)`,
    slug: `${plan.slug}-copy-${Date.now()}`,
    isActive: false, // Désactivé par défaut
  };
  await createPlan.mutateAsync(newPlan);
};
```

#### **2.3. Comparaison de plans**
```typescript
// Composant ComparisonTable
<PlanComparisonTable plans={selectedPlans} />

// Affiche côte à côte :
// - Prix
// - Quotas (écoles, élèves, personnel, stockage)
// - Fonctionnalités
// - Support
```

#### **2.4. Aperçu des groupes utilisant chaque plan**
```typescript
// Dans la carte de plan
<div className="mt-4">
  <p className="text-sm text-gray-600">
    {plan.subscriptionCount} groupes utilisent ce plan
  </p>
  <Button variant="link" onClick={() => showGroupsModal(plan)}>
    Voir les groupes →
  </Button>
</div>
```

---

### **Phase 3 : Système de Notifications (80% Quota)** 🔔
**Objectif :** Alerter automatiquement quand un groupe atteint 80% d'un quota

#### **3.1. Table SQL pour notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  school_group_id UUID REFERENCES school_groups(id),
  type VARCHAR(50), -- 'quota_warning', 'quota_critical', 'payment_due', etc.
  title VARCHAR(200),
  message TEXT,
  data JSONB, -- Données supplémentaires
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

#### **3.2. Fonction de vérification automatique**
```sql
CREATE OR REPLACE FUNCTION check_quota_warnings()
RETURNS void AS $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN 
    SELECT * FROM school_groups_with_quotas
    WHERE 
      schools_usage_percent >= 80 OR
      students_usage_percent >= 80 OR
      personnel_usage_percent >= 80 OR
      storage_usage_percent >= 80
  LOOP
    -- Créer notification si pas déjà envoyée aujourd'hui
    INSERT INTO notifications (
      school_group_id,
      type,
      title,
      message,
      data
    )
    SELECT
      v_group.school_group_id,
      'quota_warning',
      'Attention : Quota bientôt atteint',
      format('Vous avez utilisé %s%% de votre quota. Pensez à passer à un plan supérieur.',
        GREATEST(
          v_group.schools_usage_percent,
          v_group.students_usage_percent,
          v_group.personnel_usage_percent,
          v_group.storage_usage_percent
        )
      ),
      jsonb_build_object(
        'schools_percent', v_group.schools_usage_percent,
        'students_percent', v_group.students_usage_percent,
        'personnel_percent', v_group.personnel_usage_percent,
        'storage_percent', v_group.storage_usage_percent
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE school_group_id = v_group.school_group_id
      AND type = 'quota_warning'
      AND created_at > NOW() - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Cron job (à configurer dans Supabase)
-- Exécuter check_quota_warnings() toutes les heures
```

#### **3.3. Hook React pour notifications**
```typescript
export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    // Rafraîchir toutes les 30 secondes
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
```

#### **3.4. Composant NotificationBell**
```typescript
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationBell = ({ userId }: { userId: string }) => {
  const { data: notifications } = useNotifications(userId);
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <button className="relative p-2 hover:bg-gray-100 rounded-lg">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#E63946]">
          {unreadCount}
        </Badge>
      )}
    </button>
  );
};
```

#### **3.5. Panel de notifications**
```typescript
<NotificationPanel>
  {notifications?.map(notif => (
    <NotificationItem
      key={notif.id}
      notification={notif}
      onRead={() => markAsRead(notif.id)}
    />
  ))}
</NotificationPanel>
```

---

### **Phase 4 : Système de Paiement Mobile Money** 💳
**Objectif :** Intégrer les paiements Mobile Money (Airtel Money, MTN Money, etc.)

#### **4.1. Table SQL pour paiements**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  school_group_id UUID REFERENCES school_groups(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  method VARCHAR(50), -- 'airtel_money', 'mtn_money', 'bank_transfer', 'cash'
  status VARCHAR(20), -- 'pending', 'completed', 'failed', 'refunded'
  transaction_id VARCHAR(100), -- ID de la transaction externe
  phone_number VARCHAR(20), -- Numéro Mobile Money
  reference VARCHAR(100), -- Référence unique
  metadata JSONB, -- Données supplémentaires
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(reference);
```

#### **4.2. API Mobile Money (exemple Airtel Money)**
```typescript
// src/lib/mobile-money.ts
export class MobileMoneyService {
  private apiUrl = process.env.AIRTEL_MONEY_API_URL;
  private apiKey = process.env.AIRTEL_MONEY_API_KEY;

  async initializePayment(params: {
    amount: number;
    phoneNumber: string;
    reference: string;
    description: string;
  }) {
    const response = await fetch(`${this.apiUrl}/merchant/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        reference: params.reference,
        subscriber: {
          country: 'CG',
          currency: 'XAF',
          msisdn: params.phoneNumber,
        },
        transaction: {
          amount: params.amount,
          country: 'CG',
          currency: 'XAF',
          id: params.reference,
        },
      }),
    });

    return response.json();
  }

  async checkPaymentStatus(transactionId: string) {
    const response = await fetch(
      `${this.apiUrl}/standard/v1/payments/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.json();
  }
}
```

#### **4.3. Hook pour paiements**
```typescript
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      subscriptionId: string;
      amount: number;
      method: string;
      phoneNumber: string;
    }) => {
      // 1. Créer le paiement dans Supabase
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          subscription_id: params.subscriptionId,
          amount: params.amount,
          method: params.method,
          phone_number: params.phoneNumber,
          status: 'pending',
          reference: `PAY-${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Initialiser le paiement Mobile Money
      if (params.method === 'airtel_money') {
        const mobileMoneyService = new MobileMoneyService();
        const result = await mobileMoneyService.initializePayment({
          amount: params.amount,
          phoneNumber: params.phoneNumber,
          reference: payment.reference,
          description: `Abonnement E-Pilot`,
        });

        // 3. Mettre à jour avec transaction_id
        await supabase
          .from('payments')
          .update({ transaction_id: result.data.transaction.id })
          .eq('id', payment.id);
      }

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
```

#### **4.4. Composant PaymentDialog**
```typescript
<Dialog open={paymentDialogOpen}>
  <DialogContent>
    <DialogTitle>Effectuer un paiement</DialogTitle>
    
    <div className="space-y-4">
      {/* Montant */}
      <div>
        <Label>Montant</Label>
        <Input value={`${amount} FCFA`} disabled />
      </div>

      {/* Méthode de paiement */}
      <div>
        <Label>Méthode de paiement</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="airtel_money">
              <div className="flex items-center gap-2">
                <img src="/airtel-logo.png" className="h-5" />
                Airtel Money
              </div>
            </SelectItem>
            <SelectItem value="mtn_money">
              <div className="flex items-center gap-2">
                <img src="/mtn-logo.png" className="h-5" />
                MTN Money
              </div>
            </SelectItem>
            <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Numéro de téléphone (si Mobile Money) */}
      {(method === 'airtel_money' || method === 'mtn_money') && (
        <div>
          <Label>Numéro de téléphone</Label>
          <Input
            placeholder="+242 06 XXX XX XX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
      )}

      {/* Bouton */}
      <Button
        onClick={handlePayment}
        className="w-full"
        disabled={isProcessing}
      >
        {isProcessing ? 'Traitement...' : 'Payer maintenant'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

### **Phase 5 : Analytics et Rapports** 📊
**Objectif :** Tableaux de bord et rapports financiers complets

#### **5.1. Vue SQL pour analytics**
```sql
CREATE OR REPLACE VIEW financial_analytics AS
SELECT
  DATE_TRUNC('month', p.created_at) AS month,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  COUNT(DISTINCT p.id) AS payment_count,
  COUNT(DISTINCT p.subscription_id) AS subscription_count,
  SUM(p.amount) AS total_revenue,
  AVG(p.amount) AS avg_payment,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) AS completed_payments,
  COUNT(CASE WHEN p.status = 'failed' THEN 1 END) AS failed_payments
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
JOIN subscription_plans sp ON s.plan_id = sp.id
GROUP BY DATE_TRUNC('month', p.created_at), sp.name, sp.slug
ORDER BY month DESC, total_revenue DESC;
```

#### **5.2. Composant RevenueChart**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const RevenueChart = () => {
  const { data } = useFinancialAnalytics();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Évolution du chiffre d'affaires</h3>
      <LineChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total_revenue" stroke="#2A9D8F" name="Revenus" />
      </LineChart>
    </Card>
  );
};
```

#### **5.3. Export PDF de rapports**
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateFinancialReport = (data: FinancialData) => {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text('Rapport Financier E-Pilot Congo', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  // Statistiques globales
  doc.setFontSize(14);
  doc.text('Statistiques Globales', 14, 45);
  
  autoTable(doc, {
    startY: 50,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Revenus totaux', `${data.totalRevenue.toLocaleString()} FCFA`],
      ['Nombre d'abonnements', data.subscriptionCount],
      ['Taux de conversion', `${data.conversionRate}%`],
      ['Panier moyen', `${data.avgBasket.toLocaleString()} FCFA`],
    ],
  });

  // Télécharger
  doc.save(`rapport-financier-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
```

---

## 📋 Checklist Complète

### Phase 1 : Analyse ✅
- [x] Analyser page Finances
- [x] Analyser page Plans
- [ ] Analyser page Subscriptions
- [ ] Analyser page Payments
- [ ] Analyser page FinancialDashboard

### Phase 2 : Page Plans 🎯
- [x] CRUD de base
- [ ] Historique des modifications
- [ ] Duplication de plan
- [ ] Comparaison de plans
- [ ] Liste des groupes par plan

### Phase 3 : Notifications 🔔
- [ ] Table SQL notifications
- [ ] Fonction check_quota_warnings
- [ ] Hook useNotifications
- [ ] Composant NotificationBell
- [ ] Panel de notifications
- [ ] Cron job Supabase

### Phase 4 : Paiements 💳
- [ ] Table SQL payments
- [ ] API Mobile Money (Airtel/MTN)
- [ ] Hook useCreatePayment
- [ ] Composant PaymentDialog
- [ ] Webhook de confirmation
- [ ] Historique des paiements

### Phase 5 : Analytics 📊
- [ ] Vue SQL financial_analytics
- [ ] Graphiques Recharts
- [ ] Export PDF (jsPDF)
- [ ] Export Excel
- [ ] Tableaux de bord KPIs
- [ ] Prévisions de revenus

---

## 🎯 Priorités

**🔴 Urgent (Semaine 1) :**
1. Compléter les connexions Supabase manquantes
2. Implémenter les notifications (Phase 3)
3. Corriger les pages existantes

**🟠 Important (Semaine 2) :**
4. Système de paiement Mobile Money (Phase 4)
5. Améliorations page Plans (Phase 2)

**🟢 Souhaitable (Semaine 3+) :**
6. Analytics et rapports (Phase 5)
7. Optimisations et tests

---

**Document créé le :** 30 Octobre 2025
**Statut :** 📝 EN COURS
**Prochaine étape :** Implémenter Phase 3 (Notifications)
