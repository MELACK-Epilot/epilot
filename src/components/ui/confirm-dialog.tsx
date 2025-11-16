/**
 * Composant ConfirmDialog - Modal de confirmation moderne
 * Utilisé pour les actions destructives (suppression, etc.)
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'trash' | 'warning' | 'info' | 'alert';
}

const iconMap = {
  trash: Trash2,
  warning: AlertTriangle,
  info: Info,
  alert: AlertCircle,
};

const variantStyles = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
  },
  warning: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600',
  },
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Êtes-vous sûr ?',
  description = 'Cette action est irréversible.',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  icon = 'trash',
}: ConfirmDialogProps) => {
  const Icon = iconMap[icon];
  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {/* Icône */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${styles.iconColor}`} />
            </div>

            {/* Contenu */}
            <div className="flex-1 pt-1">
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`${styles.buttonBg} text-white focus:ring-2 focus:ring-offset-2`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
