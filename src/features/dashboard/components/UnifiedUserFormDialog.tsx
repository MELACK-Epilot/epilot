// @ts-nocheck
/**
 * FORMULAIRE UNIFIÉ INTELLIGENT - E-Pilot Congo
 * S'adapte automatiquement selon le rôle de l'utilisateur connecté
 * 
 * Super Admin → Peut créer : super_admin, admin_groupe
 * Admin Groupe → Peut créer : 15 rôles utilisateurs (proviseur, enseignant, etc.)
 * 
 * @module UnifiedUserFormDialog
 */

import { useEffect, useCallback, useTransition, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarUpload } from './AvatarUpload';
import { useCreateUser, useUpdateUser } from '../hooks/useUsers';
import { useSchoolGroups } from '../hooks/useSchoolGroups';
import { useSchools } from '../hooks/useSchools-simple';
import { Loader2, User as UserIcon, Shield, Lock, Eye, EyeOff, GraduationCap, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { showErrorFromException } from '@/components/ui/error-toast';
import type { User } from '../types/dashboard.types';
import { useAuth } from '@/features/auth/store/auth.store';

/**
 * Rôles disponibles selon qui est connecté
 */
const ADMIN_ROLES = [
  { value: 'super_admin', label: '👑 Super Admin', emoji: '👑' },
  { value: 'admin_groupe', label: '🏫 Admin de Groupe', emoji: '🏫' },
] as const;

const USER_ROLES = [
  { value: 'proviseur', label: '🎓 Proviseur', emoji: '🎓' },
  { value: 'directeur', label: '👔 Directeur', emoji: '👔' },
  { value: 'directeur_etudes', label: '📋 Directeur des Études', emoji: '📋' },
  { value: 'secretaire', label: '📝 Secrétaire', emoji: '📝' },
  { value: 'comptable', label: '💰 Comptable', emoji: '💰' },
  { value: 'enseignant', label: '👨‍🏫 Enseignant', emoji: '👨‍🏫' },
  { value: 'cpe', label: '🎯 CPE', emoji: '🎯' },
  { value: 'surveillant', label: '👮 Surveillant', emoji: '👮' },
  { value: 'bibliothecaire', label: '📚 Bibliothécaire', emoji: '📚' },
  { value: 'gestionnaire_cantine', label: '🍽️ Gestionnaire Cantine', emoji: '🍽️' },
  { value: 'conseiller_orientation', label: '🧭 Conseiller Orientation', emoji: '🧭' },
  { value: 'infirmier', label: '⚕️ Infirmier', emoji: '⚕️' },
  { value: 'eleve', label: '🎒 Élève', emoji: '🎒' },
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent', emoji: '👨‍👩‍👧‍👦' },
  { value: 'autre', label: '👤 Autre', emoji: '👤' },
] as const;

/**
 * Schéma de validation de base
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
  role: z.string().min(1, 'Veuillez sélectionner un rôle'),
  schoolGroupId: z.string().optional(),
  schoolId: z.string().optional(),
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

interface UnifiedUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

export const UnifiedUserFormDialog = ({ open, onOpenChange, user, mode }: UnifiedUserFormDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Récupérer l'utilisateur connecté
  const { user: currentUser } = useAuth();
  
  // Normaliser le rôle pour gérer les alias (group_admin → admin_groupe)
  const normalizeRole = (role: string | undefined): string => {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'group_admin': 'admin_groupe',
      'school_admin': 'admin_ecole',
    };
    return roleMap[role] || role;
  };
  
  const normalizedRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = normalizedRole === 'super_admin';
  const isAdminGroupe = normalizedRole === 'admin_groupe';
  
  // Hooks
  const schoolGroupsQuery = useSchoolGroups();
  const schoolGroups = schoolGroupsQuery.data || [];
  const isLoadingGroups = schoolGroupsQuery.isLoading;
  
  const schoolsQuery = useSchools({ 
    school_group_id: currentUser?.schoolGroupId 
  });
  const schools = schoolsQuery.data || [];
  const isLoadingSchools = schoolsQuery.isLoading;
  
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  // Rôles disponibles selon qui est connecté
  const availableRoles = useMemo(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 UnifiedUserFormDialog - Rôles:', {
        originalRole: currentUser?.role,
        normalizedRole,
        isSuperAdmin,
        isAdminGroupe,
        availableRolesCount: isSuperAdmin ? ADMIN_ROLES.length : isAdminGroupe ? USER_ROLES.length : 0,
      });
    }
    
    if (isSuperAdmin) {
      return ADMIN_ROLES;
    }
    if (isAdminGroupe) {
      return USER_ROLES;
    }
    return [];
  }, [isSuperAdmin, isAdminGroupe, currentUser?.role, normalizedRole]);

  // Valeur par défaut du rôle
  const defaultRole = useMemo(() => {
    if (isSuperAdmin) return 'admin_groupe';
    if (isAdminGroupe) return 'enseignant';
    return '';
  }, [isSuperAdmin, isAdminGroupe]);

  // Valeurs par défaut
  const defaultValues = useMemo(() => {
    if (mode === 'create') {
      return {
        firstName: '',
        lastName: '',
        gender: '' as any,
        dateOfBirth: '',
        email: '',
        phone: '',
        role: defaultRole,
        schoolGroupId: isAdminGroupe ? currentUser?.schoolGroupId : '',
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
      role: user?.role || defaultRole,
      schoolGroupId: user?.schoolGroupId || (isAdminGroupe ? currentUser?.schoolGroupId : ''),
      schoolId: user?.schoolId || '',
      status: user?.status || 'active',
      avatar: user?.avatar || '',
    };
  }, [mode, user, defaultRole, isAdminGroupe, currentUser]);

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(mode === 'create' ? createUserSchema : updateUserSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Observer le rôle sélectionné
  const selectedRole = form.watch('role');
  
  // Afficher le champ schoolGroupId si super_admin crée admin_groupe
  const showSchoolGroupField = isSuperAdmin && selectedRole === 'admin_groupe';
  
  // Afficher le champ schoolId si admin_groupe crée un utilisateur
  const showSchoolField = isAdminGroupe;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setAvatarFile(null);
      setAvatarPreview(user?.avatar || null);
      setAvatarRemoved(false);
      setShowPassword(false);
      
      // S'assurer que le rôle par défaut est bien défini
      if (mode === 'create' && defaultRole && !form.getValues('role')) {
        form.setValue('role', defaultRole);
      }
    }
  }, [open, form, defaultValues, user, mode, defaultRole]);

  // Handle avatar upload
  const handleAvatarChange = useCallback((file: File | null, preview: string | null) => {
    setAvatarFile(file);
    setAvatarPreview(preview);
    if (!file) {
      setAvatarRemoved(true);
      form.setValue('avatar', '');
    }
  }, [form]);

  // Submit handler
  const onSubmit = useCallback(async (values: CreateUserFormValues | UpdateUserFormValues) => {
    startTransition(async () => {
      try {
        // Préparer les données (camelCase pour le hook)
        const userData: any = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          role: values.role,
          gender: values.gender || null,
          dateOfBirth: values.dateOfBirth || null,
        };

        // Ajouter schoolGroupId si nécessaire
        if (isSuperAdmin && values.role === 'admin_groupe') {
          // Super admin crée un admin_groupe → schoolGroupId obligatoire
          if (!values.schoolGroupId) {
            form.setError('schoolGroupId', {
              type: 'manual',
              message: 'Veuillez sélectionner un groupe scolaire',
            });
            toast.error('Groupe scolaire requis', {
              description: 'Un Administrateur de Groupe doit être associé à un groupe scolaire.',
            });
            return;
          }
          userData.schoolGroupId = values.schoolGroupId;
        } else if (isSuperAdmin && values.role === 'super_admin') {
          // Super admin crée un super_admin → pas de groupe ni école
          userData.schoolGroupId = null;
        } else if (isAdminGroupe) {
          // Admin groupe crée un utilisateur → son groupe + école obligatoire
          userData.schoolGroupId = currentUser?.schoolGroupId;
          if (!values.schoolId) {
            form.setError('schoolId', {
              type: 'manual',
              message: 'Veuillez sélectionner une école',
            });
            toast.error('École requise', {
              description: "Sélectionnez l'école pour laquelle vous créez cet utilisateur.",
            });
            return;
          }
          userData.schoolId = values.schoolId;
        }

        // Avatar
        if (avatarFile) {
          userData.avatarFile = avatarFile;
        }

        if (mode === 'create') {
          const createValues = values as CreateUserFormValues;
          userData.password = createValues.password;
          userData.sendWelcomeEmail = createValues.sendWelcomeEmail;

          await createUser.mutateAsync(userData);
          toast.success('Utilisateur créé avec succès');
        } else {
          const updateValues = values as UpdateUserFormValues;
          userData.status = updateValues.status;

          await updateUser.mutateAsync({
            id: user!.id,
            ...userData,
          });
          toast.success('Utilisateur modifié avec succès');
        }

        onOpenChange(false);
      } catch (error: any) {
        // Afficher un toast d'erreur professionnel avec détection automatique du type
        showErrorFromException(error);
      }
    });
  }, [
    mode,
    user,
    avatarFile,
    avatarPreview,
    avatarRemoved,
    showSchoolGroupField,
    showSchoolField,
    isAdminGroupe,
    currentUser,
    createUser,
    updateUser,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {mode === 'create' ? (
              <>
                <UserIcon className="w-6 h-6 text-[#1D3557]" />
                Créer un nouvel utilisateur
              </>
            ) : (
              <>
                <UserIcon className="w-6 h-6 text-[#2A9D8F]" />
                Modifier l&apos;utilisateur
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? isSuperAdmin
                ? 'Créer un Super Admin ou un Administrateur de Groupe'
                : 'Créer un utilisateur pour votre groupe scolaire'
              : "Modifier les informations de l'utilisateur"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout en 3 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne 1 : Avatar */}
              <div className="lg:col-span-1">
                <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Photo de profil</h3>
                  <AvatarUpload
                    value={avatarPreview || undefined}
                    onChange={handleAvatarChange}
                    firstName={form.watch('firstName')}
                    lastName={form.watch('lastName')}
                  />
                </div>
              </div>

              {/* Colonnes 2-3 : Formulaire */}
              <div className="lg:col-span-2 space-y-6">
                {/* Section : Informations personnelles */}
                <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Informations personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Prénom */}
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Jean" {...field} />
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
                            <Input placeholder="Ex: Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Genre */}
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genre</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                              placeholder="exemple@ecole.cg"
                              disabled={mode === 'edit'}
                              {...field}
                            />
                          </FormControl>
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
                            <Input placeholder="+242 06 969 86 20" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Format: +242 ou 06...
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section : Association & Sécurité */}
                <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6">
                  <h3 className="text-sm font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Association & Sécurité
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rôle */}
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || defaultRole}
                            defaultValue={defaultRole}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un rôle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableRoles.length > 0 ? (
                                availableRoles.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500">
                                  Aucun rôle disponible
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Groupe Scolaire (si super_admin crée admin_groupe) */}
                    {showSchoolGroupField && (
                      <FormField
                        control={form.control}
                        name="schoolGroupId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Groupe Scolaire *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isLoadingGroups}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un groupe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {schoolGroups.map((group) => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* École (si admin_groupe crée utilisateur) */}
                    {showSchoolField && (
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
                    )}

                    {/* Mot de passe (création uniquement) */}
                    {mode === 'create' && (
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
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Statut (édition uniquement) */}
                    {mode === 'edit' && (
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
                    )}

                    {/* Email de bienvenue (création uniquement) */}
                    {mode === 'create' && (
                      <FormField
                        control={form.control}
                        name="sendWelcomeEmail"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Envoyer un email de bienvenue</FormLabel>
                              <FormDescription className="text-xs">
                                L'utilisateur recevra ses identifiants par email
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
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
                className="bg-gradient-to-r from-[#2A9D8F] to-[#1D3557] hover:from-[#238276] hover:to-[#152a45]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Création...' : 'Modification...'}
                  </>
                ) : (
                  <>{mode === 'create' ? "Créer l'utilisateur" : 'Enregistrer les modifications'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
