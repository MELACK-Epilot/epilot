/**
 * Section des informations générales du profil
 * Nom, code technique, description
 */

import { User as UserIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_ROLES, getRoleLabel } from '@/config/roles';
import { ROLE_EMOJIS, getRoleEmoji, DEFAULT_PROFILE_EMOJI } from '@/features/dashboard/constants/roles.constants';
import type { ProfileFormValues } from '@/features/dashboard/hooks/useProfileForm';

interface ProfileInfoSectionProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
  isCustomRole: boolean;
  setIsCustomRole: (value: boolean) => void;
  setEmojiIcon: (emoji: string) => void;
}

export const ProfileInfoSection = ({
  form,
  isEditing,
  isCustomRole,
  setIsCustomRole,
  setEmojiIcon,
}: ProfileInfoSectionProps) => {
  
  const handleRoleSelect = (roleCode: string) => {
    if (roleCode === 'custom') {
      setIsCustomRole(true);
      form.setValue('name_fr', '');
      form.setValue('code', '');
      setEmojiIcon(DEFAULT_PROFILE_EMOJI);
      form.setValue('icon', DEFAULT_PROFILE_EMOJI);
    } else {
      setIsCustomRole(false);
      const label = getRoleLabel(roleCode);
      const emoji = getRoleEmoji(roleCode);
      
      form.setValue('name_fr', label);
      form.setValue('code', roleCode);
      form.setValue('description', `Profil standard pour ${label}`);
      
      setEmojiIcon(emoji);
      form.setValue('icon', emoji);
    }
  };
  
  return (
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
            
            {!isEditing ? (
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
                        <span className="mr-2">{ROLE_EMOJIS[role] || DEFAULT_PROFILE_EMOJI}</span>
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
                disabled={isEditing || !isCustomRole}
                className={(!isCustomRole || isEditing) ? 'bg-gray-100 text-gray-500 font-mono' : 'bg-white font-mono'}
              />
              {(!isCustomRole && !isEditing && form.getValues('code')) && (
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
  );
};
