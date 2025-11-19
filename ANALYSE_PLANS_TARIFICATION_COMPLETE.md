# 📋 ANALYSE COMPLÈTE - PAGE PLANS & TARIFICATION

**Date:** 19 novembre 2025  
**Page:** `PlansUltimate.tsx`  
**Rôle:** Super Admin E-Pilot  
**Contexte:** Gestion des plans d'abonnement pour 500+ groupes scolaires

---

## 🎯 1. CONTEXTE MÉTIER

### Hiérarchie E-Pilot
```
SUPER ADMIN (Plateforme)
    ↓ crée
Plans d'Abonnement (Gratuit → Institutionnel)
    ↓ souscrivent
ADMIN DE GROUPE (500+ groupes)
    ↓ limités par
Modules & Catégories du Plan
```

### Objectif de la Page
- Créer/Modifier/Supprimer des plans
- Assigner modules/catégories aux plans
- Visualiser statistiques et revenus
- Optimiser les plans (IA)

---

## 🔍 2. ANALYSE DU CODE ACTUEL

### Fichier Principal
**`PlansUltimate.tsx`** (610 lignes)

#### ✅ Points Positifs
1. **Design moderne** avec Framer Motion
2. **Recherche** fonctionnelle
3. **Cartes de plans** bien structurées
4. **Permissions** Super Admin vérifiées
5. **Export** des plans disponible

#### ❌ Problèmes Critiques

##### A. INCOHÉRENCE BD - Champs Manquants/Incorrects

**Problème 1:** Mapping BD incorrect
```typescript
// ❌ Code actuel (ligne 404)
/{plan.billingPeriod === 'yearly' ? 'an' : 'mois'}

// ✅ BD réelle
billing_period VARCHAR (snake_case)
```

**Problème 2:** Champs utilisés mais non définis
```typescript
// ❌ Ligne 428-430
{ icon: Users, label: 'Élèves', value: plan.maxStudents }
{ icon: HardDrive, label: 'Stockage', value: `${plan.maxStorage} GB` }

// ⚠️ BD a: max_students, max_storage (snake_case)
```

##### B. COMPOSANTS INCOMPLETS/MANQUANTS

**Ligne 238-241:**
```typescript
// ❌ Composants référencés mais probablement vides
{activeTab === 'analytics' ? (
  <PlanAnalyticsDashboard />  // ⚠️ Incomplet
) : activeTab === 'optimization' ? (
  <PlanOptimizationEngine />  // ⚠️ Incomplet
) : activeTab === 'comparison' ? (
  <ModernPlanComparison />    // ⚠️ Incomplet
```

##### C. FONCTIONNALITÉS MANQUANTES

**1. Gestion des Abonnements Actifs**
```sql
-- Table existe mais pas utilisée
subscriptions (
  id UUID,
  school_group_id UUID,
  plan_id UUID,
  status VARCHAR,  -- active, cancelled, expired
  start_date DATE,
  end_date DATE
)
```

**Impact:** Impossible de voir quels groupes utilisent quel plan!

**2. Statistiques Réelles**
```typescript
// ❌ Stats basiques actuelles
const { data: stats } = usePlanStats();
// Retourne: { active, total, subscriptions }

// ✅ Stats business manquantes:
// - MRR (Monthly Recurring Revenue)
// - Churn rate
// - LTV (Lifetime Value)
// - Conversion rate
// - Revenue par plan
```

**3. Gestion Changements de Plan**
```sql
-- Table existe mais pas utilisée
plan_change_requests (
  id UUID,
  school_group_id UUID,
  current_plan_id UUID,
  requested_plan_id UUID,
  status VARCHAR,  -- pending, approved, rejected
  requested_by UUID,
  reviewed_by UUID
)
```

**Impact:** Admins de groupe ne peuvent pas demander changement de plan!

---

## 🔧 3. CORRECTIONS PRIORITAIRES

### PRIORITÉ 1: Fixer Mapping BD

#### Fichier: `src/features/dashboard/types/dashboard.types.ts`

**Créer interface correcte:**
```typescript
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: 'FCFA' | 'EUR' | 'USD';
  
  // ✅ Utiliser snake_case comme en BD
  billing_cycle: 'monthly' | 'quarterly' | 'biannual' | 'yearly';
  billing_period: 'monthly' | 'quarterly' | 'biannual' | 'yearly'; // Alias
  
  duration: number;
  discount: number | null;
  trial_days: number | null;
  
  // Limites
  max_schools: number;
  max_students: number;
  max_personnel: number;
  max_staff: number;  // Alias
  storage_limit: string;
  max_storage: number;  // En GB
  
  // Features
  features: string[];
  category_ids: string[];
  module_ids: string[];
  
  // Options
  support_level: 'email' | 'priority' | '24/7';
  custom_branding: boolean;
  api_access: boolean;
  
  // Status
  is_active: boolean;
  is_popular: boolean;
  status: 'active' | 'archived' | 'draft';
  
  // Type
  plan_type: 'gratuit' | 'premium' | 'pro' | 'institutionnel';
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
```

### PRIORITÉ 2: Hook Abonnements Actifs

#### Fichier: `src/features/dashboard/hooks/usePlanSubscriptions.ts`

```typescript
/**
 * Hook pour gérer les abonnements actifs par plan
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanSubscription {
  id: string;
  school_group_id: string;
  school_group_name: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
}

export interface PlanSubscriptionStats {
  total: number;
  active: number;
  trial: number;
  cancelled: number;
  expired: number;
  mrr: number;  // Monthly Recurring Revenue
  arr: number;  // Annual Recurring Revenue
}

/**
 * Récupère tous les abonnements pour un plan
 */
export const usePlanSubscriptions = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-subscriptions', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          school_group_id,
          school_groups (
            name
          ),
          plan_id,
          subscription_plans (
            name,
            price,
            currency,
            billing_period
          ),
          status,
          start_date,
          end_date,
          auto_renew,
          created_at
        `)
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((sub: any) => ({
        id: sub.id,
        school_group_id: sub.school_group_id,
        school_group_name: sub.school_groups?.name || 'N/A',
        plan_id: sub.plan_id,
        plan_name: sub.subscription_plans?.name || 'N/A',
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        auto_renew: sub.auto_renew,
        created_at: sub.created_at,
      })) as PlanSubscription[];
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
};

/**
 * Récupère les statistiques d'abonnements pour un plan
 */
export const usePlanSubscriptionStats = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-subscription-stats', planId],
    queryFn: async () => {
      if (!planId) return null;

      // Récupérer tous les abonnements
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          subscription_plans (
            price,
            billing_period
          )
        `)
        .eq('plan_id', planId);

      if (subsError) throw subsError;

      // Calculer les stats
      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trial = subscriptions?.filter(s => s.status === 'trial').length || 0;
      const cancelled = subscriptions?.filter(s => s.status === 'cancelled').length || 0;
      const expired = subscriptions?.filter(s => s.status === 'expired').length || 0;

      // Calculer MRR (Monthly Recurring Revenue)
      const mrr = subscriptions
        ?.filter(s => s.status === 'active')
        .reduce((sum, sub: any) => {
          const price = sub.subscription_plans?.price || 0;
          const period = sub.subscription_plans?.billing_period || 'monthly';
          
          // Normaliser en MRR
          const monthlyPrice = period === 'yearly' ? price / 12 :
                              period === 'quarterly' ? price / 3 :
                              period === 'biannual' ? price / 6 :
                              price;
          
          return sum + monthlyPrice;
        }, 0) || 0;

      const arr = mrr * 12;

      return {
        total,
        active,
        trial,
        cancelled,
        expired,
        mrr: Math.round(mrr),
        arr: Math.round(arr),
      } as PlanSubscriptionStats;
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Récupère tous les abonnements actifs (tous plans)
 */
export const useAllActiveSubscriptions = () => {
  return useQuery({
    queryKey: ['all-active-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          school_group_id,
          school_groups (
            name
          ),
          plan_id,
          subscription_plans (
            name,
            slug,
            price,
            currency
          ),
          status,
          start_date,
          end_date,
          created_at
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((sub: any) => ({
        id: sub.id,
        school_group_id: sub.school_group_id,
        school_group_name: sub.school_groups?.name || 'N/A',
        plan_id: sub.plan_id,
        plan_name: sub.subscription_plans?.name || 'N/A',
        plan_slug: sub.subscription_plans?.slug || 'N/A',
        price: sub.subscription_plans?.price || 0,
        currency: sub.subscription_plans?.currency || 'FCFA',
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        created_at: sub.created_at,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
};
```

### PRIORITÉ 3: Composant Abonnements Actifs

#### Fichier: `src/features/dashboard/components/plans/PlanSubscriptionsPanel.tsx`

```typescript
/**
 * Panneau affichant les abonnements actifs pour un plan
 */

import { Users, TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanSubscriptions, usePlanSubscriptionStats } from '../../hooks/usePlanSubscriptions';
import { formatDate } from '@/lib/utils';

interface PlanSubscriptionsPanelProps {
  planId: string;
  planName: string;
}

export const PlanSubscriptionsPanel = ({ planId, planName }: PlanSubscriptionsPanelProps) => {
  const { data: subscriptions, isLoading } = usePlanSubscriptions(planId);
  const { data: stats } = usePlanSubscriptionStats(planId);

  if (isLoading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats?.active || 0}</div>
              <div className="text-xs text-slate-500">Abonnements actifs</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {((stats?.mrr || 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-slate-500">MRR (FCFA)</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats?.trial || 0}</div>
              <div className="text-xs text-slate-500">En essai</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats?.cancelled || 0}</div>
              <div className="text-xs text-slate-500">Annulés</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des abonnements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Groupes Scolaires Abonnés ({subscriptions?.length || 0})
        </h3>

        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {sub.school_group_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{sub.school_group_name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>Depuis le {formatDate(sub.start_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      sub.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : sub.status === 'trial'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : sub.status === 'cancelled'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }
                  >
                    {sub.status === 'active' ? '✓ Actif' :
                     sub.status === 'trial' ? '⚡ Essai' :
                     sub.status === 'cancelled' ? '✕ Annulé' :
                     '○ Expiré'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500">Aucun abonnement actif pour ce plan</div>
          </div>
        )}
      </Card>
    </div>
  );
};
```

---

## 📊 4. SUITE DE L'ANALYSE

Le fichier est trop long. Je continue dans un second fichier...
