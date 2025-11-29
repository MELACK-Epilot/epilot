/**
 * Dialogue de création/modification des informations d'un profil
 * Gère uniquement les infos de base (nom, code, description, avatar)
 * La configuration des modules se fait via RolePermissionsDialog
 */

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User as UserIcon, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AvatarUpload } from '../AvatarUpload';

import { USER_ROLES, getRoleLabel } from '@/config/roles';

// Mapping des émojis pour les rôles standards
const ROLE_EMOJIS: Record<string, string> = {
  'proviseur': '🎓',
  'directeur': '👔',
  'directeur_etudes': '📋',
  'secretaire': '📝',
  'comptable': '💰',
  'enseignant': '👨‍🏫',
  'cpe': '🎯',
  'surveillant': '👮',
  'bibliothecaire': '📚',
  'gestionnaire_cantine': '🍽️',
  'conseiller_orientation': '🧭',
  'infirmier': '⚕️',
  'eleve': '🎒',
  'parent': '👨‍👩‍👧‍👦',
  'autre': '👤',
  'admin_groupe': '🏫',
};

const profileSchema = z.object({
  name_fr: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  code: z.string().min(3, 'Le code doit contenir au moins 3 caractères').regex(/^[a-z0-9_]+$/, 'Le code ne doit contenir que des lettres minuscules, chiffres et underscores'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: any;
}

export const ProfileFormDialog = ({
  isOpen,
  onClose,
  profileToEdit,
}: ProfileFormDialogProps) => {
  const queryClient = useQueryClient();
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [emojiIcon, setEmojiIcon] = useState<string>('👤');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name_fr: '',
      code: '',
      description: '',
      icon: '👤',
    },
  });

  // Reset form when dialog opens or profileToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (profileToEdit) {
        form.reset({
          name_fr: profileToEdit.name_fr || '',
          code: profileToEdit.code || '',
          description: profileToEdit.description || '',
          icon: profileToEdit.icon || '👤',
        });
        setAvatarPreview(profileToEdit.icon?.startsWith('http') ? profileToEdit.icon : null);
        setEmojiIcon(profileToEdit.icon?.startsWith('http') ? '👤' : (profileToEdit.icon || '👤'));
        setAvatarFile(null);
        setIsCustomRole(true);
      } else {
        form.reset({
          name_fr: '',
          code: '',
          description: '',
          icon: '👤',
        });
        setAvatarPreview(null);
        setEmojiIcon('👤');
        setAvatarFile(null);
        setIsCustomRole(false);
      }
    }
  }, [profileToEdit, form, isOpen]);

  // Handler pour la sélection de rôle standard
  const handleRoleSelect = (roleCode: string) => {
    if (roleCode === 'custom') {
      setIsCustomRole(true);
      form.setValue('name_fr', '');
      form.setValue('code', '');
      setEmojiIcon('👤');
      form.setValue('icon', '👤');
    } else {
      setIsCustomRole(false);
      const label = getRoleLabel(roleCode);
      const emoji = ROLE_EMOJIS[roleCode] || '👤';
      
      form.setValue('name_fr', label);
      form.setValue('code', roleCode);
      form.setValue('description', `Profil standard pour ${label}`);
      setEmojiIcon(emoji);
      form.setValue('icon', emoji);
    }
  };

  // Handler pour l'avatar
  const handleAvatarChange = useCallback((file: File | null, preview: string | null) => {
    setAvatarFile(file);
    setAvatarPreview(preview);
  }, [form]);

  // Handlers pour les permissions
  const handleTogglePermission = (moduleSlug: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleSlug]: checked
    }));
  };

  const handleToggleCategory = (category: Category, checked: boolean) => {
    const newPermissions = { ...permissions };
    category.modules.forEach((module: any) => {
      newPermissions[module.slug] = checked;
    });
    setPermissions(newPermissions);
  };

  const isCategoryChecked = (category: Category) => {
    if (category.modules.length === 0) return false;
    return category.modules.every((m: any) => permissions[m.slug]);
  };

  // Calculer le nombre de modules actifs
  const activeCount = Object.values(permissions).filter(Boolean).length;

  // Mutation pour créer/modifier
  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      let finalIcon = values.icon; // Par défaut l'icône textuelle

      // 1. Upload Avatar si présent
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `profile_${Date.now()}.${fileExt}`;
          const filePath = `avatars/profiles/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('files') // Bucket générique
            .upload(filePath, avatarFile);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Fallback silencieux ou throw selon préférence. 
            // Ici on continue mais on prévient
            toast.error("Erreur lors de l'upload de l'image");
          } else {
            const { data } = supabase.storage.from('files').getPublicUrl(filePath);
            finalIcon = data.publicUrl; // On stocke l'URL dans le champ icon
          }
        } catch (e) {
          console.error('Upload exception:', e);
        }
      } else if (avatarPreview && avatarPreview.startsWith('http')) {
        // Si on a déjà une URL en preview (modif sans changer l'image)
        finalIcon = avatarPreview;
      }

      const profileData = {
        name_fr: values.name_fr,
        description: values.description,
        permissions: permissions,
        icon: finalIcon, // Stockage URL ou Emoji
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (profileToEdit) {
        // Update
        // @ts-ignore
        const { error } = await supabase
          .from('access_profiles')
          .update(profileData)
          .eq('id', profileToEdit.id);
        if (error) throw error;
      } else {
        // Create
        // @ts-ignore
        const { error } = await supabase
          .from('access_profiles')
          .insert({
            ...profileData,
            name_en: values.name_fr,
            code: values.code,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast.success(
        profileToEdit 
          ? 'Profil mis à jour avec succès' 
          : 'Nouveau profil créé avec succès'
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#1D3557]">
            {profileToEdit ? (
              <>
                <UserIcon className="w-6 h-6 text-[#2A9D8F]" />
                Modifier le profil
              </>
            ) : (
              <>
                <UserIcon className="w-6 h-6 text-[#1D3557]" />
                Créer un nouveau profil
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Définissez les informations générales et les accès aux modules pour ce profil.
          </DialogDescription>
        </DialogHeader>

        {/* SCROLL NATIF ROBUSTE */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Layout en 3 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Colonne 1 : Identité Visuelle (Avatar Upload) */}
              <div className="lg:col-span-1">
                <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Identité du Profil</h3>
                  <div className="flex flex-col items-center justify-center gap-4">
                    <AvatarUpload
                      value={avatarPreview || undefined}
                      onChange={handleAvatarChange}
                      firstName={form.watch('name_fr')}
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Cliquez pour changer l'image.<br/>
                      Format supporté : JPG, PNG, WebP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonnes 2-3 : Formulaire */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
                <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Informations Générales
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sélection du Nom / Modèle */}
                      <div className="space-y-2">
                        <Label>Nom du profil <span className="text-red-500">*</span></Label>
                        
                        {!profileToEdit ? (
                          <div className="space-y-3">
                            <Select 
                              onValueChange={handleRoleSelect} 
                              defaultValue={isCustomRole ? 'custom' : (form.getValues('code') || undefined)}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Sélectionner un rôle..." />
                              </SelectTrigger>
                              <SelectContent>
                                {USER_ROLES.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    <span className="mr-2">{ROLE_EMOJIS[role] || '👤'}</span>
                                    {getRoleLabel(role)}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">✨ Autre (Personnalisé)</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Input Nom si personnalisé */}
                            {isCustomRole && (
                              <Input
                                id="name_fr"
                                placeholder="Ex: Enseignant Stagiaire"
                                {...form.register('name_fr')}
                                className="bg-white"
                              />
                            )}
                          </div>
                        ) : (
                          <Input
                            id="name_fr"
                            placeholder="Ex: Enseignant Principal"
                            {...form.register('name_fr')}
                            className="bg-white"
                          />
                        )}
                        
                        {form.formState.errors.name_fr && (
                          <p className="text-sm text-red-500">{form.formState.errors.name_fr.message}</p>
                        )}
                      </div>

                      {/* Code Technique */}
                      <div className="space-y-2">
                        <Label htmlFor="code">Code technique <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input
                            id="code"
                            placeholder="Ex: enseignant_principal"
                            {...form.register('code')}
                            disabled={!!profileToEdit || !isCustomRole} // Désactivé si édition OU rôle standard
                            className={(!isCustomRole || !!profileToEdit) ? 'bg-gray-100 text-gray-500 font-mono' : 'bg-white font-mono'}
                          />
                          {(!isCustomRole && !profileToEdit && form.getValues('code')) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                              Automatique
                            </div>
                          )}
                        </div>
                        {form.formState.errors.code && (
                          <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                        )}
                        <p className="text-[10px] text-gray-500">
                          Identifiant système unique.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez le rôle et les responsabilités associés..."
                        {...form.register('description')}
                        className="bg-white resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CONFIGURATION DES ACCÈS */}
                <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      Configuration des Modules
                    </h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      {activeCount} modules sélectionnés
                    </Badge>
                  </div>

                  {modulesLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : !categories || categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl border border-dashed border-gray-300">
                      <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>Aucun module disponible.</p>
                      <Button 
                        variant="link" 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['all-modules-categories'] })}
                        className="mt-2"
                      >
                        Réessayer le chargement
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const isFullyChecked = isCategoryChecked(category);
                        
                        return (
                          <div key={category.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header Catégorie */}
                            <div className="flex items-center justify-between p-3 bg-gray-50/50 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded-md border border-gray-100 shadow-sm">
                                  {(() => {
                                    const Icon = getModuleIcon(category.icon);
                                    return <Icon className="h-4 w-4" style={{ color: category.color || '#6B7280' }} />;
                                  })()}
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm">{category.name}</h4>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                  Tout
                                </span>
                                <Switch
                                  checked={isFullyChecked}
                                  onCheckedChange={(checked) => handleToggleCategory(category, checked)}
                                  className="scale-75 data-[state=checked]:bg-[#1D3557]"
                                />
                              </div>
                            </div>

                            {/* Liste Modules */}
                            <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {category.modules.map((module) => (
                                <div 
                                  key={module.id} 
                                  className={`flex items-center justify-between p-2.5 rounded-md border transition-all duration-200 ${
                                    permissions[module.slug] 
                                      ? 'bg-blue-50/40 border-blue-100' 
                                      : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Switch
                                      checked={permissions[module.slug] || false}
                                      onCheckedChange={(checked) => handleTogglePermission(module.slug, checked)}
                                      className="scale-75 data-[state=checked]:bg-[#2A9D8F] mr-1 flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className={`text-sm font-medium truncate ${permissions[module.slug] ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {module.name}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="profile-form" // Lier au formulaire
            disabled={mutation.isPending}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#1D3557] hover:from-[#238276] hover:to-[#152a45]"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {profileToEdit ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              <>{profileToEdit ? "Mettre à jour le profil" : "Créer le profil"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
