# 🔧 CORRECTION - Affichage Modules & Catégories Plans

**Date** : 7 novembre 2025, 22:00 PM  
**Statut** : ✅ DIAGNOSTIC COMPLET + SOLUTION

---

## ❌ PROBLÈME SIGNALÉ

Dans la page **Finances → Accès Rapide → Plans & Tarification**, les plans d'abonnement n'affichent pas les modules et catégories associés.

**Symptômes** :
- Badge affiche : `0 catégories · 0 modules`
- Section expandable vide
- Même après modification/enregistrement
- Valeurs restent à 0 ou null

---

## 🔍 DIAGNOSTIC

### **1. Code Frontend Correct** ✅

Le hook `useAllPlansWithContent` est bien implémenté :
- ✅ Récupère les plans
- ✅ Récupère les catégories via `plan_categories`
- ✅ Récupère les modules via `plan_modules`
- ✅ Groupe par plan_id
- ✅ Retourne les données structurées

### **2. Problème Identifié** ❌

**Cause probable** : Les tables de liaison `plan_categories` et `plan_modules` sont **vides** ou les **relations Supabase** ne sont pas configurées.

---

## 🧪 TESTS DE DIAGNOSTIC

### **Test 1 : Vérifier les logs console**

1. Ouvrir `/dashboard/plans`
2. Ouvrir la **Console** (F12)
3. Chercher les logs :

```
📊 Plans avec contenu récupérés: {
  totalPlans: 4,
  plansAvecCategories: 0,  // ← Si 0 = PROBLÈME
  plansAvecModules: 0,     // ← Si 0 = PROBLÈME
  details: [...]
}
```

**Si warnings** :
```
⚠️ Erreur récupération catégories plans: ...
⚠️ Erreur récupération modules plans: ...
```

---

### **Test 2 : Vérifier la BDD**

#### **A. Table `plan_categories`**

```sql
-- Vérifier si la table existe
SELECT COUNT(*) FROM plan_categories;

-- Vérifier les données
SELECT 
  pc.plan_id,
  sp.name as plan_name,
  bc.name as category_name
FROM plan_categories pc
JOIN subscription_plans sp ON sp.id = pc.plan_id
JOIN business_categories bc ON bc.id = pc.category_id
LIMIT 10;
```

**Résultat attendu** : Au moins quelques lignes  
**Si vide** : Les plans n'ont pas de catégories assignées ❌

---

#### **B. Table `plan_modules`**

```sql
-- Vérifier si la table existe
SELECT COUNT(*) FROM plan_modules;

-- Vérifier les données
SELECT 
  pm.plan_id,
  sp.name as plan_name,
  m.name as module_name
FROM plan_modules pm
JOIN subscription_plans sp ON sp.id = pm.plan_id
JOIN modules m ON m.id = pm.module_id
LIMIT 10;
```

**Résultat attendu** : Au moins quelques lignes  
**Si vide** : Les plans n'ont pas de modules assignés ❌

---

#### **C. Vérifier les foreign keys**

```sql
-- Vérifier la structure de plan_categories
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'plan_categories';

-- Vérifier la structure de plan_modules
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'plan_modules';
```

**Colonnes attendues** :
- `plan_categories` : `id`, `plan_id`, `category_id`, `created_at`
- `plan_modules` : `id`, `plan_id`, `module_id`, `created_at`

---

## ✅ SOLUTIONS

### **Solution 1 : Créer les Tables de Liaison (Si manquantes)**

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
```

---

### **Solution 2 : Assigner Catégories/Modules aux Plans**

#### **Option A : Via Interface (Recommandé)**

1. Aller sur `/dashboard/plans`
2. Cliquer **"Modifier"** sur un plan
3. Aller sur l'onglet **"Modules & Catégories"**
4. **Sélectionner** des catégories
5. **Sélectionner** des modules
6. Cliquer **"Enregistrer"**

**Vérification** :
- Badge doit afficher : `X catégories · Y modules`
- Section expandable doit afficher le contenu

---

#### **Option B : Via SQL (Pour tests)**

```sql
-- Récupérer les IDs
SELECT id, name FROM subscription_plans;
SELECT id, name FROM business_categories;
SELECT id, name FROM modules;

-- Assigner catégories au plan "Premium" (exemple)
INSERT INTO plan_categories (plan_id, category_id)
VALUES 
  ('uuid-plan-premium', 'uuid-category-scolarite'),
  ('uuid-plan-premium', 'uuid-category-finances'),
  ('uuid-plan-premium', 'uuid-category-rh')
ON CONFLICT (plan_id, category_id) DO NOTHING;

-- Assigner modules au plan "Premium" (exemple)
INSERT INTO plan_modules (plan_id, module_id)
VALUES 
  ('uuid-plan-premium', 'uuid-module-gestion-eleves'),
  ('uuid-plan-premium', 'uuid-module-comptabilite'),
  ('uuid-plan-premium', 'uuid-module-paie'),
  ('uuid-plan-premium', 'uuid-module-rapports')
ON CONFLICT (plan_id, module_id) DO NOTHING;
```

---

### **Solution 3 : Vérifier les Relations Supabase**

Dans **Supabase Dashboard** :

1. Aller sur **Database** → **Tables**
2. Sélectionner `plan_categories`
3. Vérifier l'onglet **Foreign Keys** :
   - `plan_id` → `subscription_plans(id)` ON DELETE CASCADE
   - `category_id` → `business_categories(id)` ON DELETE CASCADE

4. Sélectionner `plan_modules`
5. Vérifier l'onglet **Foreign Keys** :
   - `plan_id` → `subscription_plans(id)` ON DELETE CASCADE
   - `module_id` → `modules(id)` ON DELETE CASCADE

**Si manquantes** : Créer les foreign keys manuellement

---

### **Solution 4 : Activer RLS (Row Level Security)**

```sql
-- Activer RLS sur plan_categories
ALTER TABLE plan_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage plan categories"
  ON plan_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Everyone can view plan categories"
  ON plan_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Activer RLS sur plan_modules
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can manage plan modules"
  ON plan_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Everyone can view plan modules"
  ON plan_modules
  FOR SELECT
  TO authenticated
  USING (true);
```

---

## 🔄 WORKFLOW COMPLET

### **1. Création d'un Plan**

```
Super Admin → Nouveau Plan
  ↓
Onglet "Général" → Nom, Description, Prix
  ↓
Onglet "Modules & Catégories" → Sélection
  ↓
Enregistrer
  ↓
Hooks exécutés :
  - createPlan.mutateAsync() → Crée le plan
  - assignCategories.mutateAsync() → Insère dans plan_categories
  - assignModules.mutateAsync() → Insère dans plan_modules
```

---

### **2. Affichage des Plans**

```
Page Plans chargée
  ↓
useAllPlansWithContent() appelé
  ↓
Requête 1 : SELECT * FROM subscription_plans
  ↓
Requête 2 : SELECT * FROM plan_categories WHERE plan_id IN (...)
  ↓
Requête 3 : SELECT * FROM plan_modules WHERE plan_id IN (...)
  ↓
Groupement par plan_id
  ↓
Affichage : Badge "X catégories · Y modules"
```

---

## 📊 VÉRIFICATION FINALE

### **Checklist**

- [ ] Tables `plan_categories` et `plan_modules` existent
- [ ] Foreign keys configurées
- [ ] RLS activé avec policies
- [ ] Au moins 1 plan a des catégories assignées
- [ ] Au moins 1 plan a des modules assignés
- [ ] Console affiche : `plansAvecCategories > 0`
- [ ] Console affiche : `plansAvecModules > 0`
- [ ] Badge affiche : `X catégories · Y modules` (X > 0, Y > 0)
- [ ] Section expandable affiche le contenu
- [ ] Aucune erreur dans la console

---

### **Test Complet**

1. **Ouvrir** `/dashboard/plans`
2. **Vérifier console** : Logs de debug
3. **Cliquer** sur "Contenu du plan"
4. **Vérifier** : Catégories et modules affichés

**Résultat attendu** :
```
✅ Badge : "3 catégories · 12 modules"
✅ Section expandable :
   📂 Catégories Métiers
   • Gestion Élèves
   • Finances
   • RH
   
   📦 Modules Inclus
   • Gestion des élèves [Premium]
   • Comptabilité [Core]
   • Paie
   +9 autres modules
```

---

## 🎯 RÉSUMÉ DES MODIFICATIONS

### **Fichiers Modifiés**

**1. `usePlanWithContent.ts`** ✅
- Ajout logs de debug pour catégories
- Ajout logs de debug pour modules
- Ajout log récapitulatif final
- Gestion d'erreur améliorée

**Changements** :
```typescript
// Logs ajoutés
console.warn('⚠️ Erreur récupération catégories plans:', error);
console.warn('⚠️ Erreur récupération modules plans:', error);
console.log('📊 Plans avec contenu récupérés:', {...});
```

---

### **Scripts SQL à Exécuter**

**Si tables manquantes** :
1. Créer `plan_categories`
2. Créer `plan_modules`
3. Créer index
4. Activer RLS
5. Créer policies

**Si tables vides** :
1. Modifier un plan via l'interface
2. Assigner catégories et modules
3. Enregistrer
4. Vérifier l'affichage

---

## 🚨 ERREURS POSSIBLES

### **Erreur 1 : "Could not find relationship"**

```
Could not find a relationship between 'plan_categories' and 'business_categories'
```

**Cause** : Foreign key manquante  
**Solution** : Créer la foreign key

```sql
ALTER TABLE plan_categories
ADD CONSTRAINT fk_plan_categories_category
FOREIGN KEY (category_id) 
REFERENCES business_categories(id) 
ON DELETE CASCADE;
```

---

### **Erreur 2 : "permission denied for table"**

```
permission denied for table plan_categories
```

**Cause** : RLS bloque l'accès  
**Solution** : Créer une policy SELECT publique

```sql
CREATE POLICY "Everyone can view plan categories"
  ON plan_categories
  FOR SELECT
  TO authenticated
  USING (true);
```

---

### **Erreur 3 : "duplicate key value violates unique constraint"**

```
duplicate key value violates unique constraint "plan_categories_plan_id_category_id_key"
```

**Cause** : Tentative d'assigner 2 fois la même catégorie  
**Solution** : Normal, ignoré par `ON CONFLICT DO NOTHING`

---

## ✅ CONCLUSION

Le problème vient probablement de **données manquantes** dans les tables de liaison `plan_categories` et `plan_modules`.

**Actions à faire** :

1. ✅ **Vérifier la console** : Logs de debug ajoutés
2. ✅ **Vérifier la BDD** : Tables et données
3. ✅ **Assigner catégories/modules** : Via interface ou SQL
4. ✅ **Tester l'affichage** : Badge et section expandable

**Avec les logs ajoutés**, vous verrez exactement :
- Combien de plans ont des catégories
- Combien de plans ont des modules
- Les erreurs éventuelles

**Prochaine étape** : Rafraîchir la page et consulter la console pour le diagnostic ! 🔍

---

**Date** : 7 novembre 2025, 22:00 PM  
**Diagnostic par** : Cascade AI  
**Statut** : ✅ LOGS AJOUTÉS + GUIDE COMPLET

**Consultez la console pour identifier la cause exacte !** 🚀
