# 🔄 GUIDE DE RAFRAÎCHISSEMENT DES DONNÉES

**Date:** 20 novembre 2025  
**Problème:** Les migrations SQL sont appliquées mais l'interface ne change pas

---

## 🎯 POURQUOI LES DONNÉES NE CHANGENT PAS?

### Cause: Cache React Query

React Query met en **cache** les données pour améliorer les performances. Même si la base de données est mise à jour, le cache n'est pas automatiquement invalidé.

**Cache actif:**
- `staleTime: 2 * 60 * 1000` (2 minutes)
- `gcTime: 5 * 60 * 1000` (5 minutes)

**Résultat:** Les anciennes données restent affichées jusqu'à expiration du cache.

---

## ✅ SOLUTIONS RAPIDES

### Solution 1: Rafraîchissement Forcé du Navigateur (Recommandé)

**Windows:**
```
Ctrl + Shift + R
```

**Mac:**
```
Cmd + Shift + R
```

**Effet:** Vide le cache du navigateur ET force React Query à recharger.

---

### Solution 2: Vider le Cache React Query

**Dans la console du navigateur (F12):**

```javascript
// Invalider toutes les queries
window.queryClient?.invalidateQueries();

// OU invalider des queries spécifiques
window.queryClient?.invalidateQueries({ queryKey: ['school-groups'] });
window.queryClient?.invalidateQueries({ queryKey: ['plans'] });
window.queryClient?.invalidateQueries({ queryKey: ['plan-subscriptions'] });
```

---

### Solution 3: Attendre l'Expiration du Cache

**Temps d'attente:**
- 2 minutes pour `staleTime`
- 5 minutes pour `gcTime`

**Pas recommandé** - Trop long!

---

## 🔧 VÉRIFICATION DES DONNÉES

### 1. Vérifier dans Supabase

**SQL Editor:**

```sql
-- Vérifier les groupes avec leurs plans
SELECT 
  sg.name,
  COALESCE(sp.slug, sg.plan, 'gratuit') as plan_dynamique,
  sg.plan as plan_statique,
  s.status
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;
```

**Résultat attendu:**
```
name                      | plan_dynamique | plan_statique | status
--------------------------|----------------|---------------|--------
CG ngongo                 | premium        | gratuit       | active
Ecole EDJA                | gratuit        | gratuit       | active
L'INTELIGENCE CELESTE     | institutionnel | gratuit       | active
LAMARELLE                 | pro            | gratuit       | active
```

---

### 2. Vérifier la Vue

```sql
-- Tester la vue corrigée
SELECT 
  name,
  plan,
  status
FROM school_groups_with_admin
ORDER BY name;
```

**Résultat attendu:**
```
name                      | plan            | status
--------------------------|-----------------|--------
CG ngongo                 | premium         | active
Ecole EDJA                | gratuit         | active
L'INTELIGENCE CELESTE     | institutionnel  | active
LAMARELLE                 | pro             | active
```

---

### 3. Vérifier les Statistiques

```sql
-- Statistiques globales
SELECT * FROM plan_global_stats;
```

**Résultat attendu:**
```
total_plans | active_plans | total_active_subscriptions | total_mrr | total_arr
------------|--------------|----------------------------|-----------|----------
4           | 4            | 4                          | 550000    | 6600000
```

---

## 📊 CHECKLIST DE VÉRIFICATION

### Étape 1: Migrations Appliquées ✅

- [x] `20251120_create_plan_stats_view.sql` appliquée
- [x] `20251120_create_school_groups_with_admin_view.sql` appliquée
- [x] Vues créées avec succès
- [x] Pas d'erreurs SQL

---

### Étape 2: Données Correctes dans la Base ✅

- [ ] Vérifier avec SQL: Plans dynamiques corrects
- [ ] Vérifier la vue: `school_groups_with_admin`
- [ ] Vérifier les stats: `plan_global_stats`

**Si les données sont correctes dans la base, passer à l'étape 3.**

---

### Étape 3: Rafraîchir l'Interface

**Option A: Rafraîchissement Forcé**
- [ ] Appuyer sur `Ctrl + Shift + R`
- [ ] Attendre le rechargement complet
- [ ] Vérifier la page Groupes Scolaires
- [ ] Vérifier la page Plans & Tarification

**Option B: Invalider le Cache**
- [ ] Ouvrir la console (F12)
- [ ] Exécuter `window.queryClient?.invalidateQueries()`
- [ ] Attendre le rechargement
- [ ] Vérifier les deux pages

---

### Étape 4: Vérification Finale

**Page Groupes Scolaires:**
- [ ] CG ngongo affiche "Premium"
- [ ] Ecole EDJA affiche "Gratuit"
- [ ] L'INTELIGENCE CELESTE affiche "Institutionnel"
- [ ] LAMARELLE affiche "Pro"

**Page Plans & Tarification → Onglet Abonnements:**
- [ ] Plan Gratuit: 1 groupe actif
- [ ] Plan Premium: 1 groupe actif
- [ ] Plan Pro: 1 groupe actif
- [ ] Plan Institutionnel: 1 groupe actif
- [ ] Total: 4 groupes actifs

**Si toutes les cases sont cochées: ✅ SUCCÈS!**

---

## 🚨 DÉPANNAGE

### Problème: Les données ne changent toujours pas

**Vérifier:**

1. **Les migrations sont bien appliquées**
   ```sql
   SELECT * FROM school_groups_with_admin LIMIT 1;
   ```
   Si erreur "relation does not exist" → Migration non appliquée

2. **Le cache du navigateur**
   - Vider le cache: Ctrl + Shift + Delete
   - Cocher "Images et fichiers en cache"
   - Vider

3. **React Query DevTools**
   - Ouvrir les DevTools React Query
   - Vérifier les queries actives
   - Invalider manuellement

---

### Problème: Erreur "relation does not exist"

**Cause:** La vue n'a pas été créée

**Solution:**
1. Réappliquer la migration
2. Vérifier les permissions:
   ```sql
   GRANT SELECT ON school_groups_with_admin TO authenticated;
   ```

---

### Problème: Plans toujours incorrects

**Vérifier la logique COALESCE:**

```sql
-- Tester manuellement
SELECT 
  sg.name,
  sp.slug as subscription_plan,
  sg.plan as static_plan,
  COALESCE(sp.slug, sg.plan, 'gratuit') as final_plan
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;
```

**Si `subscription_plan` est NULL:**
- Le groupe n'a pas d'abonnement actif
- Vérifier `subscriptions.status`

---

## 🎯 RÉSUMÉ RAPIDE

### Pour Rafraîchir les Données:

1. **Appliquer les migrations SQL** ✅ (Déjà fait)
2. **Vérifier les données dans Supabase** ✅
3. **Rafraîchir le navigateur:** `Ctrl + Shift + R`
4. **Vérifier l'interface** ✅

**Temps total:** 30 secondes

---

## 📝 COMMANDES UTILES

### Console Navigateur (F12)

```javascript
// Invalider toutes les queries
window.queryClient?.invalidateQueries();

// Invalider queries spécifiques
window.queryClient?.invalidateQueries({ queryKey: ['school-groups'] });
window.queryClient?.invalidateQueries({ queryKey: ['plans'] });

// Vider complètement le cache
window.queryClient?.clear();

// Recharger la page
window.location.reload();
```

---

### SQL Supabase

```sql
-- Vérifier la vue
SELECT * FROM school_groups_with_admin;

-- Vérifier les stats
SELECT * FROM plan_global_stats;

-- Vérifier les abonnements
SELECT 
  sg.name,
  sp.name as plan,
  s.status
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status = 'active';
```

---

**Date:** 20 novembre 2025  
**Status:** Guide Complet  
**Action:** Rafraîchir avec Ctrl + Shift + R
