/**
 * Modal de confirmation d'action générique professionnel
 * Design moderne avec couleurs E-Pilot
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
} from "@/components/ui/alert-dialog";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ActionType = "success" | "warning" | "info" | "danger";

interface ConfirmActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ActionType;
  isLoading?: boolean;
}

const typeConfig: Record<ActionType, { icon: any; bgColor: string; iconColor: string; buttonColor: string }> = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
    buttonColor: "bg-orange-600 hover:bg-orange-700",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  danger: {
    icon: AlertCircle,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
    buttonColor: "bg-red-600 hover:bg-red-700",
  },
};

export const ConfirmActionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "info",
  isLoading = false,
}: ConfirmActionDialogProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-gray-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`${config.buttonColor} text-white`}
          >
            {isLoading ? "Traitement..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
