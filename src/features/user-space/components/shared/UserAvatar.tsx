/**
 * Composant Avatar utilisateur réutilisable
 * Élimine la redondance des avatars dans l'interface
 * 
 * @module UserAvatar
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { GRADIENTS, COMMON_CLASSES } from '../../constants/designSystem';

interface UserAvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    avatar?: string;
  };
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

export const UserAvatar = memo(({ 
  user, 
  size = 'medium', 
  className,
  onClick 
}: UserAvatarProps) => {
  const sizeClasses = {
    small: COMMON_CLASSES.avatarSmall,
    medium: COMMON_CLASSES.avatarMedium,
    large: COMMON_CLASSES.avatarLarge,
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  const hasPhoto = user.photoUrl || user.avatar;

  if (hasPhoto) {
    return (
      <img
        src={user.photoUrl || user.avatar}
        alt={`${user.firstName} ${user.lastName}`}
        className={cn(
          COMMON_CLASSES.avatar,
          sizeClasses[size],
          'object-cover',
          onClick && 'cursor-pointer hover:scale-110 transition-transform',
          className
        )}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={cn(
        COMMON_CLASSES.avatar,
        sizeClasses[size],
        `bg-gradient-to-br ${GRADIENTS.avatar}`,
        onClick && 'cursor-pointer hover:scale-110 transition-transform',
        className
      )}
      onClick={onClick}
    >
      {initials}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';
