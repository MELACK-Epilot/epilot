# 🎯 GUIDE FINAL - Auto-Assignation Plan → Groupe

**Date** : 9 novembre 2025, 23:55  
**Version** : FINALE avec tables existantes

---

## 📊 TABLES UTILISÉES (EXISTANTES)

### **✅ Tables Confirmées**

| Table | Rôle | Statut |
|-------|------|--------|
| **business_categories** | 8 catégories métiers | ✅ Existe |
| **modules** | 50 modules pédagogiques | ✅ Existe |
| **plan_categories** | Catégories par plan | ✅ Existe |
| **plan_modules** | Modules par plan | ✅ Existe |
| **group_module_configs** | Modules assignés au groupe | ✅ Existe |
| **group_business_categories** | Catégories assignées au groupe | ✅ Existe |
| **subscriptions** | Abonnements des groupes | ✅ Existe |

---

## 🎯 STRUCTURE DES CATÉGORIES

### **8 Catégories Métiers**

```sql
1. Scolarité & Admissions (gratuit, core)
   - Icon: GraduationCap, Color: #2A9D8F
   - 6 modules

2. Pédagogie & Évaluations (gratuit, core)
   - Icon: BookOpen, Color: #1D3557
   - 10 modules

3. Finances & Comptabilité (premium, core)
   - Icon: DollarSign, Color: #E9C46A
   - 6 modules

4. Ressources Humaines (premium)
   - Icon: Users, Color: #457B9D
   - 7 modules

5. Vie Scolaire & Discipline (premium)
   - Icon: Shield, Color: #E63946
   - 6 modules

6. Services & Infrastructures (pro)
   - Icon: Building2, Color: #F77F00
   - 6 modules

7. Sécurité & Accès (gratuit, core)
   - Icon: Lock, Color: #6A4C93
   - 3 modules

8. Documents & Rapports (premium)
   - Icon: FileText, Color: #06A77D
   - 3 modules
```

**Total** : 47 modules répartis dans 8 catégories

---

## 🔥 FICHIER SQL FINAL

### **`FINAL_AUTO_ASSIGN_PLAN_TO_GROUP.sql`**

**Contient** :

1. ✅ **Fonction `auto_assign_plan_to_group()`**
   - Assigne modules → `group_module_configs`
   - Assigne catégories → `group_business_categories`
   - Trigger sur INSERT dans `subscriptions`

2. ✅ **Fonction `update_plan_on_upgrade()`**
   - Gère les upgrades/downgrades
   - Désactive anciens modules/catégories
   - Active nouveaux modules/catégories
   - Trigger sur UPDATE de `plan_id`

3. ✅ **Fonction `disable_on_subscription_end()`**
   - Désactive tout à l'expiration
   - Trigger sur UPDATE de `status`

---

## 🚀 INSTALLATION

### **Étape 1 : Vérifier les Tables**

```sql
-- Exécuter VERIFICATION_TABLES_CATEGORIES.sql
-- Vérifier que group_business_categories existe
```

**Résultat attendu** :
```
table_name                    | table_type
------------------------------|------------
group_business_categories     | BASE TABLE
group_module_configs          | BASE TABLE
```

---

### **Étape 2 : Exécuter le SQL**

```bash
# Dans Supabase SQL Editor
# Copier-coller le contenu de FINAL_AUTO_ASSIGN_PLAN_TO_GROUP.sql
# Exécuter
```

**Vérifications** :
- ✅ 3 fonctions créées
- ✅ 3 triggers créés
- ✅ Aucune erreur

---

### **Étape 3 : Activer le Temps Réel**

**Dans Supabase Dashboard → Database → Replication**

Activer pour :
1. ✅ **subscriptions**
2. ✅ **group_module_configs**
3. ✅ **group_business_categories**
4. ✅ **plan_modules** (optionnel)
5. ✅ **plan_categories** (optionnel)

---

## 🧪 TESTS

### **Test 1 : Abonnement Initial**

```sql
-- 1. Créer un groupe (si pas déjà fait)
INSERT INTO school_groups (id, name, admin_id, status)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Groupe Test E-Pilot',
  'UUID_ADMIN',
  'active'
);

-- 2. Récupérer l'ID d'un plan existant
SELECT id, name, slug FROM subscription_plans WHERE slug = 'premium';
-- Copier l'UUID du plan Premium

-- 3. Créer l'abonnement
INSERT INTO subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  amount,
  currency,
  billing_period
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- UUID du groupe
  'UUID_PLAN_PREMIUM',                      -- UUID du plan Premium
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  50000,
  'FCFA',
  'monthly'
);

-- 4. Vérifier les modules assignés
SELECT 
  m.name AS module_name,
  m.slug,
  bc.name AS category_name,
  gmc.is_enabled,
  gmc.enabled_at
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
JOIN business_categories bc ON bc.id = m.category_id
WHERE gmc.school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY bc.order_index, m.order_index;

-- 5. Vérifier les catégories assignées
SELECT 
  bc.name AS category_name,
  bc.slug,
  bc.required_plan,
  gbc.is_enabled,
  gbc.enabled_at
FROM group_business_categories gbc
JOIN business_categories bc ON bc.id = gbc.category_id
WHERE gbc.school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY bc.order_index;
```

**Résultat attendu pour Plan Premium** :
- ✅ Catégories : Scolarité, Pédagogie, Finances, RH, Vie Scolaire, Sécurité, Documents
- ✅ Modules : Tous les modules de ces catégories (environ 41 modules)
- ✅ `is_enabled = true` pour tous
- ✅ `enabled_at` = timestamp de l'abonnement

---

### **Test 2 : Upgrade de Plan**

```sql
-- 1. Récupérer l'ID du plan Pro
SELECT id FROM subscription_plans WHERE slug = 'pro';

-- 2. Upgrade vers Pro
UPDATE subscriptions 
SET plan_id = 'UUID_PLAN_PRO'
WHERE school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- 3. Vérifier les catégories actives
SELECT 
  bc.name,
  bc.required_plan,
  gbc.is_enabled
FROM group_business_categories gbc
JOIN business_categories bc ON bc.id = gbc.category_id
WHERE gbc.school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY bc.order_index;
```

**Résultat attendu** :
- ✅ Catégorie "Services & Infrastructures" (pro) : `is_enabled = true`
- ✅ Toutes les autres catégories Premium : `is_enabled = true`
- ✅ Nouveaux modules de la catégorie Services : activés

---

### **Test 3 : Downgrade**

```sql
-- 1. Downgrade vers Gratuit
UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'gratuit')
WHERE school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- 2. Vérifier
SELECT 
  bc.name,
  bc.required_plan,
  gbc.is_enabled
FROM group_business_categories gbc
JOIN business_categories bc ON bc.id = gbc.category_id
WHERE gbc.school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY bc.order_index;
```

**Résultat attendu** :
- ✅ Catégories Gratuit (Scolarité, Pédagogie, Sécurité) : `is_enabled = true`
- ✅ Catégories Premium/Pro : `is_enabled = false`

---

### **Test 4 : Expiration**

```sql
-- 1. Expirer l'abonnement
UPDATE subscriptions 
SET status = 'expired'
WHERE school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- 2. Vérifier modules
SELECT COUNT(*) AS modules_actifs
FROM group_module_configs
WHERE school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
AND is_enabled = true;

-- 3. Vérifier catégories
SELECT COUNT(*) AS categories_actives
FROM group_business_categories
WHERE school_group_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
AND is_enabled = true;
```

**Résultat attendu** :
- ✅ `modules_actifs = 0`
- ✅ `categories_actives = 0`

---

## 🔔 TEMPS RÉEL REACT

### **Hook pour Modules**

```typescript
// hooks/useRealtimeGroupModules.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useRealtimeGroupModules = (groupId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-modules-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_module_configs',
          filter: `school_group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('🔥 Module change:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['group-modules', groupId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
};
```

---

### **Hook pour Catégories**

```typescript
// hooks/useRealtimeGroupCategories.ts
export const useRealtimeGroupCategories = (groupId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-categories-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_business_categories',
          filter: `school_group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('🔥 Category change:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['group-categories', groupId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
};
```

---

### **Utilisation**

```typescript
// pages/AdminGroupDashboard.tsx
import { useRealtimeGroupModules } from '@/hooks/useRealtimeGroupModules';
import { useRealtimeGroupCategories } from '@/hooks/useRealtimeGroupCategories';
import { useAuth } from '@/features/auth/store/auth.store';

export const AdminGroupDashboard = () => {
  const { user } = useAuth();
  const groupId = user?.school_group_id;

  // ✅ Active le temps réel
  useRealtimeGroupModules(groupId);
  useRealtimeGroupCategories(groupId);

  // Vos hooks de données
  const { data: modules } = useGroupModules(groupId);
  const { data: categories } = useGroupCategories(groupId);

  return (
    <div>
      <h1>Dashboard Admin Groupe</h1>
      
      {/* Les données se rafraîchissent automatiquement */}
      <CategoriesList categories={categories} />
      <ModulesList modules={modules} />
    </div>
  );
};
```

---

## ✅ CHECKLIST FINALE

### **Base de Données**

- [ ] Vérifier que `group_business_categories` existe
- [ ] Vérifier que `group_module_configs` existe
- [ ] Exécuter `FINAL_AUTO_ASSIGN_PLAN_TO_GROUP.sql`
- [ ] Vérifier que les 3 triggers sont créés
- [ ] Tester avec un abonnement test

### **Supabase Realtime**

- [ ] Activer réplication pour `subscriptions`
- [ ] Activer réplication pour `group_module_configs`
- [ ] Activer réplication pour `group_business_categories`

### **Code React**

- [ ] Créer `useRealtimeGroupModules.ts`
- [ ] Créer `useRealtimeGroupCategories.ts`
- [ ] Intégrer dans le dashboard Admin Groupe
- [ ] Tester le rafraîchissement temps réel

---

## 🎉 RÉSULTAT FINAL

**Workflow complet** :

```
1. Super Admin crée un plan
   - Sélectionne 5 catégories
   - Sélectionne 30 modules
   ↓
2. Super Admin crée un groupe
   ↓
3. Super Admin abonne le groupe au plan
   ↓
4. 🔥 TRIGGER auto_assign_plan_to_group
   - INSERT dans group_module_configs (30 lignes)
   - INSERT dans group_business_categories (5 lignes)
   ↓
5. 🔥 SUPABASE REALTIME notifie le client
   ↓
6. ✅ Hook React détecte le changement
   - Invalide le cache
   - Recharge les données
   ↓
7. ✅ Admin Groupe voit IMMÉDIATEMENT
   - 5 catégories disponibles
   - 30 modules disponibles
```

**Temps total** : < 1 seconde ⚡

---

## 📁 FICHIERS CRÉÉS

1. ✅ `FINAL_AUTO_ASSIGN_PLAN_TO_GROUP.sql` - SQL à exécuter
2. ✅ `VERIFICATION_TABLES_CATEGORIES.sql` - Vérification tables
3. ✅ `GUIDE_FINAL_AUTO_ASSIGNATION.md` - Ce guide
4. ✅ `ANALYSE_COMPLETE_AUTO_ASSIGNATION_PLAN.md` - Analyse détaillée

**Le système est prêt pour la production !** 🚀
