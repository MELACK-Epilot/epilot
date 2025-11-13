/**
 * Composant Card Animé
 * Wrapper avec animations Framer Motion subtiles et modernes
 * @module AnimatedCard
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  className?: string;
  hover?: boolean;
}

export const AnimatedCard = ({
  children,
  delay = 0,
  className,
  hover = true,
  ...props
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Cubic bezier pour animation fluide
      }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Container pour animations séquencées (stagger)
 */
interface AnimatedContainerProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
}

export const AnimatedContainer = ({
  children,
  stagger = 0.1,
  className,
}: AnimatedContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Item pour animations séquencées
 */
interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedItem = ({ children, className }: AnimatedItemProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
