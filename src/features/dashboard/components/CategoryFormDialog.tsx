/**
 * Dialog pour créer/modifier une Catégorie Métier
 * @module CategoryFormDialog
 */

import { useEffect, useCallback } from 'react';
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
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories';
import { Loader2, Tag, Palette } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Schéma de validation Zod - VERSION COMPLÈTE LONG TERME
 */
const categorySchema = z.object({
  // Champs de base
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
  icon: z
    .string()
    .min(1, 'Veuillez sélectionner une icône'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide (ex: #1D3557)'),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
  
  // Champs avancés - Priorité HAUTE
  order_index: z
    .number()
    .int('Doit être un nombre entier')
    .min(0, 'Doit être positif ou zéro')
    .default(0),
  
  // Champs avancés - Priorité MOYENNE
  is_visible: z
    .boolean()
    .default(true),
  school_levels: z
    .array(z.enum(['maternel', 'primaire', 'college', 'lycee', 'centre_formation', 'universite']))
    .optional()
    .default([]),
  max_modules: z
    .number()
    .int('Doit être un nombre entier')
    .min(1, 'Minimum 1 module')
    .optional()
    .nullable(),
  
  // Champs avancés - Priorité BASSE
  cover_image: z
    .string()
    .url('URL invalide')
    .optional()
    .nullable()
    .or(z.literal('')),
  keywords: z
    .array(z.string())
    .optional()
    .default([]),
  owner_id: z
    .string()
    .uuid('ID utilisateur invalide')
    .optional()
    .nullable(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any | null;
  mode: 'create' | 'edit';
}

// Icônes disponibles (catégories pédagogiques)
const AVAILABLE_ICONS = [
  // Général
  { value: 'tag', label: 'Tag / Étiquette', icon: '🏷️', category: 'Général' },
  { value: 'folder', label: 'Dossier', icon: '📁', category: 'Général' },
  { value: 'star', label: 'Étoile', icon: '⭐', category: 'Général' },
  
  // Académique
  { value: 'book', label: 'Livre', icon: '📚', category: 'Académique' },
  { value: 'graduation', label: 'Diplôme', icon: '🎓', category: 'Académique' },
  { value: 'pencil', label: 'Crayon', icon: '✏️', category: 'Académique' },
  { value: 'notebook', label: 'Cahier', icon: '📓', category: 'Académique' },
  
  // Sciences
  { value: 'calculator', label: 'Calculatrice', icon: '🧮', category: 'Sciences' },
  { value: 'flask', label: 'Chimie', icon: '🧪', category: 'Sciences' },
  { value: 'microscope', label: 'Microscope', icon: '🔬', category: 'Sciences' },
  { value: 'atom', label: 'Atome', icon: '⚛️', category: 'Sciences' },
  
  // Géographie & Histoire
  { value: 'globe', label: 'Globe', icon: '🌍', category: 'Géographie' },
  { value: 'map', label: 'Carte', icon: '🗺️', category: 'Géographie' },
  { value: 'monument', label: 'Monument', icon: '🏛️', category: 'Histoire' },
  
  // Arts & Culture
  { value: 'palette', label: 'Palette', icon: '🎨', category: 'Arts' },
  { value: 'music', label: 'Musique', icon: '🎵', category: 'Arts' },
  { value: 'theater', label: 'Théâtre', icon: '🎭', category: 'Arts' },
  { value: 'camera', label: 'Photo', icon: '📷', category: 'Arts' },
  
  // Sport & Santé
  { value: 'dumbbell', label: 'Sport', icon: '🏋️', category: 'Sport' },
  { value: 'soccer', label: 'Football', icon: '⚽', category: 'Sport' },
  { value: 'heart', label: 'Santé', icon: '❤️', category: 'Santé' },
  
  // Technologie
  { value: 'computer', label: 'Ordinateur', icon: '💻', category: 'Technologie' },
  { value: 'robot', label: 'Robot', icon: '🤖', category: 'Technologie' },
  { value: 'lightbulb', label: 'Idée', icon: '💡', category: 'Technologie' },
  
  // Langues
  { value: 'speech', label: 'Parole', icon: '💬', category: 'Langues' },
  { value: 'book-open', label: 'Lecture', icon: '📖', category: 'Langues' },
  { value: 'abc', label: 'Alphabet', icon: '🔤', category: 'Langues' },
];

// Couleurs prédéfinies E-Pilot
const PRESET_COLORS = [
  { value: '#1D3557', label: 'Bleu Foncé' },
  { value: '#2A9D8F', label: 'Vert Cité' },
  { value: '#E9C46A', label: 'Or Républicain' },
  { value: '#E63946', label: 'Rouge Sobre' },
  { value: '#457B9D', label: 'Bleu Clair' },
  { value: '#F1FAEE', label: 'Blanc Cassé' },
  { value: '#264653', label: 'Bleu Nuit' },
  { value: '#2A9134', label: 'Vert Forêt' },
];

export const CategoryFormDialog = ({ open, onOpenChange, category, mode }: CategoryFormDialogProps) => {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: 'tag',
      color: '#1D3557',
      status: 'active',
      order_index: 0,
      is_visible: true,
      school_levels: [],
      max_modules: null,
      cover_image: '',
      keywords: [],
      owner_id: null,
    },
  });

  // Réinitialiser le formulaire
  useEffect(() => {
    if (!open) return;

    if (category && mode === 'edit') {
      form.reset({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || 'tag',
        color: category.color || '#1D3557',
        status: category.status || 'active',
        order_index: category.order_index ?? 0,
        is_visible: category.is_visible ?? true,
        school_levels: category.school_levels || [],
        max_modules: category.max_modules || null,
        cover_image: category.cover_image || '',
        keywords: category.keywords || [],
        owner_id: category.owner_id || null,
      });
    } else if (mode === 'create') {
      form.reset({
        name: '',
        slug: '',
        description: '',
        icon: 'tag',
        color: '#1D3557',
        status: 'active',
        order_index: 0,
        is_visible: true,
        school_levels: [],
        max_modules: null,
        cover_image: '',
        keywords: [],
        owner_id: null,
      });
    }

    return () => {
      if (!open) {
        form.clearErrors();
      }
    };
  }, [category, mode, open, form]);

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
    async (values: CategoryFormValues) => {
      console.log('🚀 onSubmit appelé avec les valeurs:', values);
      console.log('📋 Mode:', mode);
      console.log('🏷️ Category:', category);

      try {
        if (mode === 'create') {
          await createCategory.mutateAsync(values);
          toast.success('✅ Catégorie créée avec succès', {
            description: `${values.name} a été ajoutée`,
            duration: 5000,
          });
        } else if (category) {
          await updateCategory.mutateAsync({
            id: category.id,
            ...values,
          });
          toast.success('✅ Catégorie modifiée avec succès', {
            description: 'Les modifications ont été enregistrées',
            duration: 3000,
          });
        }

        onOpenChange(false);
        form.reset();
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue lors de l\'enregistrement';
        
        console.error('❌ CategoryFormDialog error:', error);
        
        toast.error('❌ Erreur', {
          description: errorMessage,
          duration: 5000,
        });
      }
    },
    [mode, category, createCategory, updateCategory, onOpenChange, form]
  );

  const isLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        aria-describedby="category-form-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Tag className="h-6 w-6 text-[#2A9D8F]" />
            {mode === 'create' ? '➕ Créer une Catégorie Métier' : '✏️ Modifier la Catégorie'}
          </DialogTitle>
          <DialogDescription id="category-form-description">
            {mode === 'create' 
              ? 'Créez une nouvelle catégorie pour organiser vos modules pédagogiques.'
              : 'Modifiez les informations de la catégorie métier.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout Paysage : 2 colonnes principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne Gauche */}
              <div className="space-y-4">
                {/* Nom et Slug */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Nom */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la catégorie *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Gestion Académique" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="gestion-academique" 
                            {...field} 
                            disabled={isLoading || mode === 'edit'}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {mode === 'create' ? 'Généré automatiquement depuis le nom' : 'Le slug ne peut pas être modifié'}
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
                          placeholder="Décrivez cette catégorie et les modules qu'elle contient..."
                          rows={4}
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Icône et Couleur */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Icône */}
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icône *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une icône" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABLE_ICONS.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                <span className="flex items-center gap-2">
                                  <span>{icon.icon}</span>
                                  <span>{icon.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Couleur */}
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Couleur *
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              type="color"
                              {...field} 
                              disabled={isLoading}
                              className="w-20 h-10 cursor-pointer"
                            />
                          </FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRESET_COLORS.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <span className="flex items-center gap-2">
                                    <span 
                                      className="w-4 h-4 rounded border border-gray-300" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    <span>{color.label}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ordre d'affichage */}
                <FormField
                  control={form.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Plus le nombre est petit, plus la catégorie apparaît en premier (0 = premier)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Visibilité */}
                <FormField
                  control={form.control}
                  name="is_visible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                        <FormLabel>Catégorie visible</FormLabel>
                        <FormDescription className="text-xs">
                          Décochez pour masquer cette catégorie sans la supprimer
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Colonne Droite */}
              <div className="space-y-4">
                {/* Niveaux scolaires */}
                <FormField
                  control={form.control}
                  name="school_levels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span>Niveaux scolaires</span>
                        <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
                      </FormLabel>
                      <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-br from-blue-50/50 to-green-50/50">
                        {/* Ordre logique : Maternel → Primaire → Collège → Lycée → Centre Formation → Université */}
                        {[
                          { value: 'maternel', label: '🍼 Maternel', description: '3-5 ans' },
                          { value: 'primaire', label: '📚 Primaire', description: '6-11 ans' },
                          { value: 'college', label: '🎓 Collège', description: '12-14 ans' },
                          { value: 'lycee', label: '🏫 Lycée', description: '15-17 ans' },
                          { value: 'centre_formation', label: '🔧 Centre de Formation', description: 'Formation professionnelle' },
                          { value: 'universite', label: '🎓 Université', description: 'Enseignement supérieur' },
                        ].map((level) => (
                          <label 
                            key={level.value} 
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-white/60 transition-colors cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(level.value as any)}
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, level.value]);
                                } else {
                                  field.onChange(current.filter((l) => l !== level.value));
                                }
                              }}
                              disabled={isLoading}
                              className="w-4 h-4 text-[#2A9D8F] rounded focus:ring-2 focus:ring-[#2A9D8F] cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 group-hover:text-[#1D3557]">
                                {level.label}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {level.description}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <FormDescription className="text-xs flex items-start gap-2">
                        <span className="text-[#2A9D8F]">ℹ️</span>
                        <span>
                          Sélectionnez un ou plusieurs niveaux concernés par cette catégorie. 
                          Laissez vide si la catégorie s'applique à tous les niveaux.
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nombre max de modules */}
                <FormField
              control={form.control}
              name="max_modules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre maximum de modules (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="Illimité" 
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Limitez le nombre de modules dans cette catégorie (laissez vide pour illimité)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

                {/* Image de couverture */}
                <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image de couverture (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/image.jpg" 
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    URL de l'image de couverture pour cette catégorie
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

                {/* Mots-clés */}
                <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mots-clés (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="mathématiques, calcul, algèbre (séparés par des virgules)" 
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => {
                        const keywords = e.target.value
                          .split(',')
                          .map(k => k.trim())
                          .filter(k => k.length > 0);
                        field.onChange(keywords);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Mots-clés pour améliorer la recherche (séparés par des virgules)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

                {/* Statut (modification uniquement) */}
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
