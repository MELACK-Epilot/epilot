# 🔍 GUIDE RAPIDE - Diagnostic Plans & Modules

**Date** : 7 novembre 2025, 22:05 PM  
**Objectif** : Identifier pourquoi les modules/catégories ne s'affichent pas

---

## 🚀 DIAGNOSTIC EN 3 ÉTAPES

### **ÉTAPE 1 : Console Navigateur** (30 secondes)

1. Ouvrir `/dashboard/plans`
2. Appuyer sur **F12** (Console)
3. Chercher ce log :

```
📊 Plans avec contenu récupérés: {
  totalPlans: 4,
  plansAvecCategories: 0,  // ← Regarder ici
  plansAvecModules: 0,     // ← Et ici
  details: [...]
}
```

**Interprétation** :
- `plansAvecCategories: 0` → ❌ Aucune catégorie assignée
- `plansAvecModules: 0` → ❌ Aucun module assigné
- `plansAvecCategories: 3` → ✅ 3 plans ont des catégories
- `plansAvecModules: 3` → ✅ 3 plans ont des modules

**Si warnings** :
```
⚠️ Erreur récupération catégories plans: ...
⚠️ Erreur récupération modules plans: ...
```
→ Problème de relations Supabase (voir Étape 2)

---

### **ÉTAPE 2 : Diagnostic SQL** (1 minute)

1. Aller sur [Supabase Dashboard](https://supabase.com)
2. Ouvrir **SQL Editor**
3. Copier-coller le script : `database/DIAGNOSTIC_PLANS_MODULES_CATEGORIES.sql`
4. Cliquer **Run**

**Résultat attendu** :
```
========================================
DIAGNOSTIC PLANS & MODULES
========================================

📦 Plans actifs : 4
📂 Catégories actives : 8
🔧 Modules actifs : 50

--- Tables de liaison ---
🔗 Liaisons plan-catégories : 0  ← PROBLÈME SI 0
🔗 Liaisons plan-modules : 0     ← PROBLÈME SI 0

⚠️ PROBLÈME : Aucune catégorie assignée aux plans !
   → Solution : Modifier un plan et assigner des catégories

⚠️ PROBLÈME : Aucun module assigné aux plans !
   → Solution : Modifier un plan et assigner des modules
```

---

### **ÉTAPE 3 : Vérifier les Données** (1 minute)

Le script affiche aussi :

```
📊 DÉTAILS PAR PLAN

Plan          | Slug      | Prix   | Catégories | Modules | Statut
--------------|-----------|--------|------------|---------|------------------
Gratuit       | gratuit   | 0      | 0          | 0       | ❌ Aucune catégorie
Premium       | premium   | 50000  | 0          | 0       | ❌ Aucune catégorie
Pro           | pro       | 150000 | 0          | 0       | ❌ Aucune catégorie
Institutionnel| institu.. | 500000 | 0          | 0       | ❌ Aucune catégorie
```

**Si toutes les colonnes "Catégories" et "Modules" sont à 0** :
→ Les plans n'ont pas de contenu assigné ❌

---

## ✅ SOLUTIONS RAPIDES

### **Solution 1 : Assigner via Interface** (Recommandé)

1. Aller sur `/dashboard/plans`
2. Cliquer **"Modifier"** sur un plan
3. Aller sur l'onglet **"Modules & Catégories"**
4. **Cocher** des catégories (ex: Scolarité, Finances, RH)
5. **Cocher** des modules (ex: Gestion élèves, Comptabilité, Paie)
6. Cliquer **"Enregistrer"**

**Vérification immédiate** :
- Badge doit afficher : `3 catégories · 12 modules`
- Section expandable doit afficher le contenu

---

### **Solution 2 : Assigner via SQL** (Pour tests)

```sql
-- Récupérer les IDs
SELECT id, name FROM subscription_plans WHERE slug = 'premium';
-- Copier l'ID du plan Premium

SELECT id, name FROM business_categories LIMIT 5;
-- Copier les IDs de 3 catégories

SELECT id, name FROM modules LIMIT 10;
-- Copier les IDs de 5 modules

-- Assigner catégories
INSERT INTO plan_categories (plan_id, category_id)
VALUES 
  ('ID-PLAN-PREMIUM', 'ID-CATEGORY-1'),
  ('ID-PLAN-PREMIUM', 'ID-CATEGORY-2'),
  ('ID-PLAN-PREMIUM', 'ID-CATEGORY-3')
ON CONFLICT (plan_id, category_id) DO NOTHING;

-- Assigner modules
INSERT INTO plan_modules (plan_id, module_id)
VALUES 
  ('ID-PLAN-PREMIUM', 'ID-MODULE-1'),
  ('ID-PLAN-PREMIUM', 'ID-MODULE-2'),
  ('ID-PLAN-PREMIUM', 'ID-MODULE-3'),
  ('ID-PLAN-PREMIUM', 'ID-MODULE-4'),
  ('ID-PLAN-PREMIUM', 'ID-MODULE-5')
ON CONFLICT (plan_id, module_id) DO NOTHING;
```

**Vérification** :
```sql
-- Compter les assignations
SELECT COUNT(*) FROM plan_categories WHERE plan_id = 'ID-PLAN-PREMIUM';
-- Doit retourner 3

SELECT COUNT(*) FROM plan_modules WHERE plan_id = 'ID-PLAN-PREMIUM';
-- Doit retourner 5
```

---

### **Solution 3 : Créer Tables (Si manquantes)**

Si le diagnostic SQL affiche :
```
ERROR: relation "plan_categories" does not exist
```

Exécuter ce script :

```sql
-- Table plan_categories
CREATE TABLE IF NOT EXISTS plan_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, category_id)
);

CREATE INDEX idx_plan_categories_plan ON plan_categories(plan_id);
CREATE INDEX idx_plan_categories_category ON plan_categories(category_id);

-- Table plan_modules
CREATE TABLE IF NOT EXISTS plan_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, module_id)
);

CREATE INDEX idx_plan_modules_plan ON plan_modules(plan_id);
CREATE INDEX idx_plan_modules_module ON plan_modules(module_id);

-- RLS
ALTER TABLE plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view plan categories"
  ON plan_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Everyone can view plan modules"
  ON plan_modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super Admin can manage plan categories"
  ON plan_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

CREATE POLICY "Super Admin can manage plan modules"
  ON plan_modules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
```

---

## 🧪 TEST FINAL

Après avoir assigné des catégories/modules :

1. **Rafraîchir** `/dashboard/plans` (F5)
2. **Vérifier console** :
```
📊 Plans avec contenu récupérés: {
  totalPlans: 4,
  plansAvecCategories: 1,  // ✅ Au moins 1
  plansAvecModules: 1,     // ✅ Au moins 1
  details: [
    { nom: "Premium", categories: 3, modules: 5 }  // ✅ Valeurs > 0
  ]
}
```

3. **Vérifier interface** :
   - Badge : `3 catégories · 5 modules` ✅
   - Cliquer "Contenu du plan" → Section s'ouvre ✅
   - Catégories listées ✅
   - Modules listés ✅

---

## 📋 CHECKLIST COMPLÈTE

- [ ] Console affiche logs de debug
- [ ] Script SQL diagnostic exécuté
- [ ] Tables `plan_categories` et `plan_modules` existent
- [ ] Au moins 1 plan a des catégories (> 0)
- [ ] Au moins 1 plan a des modules (> 0)
- [ ] Badge affiche valeurs correctes
- [ ] Section expandable fonctionne
- [ ] Aucune erreur dans console

---

## 🎯 RÉSUMÉ

**Problème** : Badge affiche `0 catégories · 0 modules`

**Cause probable** : Tables de liaison vides

**Solution** :
1. ✅ Modifier un plan
2. ✅ Assigner catégories et modules
3. ✅ Enregistrer
4. ✅ Rafraîchir la page

**Temps total** : 2-3 minutes

---

## 📞 SI PROBLÈME PERSISTE

1. **Vérifier console** : Erreurs Supabase
2. **Vérifier RLS** : Policies actives
3. **Vérifier foreign keys** : Relations configurées
4. **Consulter** : `CORRECTION_MODULES_CATEGORIES_PLANS.md`

---

**Date** : 7 novembre 2025, 22:05 PM  
**Guide par** : Cascade AI  
**Statut** : ✅ PRÊT POUR DIAGNOSTIC

**Suivez les 3 étapes pour identifier la cause !** 🔍
