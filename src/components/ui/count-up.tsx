/**
 * Composant CountUp - Animation de compteur
 * Utilise Framer Motion pour une animation fluide et performante
 * @module CountUp
 */

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp = ({ 
  value, 
  duration = 1.5, 
  formatter = (v) => Math.round(v).toLocaleString(), 
  className = "",
  prefix = "",
  suffix = ""
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 20,
    stiffness: 100,
    duration: duration * 1000,
  });
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${formatter(latest)}${suffix}`;
      }
    });
  }, [springValue, formatter, prefix, suffix]);

  return <span ref={ref} className={className} />;
};
