/**
 * Composant AnimatedSection
 * Wrapper réutilisable pour animations Framer Motion
 * Évite la duplication de code
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedSectionProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Section animée avec fade-in et slide-up
 * 
 * @param {ReactNode} children - Contenu de la section
 * @param {number} delay - Délai d'animation en secondes (défaut: 0)
 * @param {string} className - Classes CSS additionnelles
 * 
 * @example
 * <AnimatedSection delay={0.1}>
 *   <MyComponent />
 * </AnimatedSection>
 */
export const AnimatedSection = ({ 
  children, 
  delay = 0, 
  className = '',
  ...props 
}: AnimatedSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        duration: 0.3,
        ease: 'easeOut'
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Section animée sans délai (pour usage immédiat)
 */
export const AnimatedSectionImmediate = ({ 
  children, 
  className = '',
  ...props 
}: Omit<AnimatedSectionProps, 'delay'>) => {
  return <AnimatedSection delay={0} className={className} {...props}>{children}</AnimatedSection>;
};
