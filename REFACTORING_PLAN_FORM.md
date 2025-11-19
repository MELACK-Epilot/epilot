# 🔧 REFACTORING PLANFORMDIALOG - DÉCOUPAGE MODULAIRE

**Date:** 19 novembre 2025  
**Workflow:** `/planform`  
**Fichier original:** 789 lignes → **DÉPASSEMENT +439 lignes**

---

## 📊 ANALYSE

### Problème
- **Taille:** 789 lignes (limite: 350)
- **Responsabilités multiples:** Validation, état, UI, soumission
- **Maintenabilité:** Difficile à tester et modifier

### Solution
Découpage en **8 fichiers modulaires** selon architecture imposée

---

## 🗂️ NOUVELLE STRUCTURE

```
src/features/dashboard/
├── components/plans/
│   ├── PlanFormDialog.tsx          # ✅ Composition (150 lignes)
│   ├── PlanForm.types.ts           # ✅ Types (50 lignes)
│   └── tabs/
│       ├── PlanFormGeneral.tsx     # ✅ Onglet 1 (130 lignes)
│       ├── PlanFormPricing.tsx     # Onglet 2 (100 lignes)
│       ├── PlanFormLimits.tsx      # Onglet 3 (120 lignes)
│       └── PlanFormModules.tsx     # Onglet 4 (100 lignes)
├── hooks/
│   └── usePlanForm.ts              # ✅ Logique (250 lignes)
└── utils/
    └── planForm.utils.ts           # ✅ Helpers (30 lignes)
```

**Total:** 930 lignes réparties en 8 fichiers  
**Max par fichier:** 250 lignes ✅

---

## 📦 FICHIERS CRÉÉS

### 1. Types & Validation
**Fichier:** `PlanForm.types.ts` (50 lignes)
- Schéma Zod `planFormSchema`
- Type `PlanFormValues`
- Interfaces props

### 2. Utilitaires
**Fichier:** `planForm.utils.ts` (30 lignes)
- `generateSlug()` - Génération slug
- `featuresToString()` - Conversion features
- `stringToFeatures()` - Parse features

### 3. Hook de Gestion
**Fichier:** `usePlanForm.ts` (250 lignes)
- Gestion état (catégories, modules, tabs)
- Logique formulaire
- Soumission et validation
- Synchronisation données

### 4. Onglet Général
**Fichier:** `tabs/PlanFormGeneral.tsx` (130 lignes)
- Informations de base
- Type de plan
- Description
- Fonctionnalités

---

## 📝 FICHIERS À CRÉER

### 5. Onglet Tarification
**Fichier:** `tabs/PlanFormPricing.tsx`

```typescript
import { DollarSign, Gift, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PlanFormTabProps } from '../PlanForm.types';

export const PlanFormPricing = ({ form }: PlanFormTabProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Tarification
        </h3>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="price">Prix *</Label>
            <Input
              id="price"
              type="number"
              {...form.register('price', { valueAsNumber: true })}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select
              value={form.watch('currency')}
              onValueChange={(value) => form.setValue('currency', value as 'FCFA' | 'EUR' | 'USD')}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFA">FCFA</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingPeriod">Période *</Label>
            <Select
              value={form.watch('billingPeriod')}
              onValueChange={(value) => form.setValue('billingPeriod', value as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="biannual">Semestriel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Réduction (%)
            </Label>
            <Input
              id="discount"
              type="number"
              {...form.register('discount', { valueAsNumber: true })}
              placeholder="0"
              min="0"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialDays" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Essai gratuit (jours)
            </Label>
            <Input
              id="trialDays"
              type="number"
              {...form.register('trialDays', { valueAsNumber: true })}
              placeholder="0"
              min="0"
              max="90"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 6. Onglet Limites
**Fichier:** `tabs/PlanFormLimits.tsx`

```typescript
import { Users, Building2, HardDrive, Headphones, Palette, Zap, Crown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PlanFormTabProps } from '../PlanForm.types';

export const PlanFormLimits = ({ form }: PlanFormTabProps) => {
  return (
    <div className="space-y-6">
      {/* Limites */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Limites & Quotas
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxSchools" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nombre d'écoles max
            </Label>
            <Input
              id="maxSchools"
              type="number"
              {...form.register('maxSchools', { valueAsNumber: true })}
              placeholder="-1 pour illimité"
              min="-1"
            />
            <p className="text-xs text-gray-500">-1 = Illimité</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStudents">Nombre d'élèves max</Label>
            <Input
              id="maxStudents"
              type="number"
              {...form.register('maxStudents', { valueAsNumber: true })}
              placeholder="-1 pour illimité"
              min="-1"
            />
            <p className="text-xs text-gray-500">-1 = Illimité</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStaff">Personnel max</Label>
            <Input
              id="maxStaff"
              type="number"
              {...form.register('maxStaff', { valueAsNumber: true })}
              placeholder="-1 pour illimité"
              min="-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStorage" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Stockage (GB)
            </Label>
            <Input
              id="maxStorage"
              type="number"
              {...form.register('maxStorage', { valueAsNumber: true })}
              placeholder="5"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Support & Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Headphones className="w-5 h-5" />
          Support & Options
        </h3>

        <div className="space-y-2">
          <Label htmlFor="supportLevel">Niveau de support</Label>
          <Select
            value={form.watch('supportLevel')}
            onValueChange={(value) => form.setValue('supportLevel', value as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email uniquement</SelectItem>
              <SelectItem value="priority">Support prioritaire</SelectItem>
              <SelectItem value="24/7">Support 24/7</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <Label htmlFor="customBranding" className="cursor-pointer">Branding personnalisé</Label>
            </div>
            <Switch
              id="customBranding"
              checked={form.watch('customBranding')}
              onCheckedChange={(checked) => form.setValue('customBranding', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <Label htmlFor="apiAccess" className="cursor-pointer">Accès API</Label>
            </div>
            <Switch
              id="apiAccess"
              checked={form.watch('apiAccess')}
              onCheckedChange={(checked) => form.setValue('apiAccess', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#E9C46A]" />
              <Label htmlFor="isPopular" className="cursor-pointer">Plan populaire</Label>
            </div>
            <Switch
              id="isPopular"
              checked={form.watch('isPopular')}
              onCheckedChange={(checked) => form.setValue('isPopular', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 7. Onglet Modules
**Fichier:** `tabs/PlanFormModules.tsx`

```typescript
import { Layers, Package } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CategorySelector } from '../CategorySelector';
import { ModuleSelector } from '../ModuleSelector';
import type { PlanFormModulesTabProps } from '../PlanForm.types';

export const PlanFormModules = ({
  form,
  selectedCategoryIds,
  setSelectedCategoryIds,
  selectedModuleIds,
  setSelectedModuleIds,
  searchQuery,
  setSearchQuery,
  validSelectedModules,
}: PlanFormModulesTabProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Catégories & Modules
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez les catégories et modules inclus dans ce plan.
        </p>

        {/* Barre de recherche */}
        <div className="space-y-2">
          <Label htmlFor="search" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Rechercher des catégories ou modules
          </Label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sélection des catégories */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Catégories incluses *
          </Label>
          <CategorySelector
            planSlug={form.watch('planType') || 'gratuit'}
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
            planSlug={form.watch('planType') || 'gratuit'}
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
                {selectedCategoryIds.length} {selectedCategoryIds.length > 1 ? 'catégories' : 'catégorie'}
              </span>
              <span className="text-[#1D3557] font-bold">
                {validSelectedModules.length} {validSelectedModules.length > 1 ? 'modules' : 'module'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 8. Composant Principal
**Fichier:** `PlanFormDialog.tsx` (NOUVEAU - 150 lignes)

```typescript
import { Loader2, Package, Info, DollarSign, Settings, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePlanForm } from '../../hooks/usePlanForm';
import { PlanFormGeneral } from './tabs/PlanFormGeneral';
import { PlanFormPricing } from './tabs/PlanFormPricing';
import { PlanFormLimits } from './tabs/PlanFormLimits';
import { PlanFormModules } from './tabs/PlanFormModules';
import type { PlanFormDialogProps } from './PlanForm.types';

export const PlanFormDialog = ({ open, onOpenChange, plan, mode }: PlanFormDialogProps) => {
  const {
    form,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedModuleIds,
    setSelectedModuleIds,
    validSelectedModules,
    isLoading,
    onSubmit,
    generateSlug,
  } = usePlanForm(plan, mode, () => onOpenChange(false));

  const handleNameChange = (name: string) => {
    if (mode === 'create') {
      form.setValue('slug', generateSlug(name));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-[#1D3557]" />
            {mode === 'create' ? 'Créer un nouveau plan' : 'Modifier le plan'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'create'
              ? 'Configurez les détails du nouveau plan d\'abonnement'
              : 'Modifiez les informations du plan d\'abonnement'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 mx-6 my-3 shrink-0">
              <TabsTrigger value="general" className="flex items-center gap-1.5 text-sm">
                <Info className="w-3.5 h-3.5" />
                Général
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-3.5 h-3.5" />
                Tarification
              </TabsTrigger>
              <TabsTrigger value="limits" className="flex items-center gap-1.5 text-sm">
                <Settings className="w-3.5 h-3.5" />
                Limites & Options
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-1.5 text-sm">
                <Layers className="w-3.5 h-3.5" />
                Modules & Catégories
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
              <TabsContent value="general" className="mt-0">
                <PlanFormGeneral form={form} mode={mode} onNameChange={handleNameChange} />
              </TabsContent>

              <TabsContent value="pricing" className="mt-0">
                <PlanFormPricing form={form} mode={mode} />
              </TabsContent>

              <TabsContent value="limits" className="mt-0">
                <PlanFormLimits form={form} mode={mode} />
              </TabsContent>

              <TabsContent value="modules" className="mt-0">
                <PlanFormModules
                  form={form}
                  mode={mode}
                  selectedCategoryIds={selectedCategoryIds}
                  setSelectedCategoryIds={setSelectedCategoryIds}
                  selectedModuleIds={selectedModuleIds}
                  setSelectedModuleIds={setSelectedModuleIds}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  validSelectedModules={validSelectedModules}
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-gray-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              size="sm"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#2A9D8F] hover:bg-[#1D8A7E]"
              size="sm"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {mode === 'create' ? 'Créer le plan' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlanFormDialog;
```

---

## ✅ RÉSULTAT FINAL

### Avant
- ❌ 1 fichier de 789 lignes
- ❌ Responsabilités mélangées
- ❌ Difficile à tester
- ❌ Difficile à maintenir

### Après
- ✅ 8 fichiers modulaires
- ✅ Max 250 lignes par fichier
- ✅ Séparation des responsabilités
- ✅ Testable unitairement
- ✅ Maintenable facilement

### Bénéfices
1. **Lisibilité** - Chaque fichier a un rôle clair
2. **Testabilité** - Hooks et utils testables séparément
3. **Réutilisabilité** - Onglets réutilisables
4. **Performance** - Lazy loading possible
5. **Collaboration** - Plusieurs devs peuvent travailler en parallèle

---

## 🚀 PROCHAINES ÉTAPES

1. Créer les 3 fichiers d'onglets manquants
2. Remplacer l'ancien `PlanFormDialog.tsx`
3. Tester le formulaire
4. Vérifier les imports

**Le découpage est conforme au workflow `/planform`!** ✅
