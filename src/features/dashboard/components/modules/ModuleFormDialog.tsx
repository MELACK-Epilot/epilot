/**
 * Formulaire de création/modification de module
 * La catégorie est OBLIGATOIRE
 */

import { useEffect, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateModule, useUpdateModule } from '../../hooks/useModules';
import { useCategories } from '../../hooks/useCategories';

/**
 * Schéma de validation Zod
 * La catégorie est OBLIGATOIRE
 */
const moduleSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  slug: z
    .string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(100, 'Le slug ne peut pas dépasser 100 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(500, 'La description ne peut pas dépasser 500 caractères'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Format de version invalide (ex: 1.0.0)'),
  categoryId: z
    .string()
    .uuid('Catégorie invalide')
    .min(1, 'La catégorie est obligatoire'), // OBLIGATOIRE
  requiredPlan: z.enum(['gratuit', 'premium', 'pro', 'institutionnel']),
  status: z.enum(['active', 'inactive', 'beta', 'deprecated']),
  isPremium: z.boolean().default(false),
  isCore: z.boolean().default(false),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: any | null;
  mode: 'create' | 'edit';
}

export const ModuleFormDialog = ({ open, onOpenChange, module, mode }: ModuleFormDialogProps) => {
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      version: '1.0.0',
      categoryId: '',
      requiredPlan: 'gratuit',
      status: 'active',
      isPremium: false,
      isCore: false,
    },
  });

  // Réinitialiser le formulaire
  useEffect(() => {
    if (!open) return;

    if (module && mode === 'edit') {
      form.reset({
        name: module.name || '',
        slug: module.slug || '',
        description: module.description || '',
        version: module.version || '1.0.0',
        categoryId: module.categoryId || '',
        requiredPlan: module.requiredPlan || 'gratuit',
        status: module.status || 'active',
        isPremium: module.isPremium || false,
        isCore: module.isCore || false,
      });
    } else if (mode === 'create') {
      form.reset({
        name: '',
        slug: '',
        description: '',
        version: '1.0.0',
        categoryId: '',
        requiredPlan: 'gratuit',
        status: 'active',
        isPremium: false,
        isCore: false,
      });
    }

    return () => {
      if (!open) {
        form.clearErrors();
      }
    };
  }, [module, mode, open, form]);

  // Générer automatiquement le slug depuis le nom
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && mode === 'create') {
        const slug = value.name
          ?.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        form.setValue('slug', slug || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, mode]);

  const onSubmit = useCallback(
    async (values: ModuleFormValues) => {
      console.log('🚀 onSubmit appelé avec les valeurs:', values);
      console.log('📋 Mode:', mode);
      console.log('📦 Module:', module);

      // Validation supplémentaire côté client
      if (!values.categoryId) {
        toast.error('❌ Erreur de validation', {
          description: 'La catégorie est obligatoire. Veuillez sélectionner une catégorie.',
          duration: 5000,
        });
        return;
      }

      startTransition(async () => {
        try {
          if (mode === 'create') {
            await createModule.mutateAsync(values);
            toast.success('✅ Module créé avec succès', {
              description: `${values.name} a été ajouté`,
              duration: 5000,
            });
          } else if (module) {
            await updateModule.mutateAsync({
              id: module.id,
              ...values,
            });
            toast.success('✅ Module modifié avec succès', {
              description: 'Les modifications ont été enregistrées',
              duration: 3000,
            });
          }

          // Fermer le dialog et réinitialiser
          onOpenChange(false);
          form.reset();
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Une erreur est survenue lors de l\'enregistrement';
          
          console.error('❌ ModuleFormDialog error:', error);
          
          toast.error('❌ Erreur', {
            description: errorMessage,
            duration: 5000,
          });
        }
      });
    },
    [mode, module, createModule, updateModule, onOpenChange, form]
  );

  const isLoading = createModule.isPending || updateModule.isPending || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="module-form-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6 text-[#2A9D8F]" />
            {mode === 'create' ? '➕ Créer un Module' : '✏️ Modifier le Module'}
          </DialogTitle>
          <DialogDescription id="module-form-description">
            {mode === 'create' 
              ? 'Créez un nouveau module pédagogique. La catégorie est obligatoire.'
              : 'Modifiez les informations du module pédagogique.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout Paysage : 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne Gauche */}
              <div className="space-y-4">
                {/* Nom et Slug */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du module *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Gestion des Notes" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="gestion-notes" 
                            {...field} 
                            disabled={isLoading || mode === 'edit'}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {mode === 'create' ? 'Généré automatiquement' : 'Non modifiable'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Décrivez ce module..."
                          rows={4}
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Version */}
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1.0.0" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Format: X.Y.Z (ex: 1.0.0)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Colonne Droite */}
              <div className="space-y-4">
                {/* Catégorie OBLIGATOIRE */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span>Catégorie *</span>
                        <AlertCircle className="h-4 w-4 text-[#E63946]" />
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading || categoriesLoading}
                      >
                        <FormControl>
                          <SelectTrigger className={!field.value ? 'border-[#E63946]' : ''}>
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 text-[#E63946] mt-0.5" />
                        <span className="text-[#E63946]">
                          Obligatoire : Chaque module doit appartenir à une catégorie
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Plan requis */}
                <FormField
                  control={form.control}
                  name="requiredPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan requis *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gratuit">Gratuit</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="institutionnel">Institutionnel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Statut */}
                {mode === 'edit' && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">✅ Actif</SelectItem>
                            <SelectItem value="inactive">⏸️ Inactif</SelectItem>
                            <SelectItem value="beta">🧪 Beta</SelectItem>
                            <SelectItem value="deprecated">⚠️ Déprécié</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Checkboxes Premium et Core */}
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Module Premium</FormLabel>
                          <FormDescription className="text-xs">
                            Réservé aux abonnements premium et supérieurs
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isCore"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Module Core</FormLabel>
                          <FormDescription className="text-xs">
                            Module essentiel au fonctionnement de la plateforme
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[100px] bg-[#2A9D8F] hover:bg-[#1D3557]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : mode === 'create' ? (
                  '✅ Créer'
                ) : (
                  '💾 Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
