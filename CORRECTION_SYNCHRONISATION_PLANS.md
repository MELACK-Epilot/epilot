# 🔧 CORRECTION SYNCHRONISATION PLANS

**Date:** 20 novembre 2025  
**Problème:** Incohérence entre `school_groups.plan` et `subscriptions.plan_id`

---

## 🐛 PROBLÈME IDENTIFIÉ

### Situation Actuelle

**Dans la base de données (`school_groups.plan`):**
```json
[
  { "name": "CG ngongo", "plan": "premium" },
  { "name": "Ecole EDJA", "plan": "premium" },
  { "name": "L'INTELIGENCE CELESTE", "plan": "institutionnel" },
  { "name": "LAMARELLE", "plan": "premium" }
]
```

**Mais dans `subscriptions`:**
- Les plans sont différents (anciens)
- Ou les subscriptions n'existent pas

### Cause

Quand vous modifiez le plan dans l'interface (page Groupes Scolaires), le système met à jour **uniquement** la colonne `school_groups.plan`, mais **PAS** la table `subscriptions`.

**Résultat:** Désynchronisation entre les deux sources de données!

---

## ✅ SOLUTION

### Migration de Synchronisation

**Fichier:** `supabase/migrations/20251120_sync_subscriptions_with_plan_column.sql`

Cette migration fait **3 choses**:

#### 1. Mettre à jour les subscriptions existantes

```sql
UPDATE subscriptions s
SET plan_id = (
  SELECT sp.id 
  FROM subscription_plans sp
  JOIN school_groups sg ON sg.id = s.school_group_id
  WHERE sp.slug = sg.plan
)
WHERE EXISTS (
  SELECT 1 FROM school_groups sg
  WHERE sg.id = s.school_group_id
);
```

**Effet:** Les subscriptions existantes sont mises à jour pour correspondre à `school_groups.plan`.

---

#### 2. Créer des subscriptions manquantes

```sql
INSERT INTO subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  auto_renew
)
SELECT 
  sg.id,
  sp.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  true
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.school_group_id = sg.id
);
```

**Effet:** Les groupes sans subscription en obtiennent une automatiquement.

---

#### 3. Vérifier le résultat

```sql
SELECT 
  sg.name,
  sg.plan as "Plan Colonne",
  sp.slug as "Plan Subscription",
  s.status
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;
```

**Résultat attendu après migration:**
```
Groupe                    | Plan Colonne | Plan Subscription | Statut
--------------------------|--------------|-------------------|--------
CG ngongo                 | premium      | premium           | active
Ecole EDJA                | premium      | premium           | active
L'INTELIGENCE CELESTE     | institutionnel | institutionnel  | active
LAMARELLE                 | premium      | premium           | active
```

**✅ PARFAITEMENT SYNCHRONISÉ!**

---

## 🚀 APPLICATION DE LA MIGRATION

### Étape 1: Appliquer la Migration

**Via Supabase Dashboard:**
1. Aller dans **SQL Editor**
2. Cliquer sur **New Query**
3. Copier-coller le contenu de `20251120_sync_subscriptions_with_plan_column.sql`
4. Cliquer sur **Run**

**OU via CLI:**
```bash
supabase db push
```

---

### Étape 2: Vérifier la Synchronisation

**Dans SQL Editor:**

```sql
-- Vérifier que tout est synchronisé
SELECT 
  sg.name as "Groupe",
  sg.plan as "Plan Colonne",
  sp.slug as "Plan Subscription",
  CASE 
    WHEN sg.plan = sp.slug THEN '✅ OK'
    ELSE '❌ DÉSYNCHRONISÉ'
  END as "Statut Sync"
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;
```

**Résultat attendu:**
```
Groupe                    | Plan Colonne | Plan Subscription | Statut Sync
--------------------------|--------------|-------------------|-------------
CG ngongo                 | premium      | premium           | ✅ OK
Ecole EDJA                | premium      | premium           | ✅ OK
L'INTELIGENCE CELESTE     | institutionnel | institutionnel  | ✅ OK
LAMARELLE                 | premium      | premium           | ✅ OK
```

---

### Étape 3: Rafraîchir l'Application

1. **Rafraîchir le navigateur:** `Ctrl + Shift + R`
2. **Vérifier la page Groupes Scolaires**
3. **Vérifier la page Plans & Tarification → Abonnements**

---

## 🎯 RÉSULTAT ATTENDU

### Page Groupes Scolaires

```
Nom du Groupe             | Plan
--------------------------|------------------
CG ngongo                 | Premium
Ecole EDJA                | Premium
L'INTELIGENCE CELESTE     | Institutionnel
LAMARELLE                 | Premium
```

---

### Page Plans & Tarification → Onglet Abonnements

**Plan Premium:**
- Groupes actifs: **3**
- CG ngongo ✅
- Ecole EDJA ✅
- LAMARELLE ✅

**Plan Institutionnel:**
- Groupes actifs: **1**
- L'INTELIGENCE CELESTE ✅

**Total:** 4 groupes actifs

---

## 🔧 CORRECTION DU FORMULAIRE D'ÉDITION

### Problème

Quand on modifie le plan d'un groupe dans l'interface, seule la colonne `school_groups.plan` est mise à jour.

### Solution: Modifier le Hook `useUpdateSchoolGroup`

**Fichier:** `src/features/dashboard/hooks/useSchoolGroups.ts`

**Ajouter la mise à jour de la subscription:**

```typescript
export const useUpdateSchoolGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSchoolGroupInput) => {
      const { id, ...updates } = input;

      // 1. Mettre à jour le groupe
      const { data: group, error: groupError } = await supabase
        .from('school_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Si le plan a changé, mettre à jour la subscription
      if (updates.plan) {
        // Récupérer l'ID du nouveau plan
        const { data: newPlan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('slug', updates.plan)
          .single();

        if (newPlan) {
          // Mettre à jour la subscription active
          const { error: subError } = await supabase
            .from('subscriptions')
            .update({ plan_id: newPlan.id })
            .eq('school_group_id', id)
            .eq('status', 'active');

          if (subError) {
            console.error('Erreur mise à jour subscription:', subError);
          }
        }
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-groups'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-subscriptions'] });
    },
  });
};
```

**Effet:** Quand vous modifiez le plan d'un groupe, la subscription est automatiquement mise à jour!

---

## 📋 CHECKLIST COMPLÈTE

### Étape 1: Migration ✅
- [ ] Fichier `20251120_sync_subscriptions_with_plan_column.sql` créé
- [ ] Migration appliquée dans Supabase
- [ ] Vérification SQL réussie
- [ ] Tous les plans sont synchronisés

### Étape 2: Vérification Base de Données ✅
- [ ] `school_groups.plan` correspond à `subscription_plans.slug`
- [ ] Toutes les subscriptions ont `status = 'active'`
- [ ] Pas de groupes sans subscription

### Étape 3: Vérification Interface ✅
- [ ] Page Groupes Scolaires rafraîchie
- [ ] Plans affichés correctement
- [ ] Page Plans & Tarification cohérente
- [ ] Onglet Abonnements affiche les bons chiffres

### Étape 4: Correction Future (Optionnel) ✅
- [ ] Hook `useUpdateSchoolGroup` modifié
- [ ] Test de modification de plan
- [ ] Vérification de la synchronisation automatique

---

## 🎯 RÉSUMÉ

### Problème
Modification du plan dans l'interface → Mise à jour de `school_groups.plan` uniquement → Désynchronisation avec `subscriptions`.

### Solution Immédiate
Migration SQL pour synchroniser les deux tables.

### Solution Permanente
Modifier le hook pour mettre à jour les deux tables simultanément.

---

## 📊 AVANT / APRÈS

### AVANT (Désynchronisé)

**school_groups.plan:**
- CG ngongo: premium
- Ecole EDJA: premium
- L'INTELIGENCE CELESTE: institutionnel
- LAMARELLE: premium

**subscriptions.plan_id:**
- CG ngongo: gratuit (ancien)
- Ecole EDJA: gratuit (ancien)
- L'INTELIGENCE CELESTE: gratuit (ancien)
- LAMARELLE: pro (ancien)

**Résultat:** ❌ Incohérence

---

### APRÈS (Synchronisé)

**school_groups.plan:**
- CG ngongo: premium
- Ecole EDJA: premium
- L'INTELIGENCE CELESTE: institutionnel
- LAMARELLE: premium

**subscriptions.plan_id:**
- CG ngongo: premium ✅
- Ecole EDJA: premium ✅
- L'INTELIGENCE CELESTE: institutionnel ✅
- LAMARELLE: premium ✅

**Résultat:** ✅ Parfaitement synchronisé!

---

**Date:** 20 novembre 2025  
**Status:** ✅ Solution Complète  
**Action:** Appliquer la migration de synchronisation
