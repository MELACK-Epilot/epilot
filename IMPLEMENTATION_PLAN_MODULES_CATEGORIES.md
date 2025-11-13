# 🚀 IMPLÉMENTATION : PLANS AVEC MODULES & CATÉGORIES

**Date** : 6 novembre 2025  
**Statut** : ⏳ EN COURS

---

## ✅ CE QUI A ÉTÉ FAIT

### **1. Analyse complète** ✅
- ✅ `ANALYSE_PLAN_MODULES_CATEGORIES.md` - Document d'analyse détaillé
- ✅ Identification du problème
- ✅ Architecture base de données documentée

### **2. Scripts SQL** ✅
- ✅ `database/FIX_PLAN_MODULES_CATEGORIES.sql` - Corriger les foreign keys
- ✅ `database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql` - Fonctions d'auto-assignation

### **3. Hooks React** ✅
- ✅ `src/features/dashboard/hooks/usePlanModules.ts` - Hooks pour gérer plan_modules et plan_categories
- ✅ `src/features/dashboard/hooks/useCategories.ts` - Existe déjà ✅

### **4. Composants UI** ✅
- ✅ `src/features/dashboard/components/plans/CategorySelector.tsx` - Sélection catégories
- ✅ `src/features/dashboard/components/plans/ModuleSelector.tsx` - Sélection modules

---

## ⏳ CE QU'IL RESTE À FAIRE

### **ÉTAPE 1 : Exécuter les scripts SQL** 🔴

**Dans Supabase SQL Editor** :

1. **Corriger les foreign keys** :
   ```bash
   # Exécuter : database/FIX_PLAN_MODULES_CATEGORIES.sql
   ```

2. **Créer les fonctions d'auto-assignation** :
   ```bash
   # Exécuter : database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql
   ```

3. **Vérifier** :
   ```sql
   -- Vérifier les contraintes
   SELECT conname, conrelid::regclass, confrelid::regclass 
   FROM pg_constraint 
   WHERE conname LIKE 'plan_%_plan_id_fkey';
   
   -- Vérifier les fonctions
   SELECT proname FROM pg_proc WHERE proname LIKE '%assign%';
   ```

---

### **ÉTAPE 2 : Modifier PlanFormDialog.tsx** 🔴

**Fichier** : `src/features/dashboard/components/plans/PlanFormDialog.tsx`

#### **2.1 Ajouter les imports** :

```typescript
import { CategorySelector } from './CategorySelector';
import { ModuleSelector } from './ModuleSelector';
import { usePlanModules, usePlanCategories, useAssignModulesToPlan, useAssignCategoriesToPlan } from '../../hooks/usePlanModules';
import { Layers, Package } from 'lucide-react';
```

#### **2.2 Ajouter les états** :

```typescript
const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

// Hooks pour récupérer les modules/catégories existants (mode edit)
const { data: existingModules } = usePlanModules(plan?.id);
const { data: existingCategories } = usePlanCategories(plan?.id);

// Hooks pour assigner
const assignModules = useAssignModulesToPlan();
const assignCategories = useAssignCategoriesToPlan();
```

#### **2.3 Charger les données en mode édition** :

```typescript
useEffect(() => {
  if (mode === 'edit' && plan) {
    // ... code existant ...
    
    // Charger les catégories et modules
    if (existingCategories) {
      setSelectedCategoryIds(existingCategories.map(c => c.id));
    }
    if (existingModules) {
      setSelectedModuleIds(existingModules.map(m => m.id));
    }
  } else {
    // Reset
    setSelectedCategoryIds([]);
    setSelectedModuleIds([]);
  }
}, [mode, plan, existingCategories, existingModules]);
```

#### **2.4 Modifier la fonction onSubmit** :

```typescript
const onSubmit = async (values: PlanFormValues) => {
  try {
    const featuresArray = values.features.split('\n').filter(f => f.trim() !== '');

    // Validation : Au moins 1 catégorie et 1 module
    if (selectedCategoryIds.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Sélectionnez au moins une catégorie',
        variant: 'destructive',
      });
      return;
    }

    if (selectedModuleIds.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Sélectionnez au moins un module',
        variant: 'destructive',
      });
      return;
    }

    let planId: string;

    if (mode === 'create') {
      // Créer le plan
      const result = await createPlan.mutateAsync(input);
      planId = result.id;
    } else if (plan) {
      // Mettre à jour le plan
      await updatePlan.mutateAsync(input);
      planId = plan.id;
    }

    // Assigner les catégories et modules
    await Promise.all([
      assignCategories.mutateAsync({ planId, categoryIds: selectedCategoryIds }),
      assignModules.mutateAsync({ planId, moduleIds: selectedModuleIds }),
    ]);

    toast({
      title: mode === 'create' ? 'Plan créé' : 'Plan modifié',
      description: `Le plan "${values.name}" a été ${mode === 'create' ? 'créé' : 'modifié'} avec ${selectedCategoryIds.length} catégories et ${selectedModuleIds.length} modules.`,
    });

    onOpenChange(false);
    form.reset();
    setSelectedCategoryIds([]);
    setSelectedModuleIds([]);
  } catch (error: any) {
    toast({
      title: 'Erreur',
      description: error.message || 'Une erreur est survenue',
      variant: 'destructive',
    });
  }
};
```

#### **2.5 Ajouter la section dans le formulaire** :

**Après la section "Fonctionnalités" (ligne ~485), ajouter** :

```typescript
{/* Modules & Catégories */}
<div className="space-y-4">
  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
    <Layers className="w-5 h-5" />
    Catégories & Modules
  </h3>
  <p className="text-sm text-gray-600">
    Sélectionnez les catégories et modules inclus dans ce plan. Les modules seront automatiquement assignés aux groupes scolaires qui souscrivent à ce plan.
  </p>

  {/* Sélection des catégories */}
  <div className="space-y-2">
    <Label className="flex items-center gap-2">
      <Layers className="w-4 h-4" />
      Catégories incluses *
    </Label>
    <CategorySelector
      planSlug={form.watch('slug')}
      selectedCategoryIds={selectedCategoryIds}
      onCategoryChange={setSelectedCategoryIds}
    />
  </div>

  {/* Sélection des modules */}
  <div className="space-y-2">
    <Label className="flex items-center gap-2">
      <Package className="w-4 h-4" />
      Modules inclus *
    </Label>
    <ModuleSelector
      planSlug={form.watch('slug')}
      selectedCategoryIds={selectedCategoryIds}
      selectedModuleIds={selectedModuleIds}
      onModuleChange={setSelectedModuleIds}
    />
  </div>

  {/* Résumé */}
  <div className="p-4 bg-[#2A9D8F]/10 rounded-lg border border-[#2A9D8F]/30">
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-gray-900">Résumé de la sélection :</span>
      <div className="flex gap-4">
        <span className="text-[#2A9D8F] font-bold">
          {selectedCategoryIds.length} catégories
        </span>
        <span className="text-[#1D3557] font-bold">
          {selectedModuleIds.length} modules
        </span>
      </div>
    </div>
  </div>
</div>
```

---

### **ÉTAPE 3 : Tester le flux complet** 🔴

#### **Test 1 : Créer un plan avec modules** :

1. Aller sur `/dashboard/plans`
2. Cliquer "Nouveau Plan"
3. Remplir les informations de base
4. Sélectionner des catégories (ex: Scolarité, Pédagogie)
5. Sélectionner des modules
6. Sauvegarder
7. **Vérifier dans Supabase** :
   ```sql
   -- Vérifier le plan
   SELECT * FROM plans WHERE slug = 'premium';
   
   -- Vérifier les catégories assignées
   SELECT pc.*, bc.name 
   FROM plan_categories pc
   JOIN business_categories bc ON pc.category_id = bc.id
   WHERE pc.plan_id = '...';
   
   -- Vérifier les modules assignés
   SELECT pm.*, m.name 
   FROM plan_modules pm
   JOIN modules m ON pm.module_id = m.id
   WHERE pm.plan_id = '...';
   ```

#### **Test 2 : Créer un groupe avec ce plan** :

1. Aller sur `/dashboard/school-groups`
2. Créer un nouveau groupe
3. Sélectionner le plan créé
4. Sauvegarder
5. **Vérifier l'auto-assignation** :
   ```sql
   -- Vérifier les modules assignés au groupe
   SELECT gmc.*, m.name 
   FROM group_module_configs gmc
   JOIN modules m ON gmc.module_id = m.id
   WHERE gmc.school_group_id = '...'
   AND gmc.is_enabled = true;
   ```

#### **Test 3 : Modifier un plan** :

1. Éditer un plan existant
2. Ajouter/retirer des modules
3. Sauvegarder
4. **Vérifier** que les changements sont bien enregistrés

---

### **ÉTAPE 4 : Peupler les plans existants** 🟡 (OPTIONNEL)

Si vous avez déjà des plans créés sans modules/catégories, créez un script pour les peupler :

**Fichier** : `database/POPULATE_EXISTING_PLANS.sql`

```sql
-- Exemple : Assigner modules au plan Gratuit
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  (SELECT id FROM plans WHERE slug = 'gratuit'),
  id
FROM business_categories
WHERE required_plan = 'gratuit'
ON CONFLICT DO NOTHING;

INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM plans WHERE slug = 'gratuit'),
  id
FROM modules
WHERE required_plan = 'gratuit'
ON CONFLICT DO NOTHING;

-- Répéter pour premium, pro, institutionnel
```

---

## 📋 CHECKLIST FINALE

### **Base de données** :
- [ ] Exécuter `FIX_PLAN_MODULES_CATEGORIES.sql`
- [ ] Exécuter `CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql`
- [ ] Vérifier les contraintes et fonctions

### **Code React** :
- [ ] Modifier `PlanFormDialog.tsx` (imports, états, onSubmit, UI)
- [ ] Tester la compilation (`npm run build`)

### **Tests fonctionnels** :
- [ ] Créer un plan avec modules/catégories
- [ ] Vérifier dans Supabase (plan_modules, plan_categories)
- [ ] Créer un groupe avec ce plan
- [ ] Vérifier l'auto-assignation (group_module_configs)
- [ ] Modifier un plan existant
- [ ] Tester upgrade/downgrade de plan

### **Documentation** :
- [ ] Mettre à jour le README si nécessaire
- [ ] Documenter le flux dans un guide utilisateur

---

## 🎯 RÉSULTAT ATTENDU

### **Avant** ❌ :
```
1. Super Admin crée un plan
   → Aucun module/catégorie défini
2. Super Admin crée un groupe avec ce plan
   → Groupe n'a aucun module
3. Admin Groupe doit assigner manuellement
```

### **Après** ✅ :
```
1. Super Admin crée un plan
   → Sélectionne 3 catégories + 18 modules
   → Sauvegarde dans plan_modules et plan_categories
2. Super Admin crée un groupe avec ce plan
   → TRIGGER auto-assigne les 18 modules au groupe
   → Groupe a immédiatement accès aux modules
3. Admin Groupe peut activer/désactiver les modules disponibles
```

---

## 📚 FICHIERS MODIFIÉS/CRÉÉS

### **Créés** ✅ :
1. `ANALYSE_PLAN_MODULES_CATEGORIES.md`
2. `IMPLEMENTATION_PLAN_MODULES_CATEGORIES.md` (ce fichier)
3. `database/FIX_PLAN_MODULES_CATEGORIES.sql`
4. `database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql`
5. `src/features/dashboard/hooks/usePlanModules.ts`
6. `src/features/dashboard/components/plans/CategorySelector.tsx`
7. `src/features/dashboard/components/plans/ModuleSelector.tsx`

### **À modifier** ⏳ :
1. `src/features/dashboard/components/plans/PlanFormDialog.tsx`

---

## 🚀 ORDRE D'EXÉCUTION

1. **SQL** : Exécuter les 2 scripts dans Supabase
2. **Code** : Modifier `PlanFormDialog.tsx`
3. **Test** : Créer un plan, créer un groupe, vérifier
4. **Commit** : Commit les changements

---

## 💡 NOTES IMPORTANTES

### **Hiérarchie des plans** :
- **Gratuit** : Accès modules "gratuit" uniquement
- **Premium** : Accès modules "gratuit" + "premium"
- **Pro** : Accès modules "gratuit" + "premium" + "pro"
- **Institutionnel** : Accès à TOUS les modules

### **Logique d'assignation** :
- Quand un groupe souscrit → Modules assignés automatiquement
- Quand un groupe upgrade → Nouveaux modules ajoutés
- Quand un groupe downgrade → Modules retirés
- Quand abonnement expire → Tous les modules désactivés

### **Sécurité** :
- Seul Super Admin peut créer/modifier des plans
- Seul Super Admin peut assigner modules aux plans
- Admin Groupe peut seulement activer/désactiver les modules disponibles

---

**Prêt pour l'implémentation finale !** 🎯

**Prochaine étape** : Modifier `PlanFormDialog.tsx` selon les instructions ci-dessus.
