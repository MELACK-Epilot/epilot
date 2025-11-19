/**
 * UserProfileDialog COMPLET - Version Professionnelle
 * Pour admin gérant 600+ écoles
 * Phase 1: Préférences + Sécurité + Notifications
 * @module UserProfileDialog
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '../UserAvatar';
import { useAuth } from '@/features/auth/store/auth.store';
import { useUpdateUser } from '../../hooks/useUsers';
import {
  useUserPreferences,
  useUpdatePreferences,
  useNotificationSettings,
  useUpdateNotifications,
  useLoginHistory,
} from '../../hooks/useUserProfile';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
  Camera,
  Save,
  X,
  Key,
  Globe,
  Palette,
  Bell,
  Lock,
  Clock,
  Monitor,
  Smartphone,
  MapPin,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Schéma de validation complet
const profileSchema = z.object({
  // Informations personnelles
  firstName: z.string().min(2, 'Min 2 caractères'),
  lastName: z.string().min(2, 'Min 2 caractères'),
  gender: z.enum(['M', 'F']).optional(),
  dateOfBirth: z.string().optional().transform(val => val === '' ? undefined : val),
  phone: z.string().optional().transform(val => val === '' ? undefined : val),
  avatar: z.string().optional().transform(val => val === '' ? undefined : val),
  
  // Préférences
  language: z.enum(['fr', 'en']).default('fr'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  timezone: z.string().default('Africa/Brazzaville'),
  
  // Notifications
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  weeklyReport: z.boolean().default(true),
  monthlyReport: z.boolean().default(true),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  // Charger les données du profil
  const { data: preferences } = useUserPreferences(user?.id);
  const { data: notifications } = useNotificationSettings(user?.id);
  const { data: loginHistory } = useLoginHistory(user?.id, 10);
  
  // Mutations
  const updatePreferences = useUpdatePreferences();
  const updateNotifications = useUpdateNotifications();

  // Form avec données réelles
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      gender: user?.gender,
      dateOfBirth: user?.dateOfBirth || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
      language: preferences?.language || 'fr',
      theme: preferences?.theme || 'system',
      timezone: preferences?.timezone || 'Africa/Brazzaville',
      emailNotifications: notifications?.email_enabled ?? true,
      pushNotifications: notifications?.push_enabled ?? true,
      smsNotifications: notifications?.sms_enabled ?? false,
      weeklyReport: notifications?.email_weekly_report ?? true,
      monthlyReport: notifications?.email_monthly_report ?? true,
    },
  });

  // Mettre à jour le form quand les données arrivent ou quand le modal s'ouvre
  useEffect(() => {
    if (open && preferences && notifications && user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender,
        dateOfBirth: user.dateOfBirth || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        language: preferences.language || 'fr',
        theme: preferences.theme || 'system',
        timezone: preferences.timezone || 'Africa/Brazzaville',
        emailNotifications: notifications.email_enabled ?? true,
        pushNotifications: notifications.push_enabled ?? true,
        smsNotifications: notifications.sms_enabled ?? false,
        weeklyReport: notifications.email_weekly_report ?? true,
        monthlyReport: notifications.email_monthly_report ?? true,
      });
    }
  }, [open, preferences, notifications, user]);

  // Handlers
  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;

    try {
      // 1. Mettre à jour infos personnelles (avec upload photo si nécessaire)
      const updateData: any = {
        id: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth || null,
        phone: data.phone || null,
      };
      
      // Ajouter le fichier avatar si une nouvelle photo a été sélectionnée
      if (avatarFile) {
        updateData.avatarFile = avatarFile;
      } else if (avatarRemoved) {
        updateData.avatarRemoved = true;
      }
      
      const updatedUser = await updateUser.mutateAsync(updateData);
      
      // 2. Mettre à jour préférences
      await updatePreferences.mutateAsync({
        p_user_id: user.id,
        p_language: data.language,
        p_theme: data.theme,
        p_timezone: data.timezone,
      });
      
      // 3. Mettre à jour notifications
      await updateNotifications.mutateAsync({
        p_user_id: user.id,
        p_email_enabled: data.emailNotifications,
        p_email_weekly_report: data.weeklyReport,
        p_email_monthly_report: data.monthlyReport,
        p_push_enabled: data.pushNotifications,
        p_sms_enabled: data.smsNotifications,
      });
      
      // 4. Mettre à jour le store Zustand (pour l'avatar dans le header)
      setUser({
        ...user,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth || null,
        phone: data.phone || null,
        avatar: updatedUser?.avatar || null, // Utiliser l'avatar depuis la réponse serveur
      });
      
      // Réinitialiser les états de l'avatar
      setAvatarFile(null);
      setAvatarRemoved(false);
      
      // 5. Invalider les queries pour recharger les données
      await queryClient.invalidateQueries({ queryKey: ['user-preferences', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['notification-settings', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.success('Profil mis à jour avec succès! 🎉');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5 MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Stocker le fichier pour l'upload lors de la sauvegarde
      setAvatarFile(file);
      setAvatarRemoved(false);
      
      // Créer une URL de prévisualisation base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue('avatar', base64String);
        toast.success('Photo chargée! Cliquez sur "Enregistrer" pour sauvegarder 📸');
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error('Erreur lors du chargement de l\'image');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarRemoved(true);
    form.setValue('avatar', '');
    toast.success('Photo supprimée');
  };

  if (!user) return null;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin E-Pilot',
      admin_groupe: 'Administrateur de Groupe',
      proviseur: 'Proviseur',
      directeur: 'Directeur',
      enseignant: 'Enseignant',
      comptable: 'Comptable',
    };
    return labels[role] || role;
  };

  // Formater l'historique de connexion
  const formattedLoginHistory = (loginHistory || []).map((login: any) => ({
    device: login.device_type || 'Appareil inconnu',
    location: `${login.location_city || 'Ville inconnue'}, ${login.location_country || 'Pays inconnu'}`,
    time: login.login_at ? format(new Date(login.login_at), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'Date inconnue',
    icon: login.device_type?.includes('iPhone') || login.device_type?.includes('Android') ? Smartphone : Monitor,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-[#1D3557]" />
            Mon Profil Personnel
          </DialogTitle>
          <DialogDescription>
            Gérez vos informations, préférences et paramètres de sécurité
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Settings className="h-4 w-4 mr-2" />
                  Préférences
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" />
                  Sécurité
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* ONGLET 1: PROFIL */}
              <TabsContent value="profile" className="space-y-6 mt-6">
                {/* Photo de Profil */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#1D3557]" />
                    Photo de Profil
                  </h3>
                  
                  <div className="flex items-center gap-6">
                    <UserAvatar
                      firstName={form.watch('firstName')}
                      lastName={form.watch('lastName')}
                      avatar={form.watch('avatar')}
                      size="xl"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingPhoto}
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {isUploadingPhoto ? 'Téléchargement...' : 'Changer'}
                        </Button>
                        
                        {form.watch('avatar') && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        )}
                      </div>
                      
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      
                      <p className="text-xs text-gray-500">
                        JPG, PNG ou WebP. Max 5 MB. Recommandé: 400x400px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informations Personnelles */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-[#2A9D8F]" />
                    Informations Personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
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
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+242 06 969 86 20" />
                          </FormControl>
                          <FormDescription>
                            Format Congo: +242 ou 06...
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Informations Compte */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                    Informations du Compte
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">Email</span>
                      </div>
                      <div className="text-gray-900 font-medium">{user.email}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Identifiant de connexion
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Rôle</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>

                    {user.schoolGroupName && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">Groupe Scolaire</span>
                        </div>
                        <div className="text-gray-900 font-medium">{user.schoolGroupName}</div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ONGLET 2: PRÉFÉRENCES */}
              <TabsContent value="preferences" className="space-y-6 mt-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    Langue et Région
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Langue</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fr">🇫🇷 Français</SelectItem>
                              <SelectItem value="en">🇬🇧 English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuseau horaire</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Africa/Brazzaville">🇨🇬 Brazzaville</SelectItem>
                              <SelectItem value="Africa/Kinshasa">🇨🇩 Kinshasa</SelectItem>
                              <SelectItem value="Africa/Lagos">🇳🇬 Lagos</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-6 border border-pink-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-pink-600" />
                    Apparence
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thème</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">☀️ Clair</SelectItem>
                            <SelectItem value="dark">🌙 Sombre</SelectItem>
                            <SelectItem value="system">💻 Système</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choisissez le thème qui vous convient
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* ONGLET 3: SÉCURITÉ */}
              <TabsContent value="security" className="space-y-6 mt-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-6 border border-red-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-red-600" />
                    Mot de passe
                  </h3>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">Changer le mot de passe</p>
                      <p className="text-sm text-gray-500">Dernière modification: Il y a 30 jours</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => toast.info('Fonctionnalité à venir')}>
                      <Key className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-orange-600" />
                    Authentification 2FA
                  </h3>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">Activer 2FA</p>
                      <p className="text-sm text-gray-500">Sécurisez votre compte</p>
                    </div>
                    <Switch checked={false} onCheckedChange={() => toast.info('Fonctionnalité à venir')} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Historique de connexion
                  </h3>
                  
                  <div className="space-y-3">
                    {formattedLoginHistory.map((login, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <login.icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">{login.device}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {login.location}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{login.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ONGLET 4: NOTIFICATIONS */}
              <TabsContent value="notifications" className="space-y-6 mt-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    Notifications Email
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">Notifications générales</p>
                            <p className="text-sm text-gray-500">Alertes importantes</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weeklyReport"
                      render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">Rapport hebdomadaire</p>
                            <p className="text-sm text-gray-500">Chaque lundi</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyReport"
                      render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">Rapport mensuel</p>
                            <p className="text-sm text-gray-500">1er de chaque mois</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-6 border border-yellow-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-yellow-600" />
                    Notifications Push
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">Notifications navigateur</p>
                            <p className="text-sm text-gray-500">Temps réel</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smsNotifications"
                      render={({ field }) => (
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">Notifications SMS</p>
                            <p className="text-sm text-gray-500">Alertes critiques</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Pour un admin gérant 600+ écoles</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Nous recommandons d'activer les rapports hebdomadaires et mensuels pour suivre l'évolution de votre réseau.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              
              <Button type="submit" disabled={updateUser.isPending} className="bg-[#1D3557] hover:bg-[#2A9D8F]">
                {updateUser.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
