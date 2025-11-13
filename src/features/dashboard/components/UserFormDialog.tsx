// @ts-nocheck
/**
 * Dialog pour créer/modifier un Administrateur de Groupe
 * Version PAYSAGE avec upload d'avatar
 * @module UserFormDialog
 */

import { useEffect, useCallback, useTransition, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarUpload } from './AvatarUpload';
import { useCreateUser, useUpdateUser } from '../hooks/useUsers';
import { useSchoolGroups } from '../hooks/useSchoolGroups';
import { Loader2, User as UserIcon, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User } from '../types/dashboard.types';

/**
 * Schémas de validation avec validation stricte
 */
const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prénom ne peut contenir que des lettres'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres'),
  gender: z.enum(['M', 'F']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  email: z
    .string()
    .email('Email invalide')
    .toLowerCase()
    .refine((email) => email.endsWith('.cg') || email.endsWith('.com'), {
      message: 'Email doit se terminer par .cg ou .com',
    }),
  phone: z
    .string()
    .min(9, 'Le numéro doit contenir au moins 9 chiffres')
    .transform((val) => {
      // Nettoyer les espaces et caractères non numériques
      let cleaned = val.replace(/\D/g, '');

      // Si le numéro fait exactement 9 chiffres (format Congo), ajouter +242
      if (cleaned.length === 9) {
        cleaned = '+242' + cleaned;
      }
      // Si le numéro fait 11 chiffres et commence par 242, ajouter le +
      else if (cleaned.length === 11 && cleaned.startsWith('242')) {
        cleaned = '+' + cleaned;
      }
      // Si le numéro fait 12 chiffres et commence par +242, c'est déjà bon
      else if (cleaned.length === 12 && cleaned.startsWith('+242')) {
        // Rien à faire
      }
      // Autres cas : essayer d'ajouter +242 si ça semble être un numéro Congo
      else if (cleaned.length === 10 && (cleaned.startsWith('6') || cleaned.startsWith('5'))) {
        cleaned = '+2420' + cleaned;
      }
      else if (!cleaned.startsWith('+242')) {
        cleaned = '+242' + cleaned.replace(/^(\+?242)?/, '');
      }

      return cleaned;
    })
    .refine((val) => /^\+242[0-9]{9}$/.test(val), {
      message: 'Format invalide. Exemples valides: +242069698620 ou 069698620',
    }),
  role: z.enum(['super_admin', 'admin_groupe'], {
    errorMap: () => ({ message: 'Veuillez sélectionner un rôle' }),
  }),
  schoolGroupId: z
    .string()
    .optional()
    .refine((val) => !val || val.length > 0, {
      message: 'Veuillez sélectionner un groupe scolaire',
    }),
  avatar: z.string().optional(), // URL Supabase Storage
});

const createUserSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .max(100, 'Maximum 100 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial (!@#$%^&*)'),
  sendWelcomeEmail: z.boolean().default(true),
}).refine((data) => {
  // Si le rôle est admin_groupe, schoolGroupId est obligatoire
  if (data.role === 'admin_groupe') {
    return data.schoolGroupId && data.schoolGroupId.length > 0;
  }
  return true;
}, {
  message: 'Le groupe scolaire est obligatoire pour un Administrateur de Groupe',
  path: ['schoolGroupId'],
});

const updateUserSchema = baseUserSchema.extend({
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

export const UserFormDialog = ({ open, onOpenChange, user, mode }: UserFormDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const schoolGroupsQuery = useSchoolGroups();
  const schoolGroups = schoolGroupsQuery.data || [];
  const isLoadingGroups = schoolGroupsQuery.isLoading;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  // Memoize default values pour éviter les re-renders
  const defaultValues = useMemo(() => {
    if (mode === 'create') {
      return {
        firstName: '',
        lastName: '',
        gender: '' as any,  // Chaîne vide au lieu de undefined
        dateOfBirth: '',    // Chaîne vide au lieu de undefined
        email: '',
        phone: '',
        role: 'admin_groupe' as const,
        schoolGroupId: '',
        password: '',
        sendWelcomeEmail: true,
        avatar: '',
      };
    }
    return {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      gender: user?.gender || '' as any,
      dateOfBirth: user?.dateOfBirth || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'admin_groupe',
      schoolGroupId: user?.schoolGroupId || '',
      status: user?.status || 'active',
      avatar: user?.avatar || '',
    };
  }, [mode, user]);

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(mode === 'create' ? createUserSchema : updateUserSchema),
    defaultValues,
    mode: 'onSubmit', // Validation à la soumission pour éviter les blocages
    reValidateMode: 'onChange', // Re-validation en temps réel après la première soumission
  });

  // Réinitialiser le formulaire avec cleanup
  useEffect(() => {
    if (!open) return;

    const resetForm = () => {
      if (user && mode === 'edit') {
        form.reset({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          gender: user.gender || '' as any,
          dateOfBirth: user.dateOfBirth || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'admin_groupe',
          schoolGroupId: user.schoolGroupId || '',
          status: user.status || 'active',
          avatar: user.avatar || '',
        });
        setAvatarPreview(user.avatar || null);
        setAvatarRemoved(false);
      } else if (mode === 'create') {
        form.reset({
          firstName: '',
          lastName: '',
          gender: '' as any,
          dateOfBirth: '',
          email: '',
          phone: '',
          role: 'admin_groupe',
          schoolGroupId: '',
          password: '',
          sendWelcomeEmail: true,
          avatar: '',
        });
        setAvatarPreview(null);
        setAvatarRemoved(false);
      }
    };

    resetForm();

    // Cleanup: réinitialiser les erreurs quand le dialog se ferme
    return () => {
      if (!open) {
        form.clearErrors();
      }
    };
  }, [user, mode, open, form]);

  // Vider schoolGroupId quand on sélectionne Super Admin
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'role' && value.role === 'super_admin') {
        form.setValue('schoolGroupId', '');
        form.clearErrors('schoolGroupId');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Optimiser avec useCallback
  const onSubmit = useCallback(
    async (values: CreateUserFormValues | UpdateUserFormValues) => {
      console.log('🚀 onSubmit appelé avec les valeurs:', values);
      console.log('📋 Mode:', mode);
      console.log('👤 User:', user);
      
      // Validation supplémentaire côté client
      if (mode === 'create') {
        const createValues = values as CreateUserFormValues;
        
        // Vérifier que le groupe est sélectionné pour admin_groupe
        if (createValues.role === 'admin_groupe' && !createValues.schoolGroupId) {
          toast({
            title: '❌ Erreur de validation',
            description: 'Veuillez sélectionner un groupe scolaire pour un Administrateur de Groupe',
          });
          return;
        }
        
        // Vérifier que le mot de passe est fourni
        if (!createValues.password || createValues.password.length < 8) {
          toast({
            title: '❌ Erreur de validation',
            description: 'Le mot de passe doit contenir au moins 8 caractères',
          });
          return;
        }
      }
      
      startTransition(async () => {
        try {
          if (mode === 'create') {
            const createValues = values as CreateUserFormValues;

            // Préparer les données pour la création
            const dataToSubmit = {
              firstName: createValues.firstName.trim(),
              lastName: createValues.lastName.trim(),
              email: createValues.email.toLowerCase().trim(),
              phone: createValues.phone.replace(/\s/g, ''),
              role: createValues.role,
              schoolGroupId: createValues.role === 'super_admin' ? undefined : createValues.schoolGroupId,
              password: createValues.password,
              sendWelcomeEmail: createValues.sendWelcomeEmail,
              avatarFile: avatarFile,
              gender: createValues.gender || undefined,
              dateOfBirth: createValues.dateOfBirth || undefined,
            };
            
            console.log('📤 Données à soumettre (création):', dataToSubmit);
            
            console.log('⏳ Appel de createUser.mutateAsync...');
            const result = await createUser.mutateAsync(dataToSubmit);
            console.log('✅ createUser.mutateAsync terminé, résultat:', result);
            
            console.log('📢 Affichage du toast de succès...');
            toast({
              title: '✅ Utilisateur créé avec succès',
              description: `${createValues.firstName} ${createValues.lastName} a été ajouté`,
            });
            console.log('✅ Toast affiché');
            
            // Forcer le rafraîchissement de la liste
            console.log('🔄 Rafraîchissement de la liste des utilisateurs...');
            await queryClient.invalidateQueries({ queryKey: ['users'] });
            console.log('✅ Liste rafraîchie');
          } else if (user) {
            const updateValues = values as UpdateUserFormValues;

            // Préparer les données pour la mise à jour
            const dataToSubmit = {
              id: user.id,
              firstName: updateValues.firstName.trim(),
              lastName: updateValues.lastName.trim(),
              phone: updateValues.phone.replace(/\s/g, ''),
              schoolGroupId: updateValues.role === 'super_admin' ? undefined : updateValues.schoolGroupId,
              status: updateValues.status,
              avatarFile: avatarFile,
              avatarRemoved: avatarRemoved,
            };
            
            console.log('📤 Données à soumettre (modification):', dataToSubmit);
            
            await updateUser.mutateAsync(dataToSubmit);
            toast({
              title: '✅ Utilisateur modifié avec succès',
              description: 'Les modifications ont été enregistrées',
            });
          }
          
          // Fermer le dialog et réinitialiser
          console.log('🚪 Fermeture du dialog...');
          onOpenChange(false);
          console.log('✅ Dialog fermé');
          
          console.log('🔄 Réinitialisation du formulaire...');
          form.reset();
          setAvatarFile(null);
          setAvatarPreview(null);
          setAvatarRemoved(false);
          console.log('✅ Formulaire réinitialisé');
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Une erreur est survenue lors de l\'enregistrement';
          
          console.error('❌ UserFormDialog error:', error);
          toast({
            title: '❌ Erreur',
            description: errorMessage,
          });
        }
      });
    },
    [mode, user, avatarFile, avatarRemoved, createUser, updateUser, onOpenChange, form, queryClient]
  );

  const isLoading = createUser.isPending || updateUser.isPending || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        aria-describedby="user-form-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserIcon className="h-6 w-6 text-[#1D3557]" />
            {mode === 'create' ? '➕ Créer un Administrateur de Groupe' : '✏️ Modifier l\'Administrateur de Groupe'}
          </DialogTitle>
          <DialogDescription id="user-form-description">
            {mode === 'create' 
              ? 'Créez un nouvel administrateur qui gérera un groupe scolaire. Tous les champs marqués d\'un * sont obligatoires.'
              : 'Modifiez les informations de l\'administrateur de groupe. L\'email ne peut pas être modifié.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout Paysage : 3 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne 1 : Avatar */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="h-5 w-5 text-[#1D3557]" />
                    <h3 className="font-semibold text-gray-900">Photo de profil</h3>
                  </div>
                  <AvatarUpload
                    value={avatarPreview || undefined}
                    onChange={(file, preview) => {
                      setAvatarFile(file);
                      setAvatarPreview(preview);
                      setAvatarRemoved(!file && (!!user?.avatar || !!avatarPreview));
                    }}
                    disabled={isLoading}
                    firstName={form.watch('firstName')}
                    lastName={form.watch('lastName')}
                  />
                </div>
              </div>

              {/* Colonne 2 & 3 : Formulaire */}
              <div className="lg:col-span-2 space-y-4">
                {/* Informations personnelles */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-[#1D3557]" />
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Dupont" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="admin@groupe.cg" 
                              {...field} 
                              disabled={mode === 'edit' || isLoading}
                            />
                          </FormControl>
                          {mode === 'edit' && (
                            <FormDescription className="text-xs">
                              L'email ne peut pas être modifié.
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                +242
                              </div>
                              <Input
                                placeholder="069698620 ou 056218919"
                                {...field}
                                value={field.value?.replace(/^\+242/, '') || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                                className="pl-16"
                                maxLength={9}
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Exemples: 069698620 ou 056218919 (9 chiffres, le +242 est automatique)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genre</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger aria-label="Sélectionner le genre">
                                <SelectValue placeholder="Sélectionnez le genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">👨 Masculin</SelectItem>
                              <SelectItem value="F">👩 Féminin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de naissance</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Association & Sécurité */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#2A9D8F]" />
                    Association & Sécurité
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger aria-label="Sélectionner le rôle">
                                <SelectValue placeholder="Sélectionnez un rôle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="super_admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-[#1D3557]" />
                                  <span>Super Admin E-Pilot</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin_groupe">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4 text-[#2A9D8F]" />
                                  <span>Administrateur de Groupe Scolaire</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Le rôle détermine les permissions de l'utilisateur
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schoolGroupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Groupe Scolaire {form.watch('role') === 'admin_groupe' && '*'}
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isLoadingGroups || isLoading || form.watch('role') === 'super_admin'}
                          >
                            <FormControl>
                              <SelectTrigger aria-label="Sélectionner le groupe scolaire">
                                <SelectValue placeholder={
                                  form.watch('role') === 'super_admin'
                                    ? "Non applicable pour Super Admin"
                                    : isLoadingGroups 
                                    ? "Chargement..." 
                                    : "Sélectionnez un groupe scolaire"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schoolGroups && schoolGroups.length > 0 ? (
                                schoolGroups.map((group) => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name} ({group.code})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-group" disabled>
                                  Aucun groupe disponible
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            {form.watch('role') === 'super_admin' 
                              ? "Les Super Admins gèrent tous les groupes"
                              : "Le groupe scolaire que cet administrateur gérera"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mot de passe (création uniquement) */}
                    {mode === 'create' && (
                      <>
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Mot de passe *
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    {...field} 
                                    disabled={isLoading}
                                    className="pr-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sendWelcomeEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading}
                                  aria-label="Envoyer un email de bienvenue"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Envoyer un email de bienvenue
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  L'utilisateur recevra un email avec ses identifiants de connexion.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Statut (modification uniquement) */}
                    {mode === 'edit' && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Statut *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                              <FormControl>
                                <SelectTrigger aria-label="Sélectionner le statut">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">✅ Actif</SelectItem>
                                <SelectItem value="inactive">⏸️ Inactif</SelectItem>
                                <SelectItem value="suspended">🚫 Suspendu</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
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
              {/* Bouton de test pour forcer la validation */}
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  console.log('🧪 TEST: Validation manuelle');
                  const isValid = await form.trigger();
                  console.log('   - Formulaire valide:', isValid);
                  console.log('   - Erreurs:', form.formState.errors);
                  console.log('   - Valeurs:', form.getValues());
                  
                  if (isValid) {
                    console.log('✅ Formulaire valide, appel de handleSubmit...');
                    form.handleSubmit(onSubmit)();
                  } else {
                    console.error('❌ Formulaire invalide, voir erreurs ci-dessus');
                  }
                }}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                🧪 Test
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[120px] bg-[#1D3557] hover:bg-[#2A9D8F]"
                onClick={(e) => {
                  console.log('🔘 Bouton Créer cliqué');
                  console.log('📋 État du formulaire:', {
                    isValid: form.formState.isValid,
                    isDirty: form.formState.isDirty,
                    isSubmitting: form.formState.isSubmitting,
                    isValidating: form.formState.isValidating,
                    submitCount: form.formState.submitCount,
                    errors: form.formState.errors,
                    values: form.getValues(),
                  });
                  
                  // Vérifier si le formulaire a des erreurs
                  const errors = form.formState.errors;
                  if (Object.keys(errors).length > 0) {
                    console.error('❌ Erreurs de validation:', errors);
                    Object.entries(errors).forEach(([field, error]) => {
                      console.error(`   - ${field}:`, error.message);
                    });
                  } else {
                    console.log('✅ Aucune erreur de validation');
                  }
                  
                  // Vérifier les valeurs critiques
                  const values = form.getValues();
                  console.log('🔍 Vérification des champs critiques:');
                  console.log('   - Rôle:', values.role);
                  console.log('   - Groupe scolaire:', values.schoolGroupId);
                  console.log('   - Email:', values.email);
                  console.log('   - Téléphone:', values.phone);
                  console.log('   - Mot de passe:', values.password ? '***' + values.password.slice(-4) : 'VIDE');
                }}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? '➕ Créer' : '💾 Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
