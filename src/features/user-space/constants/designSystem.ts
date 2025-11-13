/**
 * Système de design centralisé pour l'espace utilisateur
 * Élimine les redondances de couleurs, gradients et styles
 * 
 * @module DesignSystem
 */

// 🎨 COULEURS PRINCIPALES
export const COLORS = {
  primary: '#2A9D8F',
  primaryDark: '#238b7e', 
  primaryDarker: '#1d7a6f',
  secondary: '#1D3557',
  secondaryDark: '#152844',
  accent: '#E9C46A',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// 🌈 GRADIENTS RÉUTILISABLES
export const GRADIENTS = {
  primary: `from-[${COLORS.primary}] via-[${COLORS.primaryDark}] to-[${COLORS.primaryDarker}]`,
  avatar: `from-[${COLORS.primary}] to-[${COLORS.secondary}]`,
  blue: 'from-blue-500 via-blue-600 to-blue-700',
  purple: 'from-purple-500 via-purple-600 to-purple-700',
  green: 'from-green-500 via-green-600 to-green-700',
  orange: 'from-orange-500 via-orange-600 to-orange-700',
  red: 'from-red-500 via-red-600 to-red-700',
} as const;

// 📐 CLASSES CSS COMMUNES
export const COMMON_CLASSES = {
  // Cards
  card: 'p-6 hover:shadow-xl transition-all duration-300 cursor-pointer',
  cardHover: 'hover:scale-[1.02] hover:shadow-2xl',
  
  // Icônes avec fond
  iconContainer: 'p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300',
  iconContainerSmall: 'p-2 rounded-lg shadow-md',
  
  // Avatars
  avatar: 'rounded-xl flex items-center justify-center text-white font-semibold shadow-lg',
  avatarSmall: 'w-8 h-8 text-xs',
  avatarMedium: 'w-10 h-10 text-sm',
  avatarLarge: 'w-12 h-12 text-base',
  
  // Badges
  badge: 'px-3 py-1 rounded-full text-xs font-medium',
  badgeGlass: 'bg-white/15 backdrop-blur-sm border-0',
  
  // Animations
  fadeIn: 'opacity-0 animate-in fade-in duration-300',
  slideUp: 'translate-y-4 animate-in slide-in-from-bottom duration-300',
  
  // Loading
  spinner: `h-12 w-12 text-[${COLORS.primary}] animate-spin mx-auto mb-4`,
} as const;

// 🎭 ANIMATIONS FRAMER MOTION
export const ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  },
  
  slideFromLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { delay: 0.2 }
  },
  
  stagger: (index: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.1, duration: 0.3 }
  })
} as const;

// 🏷️ TYPES POUR TYPESCRIPT
export type ColorKey = keyof typeof COLORS;
export type GradientKey = keyof typeof GRADIENTS;
export type CommonClassKey = keyof typeof COMMON_CLASSES;
