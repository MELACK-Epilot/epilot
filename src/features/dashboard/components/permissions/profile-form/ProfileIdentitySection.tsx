/**
 * Section identité visuelle du profil
 * Avatar upload
 */

import { AvatarUpload } from '@/features/dashboard/components/AvatarUpload';

interface ProfileIdentitySectionProps {
  avatarPreview: string | null;
  onAvatarChange: (file: File | null, preview: string | null) => void;
  profileName: string;
}

export const ProfileIdentitySection = ({
  avatarPreview,
  onAvatarChange,
  profileName,
}: ProfileIdentitySectionProps) => {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
        Identité du Profil
      </h3>
      <div className="flex flex-col items-center justify-center gap-4">
        <AvatarUpload
          value={avatarPreview || undefined}
          onChange={onAvatarChange}
          firstName={profileName}
        />
        <p className="text-xs text-gray-500 text-center">
          Cliquez pour changer l'image.<br/>
          Format supporté : JPG, PNG, WebP.
        </p>
      </div>
    </div>
  );
};
