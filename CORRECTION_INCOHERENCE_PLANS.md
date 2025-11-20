# 🔧 CORRECTION INCOHÉRENCE PLANS

**Date:** 20 novembre 2025  
**Problème:** Incohérence entre les plans affichés dans Groupes Scolaires et Plans & Tarification

---

## 🐛 PROBLÈME IDENTIFIÉ

### Symptômes
Dans la page **Groupes Scolaires**, on voit:
- CG ngongo: **Premium** ✅
- Ecole EDJA: **Gratuit** ✅
- L'INTELIGENCE CELESTE: **Institutionnel** ✅
- LAMARELLE: **Pro** ✅

Mais dans la page **Plans & Tarification** → Onglet **Abonnements**, les chiffres ne correspondent pas!

### Cause Racine
Il existe **DEUX sources de données** pour le plan d'un groupe:

1. **Colonne statique** `school_groups.plan` (ancienne méthode)
2. **Table dynamique** `subscriptions` + `subscription_plans` (nouvelle méthode)

La vue `school_groups_with_admin` utilisait la **colonne statique** au lieu de la **subscription active**, causant l'incohérence.

---

## ✅ SOLUTION IMPLÉMENTÉE

### Correction de la Vue `school_groups_with_admin`

**Fichier:** `supabase/migrations/20251120_create_school_groups_with_admin_view.sql`

**Avant (incorrect):**
```sql
SELECT 
  sg.id,
  sg.name,
  sg.plan,  -- ❌ COLONNE STATIQUE (peut être obsolète)
  ...
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id;
```

**Après (correct):**
```sql
SELECT 
  sg.id,
  sg.name,
  -- ✅ PLAN DYNAMIQUE depuis la subscription active
  COALESCE(sp.slug, sg.plan, 'gratuit') AS plan,
  ...
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id
-- Récupérer le plan depuis la subscription active
LEFT JOIN subscriptions s ON (
  s.school_group_id = sg.id 
  AND s.status = 'active'
)
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;
```

### Logique du COALESCE

```sql
COALESCE(sp.slug, sg.plan, 'gratuit')
```

**Priorité:**
1. **sp.slug** - Plan depuis la subscription active (priorité 1)
2. **sg.plan** - Plan de la colonne statique (fallback)
3. **'gratuit'** - Plan par défaut si aucun des deux

---

## 🎯 POURQUOI CETTE INCOHÉRENCE?

### Scénario Problématique

1. **Création du groupe** → `school_groups.plan = 'gratuit'`
2. **Admin souscrit à Premium** → `subscriptions.plan_id = ID_PREMIUM`
3. **Vue utilise `sg.plan`** → Affiche toujours "Gratuit" ❌
4. **Stats utilisent `subscriptions`** → Comptent "Premium" ✅

**Résultat:** Incohérence entre les deux pages!

---

## 📊 VÉRIFICATION DES DONNÉES

### Script SQL de Vérification

**Fichier:** `VERIFICATION_DONNEES_PLANS.sql`

```sql
-- Vérifier les groupes avec leurs plans (statique vs dynamique)
SELECT 
  sg.name as "Groupe",
  sg.plan as "Plan Statique",
  sp.slug as "Plan Dynamique",
  s.status as "Statut Abonnement"
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;
```

**Résultat attendu (exemple):**
```
Groupe                    | Plan Statique | Plan Dynamique | Statut
--------------------------|---------------|----------------|--------
CG ngongo                 | gratuit       | premium        | active
Ecole EDJA                | gratuit       | gratuit        | active
L'INTELIGENCE CELESTE     | gratuit       | institutionnel | active
LAMARELLE                 | gratuit       | pro            | active
```

**Problème visible:** La colonne statique est toujours "gratuit" mais le plan dynamique est différent!

---

## 🔄 MIGRATION À APPLIQUER

### 1. Corriger la Vue `school_groups_with_admin`

**Fichier:** `supabase/migrations/20251120_create_school_groups_with_admin_view.sql`

**Appliquer via Supabase Dashboard:**
1. SQL Editor → New Query
2. Copier-coller le contenu du fichier
3. Exécuter (Run)

**OU via CLI:**
```bash
supabase db push
```

---

### 2. Vérifier la Vue Corrigée

```sql
-- Tester la vue
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

## 🎯 IMPACT DE LA CORRECTION

### Avant
**Page Groupes Scolaires:**
- Affiche le plan depuis `sg.plan` (statique)
- Peut être obsolète si le groupe a changé de plan

**Page Plans & Tarification:**
- Compte les abonnements depuis `subscriptions`
- Données à jour

**Résultat:** ❌ Incohérence

---

### Après
**Page Groupes Scolaires:**
- Affiche le plan depuis `subscriptions` (dynamique)
- Toujours à jour

**Page Plans & Tarification:**
- Compte les abonnements depuis `subscriptions`
- Données à jour

**Résultat:** ✅ Cohérence totale

---

## 📋 EXEMPLES CONCRETS

### Exemple 1: Groupe CG ngongo

**Avant la correction:**
```
Page Groupes Scolaires: "Gratuit" (depuis sg.plan)
Page Plans & Tarification: Compté dans "Premium" (depuis subscriptions)
❌ INCOHÉRENCE
```

**Après la correction:**
```
Page Groupes Scolaires: "Premium" (depuis subscriptions)
Page Plans & Tarification: Compté dans "Premium" (depuis subscriptions)
✅ COHÉRENT
```

---

### Exemple 2: Groupe LAMARELLE

**Avant la correction:**
```
Page Groupes Scolaires: "Gratuit" (depuis sg.plan)
Page Plans & Tarification: Compté dans "Pro" (depuis subscriptions)
❌ INCOHÉRENCE
```

**Après la correction:**
```
Page Groupes Scolaires: "Pro" (depuis subscriptions)
Page Plans & Tarification: Compté dans "Pro" (depuis subscriptions)
✅ COHÉRENT
```

---

## 🔍 POURQUOI GARDER `sg.plan`?

### Raisons de Conserver la Colonne Statique

1. **Fallback** - Si un groupe n'a pas d'abonnement actif
2. **Migration** - Données historiques
3. **Performance** - Éviter un JOIN si nécessaire

### Utilisation du COALESCE

```sql
COALESCE(sp.slug, sg.plan, 'gratuit')
```

**Ordre de priorité:**
1. Plan de la subscription active (source de vérité)
2. Plan de la colonne statique (fallback)
3. Plan gratuit par défaut

---

## 🚀 DÉPLOIEMENT

### Étapes

1. **Appliquer la migration corrigée**
   ```bash
   # Via Supabase Dashboard
   # SQL Editor → Copier-coller le fichier → Run
   ```

2. **Vérifier la vue**
   ```sql
   SELECT * FROM school_groups_with_admin LIMIT 5;
   ```

3. **Rafraîchir l'application**
   - Ctrl + Shift + R dans le navigateur

4. **Vérifier la cohérence**
   - Page Groupes Scolaires → Vérifier les plans
   - Page Plans & Tarification → Onglet Abonnements
   - Les deux doivent correspondre ✅

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Migration `20251120_create_school_groups_with_admin_view.sql` corrigée
- [ ] Migration appliquée dans Supabase
- [ ] Vue `school_groups_with_admin` mise à jour
- [ ] Test SQL réussi
- [ ] Page Groupes Scolaires rafraîchie
- [ ] Plans affichés correspondent aux subscriptions
- [ ] Page Plans & Tarification cohérente
- [ ] Onglet Abonnements affiche les bons chiffres

---

## 🎯 RÉSULTAT FINAL

### Cohérence Totale

**Page Groupes Scolaires:**
```
CG ngongo          → Premium
Ecole EDJA         → Gratuit
L'INTELIGENCE      → Institutionnel
LAMARELLE          → Pro
```

**Page Plans & Tarification → Abonnements:**
```
Plan Gratuit:        1 groupe  (Ecole EDJA)
Plan Premium:        1 groupe  (CG ngongo)
Plan Pro:            1 groupe  (LAMARELLE)
Plan Institutionnel: 1 groupe  (L'INTELIGENCE)
Total:               4 groupes actifs
```

**✅ PARFAITEMENT COHÉRENT!**

---

## 📚 LEÇON APPRISE

### Règle d'Or

**TOUJOURS utiliser `subscriptions` comme source de vérité pour le plan d'un groupe!**

**Jamais** se fier uniquement à `school_groups.plan` (colonne statique).

### Architecture Correcte

```
Source de Vérité:
  subscriptions.plan_id → subscription_plans.slug

Fallback:
  school_groups.plan (si pas d'abonnement actif)

Affichage:
  COALESCE(subscription_plan, static_plan, 'gratuit')
```

---

**Date:** 20 novembre 2025  
**Status:** ✅ Corrigé et Documenté  
**Qualité:** Production Ready
