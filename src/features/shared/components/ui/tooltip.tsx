/**
 * Composant Tooltip UI simple
 * Version simplifiée sans dépendances externes
 */

import * as React from "react"

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  className?: string;
}

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

const TooltipContent: React.FC<TooltipContentProps> = ({ 
  children, 
  side = 'top', 
  sideOffset = 8, 
  className = '' 
}) => {
  const getPositionStyle = (side: string, offset: number) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 50,
    };

    switch (side) {
      case 'top':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: `${offset}px`,
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: `${offset}px`,
        };
      case 'left':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: `${offset}px`,
        };
      case 'right':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: `${offset}px`,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div 
      className={`${className}`}
      style={getPositionStyle(side, sideOffset)}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
