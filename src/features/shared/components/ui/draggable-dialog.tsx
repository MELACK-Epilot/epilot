/**
 * Composant Dialog déplaçable avec la souris
 * Wrapper autour de Dialog de shadcn/ui
 */

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { DialogProps } from '@radix-ui/react-dialog';

interface DraggableDialogProps extends DialogProps {
  children: React.ReactNode;
}

interface DraggableDialogContentProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogContent>, 'onMouseDown'> {
  children: React.ReactNode;
}

/**
 * Dialog déplaçable
 */
export const DraggableDialog = ({ children, ...props }: DraggableDialogProps) => {
  return <Dialog {...props}>{children}</Dialog>;
};

/**
 * Contenu du Dialog déplaçable
 */
export const DraggableDialogContent = React.forwardRef<
  HTMLDivElement,
  DraggableDialogContentProps
>(({ children, className, ...props }, _ref) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [hasBeenDragged, setHasBeenDragged] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Gérer le début du drag
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    // Ne déplacer que si on clique sur le header (pas sur les inputs, boutons, etc.)
    const target = e.target as HTMLElement;
    const isHeader = target.closest('[data-draggable-handle]');
    
    if (!isHeader) return;

    setIsDragging(true);
    setHasBeenDragged(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  // Gérer le déplacement
  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Limiter le déplacement dans la fenêtre avec des marges de sécurité
      const dialogWidth = dialogRef.current?.offsetWidth || 600;
      const dialogHeight = dialogRef.current?.offsetHeight || 400;
      
      const minX = -window.innerWidth / 2 + dialogWidth / 2 + 50; // Marge de 50px
      const maxX = window.innerWidth / 2 - dialogWidth / 2 - 50;
      const minY = -window.innerHeight / 2 + dialogHeight / 2 + 50;
      const maxY = window.innerHeight / 2 - dialogHeight / 2 - 50;

      setPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });
    },
    [isDragging, dragStart]
  );

  // Gérer la fin du drag
  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Ajouter les écouteurs d'événements
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Réinitialiser la position quand le composant se monte
  React.useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setHasBeenDragged(false);
  }, []);

  // Réinitialiser quand isDragging change
  React.useEffect(() => {
    if (!isDragging) {
      // Seulement réinitialiser si on n'a pas été déplacé
      if (!hasBeenDragged) {
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [isDragging, hasBeenDragged]);

  return (
    <DialogContent
      ref={dialogRef}
      className={`${className} ${hasBeenDragged ? 'dialog-dragged' : 'dialog-centered'}`}
      style={{
        // N'appliquer la transformation que si le dialog a été déplacé manuellement
        ...(hasBeenDragged ? {
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        } : {}),
      }}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </DialogContent>
  );
});

DraggableDialogContent.displayName = 'DraggableDialogContent';

// Exporter aussi les autres composants de Dialog
export {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
