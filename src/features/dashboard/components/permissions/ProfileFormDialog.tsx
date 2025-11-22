import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const profileSchema = z.object({
  name_fr: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  code: z.string().min(3, 'Le code doit contenir au moins 3 caractères').regex(/^[a-z0-9_]+$/, 'Le code ne doit contenir que des lettres minuscules, chiffres et underscores'),
  description: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: any; // AccessProfile
}

export const ProfileFormDialog = ({
  isOpen,
  onClose,
  profileToEdit,
}: ProfileFormDialogProps) => {
  const queryClient = useQueryClient();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name_fr: '',
      code: '',
      description: '',
    },
  });

  // Reset form when profileToEdit changes
  useEffect(() => {
    if (profileToEdit) {
      form.reset({
        name_fr: profileToEdit.name_fr,
        code: profileToEdit.code,
        description: profileToEdit.description || '',
      });
    } else {
      form.reset({
        name_fr: '',
        code: '',
        description: '',
      });
    }
  }, [profileToEdit, form, isOpen]);

  // Mutation pour créer/modifier
  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (profileToEdit) {
        // Update
        const { error } = await supabase
          .from('access_profiles')
          .update({
            name_fr: values.name_fr,
            description: values.description,
            // code ne devrait pas être modifiable idéalement, mais bon
          })
          .eq('id', profileToEdit.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('access_profiles')
          .insert({
            name_fr: values.name_fr,
            name_en: values.name_fr, // Fallback en anglais
            code: values.code,
            description: values.description,
            permissions: {}, // Permissions vides par défaut
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast.success(
        profileToEdit 
          ? 'Profil mis à jour avec succès' 
          : 'Profil créé avec succès'
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erreur', {
        description: error.message
      });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {profileToEdit ? 'Modifier le profil' : 'Créer un nouveau profil'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name_fr">Nom du profil (FR)</Label>
            <Input
              id="name_fr"
              placeholder="Ex: Enseignant Principal"
              {...form.register('name_fr')}
            />
            {form.formState.errors.name_fr && (
              <p className="text-sm text-red-500">{form.formState.errors.name_fr.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code technique</Label>
            <Input
              id="code"
              placeholder="Ex: enseignant_principal"
              {...form.register('code')}
              disabled={!!profileToEdit} // Code non modifiable en édition
              className={!!profileToEdit ? 'bg-gray-100' : ''}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Identifiant unique utilisé par le système (minuscules, sans espaces).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du rôle et des accès associés..."
              {...form.register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-[#2A9D8F] hover:bg-[#238276]"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {profileToEdit ? 'Enregistrer' : 'Créer le profil'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
