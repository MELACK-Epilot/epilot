/**
 * Progress component - Barre de progression
 * Compatible shadcn/ui avec support indicatorClassName
 * @module components/ui/progress
 */

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/** Props du composant Progress */
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Classe CSS pour l'indicateur de progression */
  indicatorClassName?: string;
  /** Afficher le pourcentage en texte */
  showValue?: boolean;
  /** Variante de couleur */
  variant?: 'default' | 'success' | 'warning' | 'error';
}

/** Classes CSS pour les variantes */
const variantClasses: Record<NonNullable<ProgressProps['variant']>, string> = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

/**
 * Composant Progress - Barre de progression accessible
 * @example
 * <Progress value={50} />
 * <Progress value={75} variant="success" showValue />
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  indicatorClassName, 
  showValue = false,
  variant = 'default',
  ...props 
}, ref) => {
  // Normaliser la valeur entre 0 et 100
  const normalizedValue = Math.min(100, Math.max(0, value ?? 0));
  
  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        value={normalizedValue}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            variantClasses[variant],
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {showValue && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground/80">
          {Math.round(normalizedValue)}%
        </span>
      )}
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress, type ProgressProps };
