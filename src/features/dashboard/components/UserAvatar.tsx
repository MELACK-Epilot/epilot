/**
 * Composant Avatar Utilisateur
 * Affiche l'image de profil ou les initiales par défaut
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * @module UserAvatar
 */

import { memo } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatar-utils';

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'active' | 'inactive' | 'suspended';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
};

const statusBorderColors = {
  active: 'ring-[#2A9D8F]',
  inactive: 'ring-gray-400',
  suspended: 'ring-[#E63946]',
};

const UserAvatarComponent = ({
  firstName = '',
  lastName = '',
  avatar,
  size = 'md',
  status,
  className,
}: UserAvatarProps) => {
  // Générer les initiales
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // Générer l'URL publique de l'avatar
  const avatarUrl = getAvatarUrl(avatar);

  // Couleur de fond basée sur les initiales (déterministe)
  const getBackgroundColor = () => {
    const colors = [
      'bg-[#1D3557]', // Bleu
      'bg-[#2A9D8F]', // Vert
      'bg-[#E9C46A]', // Or
      'bg-[#E63946]', // Rouge
      'bg-purple-600',
      'bg-indigo-600',
    ];
    const index = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        sizeClasses[size],
        status && 'ring-2 ring-offset-2',
        status && statusBorderColors[status],
        className
      )}
    >
      {avatarUrl ? (
        <>
          <img
            src={avatarUrl}
            alt={`${firstName} ${lastName}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback si l'image ne charge pas : masquer l'image
              const target = e.currentTarget;
              target.style.display = 'none';
              // Afficher les initiales à la place
              const parent = target.parentElement;
              if (parent) {
                const initialsDiv = parent.querySelector('.avatar-initials');
                if (initialsDiv) {
                  (initialsDiv as HTMLElement).style.display = 'flex';
                }
              }
            }}
          />
          {/* Fallback initiales (caché par défaut) */}
          <div
            className={cn(
              'avatar-initials hidden absolute inset-0 items-center justify-center font-semibold text-white',
              getBackgroundColor()
            )}
          >
            {initials}
          </div>
        </>
      ) : initials ? (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center font-semibold text-white',
            getBackgroundColor()
          )}
        >
          {initials}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200">
          <User className="h-1/2 w-1/2 text-gray-500" />
        </div>
      )}
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const UserAvatar = memo(UserAvatarComponent);
UserAvatar.displayName = 'UserAvatar';
