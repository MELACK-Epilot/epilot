# 📋 ANALYSE : PLANS & TARIFICATION - MODULES & CATÉGORIES

**Date** : 6 novembre 2025  
**Statut** : ⚠️ INCOMPLET - À CORRIGER

---

## 🎯 PROBLÈME IDENTIFIÉ

### **Formulaire de création de plan actuel** :
Le formulaire `PlanFormDialog.tsx` ne permet **PAS** de sélectionner :
- ❌ Les **modules** inclus dans le plan
- ❌ Les **catégories** accessibles avec le plan

### **Impact** :
Quand un groupe scolaire choisit un plan d'abonnement, il n'a **aucun module/catégorie** assigné automatiquement, car le plan ne définit pas ce qu'il contient !

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES

### **Tables existantes** :

#### **1. plans** ✅
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  slug VARCHAR(50) UNIQUE, -- gratuit, premium, pro, institutionnel
  price DECIMAL(10, 2),
  features JSONB, -- Liste des fonctionnalités textuelles
  max_schools INTEGER,
  max_students INTEGER,
  required_plan VARCHAR(30), -- ❌ Pas utilisé correctement
  ...
)
```

#### **2. business_categories** ✅
```sql
CREATE TABLE business_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  slug VARCHAR(50),
  required_plan VARCHAR(30), -- gratuit, premium, pro, institutionnel
  ...
)
```

**8 catégories** :
1. Scolarité & Admissions (gratuit)
2. Pédagogie & Évaluations (gratuit)
3. Finances & Comptabilité (premium)
4. Ressources Humaines (premium)
5. Vie Scolaire & Discipline (premium)
6. Services & Infrastructures (pro)
7. Sécurité & Accès (gratuit)
8. Documents & Rapports (premium)

#### **3. modules** ✅
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  slug VARCHAR(50),
  category_id UUID REFERENCES business_categories(id),
  required_plan VARCHAR(30), -- gratuit, premium, pro, institutionnel
  is_core BOOLEAN,
  is_premium BOOLEAN,
  ...
)
```

**50 modules** répartis dans les 8 catégories

#### **4. plan_modules** ✅ (EXISTE MAIS PAS UTILISÉ)
```sql
CREATE TABLE plan_modules (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES subscription_plans(id), -- ❌ ERREUR : subscription_plans n'existe pas
  module_id UUID REFERENCES modules(id),
  UNIQUE(plan_id, module_id)
)
```

#### **5. plan_categories** ✅ (EXISTE MAIS PAS UTILISÉ)
```sql
CREATE TABLE plan_categories (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES subscription_plans(id), -- ❌ ERREUR : subscription_plans n'existe pas
  category_id UUID REFERENCES business_categories(id),
  UNIQUE(plan_id, category_id)
)
```

---

## ⚠️ PROBLÈMES DÉTECTÉS

### **1. Référence incorrecte dans plan_modules et plan_categories**
```sql
-- ❌ ERREUR
plan_id UUID REFERENCES subscription_plans(id)

-- ✅ CORRECT
plan_id UUID REFERENCES plans(id)
```

### **2. Formulaire incomplet**
Le formulaire `PlanFormDialog.tsx` ne gère pas :
- Sélection des modules
- Sélection des catégories

### **3. Logique d'assignation manquante**
Quand un groupe scolaire souscrit à un plan :
- ❌ Les modules ne sont pas assignés automatiquement
- ❌ Les catégories ne sont pas assignées automatiquement

---

## ✅ SOLUTION PROPOSÉE

### **ÉTAPE 1 : Corriger les tables de liaison**

**Fichier** : `database/FIX_PLAN_MODULES_CATEGORIES.sql`

```sql
-- Corriger la référence dans plan_modules
ALTER TABLE plan_modules 
  DROP CONSTRAINT IF EXISTS plan_modules_plan_id_fkey;

ALTER TABLE plan_modules 
  ADD CONSTRAINT plan_modules_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Corriger la référence dans plan_categories
ALTER TABLE plan_categories 
  DROP CONSTRAINT IF EXISTS plan_categories_plan_id_fkey;

ALTER TABLE plan_categories 
  ADD CONSTRAINT plan_categories_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
```

### **ÉTAPE 2 : Améliorer le formulaire de création de plan**

**Fichier** : `src/features/dashboard/components/plans/PlanFormDialog.tsx`

**Ajouts nécessaires** :

1. **Section "Modules & Catégories"** :
   - Sélection multiple des catégories (checkboxes)
   - Sélection multiple des modules par catégorie (checkboxes groupées)
   - Affichage visuel avec compteurs

2. **Logique de sélection intelligente** :
   - Si une catégorie est sélectionnée → Tous ses modules sont disponibles
   - Si une catégorie est désélectionnée → Ses modules sont désélectionnés
   - Filtrage par `required_plan` (ex: plan gratuit ne peut pas avoir modules premium)

3. **Validation** :
   - Au moins 1 catégorie sélectionnée
   - Au moins 1 module sélectionné

### **ÉTAPE 3 : Hooks pour gérer les modules/catégories**

**Fichiers à créer** :

1. `src/features/dashboard/hooks/useCategories.ts` :
   - `useCategories()` - Récupérer toutes les catégories
   - `useCategoriesByPlan(planSlug)` - Filtrer par plan

2. `src/features/dashboard/hooks/useModules.ts` :
   - `useModules()` - Récupérer tous les modules
   - `useModulesByCategory(categoryId)` - Filtrer par catégorie
   - `useModulesByPlan(planSlug)` - Filtrer par plan

3. `src/features/dashboard/hooks/usePlanModules.ts` :
   - `usePlanModules(planId)` - Modules d'un plan
   - `useAssignModulesToPlan()` - Assigner modules à un plan
   - `useRemoveModulesFromPlan()` - Retirer modules d'un plan

4. `src/features/dashboard/hooks/usePlanCategories.ts` :
   - `usePlanCategories(planId)` - Catégories d'un plan
   - `useAssignCategoriesToPlan()` - Assigner catégories à un plan
   - `useRemoveCategoriesFromPlan()` - Retirer catégories d'un plan

### **ÉTAPE 4 : Fonction d'assignation automatique**

**Fichier** : `database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql`

```sql
-- Fonction pour assigner automatiquement modules/catégories lors de la souscription
CREATE OR REPLACE FUNCTION auto_assign_plan_modules_to_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Assigner les catégories du plan au groupe
  INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, enabled_at)
  SELECT 
    NEW.school_group_id,
    pm.module_id,
    true,
    NOW()
  FROM plan_modules pm
  WHERE pm.plan_id = NEW.plan_id
  ON CONFLICT (school_group_id, module_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur subscriptions
CREATE TRIGGER trigger_auto_assign_modules
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION auto_assign_plan_modules_to_group();
```

---

## 📊 FLUX COMPLET

### **1. Super Admin crée un plan** :
```
1. Remplit les infos de base (nom, prix, limites)
2. Sélectionne les catégories (ex: Scolarité, Pédagogie, Finances)
3. Sélectionne les modules par catégorie
4. Sauvegarde
   → Insère dans `plans`
   → Insère dans `plan_categories`
   → Insère dans `plan_modules`
```

### **2. Super Admin crée un groupe scolaire** :
```
1. Remplit les infos du groupe
2. Sélectionne le plan d'abonnement (ex: Premium)
3. Sauvegarde
   → Insère dans `school_groups`
   → Insère dans `subscriptions`
   → TRIGGER : Copie automatiquement les modules du plan vers `group_module_configs`
```

### **3. Groupe scolaire utilise la plateforme** :
```
1. Admin Groupe se connecte
2. Voit uniquement les modules de son plan
3. Peut activer/désactiver les modules disponibles
4. Peut assigner des modules spécifiques aux utilisateurs
```

---

## 🎨 DESIGN DU FORMULAIRE AMÉLIORÉ

### **Section "Modules & Catégories"** :

```
┌─────────────────────────────────────────────────────┐
│ 📦 Modules & Catégories                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Sélectionnez les catégories et modules inclus       │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ☑ Scolarité & Admissions (8 modules)        │    │
│ │   ☑ Gestion des inscriptions                │    │
│ │   ☑ Gestion des admissions                  │    │
│ │   ☑ Dossiers scolaires                      │    │
│ │   ☐ Badges personnalisés (Premium)          │    │
│ │   ... (4 autres modules)                    │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ☑ Pédagogie & Évaluations (10 modules)      │    │
│ │   ☑ Gestion des classes                     │    │
│ │   ☑ Gestion des matières                    │    │
│ │   ☑ Emplois du temps                        │    │
│ │   ... (7 autres modules)                    │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ☐ Finances & Comptabilité (8 modules)       │    │
│ │   [Disponible en Premium]                   │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ Résumé : 3 catégories, 18 modules sélectionnés     │
└─────────────────────────────────────────────────────┘
```

---

## 📝 CHECKLIST D'IMPLÉMENTATION

### **Phase 1 : Base de données** ✅
- [ ] Corriger `plan_modules.plan_id` → `plans(id)`
- [ ] Corriger `plan_categories.plan_id` → `plans(id)`
- [ ] Créer fonction `auto_assign_plan_modules_to_group()`
- [ ] Créer trigger sur `subscriptions`

### **Phase 2 : Hooks React** ✅
- [ ] `useCategories.ts`
- [ ] `useModules.ts`
- [ ] `usePlanModules.ts`
- [ ] `usePlanCategories.ts`

### **Phase 3 : Composants UI** ✅
- [ ] `CategorySelector.tsx` - Sélection catégories
- [ ] `ModuleSelector.tsx` - Sélection modules
- [ ] Intégrer dans `PlanFormDialog.tsx`

### **Phase 4 : Tests** ✅
- [ ] Créer un plan avec modules/catégories
- [ ] Créer un groupe avec ce plan
- [ ] Vérifier assignation automatique
- [ ] Tester modification de plan

---

## 🎯 RÉSULTAT ATTENDU

### **Avant** ❌ :
- Plan créé sans modules/catégories
- Groupe scolaire n'a aucun module
- Admin doit assigner manuellement

### **Après** ✅ :
- Plan définit clairement modules/catégories
- Groupe scolaire reçoit automatiquement les modules du plan
- Cohérence totale avec la base de données

---

## 📚 FICHIERS À CRÉER/MODIFIER

### **Base de données** :
1. `database/FIX_PLAN_MODULES_CATEGORIES.sql` - Corriger références
2. `database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql` - Fonction auto-assignation
3. `database/POPULATE_PLAN_MODULES.sql` - Peupler les plans existants

### **Hooks** :
1. `src/features/dashboard/hooks/useCategories.ts`
2. `src/features/dashboard/hooks/useModules.ts`
3. `src/features/dashboard/hooks/usePlanModules.ts`
4. `src/features/dashboard/hooks/usePlanCategories.ts`

### **Composants** :
1. `src/features/dashboard/components/plans/CategorySelector.tsx`
2. `src/features/dashboard/components/plans/ModuleSelector.tsx`
3. `src/features/dashboard/components/plans/PlanFormDialog.tsx` (MODIFIER)

### **Types** :
1. `src/features/dashboard/types/dashboard.types.ts` (AJOUTER types)

---

## 🚀 ORDRE D'IMPLÉMENTATION

1. **Corriger la base de données** (FIX_PLAN_MODULES_CATEGORIES.sql)
2. **Créer les hooks** (useCategories, useModules, usePlanModules, usePlanCategories)
3. **Créer les composants de sélection** (CategorySelector, ModuleSelector)
4. **Intégrer dans le formulaire** (PlanFormDialog)
5. **Créer la fonction d'auto-assignation** (CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql)
6. **Tester le flux complet**

---

**Prêt pour l'implémentation !** 🎯
