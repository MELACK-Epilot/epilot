# 🚀 GUIDE D'APPLICATION - Migration Plan Stats

**Date:** 20 novembre 2025  
**Objectif:** Corriger les KPIs Plans & Abonnements

---

## ⚡ ÉTAPES RAPIDES

### 1. Appliquer la Migration SQL

**Option A: Via Supabase Dashboard (Recommandé)**

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet E-Pilot
3. Aller dans **SQL Editor** (menu gauche)
4. Cliquer sur **New Query**
5. Copier-coller le contenu du fichier:
   ```
   supabase/migrations/20251120_create_plan_stats_view.sql
   ```
6. Cliquer sur **Run** (ou F5)
7. Vérifier le message de succès ✅

**Option B: Via CLI Supabase**

```bash
# Depuis le dossier du projet
cd c:\MELACK\e-pilot

# Appliquer toutes les migrations
supabase db push
```

---

### 2. Vérifier les Vues Créées

**Dans SQL Editor, exécuter:**

```sql
-- Vérifier que les vues existent
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('plan_stats', 'plan_global_stats');
```

**Résultat attendu:**
```
table_name
-------------------
plan_stats
plan_global_stats
```

---

### 3. Tester les Statistiques

**Dans SQL Editor, exécuter:**

```sql
-- Statistiques globales
SELECT * FROM plan_global_stats;
```

**Résultat attendu (exemple):**
```
total_plans | active_plans | total_active_subscriptions | total_mrr | total_arr
------------|--------------|----------------------------|-----------|----------
4           | 4            | 4                          | 550000    | 6600000
```

---

### 4. Rafraîchir l'Application

1. Ouvrir votre navigateur
2. Aller sur la page **Plans & Tarification**
3. Appuyer sur **Ctrl + Shift + R** (rafraîchissement forcé)
4. Vérifier les KPIs:
   - ✅ Plans Actifs: 4 (au lieu de 1)
   - ✅ Abonnements: 4 (au lieu de 1)
   - ✅ Revenus MRR: 550K (au lieu de 225K)
   - ✅ Plans Total: 4

---

## 📊 COMPRENDRE LES KPIs

### Plans Actifs
**Définition:** Plans avec `is_active = true`

**Comment modifier:**
- Cliquer sur un plan
- Cliquer "Archiver" → `is_active = false`
- Cliquer "Restaurer" → `is_active = true`

---

### Abonnements
**Définition:** Abonnements avec `status = 'active'`

**Statuts possibles:**
- `active`: En cours ✅
- `expired`: Expiré ❌
- `cancelled`: Annulé ❌
- `trial`: Essai 🔄

---

### Revenus MRR
**Définition:** Monthly Recurring Revenue (Revenu mensuel récurrent)

**Calcul:**
```
MRR = Somme des prix de tous les abonnements actifs
```

**Exemple:**
- Groupe 1: 50 000 FCFA/mois
- Groupe 2: 0 FCFA/mois (gratuit)
- Groupe 3: 500 000 FCFA/mois
- **Total:** 550 000 FCFA = 550K

---

## 🔍 DÉPANNAGE

### Problème: Les KPIs ne changent pas

**Solution:**
1. Vérifier que la migration est appliquée:
   ```sql
   SELECT * FROM plan_global_stats;
   ```
2. Vider le cache du navigateur (Ctrl + Shift + Delete)
3. Rafraîchir la page (Ctrl + Shift + R)

---

### Problème: Erreur "relation does not exist"

**Cause:** Les vues n'ont pas été créées

**Solution:**
1. Réappliquer la migration SQL
2. Vérifier les permissions:
   ```sql
   GRANT SELECT ON plan_stats TO authenticated;
   GRANT SELECT ON plan_global_stats TO authenticated;
   ```

---

### Problème: Les chiffres semblent incorrects

**Vérification:**

```sql
-- Vérifier les plans
SELECT name, is_active FROM subscription_plans;

-- Vérifier les abonnements
SELECT 
  sg.name,
  sp.name as plan,
  s.status,
  s.price
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id;
```

---

## ✅ CHECKLIST FINALE

- [ ] Migration SQL appliquée
- [ ] Vues `plan_stats` et `plan_global_stats` créées
- [ ] Test SQL réussi
- [ ] Page rafraîchie
- [ ] KPI "Plans Actifs" correct
- [ ] KPI "Abonnements" correct
- [ ] KPI "Revenus MRR" correct
- [ ] KPI "Plans Total" correct

---

**Une fois toutes les cases cochées, le problème est résolu!** ✅🎉

**Date:** 20 novembre 2025  
**Status:** Prêt à déployer
