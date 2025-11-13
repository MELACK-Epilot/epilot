/**
 * Page Profil Utilisateur - React 19 Best Practices
 * Upload avatar, modification informations, changement mot de passe
 * @module Profile
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/lib/avatar-utils';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getAvatarUrl(user?.avatar));
  
  // Form states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || ''); // Email non modifiable
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Déterminer le rôle (avec memoization)
  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case 'super_admin': return 'Super Administrateur';
      case 'admin_groupe':
      case 'group_admin': return 'Administrateur de Groupe';
      case 'admin_ecole': return 'Administrateur d\'École';
      default: return 'Utilisateur';
    }
  }, [user?.role]);

  // Upload avatar (avec useCallback)
  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validation
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 2MB)');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Mettre à jour la base de données avec le chemin relatif
      // (getAvatarUrl() générera l'URL publique automatiquement)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Générer l'URL publique pour l'affichage
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour le store local avec le chemin relatif
      if (user) {
        setUser({ ...user, avatar: filePath });
      }
      
      // Afficher l'URL publique dans la preview
      setAvatarPreview(publicUrl);
      toast.success('Avatar mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      toast.error('Erreur lors de l\'upload de l\'avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [user, setUser]);

  // Sauvegarder les informations (avec useCallback)
  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: firstName,
          full_name: `${firstName} ${lastName}`,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Mettre à jour le store local
      if (user) {
        setUser({ ...user, firstName, lastName, phone });
      }

      setIsEditing(false);
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, phone, user, setUser]);

  // Changer le mot de passe (avec useCallback)
  const handleChangePassword = useCallback(async () => {
    try {
      if (newPassword !== confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }

      if (newPassword.length < 8) {
        toast.error('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      toast.success('Mot de passe modifié avec succès !');
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error('Erreur lors du changement de mot de passe');
    }
  }, [newPassword, confirmPassword]);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] rounded-xl">
            <UserIcon className="w-7 h-7 text-white" />
          </div>
          Mon Profil
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Gérez vos informations personnelles et vos paramètres de compte
        </p>
      </motion.div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photo de profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] flex items-center justify-center text-white text-3xl font-bold">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-2 bg-[#2A9D8F] text-white rounded-full cursor-pointer hover:bg-[#1D8A7E] transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-500">{roleLabel}</p>
                <p className="text-xs text-gray-400 mt-2">
                  JPG, PNG ou WebP. Max 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informations Personnelles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  placeholder="+242 06 123 4567"
                  className={!isEditing ? 'pl-10 bg-gray-50' : 'pl-10'}
                />
              </div>
            </div>

            {/* Email (non modifiable) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Groupe Scolaire (si Admin Groupe) */}
            {user?.schoolGroupName && (
              <div className="space-y-2">
                <Label>Groupe Scolaire</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={user.schoolGroupName}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
              </div>
            )}

            {/* Rôle */}
            <div className="space-y-2">
              <Label>Rôle</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={roleLabel}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFirstName(user?.firstName || '');
                    setLastName(user?.lastName || '');
                    setPhone(user?.phone || '');
                  }}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sécurité - Changement de mot de passe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showPasswordSection ? (
              <Button 
                variant="outline"
                onClick={() => setShowPasswordSection(true)}
                className="w-full"
              >
                Changer le mot de passe
              </Button>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Le mot de passe doit contenir au moins 8 caractères
                  </AlertDescription>
                </Alert>

                {/* Mot de passe actuel */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmer mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleChangePassword}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Modifier le mot de passe
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Profile;
