// @ts-nocheck
/**
 * Dialog pour créer/modifier un utilisateur (Admin de Groupe)
 * Rôles : enseignant, cpe, comptable, documentaliste, surveillant, etc.
 * @module GroupUserFormDialog
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
import { AvatarUpload } from '../AvatarUpload';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useSchools } from '../../hooks/useSchools-simple';
import { Loader2, User as UserIcon, Shield, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../../types/dashboard.types';
import { useAuth } from '@/features/auth/store/auth.store';

/**
 * Rôles disponibles pour l'Admin de Groupe (Liste Officielle Congo)
 */
const USER_ROLES = [
  { value: 'proviseur', label: '🎓 Proviseur' },
  { value: 'directeur', label: '👔 Directeur' },
  { value: 'directeur_etudes', label: '📋 Directeur des Études' },
  { value: 'secretaire', label: '📝 Secrétaire' },
  { value: 'comptable', label: '💰 Comptable' },
  { value: 'enseignant', label: '👨‍🏫 Enseignant' },
  { value: 'surveillant', label: '👮 Surveillant' },
  { value: 'bibliothecaire', label: '📚 Bibliothécaire' },
  { value: 'eleve', label: '🎒 Élève' },
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent' },
  { value: 'gestionnaire_cantine', label: '🍽️ Gestionnaire de Cantine' },
  { value: 'autre', label: '👤 Autre' },
] as const;

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
      let cleaned = val.replace(/\D/g, '');
      if (cleaned.length === 9) {
        cleaned = '+242' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('242')) {
        cleaned = '+' + cleaned;
      } else if (!cleaned.startsWith('+242')) {
        cleaned = '+242' + cleaned.replace(/^(\+?242)?/, '');
      }
      return cleaned;
    })
    .refine((val) => /^\+242[0-9]{9}$/.test(val), {
      message: 'Format invalide. Exemples valides: +242069698620 ou 069698620',
    }),
  role: z.enum([
    'proviseur',
    'directeur',
    'directeur_etudes',
    'secretaire',
    'comptable',
    'enseignant',
    'surveillant',
    'bibliothecaire',
    'eleve',
    'parent',
    'gestionnaire_cantine',
    'autre',
  ], {
    errorMap: () => ({ message: 'Veuillez sélectionner un rôle' }),
  }),
  schoolId: z
    .string()
    .min(1, 'Veuillez sélectionner une école'),
  avatar: z.string().optional(),
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
});

const updateUserSchema = baseUserSchema.extend({
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface GroupUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

export const GroupUserFormDialog = ({ open, onOpenChange, user, mode }: GroupUserFormDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  // Récupérer les écoles du groupe de l'admin connecté
  const { data: schools = [], isLoading: isLoadingSchools } = useSchools({
    school_group_id: currentUser?.schoolGroupId,
  });
  
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const defaultValues = useMemo(() => {
    if (mode === 'create') {
      return {
        firstName: '',
        lastName: '',
        gender: '' as any,
        dateOfBirth: '',
        email: '',
        phone: '',
        role: 'enseignant' as const,
        schoolId: '',
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
      role: user?.role || 'enseignant',
      schoolId: user?.schoolId || '',
      status: user?.status || 'active',
      avatar: user?.avatar || '',
    };
  }, [mode, user]);

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(mode === 'create' ? createUserSchema : updateUserSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setAvatarPreview(user?.avatar || null);
      setAvatarFile(null);
      setAvatarRemoved(false);
      setShowPassword(false);
    }
  }, [open, defaultValues, form, user]);

  const handleAvatarChange = useCallback((file: File | null, preview: string | null) => {
    setAvatarFile(file);
    setAvatarPreview(preview);
    setAvatarRemoved(!file);
  }, []);

  const onSubmit = async (data: CreateUserFormValues | UpdateUserFormValues) => {
    startTransition(async () => {
      try {
        const formData = {
          ...data,
          schoolGroupId: currentUser?.schoolGroupId, // Toujours le groupe de l'admin connecté
          avatar: avatarRemoved ? null : (avatarFile ? 'pending_upload' : data.avatar),
        };

        if (mode === 'create') {
          await createUser.mutateAsync({
            ...formData as CreateUserFormValues,
            avatarFile: avatarFile || undefined,
          });
          toast.success('Utilisateur créé avec succès');
        } else if (user) {
          // ✅ CORRECTION : Passer les données directement, pas dans un objet "data"
          await updateUser.mutateAsync({
            id: user.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role, // ✅ IMPORTANT : Inclure le rôle
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            schoolGroupId: formData.schoolGroupId,
            schoolId: formData.schoolId,
            status: formData.status,
            avatarFile: avatarFile || undefined,
            avatarRemoved,
          });
          toast.success('Utilisateur modifié avec succès');
        }

        onOpenChange(false);
        form.reset();
      } catch (error: any) {
        toast.error(error.message || 'Une erreur est survenue');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#1D3557]">
            <GraduationCap className="h-7 w-7 text-[#2A9D8F]" />
            {mode === 'create' ? 'Nouvel Utilisateur' : 'Modifier l\'Utilisateur'}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {mode === 'create'
              ? 'Remplissez les informations pour créer un compte utilisateur'
              : 'Modifiez les informations de l\'utilisateur'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Identité : Photo + Nom/Prénom */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#1D3557] mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#2A9D8F]" />
                Identité
              </h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo à gauche */}
                <div className="flex-shrink-0">
                  <AvatarUpload
                    value={avatarPreview || undefined}
                    onChange={handleAvatarChange}
                    firstName={form.watch('firstName')}
                    lastName={form.watch('lastName')}
                    disabled={isPending}
                  />
                </div>

                {/* Nom et Prénom à droite */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prénom */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nom */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
              </div>
            </div>

            {/* Section Informations Personnelles */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#1D3557] mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#2A9D8F]" />
                Informations Personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Genre */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date de naissance */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="utilisateur@exemple.cg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Doit se terminer par .cg ou .com</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Téléphone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+242069698620 ou 069698620" {...field} />
                    </FormControl>
                    <FormDescription>Format Congo : +242XXXXXXXXX</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
            </div>

            {/* Section Affectation */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#1D3557] mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#2A9D8F]" />
                Affectation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rôle */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* École */}
              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>École *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingSchools}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une école" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

                </div>
            </div>

            {/* Section Sécurité (création uniquement) */}
            {mode === 'create' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1D3557] mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#E9C46A]" />
                  Sécurité
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Mot de passe */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Section Statut (modification uniquement) */}
            {mode === 'edit' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1D3557] mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#2A9D8F]" />
                  Statut du Compte
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                          <SelectItem value="suspended">Suspendu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </div>
            )}

            {/* Email de bienvenue (création uniquement) */}
            {mode === 'create' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <FormField
                  control={form.control}
                  name="sendWelcomeEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base font-medium">📧 Envoyer un email de bienvenue</FormLabel>
                        <FormDescription className="text-sm">
                          L'utilisateur recevra ses identifiants de connexion par email
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#2A9D8F] hover:bg-[#238276]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Création...' : 'Modification...'}
                  </>
                ) : (
                  <>
                    <UserIcon className="mr-2 h-4 w-4" />
                    {mode === 'create' ? 'Créer l\'utilisateur' : 'Enregistrer'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
