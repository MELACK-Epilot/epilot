/**
 * Formulaire d'inscription complet en 6 étapes
 * Adapté à la structure réelle de la table inscriptions
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Users, GraduationCap, DollarSign, FileText, CheckCircle,
  ArrowRight, ArrowLeft, Save, X, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useCreateInscription } from '../hooks/mutations/useCreateInscription';
import { useUpdateInscription } from '../hooks/mutations/useUpdateInscription';
import { inscriptionFormSchema, type InscriptionFormData } from '../utils/validation';

// Import des étapes
import { InscriptionStep1 } from './steps/InscriptionStep1';
import { InscriptionStep2 } from './steps/InscriptionStep2';
import { InscriptionStep3 } from './steps/InscriptionStep3';
import { InscriptionStep4 } from './steps/InscriptionStep4';
import { InscriptionStep5 } from './steps/InscriptionStep5';
import { InscriptionStep6 } from './steps/InscriptionStep6';

// ============================================================================
// CONFIGURATION DES ÉTAPES
// ============================================================================

const STEPS = [
  {
    id: 1,
    title: 'Informations Générales',
    description: 'Identité de l\'élève',
    icon: User,
    color: 'bg-blue-500',
  },
  {
    id: 2,
    title: 'Parents / Tuteurs',
    description: 'Contacts des responsables',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    id: 3,
    title: 'Informations Scolaires',
    description: 'Niveau et classe',
    icon: GraduationCap,
    color: 'bg-purple-500',
  },
  {
    id: 4,
    title: 'Informations Financières',
    description: 'Frais et paiements',
    icon: DollarSign,
    color: 'bg-orange-500',
  },
  {
    id: 5,
    title: 'Documents',
    description: 'Pièces justificatives',
    icon: FileText,
    color: 'bg-pink-500',
  },
  {
    id: 6,
    title: 'Validation',
    description: 'Vérification finale',
    icon: CheckCircle,
    color: 'bg-teal-500',
  },
];

// ============================================================================
// PROPS
// ============================================================================

interface InscriptionFormCompletProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId?: string;
  schoolId: string;
  onSuccess?: () => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const InscriptionFormComplet = ({
  open,
  onOpenChange,
  inscriptionId,
  schoolId,
  onSuccess,
}: InscriptionFormCompletProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const isEditing = !!inscriptionId;
  const createInscription = useCreateInscription();
  const updateInscription = useUpdateInscription();

  // ========================================================================
  // FORM SETUP
  // ========================================================================

  const form = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionFormSchema),
    defaultValues: {
      school_id: schoolId,
      student_nationality: 'Congolaise (RC)',
      city: 'Brazzaville',
      region: 'Brazzaville',
      academic_year: '2024-2025',
      type_inscription: 'nouvelle',
      est_redoublant: false,
      est_affecte: false,
      a_aide_sociale: false,
      est_pensionnaire: false,
      a_bourse: false,
      frais_inscription: 40000,
      frais_scolarite: 90000,
      montant_paye: 0,
    },
  });

  // ========================================================================
  // SAUVEGARDE BROUILLON (LocalStorage)
  // ========================================================================

  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem('inscription-draft');
      if (draft && !isEditing) {
        try {
          const draftData = JSON.parse(draft);
          form.reset(draftData);
          toast.info('Brouillon récupéré');
        } catch (error) {
          console.error('Erreur récupération brouillon:', error);
        }
      }
    }
  }, [open, isEditing]);

  useEffect(() => {
    if (open && !isEditing) {
      const subscription = form.watch((data) => {
        localStorage.setItem('inscription-draft', JSON.stringify(data));
      });
      return () => subscription.unsubscribe();
    }
  }, [open, isEditing, form]);

  // ========================================================================
  // NAVIGATION ENTRE ÉTAPES
  // ========================================================================

  const handleNext = async () => {
    // Définir les champs à valider par étape
    const fieldsToValidate: Record<number, (keyof InscriptionFormData)[]> = {
      1: ['student_first_name', 'student_last_name', 'student_gender', 'student_date_of_birth'],
      2: ['parent1_phone', 'parent2_phone'],
      3: ['academic_year', 'requested_level', 'type_inscription'], // requested_class_id retiré (optionnel)
      4: ['frais_inscription', 'frais_scolarite'],
      5: [], // Documents optionnels
      6: [], // Validation finale optionnelle
    };

    const currentFields = fieldsToValidate[currentStep] || [];
    
    // Si pas de champs à valider, passer directement
    if (currentFields.length === 0) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      
      toast.success(`Étape ${currentStep} complétée !`, {
        description: currentStep < STEPS.length ? `Passez à l'étape ${currentStep + 1}: ${STEPS[currentStep].title}` : 'Prêt pour enregistrement',
        duration: 2000,
      });
      
      const contentElement = document.querySelector('.overflow-y-auto');
      if (contentElement) {
        contentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // Valider uniquement les champs de l'étape actuelle
    const isValid = await form.trigger(currentFields);
    
    if (!isValid) {
      // Récupérer les erreurs des champs de cette étape
      const errors = form.formState.errors;
      const errorFields = currentFields.filter(field => errors[field]);
      
      if (errorFields.length > 0) {
        const firstError = errors[errorFields[0] as keyof typeof errors];
        const errorMessage = (firstError as any)?.message || 'Champ requis';
        
        toast.error(
          `${errorFields.length} champ${errorFields.length > 1 ? 's' : ''} à corriger`,
          {
            description: `${errorMessage}`,
            duration: 5000,
          }
        );
        
        // Scroller vers le premier champ en erreur avec focus
        const firstErrorField = errorFields[0];
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            element.focus();
          }, 500);
        }
      }
      return;
    }

    // Validation réussie, passer à l'étape suivante
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    
    // Toast de succès
    toast.success(`Étape ${currentStep} complétée !`, {
      description: currentStep < STEPS.length ? `Passez à l'étape ${currentStep + 1}: ${STEPS[currentStep].title}` : 'Prêt pour enregistrement',
      duration: 2000,
    });
    
    // Scroller en haut du formulaire avec animation
    const contentElement = document.querySelector('.overflow-y-auto');
    if (contentElement) {
      contentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  // ========================================================================
  // SOUMISSION FINALE
  // ========================================================================

  const onSubmit = async (data: InscriptionFormData) => {
    try {
      if (isEditing) {
        await updateInscription.mutateAsync({
          id: inscriptionId,
          ...data,
        });
        toast.success('Inscription mise à jour');
      } else {
        // Envoyer TOUTES les données du formulaire (déjà en snake_case)
        await createInscription.mutateAsync(data);
        toast.success('Inscription créée avec succès');
        localStorage.removeItem('inscription-draft');
      }
      
      onSuccess?.();
      onOpenChange(false);
      form.reset();
      setCurrentStep(1);
      setCompletedSteps([]);
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  // ========================================================================
  // FERMETURE
  // ========================================================================

  const handleClose = () => {
    // Vérifier si le formulaire a été modifié
    const isDirty = form.formState.isDirty;
    
    if (isDirty && currentStep > 1) {
      // Demander confirmation si des données ont été saisies
      const confirmClose = window.confirm(
        'Voulez-vous vraiment quitter ?\n\nLes modifications non enregistrées seront perdues.'
      );
      
      if (!confirmClose) {
        return; // Annuler la fermeture
      }
    }
    
    if (!isEditing && form.formState.isDirty) {
      const confirm = window.confirm(
        'Voulez-vous sauvegarder le brouillon avant de fermer ?'
      );
      if (!confirm) {
        localStorage.removeItem('inscription-draft');
      }
    }
    onOpenChange(false);
    form.reset();
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  // ========================================================================
  // CALCUL DE LA PROGRESSION
  // ========================================================================

  const progress = (currentStep / STEPS.length) * 100;

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-5xl w-[90vw] h-[95vh] overflow-hidden flex flex-col p-0"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Compact */}
          <div className="bg-gradient-to-r from-[#1D3557] to-[#2A9D8F] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{currentStep}</span>
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-white leading-tight">
                    {isEditing ? 'Modifier l\'inscription' : 'Nouvelle inscription'}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-sm mt-0.5">
                    {STEPS[currentStep - 1].title}
                  </DialogDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span className="font-medium">{currentStep}/{STEPS.length}</span>
            </div>
          </div>

          {/* Progress Bar Compact */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-4">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Stepper Horizontal Compact */}
          <div className="px-6 py-3 border-b bg-white">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = completedSteps.includes(step.id);
                const isAccessible = step.id <= currentStep || isCompleted;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isAccessible}
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        transition-all duration-200
                        ${isActive ? 'bg-[#1D3557] text-white ring-2 ring-[#1D3557] ring-offset-2' : ''}
                        ${isCompleted && !isActive ? 'bg-[#2A9D8F] text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                        ${isAccessible ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                      `}
                    >
                      {isCompleted && !isActive ? '✓' : step.id}
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1 bg-gray-200">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-[#2A9D8F]' : 'bg-gray-200'
                          }`}
                          style={{ width: isCompleted ? '100%' : '0%' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        {/* Contenu de l'étape - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="pb-4"
            >
              {currentStep === 1 && <InscriptionStep1 form={form} />}
              {currentStep === 2 && <InscriptionStep2 form={form} />}
              {currentStep === 3 && <InscriptionStep3 form={form} />}
              {currentStep === 4 && <InscriptionStep4 form={form} />}
              {currentStep === 5 && <InscriptionStep5 form={form} />}
              {currentStep === 6 && <InscriptionStep6 form={form} />}
            </motion.div>
          </AnimatePresence>
        </div>

          {/* Boutons de navigation */}
          <div className="flex items-center justify-between gap-4 p-6 border-t bg-white flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#1D3557] hover:bg-[#1D3557]/90 gap-2"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={createInscription.isPending || updateInscription.isPending}
                  className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 gap-2"
                >
                  {createInscription.isPending || updateInscription.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
