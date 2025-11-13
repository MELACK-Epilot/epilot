/**
 * Dialog de formulaire pour créer/éditer un groupe scolaire
 * Version refactorisée et modulaire
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { SchoolGroup } from '@/features/dashboard/types/dashboard.types';

// Hooks personnalisés
import { useSchoolGroupForm } from './hooks/useSchoolGroupForm';
import { useLogoUpload } from './hooks/useLogoUpload';

// Sections du formulaire
import { BasicInfoSection } from './sections/BasicInfoSection';
import { ContactSection } from './sections/ContactSection';
import { DetailsSection } from './sections/DetailsSection';
import { LogoSection } from './sections/LogoSection';
import { PlanSection } from './sections/PlanSection';

interface SchoolGroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolGroup?: SchoolGroup | null;
  mode: 'create' | 'edit';
}

export const SchoolGroupFormDialog = ({ 
  open, 
  onOpenChange, 
  schoolGroup, 
  mode 
}: SchoolGroupFormDialogProps) => {
  // State pour la prévisualisation du logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Hook pour la logique du formulaire
  const { form, onSubmit, isLoading, yearsOfExistence } = useSchoolGroupForm({
    mode,
    schoolGroup,
    open,
    onOpenChange,
    setLogoPreview,
  });

  // Hook pour l'upload du logo
  const logoUpload = useLogoUpload({ form, setLogoPreview });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        aria-describedby="school-group-form-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1D3557]">
            {mode === 'create' ? '➕ Créer un groupe scolaire' : '✏️ Modifier le groupe scolaire'}
          </DialogTitle>
          <DialogDescription id="school-group-form-description">
            {mode === 'create'
              ? 'Remplissez les informations pour créer un nouveau groupe scolaire'
              : 'Modifiez les informations du groupe scolaire'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Colonne gauche */}
              <div className="space-y-4">
                <BasicInfoSection form={form} />
                <ContactSection form={form} />
                <DetailsSection form={form} yearsOfExistence={yearsOfExistence} />
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">
                <LogoSection
                  logoPreview={logoPreview}
                  isDragging={logoUpload.isDragging}
                  handleFileChange={logoUpload.handleFileChange}
                  handleDragOver={logoUpload.handleDragOver}
                  handleDragLeave={logoUpload.handleDragLeave}
                  handleDrop={logoUpload.handleDrop}
                  removeLogo={logoUpload.removeLogo}
                />
                <PlanSection form={form} mode={mode} />
              </div>
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="min-w-[100px] hover:bg-gray-50"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid}
                  className="min-w-[120px] bg-[#1D3557] hover:bg-[#2A9D8F] disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'create' ? '➕ Créer' : '💾 Enregistrer'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
