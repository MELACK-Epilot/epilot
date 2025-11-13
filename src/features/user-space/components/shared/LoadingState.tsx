/**
 * Composant Loading State réutilisable
 * Élimine la redondance des états de chargement
 * 
 * @module LoadingState
 */

import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_CLASSES } from '../../constants/designSystem';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingState = memo(({ 
  message = 'Chargement de votre espace...',
  size = 'medium',
  className 
}: LoadingStateProps) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const containerClasses = {
    small: 'min-h-[200px]',
    medium: 'min-h-[400px]',
    large: 'min-h-[600px]'
  };

  return (
    <div className={cn(
      'flex items-center justify-center',
      containerClasses[size],
      className
    )}>
      <div className="text-center">
        <Loader2 className={cn(
          sizeClasses[size],
          'text-[#2A9D8F] animate-spin mx-auto mb-4'
        )} />
        <p className="text-gray-600 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';
