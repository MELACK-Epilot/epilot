/**
 * Dialog de création/modification d'un plan d'abonnement
 * Version refactorisée - Composition uniquement
 * @module PlanFormDialog
 */

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

            <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
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

          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-gray-50/50 shrink-0">
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
